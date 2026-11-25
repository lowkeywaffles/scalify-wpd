---
name: web-attack-audit
description: Audit a web app for 21 real-world attacks that AI-written ("vibe-coded") apps routinely miss — HTTP/2 Rapid Reset, the bcrypt 72-byte trap, forged SAML, nOAuth email spoofing, GraphQL-alias 2FA brute force, 2FA replay, ReDoS, JWT algorithm confusion, request smuggling, cache poisoning, rate-limit IP spoofing, RLS bypass through views, Math.random tokens, timing attacks, padding oracles, prototype pollution, template injection, XXE, WebSocket hijacking, Unicode look-alike usernames, and the most common one of all, missing authorization (IDOR / RLS off / service key in the browser). Use when someone says "security audit", "is my app safe", "check for vulnerabilities", "harden my app", "pentest my code", "/web-attack-audit", or before launching anything with logins, payments or user data. Defensive only.
---

# Web attack audit

A checklist audit for apps written fast (often with AI). Each item: **what goes wrong**, **how to find it in the code**, **the fix**. Work through every item that applies to the stack, then report.

Defensive use only: audit code the user owns or is authorised to test. Never run attacks against systems you don't own, never write working exploit payloads for third-party targets, and never print secrets you find (say where they are, not what they are).

## How to run it

1. **Map the stack first** (2 minutes): framework, hosting/CDN/proxy, database (Supabase/Postgres?), auth (passwords, OAuth, SAML, 2FA), APIs (REST, GraphQL, WebSockets), XML/templates/uploads, how sessions and tokens are made. Mark each item below **applies / not applicable** from this map. Don't skip an item without saying why.
2. **Search, then read.** The grep hints are starting points; confirm every hit by reading the code path. A grep hit is not a finding.
3. **Report** with the format at the bottom. Fix only when the user asks; every fix gets a test that would have failed before it.

---

## The 21 checks

### 1. HTTP/2 "Rapid Reset" — knocked offline
Attackers open and instantly cancel HTTP/2 streams in a loop (CVE-2023-44487) to exhaust the server.
- **Find:** self-hosted Node/nginx/Envoy/Go/Apache/HAProxy serving HTTP/2 directly. Check versions against the vendor's 2023-10 patches. Managed platforms (Vercel, Cloudflare, Netlify) mitigated this at the edge.
- **Fix:** upgrade the server; put it behind a CDN/load balancer that terminates HTTP/2; set stream/connection limits.

### 2. bcrypt's 72-byte limit — "logged in with a 52-character username"
bcrypt silently ignores everything after 72 bytes. If you hash `userId + username + password` (e.g. as a cache key), a long enough username pushes the password past byte 72 and *any* password matches. This hit Okta in 2024 (usernames of 52+ characters).
- **Find:** `bcrypt.hash(` / `hashpw(` with concatenated input; passwords allowed over 72 bytes (multi-byte UTF-8 counts more).
- **Fix:** hash only the password; cap password length at 72 *bytes* or pre-hash with SHA-256/HMAC before bcrypt; prefer Argon2id for new code; never use bcrypt output as a lookup/cache key.

### 3. Forged SAML login
SAML libraries have repeatedly accepted assertions whose signature covers a different element than the one the app reads (signature wrapping, XML parser differentials — e.g. ruby-saml CVE-2024-45409, CVE-2025-25291/25292).
- **Find:** `ruby-saml`, `samlify`, `passport-saml`/`@node-saml`, `python3-saml`, hand-rolled XML signature checks.
- **Fix:** latest library version; require signed assertions (not just signed responses); read identity only from the element that was verified; reject multiple assertions; pin the IdP certificate.

### 4. Spoofed Microsoft (or any OAuth) login email — "nOAuth"
In multi-tenant Microsoft Entra ID, the `email` claim is editable by the tenant admin and unverified. Apps that link accounts by email let an attacker set your email in their tenant and log in as you.
- **Find:** OAuth/OIDC callbacks that look users up by `email`; `email_verified` ignored.
- **Fix:** identify users by `sub` (+ `tid`/`oid` for Microsoft, + issuer); link by email only when `email_verified` is true and the provider is authoritative for that domain.

### 5. 2FA brute force with GraphQL aliases
One GraphQL request can carry hundreds of aliased mutations (`a1: verify2fa(code:"000000") a2: ...`), so "5 requests per minute" becomes thousands of guesses. Batched JSON arrays do the same.
- **Find:** GraphQL endpoints with login/OTP/reset mutations; rate limits counted per HTTP request.
- **Fix:** count attempts per user/action in the resolver, not per request; cap aliases/batch size and query cost; lock the factor after N failures.

### 6. Replayed 2FA codes
A TOTP code is valid for ~30–90 s. If it isn't marked used, a phished or shoulder-surfed code works twice.
- **Find:** TOTP verify (`otplib`, `speakeasy`, `pyotp`) without storing the last accepted time-step; email/SMS codes not deleted after success.
- **Fix:** store the last used time-step per user and reject equal or older steps; one-time codes are deleted on first success and expire in minutes.

