#!/usr/bin/env python3
"""Builds the static legal pages from the text below so they share one layout. Run: python3 tools/build-legal.py"""
import pathlib
UPDATED = "15 November 2026"
DRAFT = '<p class="draft"><strong>Plain-language draft.</strong> We wrote this to be honest and readable, but it has not yet been reviewed by a lawyer. If anything is unclear, email skelifywpd@gmail.com.</p>'
PAGES = {
"privacy": ("Privacy Policy", """
<h2>The short version</h2>
<p>Brimful is built so that we know almost nothing about you. Your jars, amounts, notes and history are stored <strong>only on your own device</strong>. They are never sent to us. There are no accounts, no analytics, no advertising and no tracking.</p>
<h2>Who we are</h2>
<p>Brimful is made and run by SCALIFY WPD, a small team based in Bole, Addis Ababa, Ethiopia (operated by an individual; not yet a registered company). Contact: skelifywpd@gmail.com. We are the "controller" of the small amount of personal data described below.</p>
<h2>What stays on your device</h2>
<p>Jar names, targets, dates, deposits and withdrawals, notes, challenges, your split percentages and your settings (currency, theme, motion, sound) are saved in your browser's local storage. We cannot see, copy or recover them. If you clear your browser data or lose the device, they are gone unless you downloaded a backup from Settings.</p>
<h2>What we receive, and why</h2>
<div class="tablewrap" tabindex="0" role="region" aria-label="Table, scroll sideways if needed"><table><thead><tr><th>Data</th><th>When</th><th>Why</th><th>Legal basis</th><th>Kept for</th></tr></thead><tbody>
<tr><td>Payment method (Telebirr or Bank of Abyssinia), the name the payment came from, the transaction ID you type, the amount, and whether we confirmed it</td><td>Only if you buy Plus</td><td>To match your transfer, unlock Plus, and handle refunds</td><td>Contract</td><td>While your licence is active, and afterwards only as long as tax or accounting rules require</td></tr>
<tr><td>Your licence key (a random code)</td><td>When you buy or restore Plus, and about once a day while the app is open</td><td>To confirm the licence is valid</td><td>Contract</td><td>Same as above</td></tr>
<tr><td>Technical request data such as IP address and browser type</td><td>Whenever any website is loaded</td><td>Delivery, security and limiting abuse. We use the IP address briefly to limit repeated payment submissions and do not store it ourselves</td><td>Legitimate interests</td><td>Hosting logs are kept by our host for a limited time under its own policy</td></tr>
</tbody></table></div>
<p>We never ask for your Telebirr PIN, bank password, card number or ID. We don't collect your email unless you write to us.</p>
<h2>Who helps us run it</h2>
<ul><li><strong>Vercel</strong> hosts the website and the payments service.</li><li><strong>Supabase</strong> stores the payment records listed above (database region: EU, Frankfurt).</li><li><strong>Telebirr (Ethio telecom)</strong> or <strong>Bank of Abyssinia</strong> process your transfer under their own terms. We see what appears on our own statement.</li></ul>
<p>We don't sell or share your data with anyone else. These providers may process data outside your country, including the EU and the United States.</p>
<h2>Your choices and rights</h2>
<ul><li><strong>Delete your app data:</strong> Settings → "Delete everything on this device", or clear your browser data.</li><li><strong>Take your data with you:</strong> Settings → "Download a backup".</li><li><strong>Payment records:</strong> email us to ask for a copy, a correction or deletion. We'll answer within 30 days. We may need to keep some records where the law requires it.</li><li>Depending on where you live (for example the EU or UK), you may also have the right to object, to restrict use, and to complain to your data-protection authority.</li></ul>
<h2>Children</h2>
<p>Brimful is for people aged 13 and over and is not directed at younger children. The app itself collects no personal data from anyone. If you are under 18, please ask a parent or guardian before buying Plus. If you believe a child under 13 has sent us payment details, email us and we will delete them.</p>
<h2>Security</h2>
<p>Payment records are stored in a database only our server can read. Your app data's safety depends on your device: anyone who can unlock your phone and open your browser can open Brimful.</p>
<h2>Changes</h2>
<p>If we change what we collect, we will update this page and its date before the change takes effect.</p>
"""),
"terms": ("Terms of Use", """
<h2>1. What Brimful is</h2>
<p>Brimful is a tool for tracking savings goals and savings challenges. <strong>It does not hold, move, invest or protect money</strong>, it is not a bank or a financial service, and nothing in it is financial, tax or legal advice. The figures are whatever you type in.</p>
<h2>2. Who can use it</h2>
<p>You must be at least 13. If you are under 18, you need a parent's or guardian's permission to buy Plus.</p>
<h2>3. Free and Plus</h2>
<p>Brimful is free to use with 2 jars and 1 challenge at a time. <strong>Brimful Plus</strong> is a one-time purchase (no subscription, no renewal) that removes those limits and adds Split and extra coin colours. The price in Ethiopian birr is shown in the app before you pay; there are no extra fees from us. Your bank or Telebirr may charge its own transfer fee.</p>
<p>Payment is by Telebirr or Bank of Abyssinia transfer. We check each payment by hand and unlock Plus once the money has arrived, usually within 24 hours. If we can't find the payment we'll say so in the app. Your licence key restores Plus on your own devices; please don't share or resell it. We may cancel keys that are clearly being shared widely.</p>
<p>Plus covers the features available today for as long as we run Brimful, and for at least 12 months from your purchase. If we ever shut Brimful down we will give at least 60 days' notice in the app, and the backup feature will keep working until then.</p>
<h2>4. Refunds</h2>
<p>See the <a href="/legal/refund">Refund Policy</a> (14 days, full amount).</p>
<h2>5. Your data is your responsibility</h2>
<p>Your jars are stored only on your device. We can't restore them if you clear your browser or lose your phone, so please download backups.</p>
<h2>6. Fair use</h2>
<p>Don't try to break, overload or reverse-engineer the service, submit false payment details, or use Brimful for anything unlawful.</p>
<h2>7. Ownership</h2>
<p>The Brimful name, design and code belong to SCALIFY WPD. Open-source parts are listed in the project's third-party notices and remain under their own licences. Telebirr and Bank of Abyssinia are names of their respective owners; Brimful is not affiliated with or endorsed by them.</p>
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
<p>Email <strong>skelifywpd@gmail.com</strong> with your licence key (Settings → Licence details) or your transaction ID.</p>
<h2>How you get the money back</h2>
<p>We send the <strong>full amount you paid</strong> back to the same Telebirr number or bank account, within 5 business days of your request. If Telebirr or the bank charges a fee for sending the refund, we pay it.</p>
<h2>What happens to the app</h2>
<p>After a refund, Plus is switched off for that licence key and the app returns to the Free plan. <strong>None of your jars, history or challenges are deleted or locked</strong>; you just can't create new ones beyond the Free limits.</p>
<h2>After 14 days</h2>
<p>We decide later requests case by case, and we will always refund if Brimful is faulty or not as described. Nothing in this policy limits rights the law gives you.</p>
<h2>If a payment wasn't recognised</h2>
<p>If you paid but Plus wasn't unlocked, email us with the transaction ID. We'll either unlock it or return your money.</p>
"""),
"cookies": ("Storage &amp; Cookies", """
<h2>No cookies</h2>
<p>Brimful sets <strong>no cookies</strong> and loads nothing from advertising or analytics companies, so there is no cookie banner to accept or reject.</p>
<h2>What is stored in your browser</h2>
<p>To work at all, and to work offline, Brimful keeps the following on your device. All of it is strictly necessary for features you asked for, and none of it is used to track you.</p>
<div class="tablewrap" tabindex="0" role="region" aria-label="Table, scroll sideways if needed"><table><thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Lifetime</th><th>Who can read it</th></tr></thead><tbody>
<tr><td><code>brimful:v1</code></td><td>Local storage</td><td>Your jars, history, challenges, settings and licence key</td><td>Until you delete it</td><td>Only this site, on this device</td></tr>
<tr><td><code>brimful-v1</code></td><td>Cache storage (service worker)</td><td>Copies of the app's own files so it opens without internet</td><td>Until a new version replaces it, or you clear site data</td><td>Only this site, on this device</td></tr>
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
<ul><li>We test with automated tools and by keyboard; we have not yet completed testing with every screen reader.</li><li>The app is in English only for now.</li></ul>
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
