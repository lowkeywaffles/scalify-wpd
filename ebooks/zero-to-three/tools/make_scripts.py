import re,html
s=open('part1.html').read()+open('part2.html').read()
out=["ZERO TO THREE - MESSAGE SCRIPTS\nCopy, then replace everything in [brackets]. Write the first line fresh for every business.\n"]
last=""
for m in re.finditer(r'<(h1|h2|h3)>(.*?)</\1>|<div class="script">(.*?)</div>',s,re.S):
    if m.group(2): last=re.sub('<.*?>','',m.group(2))
    else: out.append("\n=== "+html.unescape(last)+" ===\n"+html.unescape(re.sub('<.*?>','',m.group(3)))+"\n")
open('kit/Scripts.txt','w').write("".join(out))