### 7. ReDoS — "freeze your server with a regex"
Nested quantifiers like `(a+)+`, `(\w+\s?)*$` take exponential time on crafted input, blocking Node's single thread.
- **Find:** `new RegExp(` with user input; regexes with nested `+`/`*` run on request data (email/URL validators especially). Tools: `recheck`, `safe-regex`, `eslint-plugin-regexp`.
- **Fix:** rewrite without nested quantifiers; cap input length before matching; use RE2 (`re2` package) for user-supplied patterns.

### 8. JWT signed with your public key — algorithm confusion
If verification accepts the algorithm named in the token, an attacker switches `RS256` → `HS256` and signs with your *public* key as the HMAC secret. Also: `alg: none`, and `decode()` used where `verify()` was meant.
- **Find:** `jwt.verify(token, key)` without `algorithms`; `jwt.decode(` trusted for auth; JWKS fetched from a URL in the token (`jku`/`x5u`).
- **Fix:** always pass an explicit `algorithms: ['RS256']` (or ES256); one key type per verifier; ignore `jku`/`x5u`; check `exp`, `iss`, `aud`.

### 9. Request smuggling past your proxy
Front-end and back-end disagree on where a request ends (`Content-Length` vs `Transfer-Encoding`, HTTP/2→HTTP/1 downgrade), so a hidden second request rides inside the first — bypassing the proxy's auth and filters.
- **Find:** custom reverse proxies, nginx/HAProxy in front of Node/Gunicorn, old server versions; code that reads raw bodies itself.
- **Fix:** current server versions; HTTP/2 end-to-end where possible; reject requests with both headers or malformed chunking; normalise at the edge; don't rely on the proxy as the only access check.

### 10. Cache poisoning with a header
A CDN caches a page keyed only on the URL, but the page used an *unkeyed* header (`X-Forwarded-Host`, `X-Original-URL`, `X-Forwarded-Proto`) to build links or redirects. One poisoned response is then served to everyone.
- **Find:** code reading `x-forwarded-host`/`host` to build absolute URLs, script/asset URLs, redirects or password-reset links; `Cache-Control: public` on responses that vary per user.
- **Fix:** build URLs from a configured site origin, never from request headers; `Vary` on any header you use; `Cache-Control: private, no-store` on personalised or authenticated responses.

