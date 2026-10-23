import zipfile
import io
import shutil
import xml.etree.ElementTree as ET

p_ns = "http://schemas.openxmlformats.org/presentationml/2006/main"
a_ns = "http://schemas.openxmlformats.org/drawingml/2006/main"
r_ns = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

ET.register_namespace("p", p_ns)
ET.register_namespace("a", a_ns)
ET.register_namespace("r", r_ns)

def make_para(text, bold_prefix="", bullet=True, num=None, level=0, font_sz=1400):
    """Create an a:p XML element with optional bullet, numbering, and bold prefix."""
    p = ET.Element(f"{{{a_ns}}}p")
    pPr = ET.SubElement(p, f"{{{a_ns}}}pPr")
    
    if num is not None:
        pPr.set("marL", "514350")
        pPr.set("indent", "-514350")
        buFont = ET.SubElement(pPr, f"{{{a_ns}}}buFont")
        buFont.set("typeface", "+mj-lt")
        buNum = ET.SubElement(pPr, f"{{{a_ns}}}buAutoNum")
        buNum.set("type", "arabicPeriod")
    elif bullet:
        if level == 0:
            pPr.set("marL", "285750")
            pPr.set("indent", "-285750")
            buFont = ET.SubElement(pPr, f"{{{a_ns}}}buFont")
            buFont.set("typeface", "Arial")
            buChar = ET.SubElement(pPr, f"{{{a_ns}}}buChar")
            buChar.set("char", "•")
        else:
            pPr.set("marL", "571500")
            pPr.set("indent", "-285750")
            pPr.set("lvl", "1")
            buFont = ET.SubElement(pPr, f"{{{a_ns}}}buFont")
            buFont.set("typeface", "Arial")
            buChar = ET.SubElement(pPr, f"{{{a_ns}}}buChar")
            buChar.set("char", "-")
    else:
        pPr.set("marL", "0")
        pPr.set("indent", "0")
        ET.SubElement(pPr, f"{{{a_ns}}}buNone")

    if bold_prefix:
        r_bold = ET.SubElement(p, f"{{{a_ns}}}r")
        rPr_bold = ET.SubElement(r_bold, f"{{{a_ns}}}rPr")
        rPr_bold.set("lang", "en-US")
        rPr_bold.set("b", "1")
        if font_sz:
            rPr_bold.set("sz", str(font_sz))
        t_bold = ET.SubElement(r_bold, f"{{{a_ns}}}t")
        t_bold.text = bold_prefix

    if text:
        r_norm = ET.SubElement(p, f"{{{a_ns}}}r")
        rPr_norm = ET.SubElement(r_norm, f"{{{a_ns}}}rPr")
        rPr_norm.set("lang", "en-US")
        if font_sz:
            rPr_norm.set("sz", str(font_sz))
        t_norm = ET.SubElement(r_norm, f"{{{a_ns}}}t")
        t_norm.text = text

    return p

def set_txbody(txBody, paras):
    """Replace all paragraphs in txBody with the given list of paragraphs."""
    # preserve bodyPr and lstStyle if present
    bodyPr = txBody.find(f"{{{a_ns}}}bodyPr")
    lstStyle = txBody.find(f"{{{a_ns}}}lstStyle")
    txBody.clear()
    if bodyPr is not None:
        txBody.append(bodyPr)
    else:
        ET.SubElement(txBody, f"{{{a_ns}}}bodyPr")
    if lstStyle is not None:
        txBody.append(lstStyle)
    else:
        ET.SubElement(txBody, f"{{{a_ns}}}lstStyle")
    for p in paras:
        txBody.append(p)

print("Helper functions ready")
