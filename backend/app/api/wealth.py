import datetime

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.database import database

router = APIRouter(prefix="/wealth", tags=["wealth"])

ASSET_TYPES = ['Equity', 'Mutual Funds', 'Gold', 'Real Estate', 'NPS/PPF', 'Cash']
LIAB_TYPES  = ['Home Loan', 'Car Loan', 'Personal Loan', 'Credit Card', 'Education Loan']

# ── Pydantic models ─────────────────────────────────────────────────────────

class AssetIn(BaseModel):
    type: str
    label: str
    value: float
    yield_pct: float = 0.0

class LiabilityIn(BaseModel):
    type: str
    label: str
    remaining: float
    rate: float = 0.0
    emi: float = 0.0
    tenure: int = 0

# ── Helper ───────────────────────────────────────────────────────────────────

def _seed_defaults(conn):
    """Seed the DB with the default assets/liabilities if it's empty."""
    count = conn.execute("SELECT COUNT(*) FROM assets").fetchone()[0]
    if count == 0:
        now = datetime.datetime.now().isoformat()
        defaults_a = [
            ('Equity',       'NIFTY 50 ETF',          450000, 12.5),
            ('Mutual Funds', 'HDFC Flexicap Fund',     280000, 11.2),
            ('Gold',         'Digital Gold',           120000,  8.0),
            ('Real Estate',  'Residential Property', 3500000,  6.5),
            ('NPS/PPF',      'PPF Account',            350000,  7.1),
            ('Cash',         'Savings Account',         85000,  3.5),
        ]
        for t, lbl, v, y in defaults_a:
            conn.execute(
                "INSERT INTO assets(type,label,value,yield_pct,created_at,updated_at) VALUES(?,?,?,?,?,?)",
                (t, lbl, v, y, now, now)
            )

    count2 = conn.execute("SELECT COUNT(*) FROM liabilities").fetchone()[0]
    if count2 == 0:
        now = datetime.datetime.now().isoformat()
        defaults_l = [
            ('Home Loan', 'SBI Home Loan',  2800000, 8.5, 25000, 180),
            ('Car Loan',  'HDFC Car Loan',   450000, 9.0, 12000,  42),
        ]
        for t, lbl, r, rate, emi, ten in defaults_l:
            conn.execute(
                "INSERT INTO liabilities(type,label,remaining,rate,emi,tenure,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
                (t, lbl, r, rate, emi, ten, now, now)
            )

# ── Assets endpoints ─────────────────────────────────────────────────────────

@router.get("/assets")
def list_assets():
    with database.get_db() as conn:
        _seed_defaults(conn)
        rows = conn.execute("SELECT * FROM assets ORDER BY id").fetchall()
    return [dict(r) for r in rows]

@router.post("/assets", status_code=201)
def add_asset(body: AssetIn):
    now = datetime.datetime.now().isoformat()
    with database.get_db() as conn:
        cur = conn.execute(
            "INSERT INTO assets(type,label,value,yield_pct,created_at,updated_at) VALUES(?,?,?,?,?,?)",
            (body.type, body.label, body.value, body.yield_pct, now, now)
        )
        row = conn.execute("SELECT * FROM assets WHERE id=?", (cur.lastrowid,)).fetchone()
    return dict(row)

@router.put("/assets/{asset_id}")
def update_asset(asset_id: int, body: AssetIn):
    now = datetime.datetime.now().isoformat()
    with database.get_db() as conn:
        conn.execute(
            "UPDATE assets SET type=?,label=?,value=?,yield_pct=?,updated_at=? WHERE id=?",
            (body.type, body.label, body.value, body.yield_pct, now, asset_id)
        )
        row = conn.execute("SELECT * FROM assets WHERE id=?", (asset_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Asset not found")
    return dict(row)

@router.delete("/assets/{asset_id}")
def delete_asset(asset_id: int):
    with database.get_db() as conn:
        conn.execute("DELETE FROM assets WHERE id=?", (asset_id,))
    return {"status": "deleted", "id": asset_id}

# ── Liabilities endpoints ────────────────────────────────────────────────────

@router.get("/liabilities")
def list_liabilities():
    with database.get_db() as conn:
        _seed_defaults(conn)
        rows = conn.execute("SELECT * FROM liabilities ORDER BY id").fetchall()
    return [dict(r) for r in rows]

@router.post("/liabilities", status_code=201)
def add_liability(body: LiabilityIn):
    now = datetime.datetime.now().isoformat()
    with database.get_db() as conn:
        cur = conn.execute(
            "INSERT INTO liabilities(type,label,remaining,rate,emi,tenure,created_at,updated_at) VALUES(?,?,?,?,?,?,?,?)",
            (body.type, body.label, body.remaining, body.rate, body.emi, body.tenure, now, now)
        )
        row = conn.execute("SELECT * FROM liabilities WHERE id=?", (cur.lastrowid,)).fetchone()
    return dict(row)

@router.put("/liabilities/{liab_id}")
def update_liability(liab_id: int, body: LiabilityIn):
    now = datetime.datetime.now().isoformat()
    with database.get_db() as conn:
        conn.execute(
            "UPDATE liabilities SET type=?,label=?,remaining=?,rate=?,emi=?,tenure=?,updated_at=? WHERE id=?",
            (body.type, body.label, body.remaining, body.rate, body.emi, body.tenure, now, liab_id)
        )
        row = conn.execute("SELECT * FROM liabilities WHERE id=?", (liab_id,)).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Liability not found")
    return dict(row)

@router.delete("/liabilities/{liab_id}")
def delete_liability(liab_id: int):
    with database.get_db() as conn:
        conn.execute("DELETE FROM liabilities WHERE id=?", (liab_id,))
    return {"status": "deleted", "id": liab_id}

# ── Portfolio summary ────────────────────────────────────────────────────────

@router.get("/summary")
def portfolio_summary():
    with database.get_db() as conn:
        _seed_defaults(conn)
        assets = [dict(r) for r in conn.execute("SELECT * FROM assets ORDER BY id").fetchall()]
        liabs  = [dict(r) for r in conn.execute("SELECT * FROM liabilities ORDER BY id").fetchall()]

    total_assets = sum(a["value"] for a in assets)
    total_liabs  = sum(liab["remaining"] for liab in liabs)
    net_worth    = total_assets - total_liabs

    return {
        "net_worth": net_worth,
        "total_assets": total_assets,
        "total_liabilities": total_liabs,
        "assets": assets,
        "liabilities": liabs,
    }
