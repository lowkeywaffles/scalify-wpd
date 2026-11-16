#!/usr/bin/env python3
"""Builds the static legal pages from the text below so they share one layout. Run: python3 tools/build-legal.py"""
import pathlib
UPDATED = "15 November 2026"
DRAFT = '<p class="draft"><strong>Plain-language draft.</strong> We wrote this to be honest and readable, but it has not yet been reviewed by a lawyer. If anything is unclear, email skelifywpd@gmail.com.</p>'
PAGES = {
"privacy": ("Privacy Policy", """
<h2>The short version</h2>
<p>Brimful is built so that we know almost nothing about you. Your jars, amounts, notes and history are stored <strong>on your own device</strong>. They are never sent to us in a form we can read: if you turn on the optional cloud backup, your device locks (encrypts) the copy with your recovery code before it is uploaded, and we can't open it. There are no accounts, no analytics, no advertising and no tracking.</p>
<h2>Who we are</h2>
<p>Brimful is made and run by SCALIFY WPD, a small team based in Bole, Addis Ababa, Ethiopia (operated by an individual; not yet a registered company). Contact: skelifywpd@gmail.com. We are the "controller" of the small amount of personal data described below.</p>
<h2>What stays on your device</h2>
<p>Jar names, targets, dates, deposits and withdrawals, notes, challenges, your split percentages and your settings (currency, theme, motion, sound) are saved in your browser's local storage. If you turn on cloud backup, your recovery code is saved there too, so the app can keep the backup up to date. If you use Save Together, the invite keys and your member secret for each shared jar are saved there as well. We cannot see, copy or recover any of this. If you clear your browser data or lose the device, it is gone unless you downloaded a backup file or turned on cloud backup and kept your recovery code.</p>
<h2>What we receive, and why</h2>
<div class="tablewrap" tabindex="0" role="region" aria-label="Table, scroll sideways if needed"><table><thead><tr><th>Data</th><th>When</th><th>Why</th><th>Legal basis</th><th>Kept for</th></tr></thead><tbody>
<tr><td>Birr payments: the method (Telebirr or Bank of Abyssinia), the name the payment came from, the transaction ID you type, the amount, and whether we confirmed it</td><td>Only if you buy Plus in birr</td><td>To match your transfer, unlock Plus, and handle refunds</td><td>Contract</td><td>While your licence is active, and afterwards only as long as tax or accounting rules require. If we couldn't confirm a payment, we delete the record 180 days after telling you</td></tr>
<tr><td>Card payments: Whop's payment ID, the amount, and whether it went through or was refunded</td><td>Only if you buy Plus by card</td><td>To unlock Plus automatically and handle refunds</td><td>Contract</td><td>As for birr payments. A checkout you start but don't pay is deleted after 3 days</td></tr>
<tr><td>Your confirmation that you are 18 or older, or that a parent or guardian agreed (a yes/no)</td><td>When you buy Plus</td><td>To show the purchase was allowed</td><td>Contract and legal obligation</td><td>Same as the payment record</td></tr>
<tr><td>Encrypted cloud backup: a locked copy of your app data, stored under a lookup number made from your recovery code</td><td>Only if you turn on cloud backup; updated about 15 seconds after you change something</td><td>So you can restore your jars on another device</td><td>Your request (you can withdraw it any time)</td><td>Until you turn it off or delete everything, or automatically 400 days after its last update. We can't read its contents</td></tr>
<tr><td>Your licence key (a random code)</td><td>When you buy or restore Plus, and about once a day while the app is open</td><td>To confirm the licence is valid</td><td>Contract</td><td>Same as above</td></tr>
<tr><td>Save Together (shared jars): the jar's name, goal and preset, each member's chosen display name and colour, and each deposit's amount and note, <b>all encrypted on your device</b> with the jar's invite-link key. Not encrypted, because the service needs them to work: which member slot added each deposit, how many deposits each member has added, when people joined, and timestamps</td><td>Only if you create or join a shared jar</td><td>To show the jar to its members live and apply its rules (6 people, free deposit limit, only you can remove your own deposits)</td><td>Contract</td><td>Until the person who made the jar deletes it, or automatically after 400 days without activity. If you leave or are removed, your deposits stay in the jar's total</td></tr>
<tr><td>Technical request data such as IP address and browser type</td><td>Whenever any website is loaded</td><td>Delivery, security and limiting abuse. We use the IP address briefly to limit repeated payment submissions and do not store it ourselves</td><td>Legitimate interests</td><td>Hosting logs are kept by our host for a limited time under its own policy</td></tr>
</tbody></table></div>
<p>We never ask for your Telebirr PIN, bank password or ID. If you pay by card, Whop collects your card and contact details under its own privacy policy; we never receive your card number, and we don't copy your email from Whop into our records. We don't collect your email unless you write to us.</p>
<h2>Who helps us run it</h2>
<ul><li><strong>Vercel</strong> hosts the website and Scalify's payments service (scalify-wpd.vercel.app). The payments service currently runs in the United States; the database it uses is in the EU (Frankfurt).</li><li><strong>Supabase</strong> stores the payment records and encrypted backups listed above (database region: EU, Frankfurt).</li><li><strong>Whop</strong> processes card payments under its own terms and privacy policy.</li><li><strong>Telebirr (Ethio telecom)</strong> or <strong>Bank of Abyssinia</strong> process your transfer under their own terms. We see what appears on our own statement.</li><li><strong>Telegram</strong> delivers a message to us when a payment arrives. It says only the product, amount and payment method: never your name, transaction ID or licence key.</li></ul>
<p>We don't sell or share your data with anyone else. These providers may process data outside your country, including the EU and the United States.</p>
<h2>Your choices and rights</h2>
<ul><li><strong>Delete your app data:</strong> Settings → "Delete everything on this device", or clear your browser data.</li><li><strong>Take your data with you:</strong> Settings → "Download a backup".</li><li><strong>Payment records:</strong> email us to ask for a copy, a correction or deletion. We'll answer within 30 days. We may need to keep some records where the law requires it.</li><li>Depending on where you live (for example the EU or UK), you may also have the right to object, to restrict use, and to complain to your data-protection authority.</li></ul>
<h2>Children</h2>
<p>Brimful is for people aged 13 and over and is not directed at younger children. The app itself collects no personal data from anyone. To buy Plus you must confirm that you are 18 or older, or that a parent or guardian has agreed. A parent or guardian can ask us for a refund under the <a href="/legal/refund">Refund Policy</a>. If you believe a child under 13 has sent us payment details, email us and we will delete them.</p>
<h2>Security</h2>
<p>Payment records are stored in a database only our server can read. Cloud backups are encrypted on your device with AES-256 using a key made from your 20-character recovery code; the code never leaves your device, so neither we nor our providers can read a backup, and if you lose the code nobody can recover it. Shared jars are encrypted the same way with a random key that is part of the invite link (after the "#", which browsers don't send to servers). <b>Anyone who has the link can open and join the jar</b>, so share it only with people you trust; the person who made the jar can remove members. If a backup file is shared, the invite keys inside it are shared too, so keep backup files private. Your app data's safety also depends on your device: anyone who can unlock your phone and open your browser can open Brimful.</p>
<h2>Changes</h2>
<p>If we change what we collect, we will update this page and its date before the change takes effect.</p>
"""),
"terms": ("Terms of Use", """
<h2>1. What Brimful is</h2>
<p>Brimful is a tool for tracking savings goals and savings challenges. <strong>It does not hold, move, invest or protect money</strong>, it is not a bank or a financial service, and nothing in it is financial, tax or legal advice. The figures are whatever you type in.</p>
<h2>2. Who can use it</h2>
<p>You must be at least 13. To buy Plus you must be 18 or older, or have a parent's or guardian's agreement, and you confirm this when you pay.</p>
<h2>3. Free and Plus</h2>
<p>Brimful is free to use with 2 jars and 1 challenge at a time. <strong>Brimful Plus</strong> is a one-time purchase (no subscription, no renewal) that removes those limits and adds Split and extra coin colours. The price is shown in the app before you pay: in Ethiopian birr for Telebirr or bank transfer, or $7 USD by card. There are no extra fees from us. Telebirr or your bank may charge its own transfer fee. For card payments, Whop may add sales tax or VAT where the law requires it and shows the final total before you pay; your bank may add a foreign-transaction fee.</p>
<p>Birr payments are by Telebirr or Bank of Abyssinia transfer: we check each one by hand and unlock Plus once the money has arrived, usually within 24 hours. If we can't find the payment we'll say so in the app. Card payments go through Whop's checkout under Whop's terms, and Plus unlocks automatically once Whop confirms the payment. Your licence key restores Plus on your own devices; please don't share or resell it. We may cancel keys that are clearly being shared widely.</p>
<p>Plus covers the features available today for as long as we run Brimful, and for at least 12 months from your purchase. If we ever shut Brimful down we will give at least 60 days' notice in the app, and the backup feature will keep working until then.</p>
<h3>Save Together</h3>
<p>Plus lets you create shared jars for up to 6 people. Anyone you invite can join free; free members can add up to 15 deposits to a shared jar and can always see it, and Plus removes that limit. A shared jar is still only a tracker: <strong>no money moves through Brimful</strong>, and each person keeps their own money. Don't use shared jars to collect money from people, to run a savings group that handles others' money, or for anything unlawful. The person who made a jar can edit it, remove members and delete it for everyone. We can't read shared jars or recover them if the invite link is lost.</p>
<h2>4. Refunds</h2>
<p>See the <a href="/legal/refund">Refund Policy</a> (14 days, full amount).</p>
<h2>5. Your data is your responsibility</h2>
<p>Your jars are stored on your device. Keep a backup file, or turn on cloud backup and keep your recovery code safe. We can't restore your jars without one of those, and we can't recover a lost recovery code.</p>
<h2>6. Fair use</h2>
<p>Don't try to break, overload or reverse-engineer the service, submit false payment details, or use Brimful for anything unlawful.</p>
<h2>7. Ownership</h2>
<p>The Brimful name, design and code belong to SCALIFY WPD. Open-source parts are listed in the project's third-party notices and remain under their own licences. Telebirr, Bank of Abyssinia, Whop and Telegram are names of their respective owners; Brimful is not affiliated with or endorsed by them.</p>
<h2>8. Our responsibility to you</h2>
<p>We work hard to keep Brimful accurate and available, but it is provided "as is", and we can't promise it will never have errors or downtime. To the extent the law allows, we are not liable for indirect losses or for decisions you make based on the numbers in the app, and our total liability is limited to what you paid us. Nothing here removes rights you have under consumer law that can't be removed.</p>
<h2>9. Changes and law</h2>
<p>We may update these terms; the date above will change and important changes will be announced in the app. These terms are governed by the laws of Ethiopia. If you live elsewhere, you keep any protections your local consumer law gives you.</p>
<h2>10. Contact</h2>
<p>SCALIFY WPD, Bole, Addis Ababa, Ethiopia. skelifywpd@gmail.com</p>
"""),
"refund": ("Refund Policy", """
<h2>14 days, full refund</h2>
<p>If Brimful Plus isn't for you, ask for a refund within <strong>14 days</strong> of paying. You don't need to give a reason.</p>
<h2>How to ask</h2>
<p>Email <strong>skelifywpd@gmail.com</strong> with your licence key (Settings → Licence details), your transaction ID, or your Whop receipt. A parent or guardian can ask on a child's behalf.</p>
<h2>How you get the money back</h2>
<p><strong>Birr payments:</strong> we send the <strong>full amount you paid</strong> back to the same Telebirr number or bank account within 5 business days of your request. If Telebirr or the bank charges a fee for sending the refund, we pay it.</p>
<p><strong>Card payments:</strong> we refund the full amount through Whop to the card you used, within 5 business days of your request. Your bank then usually takes 5 to 10 business days to show it.</p>
<h2>What happens to the app</h2>
<p>After a refund, Plus is switched off for that licence key and the app returns to the Free plan. <strong>None of your jars, history or challenges are deleted or locked</strong>; you just can't create new ones beyond the Free limits.</p>
<h2>After 14 days</h2>
<p>We decide later requests case by case, and we will always refund if Brimful is faulty or not as described. Nothing in this policy limits rights the law gives you.</p>
<h2>If a payment wasn't recognised</h2>
<p>If you paid but Plus wasn't unlocked, email us with the transaction ID. We'll either unlock it or return your money.</p>
"""),
"cookies": ("Storage &amp; Cookies", """
<h2>No cookies</h2>
<p>Brimful sets <strong>no cookies</strong> and loads nothing from advertising or analytics companies, so there is no cookie banner to accept or reject. If you pay by card, Whop's checkout page (on whop.com) has its own cookie policy.</p>
<h2>What is stored in your browser</h2>
<p>To work at all, and to work offline, Brimful keeps the following on your device. All of it is strictly necessary for features you asked for, and none of it is used to track you.</p>
<div class="tablewrap" tabindex="0" role="region" aria-label="Table, scroll sideways if needed"><table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Lifetime</th><th>Who can read it</th></tr></thead><tbody>
<tr><td><code>brimful:v1</code></td><td>Local storage</td><td>Your jars, history, challenges, settings, licence key, your recovery code if cloud backup is on, and the invite keys and member secrets for shared jars you're in</td><td>Until you delete it</td><td>Only this site, on this device</td></tr>
<tr><td><code>brimful-v…</code> (the number changes with each app version)</td><td>Cache storage (service worker)</td><td>Copies of the app's own files so it opens without internet</td><td>Until a new version replaces it, or you clear site data</td><td>Only this site, on this device</td></tr>
</tbody></table></div>
<h2>How to clear it</h2>
<p>In the app: Settings → "Delete everything on this device". Or in your browser: Settings → Site data → brimful.vercel.app → Clear.</p>
<h2>If this changes</h2>
<p>If we ever add anything that isn't strictly necessary (for example usage statistics), we will ask for your consent first, with "No" as easy as "Yes", and update this page.</p>
"""),
"accessibility": ("Accessibility", """
<h2>Our aim</h2>
<p>We want Brimful to be usable by everyone, and we build towards the WCAG 2.1 AA guidelines. We don't claim to meet every point yet.</p>
<h2>What we've done</h2>
<ul><li>Everything works with a keyboard, with visible focus outlines and a "Skip to content" link.</li><li>The 3D jar is decoration: every amount and percentage is also shown as text, and screen readers skip the picture.</li><li>Challenge tiles are real buttons that announce their number, amount and whether they're done.</li><li>Light and dark themes are checked for text contrast.</li><li>Motion: the app follows your device's "reduce motion" setting, and Settings → 3D motion → Reduced turns off falling coins, tilting and flipping. Sounds can be switched off.</li><li>Text can be zoomed, and forms explain errors in words next to the field.</li></ul>
<h2>Known limits</h2>
<ul><li>We test with automated tools, by keyboard, and on a slowed-down phone profile; we have not yet tested with a screen reader on a real phone (TalkBack or VoiceOver).</li><li>The app is in English only for now.</li></ul>
<h2>Tell us</h2>
<p>If something gets in your way, email <strong>skelifywpd@gmail.com</strong> and tell us what you were trying to do and on which device. We aim to reply within 5 business days.</p>
"""),
}
HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{title} · Brimful</title>
<meta name="description" content="{title} for Brimful, the savings jar tracker by SCALIFY WPD.">
<link rel="canonical" href="https://brimful.vercel.app/legal/{slug}">
<link rel="icon" href="/assets/img/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/base.css">
<link rel="stylesheet" href="/assets/css/landing.css">
<script src="/assets/js/theme.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="nav"><a class="brand" href="/">Brimful</a><a class="btn small" href="/app">Open the app</a></header>
<main id="main" class="legal-page">
<h1>{title}</h1>
<p class="updated">Last updated: {updated}</p>
{draft}
{body}
</main>
<footer class="foot"><div class="wrap"><nav aria-label="Legal"><a href="/legal/privacy">Privacy</a><a href="/legal/terms">Terms</a><a href="/legal/refund">Refunds</a><a href="/legal/cookies">Storage &amp; cookies</a><a href="/legal/accessibility">Accessibility</a></nav><p class="fine">SCALIFY WPD, Bole, Addis Ababa, Ethiopia · skelifywpd@gmail.com</p></div></footer>
</body>
</html>
"""
out = pathlib.Path(__file__).resolve().parent.parent / "legal"
out.mkdir(exist_ok=True)
for slug, (title, body) in PAGES.items():
    (out / f"{slug}.html").write_text(HEAD.format(title=title, slug=slug, updated=UPDATED, draft=DRAFT, body=body.strip()), encoding="utf-8")
print("built", ", ".join(PAGES))
