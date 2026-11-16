"""Builds kit/Zero-to-Three-Tracker.xlsx: tracker with follow-up formulas, weekly summary, pricing calculator."""
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.worksheet.datavalidation import DataValidation
from openpyxl.formatting.rule import FormulaRule
from openpyxl.utils import get_column_letter as L
import datetime as dt
wb=Workbook()
H=Font(bold=True,color="FFFFFF"); HF=PatternFill("solid",fgColor="17181C"); INP=PatternFill("solid",fgColor="FFF4D6"); OUT=PatternFill("solid",fgColor="E8F3E8")
thin=Side(style="thin",color="BBBBBB"); BOX=Border(top=thin,bottom=thin,left=thin,right=thin)
ws=wb.active; ws.title="Start here"
lines=["ZERO TO THREE — TRACKER & PRICING CALCULATOR","",
"1. Tracker: one row per business. Type the date you sent the first message in 'First sent' (YYYY-MM-DD).",
"   The follow-up dates (day 3, day 7, day 14) fill in by themselves.",
"   When you send a follow-up, type any mark (e.g. x) in its 'sent' column.",
"   'Next action due' shows the next unsent follow-up, and turns red when it's today or overdue.",
"   It goes blank when they reply, when the stage is Won/Lost/Stop, or when 'Do not contact' is Y.",
"2. Reply: choose Positive or Negative. Positive = interested in talking (not just 'thanks').",
"3. If anyone asks you to stop: set 'Do not contact' to Y. The row turns grey. Never message them again.",
"4. Summary: counts per week fill in from the tracker. Set 'Week 1 starts' to the date of your day 12.",
"5. Pricing: yellow cells are your inputs, green cells are calculated. Check every package before you quote it.",
"","Yellow = you type. Green = calculated. Rows 2–3 of the tracker are fictional examples: delete them.",
"Works in Excel and Google Sheets (File → Import → Upload). Version 1.0"]
for i,t in enumerate(lines,1): ws.cell(i,1,t).font=Font(bold=(i==1),size=13 if i==1 else 11)
ws.column_dimensions['A'].width=110
t=wb.create_sheet("Tracker")
cols=["#","Business","Link","Lane","Channel","Decision maker","Observation (one true, specific thing)","Video idea","First sent",
 "Follow-up 1 due","FU1 sent","Follow-up 2 due","FU2 sent","Final due","Final sent","Next action due",
 "Reply","Stage","Do not contact","Proposal $","Deposit received","Paid $","Notes"]
widths=[5,22,26,12,12,16,40,30,12,13,8,13,8,12,8,15,11,11,9,11,10,9,30]
for i,(c,w) in enumerate(zip(cols,widths),1):
    x=t.cell(1,i,c); x.font=H; x.fill=HF; x.alignment=Alignment(wrap_text=True,vertical="center"); t.column_dimensions[L(i)].width=w
t.row_dimensions[1].height=32; t.freeze_panes="C2"
N=301
for r in range(2,N+1):
    t.cell(r,1,r-1)
    t.cell(r,10,f'=IF(I{r}="","",I{r}+3)'); t.cell(r,12,f'=IF(I{r}="","",I{r}+7)'); t.cell(r,14,f'=IF(I{r}="","",I{r}+14)')
    t.cell(r,16,f'=IF(OR(I{r}="",S{r}="Y",R{r}="Won",R{r}="Lost",R{r}="Stop",Q{r}<>""),"",IF(K{r}="",J{r},IF(M{r}="",L{r},IF(O{r}="",N{r},""))))')
    for c in (9,10,12,14,16): t.cell(r,c).number_format="yyyy-mm-dd"
    for c in (20,22): t.cell(r,c).number_format='"$"#,##0'
    for c in (10,12,14,16): t.cell(r,c).fill=OUT
    for c in range(1,24): t.cell(r,c).border=BOX
