"""Builds kit/Client-Documents.docx: brief, proposal, shot list, revision request, delivery message, agreement."""
from docx import Document
from docx.shared import Pt
doc=Document()
st=doc.styles['Normal']; st.font.name='Calibri'; st.font.size=Pt(11)
def H(t): doc.add_heading(t,level=1)
def P(t,b=False):
    para=doc.add_paragraph(); run=para.add_run(t); run.bold=b; return para
def F(label): P(f"{label}: ____________________________________________")
doc.add_heading("Zero to Three: client documents",0)
P("Editable templates. Replace everything in [brackets]. These are plain-language starting points for small jobs, not legal advice. Check your local rules for anything larger.")
H("1. Client brief (fill in during the chat or call)")
for f in ["Business","Contact name","Date","Package"]: F(f)
for q in ["What do you most want more of right now? (bookings / orders / walk-ins / followers)","Offer or event to build the video around","Who is your best kind of customer?","A video you posted that did well, and one that flopped","Where will this run? (your page only / paid ads too)","Must include (logo, phone, handle, address)","Must avoid","Reviews I may quote (written permission from the reviewer or business)","Deadline"]: F(q)
doc.add_page_break(); H("2. Proposal")
for line in ["Hi [name], here's what I suggest for [business]:","GOAL: more [bookings] for [offer].","WHAT YOU GET: [1 vertical ad, 20 s, plus 2 alternate openings]. Captions and licensed music included.","NOT INCLUDED: filming, other sizes (1:1, 16:9), versions without captions, thumbnails, extra revision rounds (each extra is priced separately).","WHAT I NEED FROM YOU: [8 phone clips + logo], using the shot list I'll send. Please only send material you have the right to use.","TIMING: drafts [5] days after I have all usable material.","REVISIONS: 1 round included. Please send all changes in one message.","PRICE: [$90]. 50% to start, 50% before final files.","Shall I send the shot list and payment details?"]: P(line)
doc.add_page_break(); H("3. Shot list")
P("Please film on your phone, upright (vertical), 5–8 seconds each, in good light. Don't worry about sound. Ask anyone recognisable in a clip if they're OK appearing in an ad.")
for i,x in enumerate(["The front of the business from outside","A wide shot of the inside","Your product or service close up, in action (3 clips)","A happy customer (with their OK) or the finished result","You or your team, smiling at the camera","Anything that makes you different"],1): P(f"{i}. {x}")
P("Also send: your logo, your offer in one sentence, and 1–2 customer reviews you have permission to share.")
doc.add_page_break(); H("4. Revision request")
P("Please list every change in this one form, so I can make them all in one round.")
t=doc.add_table(rows=6,cols=3); t.style='Table Grid'
for i,h in enumerate(["Video / version","Time in video (e.g. 0:07)","What to change"]): t.cell(0,i).text=h
P("Anything not on this list after this round counts as an extra round ([$15] each).")
doc.add_page_break(); H("5. Delivery message")
for line in ["Hi [name], your videos are ready! Here are the final files: [link].","Files: [Business_Offer_v1_9x16.mp4], [...]","I'd post [version A] first because [reason].","Payment received, thank you. Everything here is yours to use for [business].","I'll check in next week to see how it's doing. If you're happy with it, a short testimonial would mean a lot."]: P(line)
doc.add_page_break(); H("6. Video project agreement")
P("Between [Your name] (\"Editor\") and [Client name / business] (\"Client\"). Date: [date].")
terms=[("Work","The Editor will make [number] vertical video(s) of about [length] seconds for [business], plus [any agreed variations], with captions and licensed music. Anything not listed here is not included."),
("Material and permissions","The Client will send footage, logo and offer details by [date], and confirms they have the right to use everything they send (including people who appear, music and logos)."),
("Delivery","Drafts within [X] days of the Editor receiving all usable material. If material arrives late or needs re-shooting, the delivery date moves by the same amount."),
("Revisions","One round of changes is included, sent in one message. Extra rounds cost [amount] each."),
("Price","[total]. 50% before work starts; 50% before final files are sent."),
("Rights","Once paid in full, the Client may use the final videos for their business, anywhere, with no time limit. The Editor keeps the right to the editing project files."),
("Portfolio","The Editor may / may not (circle one) show the videos in their portfolio."),
("Cancelling","Either side may cancel in writing. If the Client cancels after editing has started, the deposit is kept for work done. If the Editor cancels before delivering, the deposit is refunded."),
("No guarantee of results","The Editor promises the agreed videos by the agreed date, not a number of views, customers or sales.")]
for i,(h,tx) in enumerate(terms,1):
    para=doc.add_paragraph(); para.add_run(f"{i}. {h}. ").bold=True; para.add_run(tx)
P("Agreed by Client: ______________ Date: ______        Agreed by Editor: ______________ Date: ______")
P("For small jobs, a written reply saying \"Agreed\" to this text can serve as agreement. For larger work, get it checked under your local law.")
doc.save("kit/Client-Documents.docx"); print("docx saved")
