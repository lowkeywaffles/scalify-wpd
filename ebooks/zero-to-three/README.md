# Zero to Three (ebook)

Buyer download: `dist/Zero-to-Three.zip` = `Zero-to-Three.pdf` (49 pages, 6×9 in) + `kit/`:
- `Zero-to-Three-Tracker.xlsx`: tracker (auto follow-up dates, next action, do-not-contact), weekly summary, pricing calculator.
  Formulas verified by recalculating in LibreOffice: pricing matches the book ($50 / $90 / $320).
- `Client-Documents.docx`: brief, proposal, shot list, revision request, delivery message, agreement.
- `Scripts.txt`: every script in the book.

Rebuild: `python3 tools/make_kit_xlsx.py && python3 tools/make_kit_docx.py && python3 tools/make_scripts.py`,
assemble `book.html` from `part1.html` + `part2.html`, print with Playwright (preferCSSPageSize), then
`python3 tools/fix_links.py Zero-to-Three.pdf` (makes the kit links relative).

Before selling: author read-through; add more real portfolio videos (one TikTok example linked so far);
have 2-3 editors try it and note where they get stuck. The worked example is fictional and labelled so.