for col,f in [("E",'"DM,Email,Warm,In person,Form,Other"'),("Q",'"Positive,Negative"'),("R",'"Sent,Replied,Talk,Proposal,Won,Lost,Stop"'),("S",'"Y,N"'),("U",'"Y,N"')]:
    dv=DataValidation(type="list",formula1=f,allow_blank=True); t.add_data_validation(dv); dv.add(f"{col}2:{col}{N}")
t.conditional_formatting.add(f"A2:W{N}",FormulaRule(formula=['$S2="Y"'],fill=PatternFill("solid",fgColor="D9D9D9"),font=Font(color="808080",strike=True)))
t.conditional_formatting.add(f"P2:P{N}",FormulaRule(formula=['AND($P2<>"",$P2<=TODAY())'],fill=PatternFill("solid",fgColor="F8C9C2"),font=Font(bold=True,color="9C1C10")))
t.conditional_formatting.add(f"R2:R{N}",FormulaRule(formula=['$R2="Won"'],fill=PatternFill("solid",fgColor="C6E9C6")))
d=dt.date(2026,11,20)
ex=[{2:"Example Barbers (fictional)",3:"instagram.com/example",4:"Barbers",5:"DM",6:"Owner (Sam)",7:"Fade reel from Tuesday starts with 4 s of walking",8:"15 s before/after with the offer on screen",9:d,11:"x",17:"Positive",18:"Proposal",19:"N",20:90,21:"Y",22:45,23:"Chose Standard"},
    {2:"Forge Fitness (fictional)",3:"instagram.com/forge",4:"Gyms",5:"DM",6:"Owner (Selam)",7:"6am class reel opens on the entrance",8:"Open on the class itself",9:d,18:"Sent",19:"N"}]
for i,row in enumerate(ex):
    for c,v in row.items(): t.cell(2+i,c,v)
s=wb.create_sheet("Summary")
s["A1"]="Week 1 starts"; s["B1"]=d; s["B1"].number_format="yyyy-mm-dd"; s["B1"].fill=INP; s["A1"].font=Font(bold=True)
hdr=["Week","From","To","First messages sent","Positive replies","Negative replies","Proposals","Won","Earned $","Positive reply rate"]
for i,h_ in enumerate(hdr,1):
    c=s.cell(3,i,h_); c.font=H; c.fill=HF; s.column_dimensions[L(i)].width=18
T="Tracker!"
for w in range(1,7):
    r=3+w; s.cell(r,1,w); s.cell(r,2,f"=$B$1+{(w-1)*7}"); s.cell(r,3,f"=B{r}+6")
    rng=f'{T}$I$2:$I${N},">="&B{r},{T}$I$2:$I${N},"<="&C{r}'
    s.cell(r,4,f"=COUNTIFS({rng})"); s.cell(r,5,f'=COUNTIFS({rng},{T}$Q$2:$Q${N},"Positive")'); s.cell(r,6,f'=COUNTIFS({rng},{T}$Q$2:$Q${N},"Negative")')
    s.cell(r,7,f'=COUNTIFS({rng},{T}$T$2:$T${N},">0")'); s.cell(r,8,f'=COUNTIFS({rng},{T}$R$2:$R${N},"Won")'); s.cell(r,9,f"=SUMIFS({T}$V$2:$V${N},{rng})")
    s.cell(r,10,f'=IF(D{r}=0,"",E{r}/D{r})'); s.cell(r,10).number_format="0%"; s.cell(r,9).number_format='"$"#,##0'
    for c in (2,3): s.cell(r,c).number_format="yyyy-mm-dd"