### 11. Rate limits bypassed by spoofing the IP
Rate limiting by the first value of `X-Forwarded-For` lets the client pick any IP per request.
- **Find:** `req.headers['x-forwarded-for'].split(',')[0]`, `trust proxy` set to `true`.
- **Fix:** use the IP your platform guarantees (Vercel: `x-real-ip` / the platform's `ipAddress`; Cloudflare: `CF-Connecting-IP`), or take the entry exactly N hops from the right for N trusted proxies; rate-limit sensitive actions per account as well as per IP.

### 12. Reading past Row Level Security through a view
Postgres views run with the **view owner's** rights by default, so a view over an RLS-protected table returns every row to anyone who can query the view. On Supabase, views in `public` are exposed through the API.
- **Find:** `create view` in migrations without `with (security_invoker = true)`; Supabase dashboard → Advisors → "Security Definer View"; also `security definer` functions in exposed schemas.
- **Fix:** `create view ... with (security_invoker = true)` (Postgres 15+), or `alter view x set (security_invoker = true)`; revoke `select` from `anon`/`authenticated` on views that shouldn't be public; `security definer` functions get `set search_path = ''` and their own checks, and live in an unexposed schema.

### 13. Predictable tokens from Math.random
`Math.random()` is not cryptographic; its internal state can be recovered from a handful of outputs and every future "random" token predicted.
- **Find:** `Math.random` (also `random.random` in Python, `rand()` in PHP) anywhere near tokens, invite codes, reset links, session IDs, coupon/licence keys, file names.
- **Fix:** `crypto.getRandomValues` / `crypto.randomUUID()` (browser), `crypto.randomBytes` (Node), `secrets` (Python); at least 128 bits for secrets.

### 14. Guessing a token by timing
`a === b` on secrets returns faster when the first characters differ, leaking the secret byte by byte.
- **Find:** `===`/`==` comparisons against API keys, webhook signatures, HMACs, reset tokens, admin passwords.
- **Fix:** `crypto.timingSafeEqual` (equal-length buffers; compare hashes if lengths differ) / `hmac.compare_digest`; look tokens up by a hash, not by comparing in a loop.

### 15. Padding-oracle attacks on your cookies
Encrypting cookies/tokens with AES-CBC without a MAC, and answering "bad padding" differently from "bad data", lets an attacker decrypt and forge them.
- **Find:** `aes-*-cbc`, `createCipheriv(` without an HMAC check; homemade cookie encryption.
- **Fix:** AEAD (`aes-256-gcm`, `chacha20-poly1305`) or a vetted library (iron-session, libsodium `secretbox`, Rails/Django signed cookies); identical errors for every decryption failure.

### 16. Prototype pollution into RCE
Deep-merging user JSON lets `{"__proto__": {"shell": "..."}}` or `constructor.prototype` set properties on every object, which gadgets (child_process options, template engines) turn into code execution.
- **Find:** recursive merge/`set`/`clone` helpers, `lodash.merge`/`defaultsDeep`/`_.set` with request data, `Object.assign` on parsed JSON into config.
- **Fix:** validate input with a schema (zod/valibot) and copy only known keys; reject `__proto__`, `constructor`, `prototype` keys; use `Map` or `Object.create(null)`; keep libraries updated; Node `--disable-proto=delete` where possible.

### 17. Running code in your templates (SSTI)
Passing user input as the *template* (not as data) to Jinja2, EJS, Handlebars, Pug, Twig, Nunjucks, Go templates etc. runs code on the server.
- **Find:** `render_template_string(`, `ejs.render(userInput`, `Handlebars.compile(userInput`, `new Function(`, `eval(`, email templates editable by users.
- **Fix:** templates are files you wrote; user input only ever goes in as variables; if users must write templates, use a logic-less sandboxed engine (Liquid with strict filters, Mustache).

### 18. Reading your files with XXE
XML parsers that expand external entities let an uploaded XML/SVG/DOCX/SAML document read `/etc/passwd`, environment files or internal URLs.
- **Find:** `libxmljs` with `noent: true`, `xml2js`/`fast-xml-parser` options, Java `DocumentBuilderFactory`, Python `lxml`/`xml.etree` on untrusted input; SVG and Office uploads.
- **Fix:** disable DTDs and external entities (`defusedxml` in Python; `noent: false`, `dtdload: false` in libxml); accept JSON instead of XML where possible; sanitise SVG uploads or serve them from a separate domain.

### 19. WebSocket hijacking (CSWSH)
Browsers send cookies with WebSocket upgrades from any site, and the same-origin policy doesn't block them. If the server only checks the cookie, a malicious page can open a socket as the logged-in user.
- **Find:** `ws`/`socket.io`/`Sec-WebSocket` handlers that never read the `Origin` header; socket auth that relies only on cookies.
- **Fix:** allow-list `Origin` on upgrade; authenticate with a short-lived token sent in the first message; `SameSite=Lax/Strict` session cookies; authorise every message, not just the connection.

### 20. Cloned usernames with Unicode look-alikes
`аdmin` (Cyrillic а) looks like `admin`; `ᴬdmin` normalises to `admin` in some steps and not others. Spotify had an account-takeover bug in 2013 because their username normalisation wasn't idempotent.
- **Find:** username/handle/slug uniqueness checks on raw strings; normalisation applied in some code paths but not others.
- **Fix:** one canonical form everywhere: NFKC + case-fold, applied twice to check it's stable; reject mixed scripts and confusables (Unicode TS #39 "skeleton"); restrict handles to a small allowed character set; store and compare only the canonical form.

### 21. Missing authorization — IDOR, RLS turned off, service key in the browser ⭐ (not in the original list, and the one that actually breaks most apps)
The exotic bugs above are real, but the most common breach in AI-built apps is simpler: the API never checks that *this* user may touch *that* record. Change `/api/orders/123` to `124` and you get someone else's data. On Supabase it's tables with RLS off (or `using (true)` policies), or the `service_role` key shipped to the browser — dozens of AI-generated apps leaked whole databases this way in 2025.
- **Find:**
  - every route handler/server action that takes an ID: does it filter by the signed-in user (or check membership) *before* reading or writing?
  - `select * ... where id = $1` without an owner condition; admin routes protected only by hiding the link
  - Supabase: tables without `enable row level security`; policies `using (true)` or missing `with check`; `service_role`/`SUPABASE_SERVICE_ROLE_KEY` in any client bundle or `NEXT_PUBLIC_*`/`VITE_*` variable; `.rpc()` to `security definer` functions without their own checks
  - IDs that are sequential and guessable (makes it worse, not the root cause)
- **Fix:** deny by default — RLS on every table in exposed schemas with owner/membership policies (and `with check` for writes); authorise inside every handler from the session, never from a user-supplied `userId`; service keys only on the server; add one test per route: user B requesting user A's record gets 403/404.

---

## Report format

Rank findings most severe first. For each:

```
[SEVERITY] #<check> <short title>
Where:   path/to/file.js:42 (and every other place it appears)
Why:     one plain-English sentence on what an attacker gets
Proof:   the code path you read (no live attack, no exploit payload)
Fix:     the smallest change that closes it + the test that proves it
```

Severity: **Critical** (anyone can read/write others' data, log in as others, or run code), **High** (needs a login or a specific setup), **Medium** (denial of service, information leak), **Low** (defence in depth).

Close with: the checks that **don't apply** and why, the ones you **couldn't verify** (e.g. server versions, platform settings) and what the user should check in their dashboard, and the top 3 fixes to do first.

## Rules

- Never claim the app is "secure" or "unhackable". Say which checks passed, on which code, and what wasn't covered.
- Don't print secrets, keys, tokens or personal data you come across; name the file and line.
- Prefer platform features and maintained libraries over custom crypto, parsers or rate limiters.
- One finding per root cause; list every location, fix it once in shared code.
