import sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import NameObject, TextStringObject, DictionaryObject
r=PdfReader(sys.argv[1]); w=PdfWriter(); w.append(r); n=0
for page in w.pages:
    for a in page.get("/Annots") or []:
        a=a.get_object(); act=a.get("/A")
        if act and act.get("/URI","").startswith("file://"):
            uri=act["/URI"]; rel="kit/"+uri.split("/kit/")[1]
            a[NameObject("/A")]=DictionaryObject({NameObject("/S"):NameObject("/Launch"),NameObject("/F"):TextStringObject(rel)})
            n+=1
w.write(sys.argv[1]); print("fixed",n,"links")