s.cell(11,1,"TOTAL").font=Font(bold=True)
for c in range(4,10): s.cell(11,c,f"=SUM({L(c)}4:{L(c)}9)").font=Font(bold=True)
s.cell(11,10,'=IF(D11=0,"",E11/D11)'); s.cell(11,10).number_format="0%"; s.cell(11,9).number_format='"$"#,##0'
s["A13"]="Follow-ups due today or overdue:"; s["B13"]=f'=COUNTIFS({T}$P$2:$P${N},"<="&TODAY(),{T}$P$2:$P${N},"<>")'
s["A14"]="Do not contact:"; s["B14"]=f'=COUNTIF({T}$S$2:$S${N},"Y")'
s["A16"]="Messages sent before 'Week 1 starts' (e.g. warm messages) are not counted in weeks 1–6."
p=wb.create_sheet("Pricing")
p.column_dimensions['A'].width=46
for c in "BCD": p.column_dimensions[c].width=16
p["A1"]="PACKAGE PRICING CALCULATOR"; p["A1"].font=Font(bold=True,size=13)
p["A2"]="Yellow = your inputs (examples match the book). Green = calculated."
for i,h_ in enumerate(["","Starter","Standard","Monthly batch"],1):
    c=p.cell(4,i,h_); c.font=H; c.fill=HF
rows=[("Full edits (separate videos)",[1,1,8]),("Hours per full edit",[3,3,2.5]),("Alternate openings / hook variations",[0,2,0]),("Hours per variation",[0,1.5,0]),
 ("Planning call hours",[0,0,1]),("Messages & admin hours",[0.5,0.5,0]),("Expected revision hours",[0.5,0.5,0]),("Your minimum per hour ($)",[10,10,10]),
 ("Asset costs: paid music, stock ($)",[0,0,0]),("Payment fee (%)",[0,0,0]),("Safety buffer (%)",[20,20,20])]
for i,(lab,v) in enumerate(rows):
    r=5+i; p.cell(r,1,lab).border=BOX
    for j,val in enumerate(v): c=p.cell(r,2+j,val); c.fill=INP; c.border=BOX
out=[("Total hours","={c}5*{c}6+{c}7*{c}8+{c}9+{c}10+{c}11",'0.0'),("Floor price (covers time, costs, fees)","=({c}16*{c}12+{c}13)/(1-{c}14/100)",'"$"#,##0.00'),
     ("Floor price + buffer","={c}17*(1+{c}15/100)",'"$"#,##0.00'),("Suggested price (rounded up to $5)","=CEILING({c}18,5)",'"$"#,##0')]
for i,(lab,f,fmt) in enumerate(out):
    r=16+i; p.cell(r,1,lab).font=Font(bold=True)
    for j,col in enumerate("BCD"):
        c=p.cell(r,2+j,f.format(c=col)); c.fill=OUT; c.number_format=fmt; c.border=BOX
p["A21"]="Your price ($)"; p["A21"].font=Font(bold=True)
for j,(col,v) in enumerate(zip("BCD",[50,90,320])): c=p.cell(21,2+j,v); c.fill=INP; c.number_format='"$"#,##0'; c.border=BOX
p["A22"]="What you really earn per hour"; p["A23"]="Check"
for col in "BCD":
    c=p[f"{col}22"]; c.value=f'=IF({col}16=0,"",({col}21*(1-{col}14/100)-{col}13)/{col}16)'; c.fill=OUT; c.number_format='"$"#,##0.00'; c.border=BOX
    c=p[f"{col}23"]; c.value=f'=IF({col}21<{col}17,"BELOW FLOOR – raise it",IF({col}21<{col}18,"OK, but no buffer","OK"))'; c.fill=OUT; c.border=BOX
p["A25"]="Notes"; p["A25"].font=Font(bold=True)
for i,t_ in enumerate(["A variation = same middle and ending, new first 2–3 seconds. Three separate concepts = three full edits.",
 "The monthly batch only pays if one template and one batch of footage really cut your hours. Time yourself on the first one.",
 "Update 'Hours per full edit' with your real times after each job."]): p.cell(26+i,1,t_)
wb.save("kit/Zero-to-Three-Tracker.xlsx"); print("xlsx saved")
