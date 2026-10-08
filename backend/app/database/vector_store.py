import json
import logging

from app.database import database

logger = logging.getLogger(__name__)

def insert_embedding(conn, chunk_id: int, embedding: list[float]):
    if not database.VEC_AVAILABLE:
        logger.warning("Vector extension not available, skipping embedding insertion")
        return

    # vec0 expects JSON array or raw bytes depending on sqlite-vec version, usually JSON is accepted.
    # Alternatively, we serialize it as JSON
    emb_json = json.dumps(embedding)
    conn.execute("INSERT INTO vec_chunks(rowid, embedding) VALUES (?, ?)", (chunk_id, emb_json))

def search_similar(conn, query_embedding: list[float], top_k: int, threshold: float) -> list[dict]:
    if not database.VEC_AVAILABLE:
        logger.warning("Vector extension not available, cannot search embeddings")
        return []

    emb_json = json.dumps(query_embedding)

    query = """
        SELECT
            dc.id as chunk_id,
            d.id as document_id,
            d.filename as document_name,
            dc.page,
            dc.section,
            dc.text,
            1.0 - v.distance as score
        FROM vec_chunks v
        JOIN document_chunks dc ON v.rowid = dc.id
        JOIN documents d ON dc.document_id = d.id
        WHERE v.embedding MATCH ? AND k = ?
    """

    # In sqlite-vec, lower distance is better.
    # We might need to filter by score in Python or via the query if vec0 supports it.

    cursor = conn.execute(query, (emb_json, top_k))
    results = []
    for row in cursor:
        score = row['score']
        if score >= threshold:
            results.append({
                'chunk_id': row['chunk_id'],
                'document_id': row['document_id'],
                'document_name': row['document_name'],
                'page': row['page'],
                'section': row['section'],
                'text': row['text'],
                'score': score
            })

    # Sort by score descending
    results.sort(key=lambda x: x['score'], reverse=True)
    return results

def delete_document_embeddings(conn, document_id: int):
    if not database.VEC_AVAILABLE:
        return

    # Delete from vec_chunks where rowid in (select id from document_chunks where document_id=?)
    conn.execute("""
        DELETE FROM vec_chunks
        WHERE rowid IN (SELECT id FROM document_chunks WHERE document_id = ?)
    """, (document_id,))
