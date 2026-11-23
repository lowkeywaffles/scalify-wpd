// <instagram-feed src="/api/instagram"></instagram-feed>
// Renders an accessible grid of links from the private-instagram-feed endpoint. No shadow DOM, so your own CSS styles it.
// Hides itself when the feed is empty or unavailable. Usage: <script type="module" src="…/element.js"></script>

const date = (iso) => { const t = new Date(iso); return isNaN(t) ? "" : t.toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" }); };

export class InstagramFeed extends HTMLElement {
  async connectedCallback() {
    this.hidden = true;
    const src = this.getAttribute("src") || "/api/instagram";
    try {
      const r = await fetch(src, { credentials: "omit" });
      const d = r.ok ? await r.json() : null;
      if (!d?.posts?.length) return;
      const ul = document.createElement("ul");
      ul.className = "instagram-feed";
      for (const p of d.posts) {
        const li = document.createElement("li"), a = document.createElement("a"), img = document.createElement("img");
        a.href = p.permalink; a.rel = "noopener noreferrer";
        img.src = p.image; img.loading = "lazy"; img.decoding = "async"; img.width = 300; img.height = 400;
        const caption = p.caption.split("\n")[0].trim().slice(0, 120) || "Instagram post", when = date(p.time);
        img.alt = `${p.type === "video" ? "Video: " : ""}${caption} (${when ? `${when}, ` : ""}opens on Instagram)`;
        img.onerror = () => { li.remove(); if (!ul.children.length) this.hidden = true; };
        a.append(img); li.append(a); ul.append(li);
      }
      this.replaceChildren(ul);
      this.hidden = false;
    } catch { /* stay hidden */ }
  }
}
if (!customElements.get("instagram-feed")) customElements.define("instagram-feed", InstagramFeed);
