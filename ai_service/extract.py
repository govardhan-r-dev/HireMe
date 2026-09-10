"""Optional document extraction service for HireMe.co.
Install: pip install pymupdf sentence-transformers
Usage: python extract.py path/to/file.pdf
"""
import sys, json
from pathlib import Path

def extract(path: str):
    p=Path(path)
    if p.suffix.lower()=='.pdf':
        import fitz
        doc=fitz.open(str(p))
        text='\n'.join(page.get_text() for page in doc)
    elif p.suffix.lower()=='.txt':
        text=p.read_text(encoding='utf-8', errors='ignore')
    else:
        text=''
    return {'file':p.name,'text':text[:100000]}

if __name__=='__main__':
    if len(sys.argv)!=2:
        print(json.dumps({'error':'usage: python extract.py <file>'})); raise SystemExit(1)
    print(json.dumps(extract(sys.argv[1])))
