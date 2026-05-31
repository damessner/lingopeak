import zipfile
import xml.etree.ElementTree as ET
import os

docx_path = os.path.join("material", "MORE_1_LP_2023_Jahresplanung.docx")
print("Reading docx:", docx_path)

if not os.path.exists(docx_path):
    print("File does not exist!")
    exit(1)

try:
    with zipfile.ZipFile(docx_path) as z:
        doc_xml = z.read("word/document.xml")
        root = ET.fromstring(doc_xml)
        
        # Word XML namespaces
        ns = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
        
        # Find all text elements
        texts = []
        for p in root.iterfind(".//w:p", ns):
            p_text = []
            for t in p.iterfind(".//w:t", ns):
                if t.text:
                    p_text.append(t.text)
            if p_text:
                texts.append("".join(p_text))
        
        # Write extracted text to file
        with open("scratch/curriculum_extracted.txt", "w", encoding="utf-8") as out:
            out.write("\n".join(texts))
        
        print("Success! Extracted", len(texts), "paragraphs to scratch/curriculum_extracted.txt")
except Exception as e:
    print("Error:", e)
