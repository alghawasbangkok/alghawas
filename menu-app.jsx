const { useState, useEffect, useRef, useMemo } = React;
const DATA = window.GHAWAS_STORE.load();
// Floating order-bar positioning (kept here so every HTML shell gets it).
(function injectOrderCSS() {
  const css = ".order-bar{position:fixed;left:50%;transform:translateX(-50%);bottom:calc(86px + env(safe-area-inset-bottom));width:100%;max-width:444px;z-index:45;padding:0 12px;}"
    + "@media(min-width:1040px){.order-bar{bottom:24px;max-width:420px;right:24px;left:auto;transform:none;}}"
    + ".pac-container{z-index:99999 !important;border-radius:10px;margin-top:2px;font-family:var(--sans);box-shadow:0 8px 30px rgba(0,0,0,.18);}"
    + "@keyframes ob-pop{0%{transform:scale(1)}40%{transform:scale(1.05)}100%{transform:scale(1)}}"
    + "button,[role=button]{transition:transform .14s cubic-bezier(.23,1,.32,1);}"
    + "button:active,[role=button]:active{transform:scale(.97);}"
    + ":focus-visible{outline:2px solid var(--accent);outline-offset:2px;border-radius:6px;}"
    + "button:focus:not(:focus-visible),[role=button]:focus:not(:focus-visible){outline:none;}"
    + ".order-bar button:active{transform:scale(.985);}"
    + "@media(prefers-reduced-motion: reduce){.order-bar button{animation:none !important}button:active,[role=button]:active{transform:none !important}}";
  const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
})();
// "delivery" = full ordering + contact actions; "dinein" = clean browse-only menu.
const MODE = (window.GHAWAS_MODE === "dinein") ? "dinein" : "delivery";
const IS_DINEIN = MODE === "dinein";
// Google Maps Places Autocomplete (address autofill) — active only if a key is set in the admin.
const MAPS_KEY = (DATA.brand && DATA.brand.mapsApiKey) ? String(DATA.brand.mapsApiKey).trim() : "";
let mapsPromise = null;
function loadMaps(key) {
  if (window.google && window.google.maps && window.google.maps.places) return Promise.resolve();
  if (mapsPromise) return mapsPromise;
  mapsPromise = new Promise(function (res, rej) {
    const s = document.createElement("script");
    s.src = "https://maps.googleapis.com/maps/api/js?key=" + encodeURIComponent(key) + "&libraries=places";
    s.async = true; s.onload = res; s.onerror = rej; document.head.appendChild(s);
  });
  return mapsPromise;
}
// If the admin saves changes in another tab, refresh the menu to reflect them.
window.GHAWAS_STORE.onChange(function () { location.reload(); });
// If live publishing is configured, pull the latest from the cloud in the
// background and refresh if it differs from what we rendered.
(function () {
  try {
    window.GHAWAS_STORE.pull().then(function (remote) {
      if (remote && JSON.stringify(remote) !== JSON.stringify(window.GHAWAS_STORE.load())) {
        window.GHAWAS_STORE.save(remote);
        try { if (sessionStorage.getItem("ghawas_synced")) return; sessionStorage.setItem("ghawas_synced", "1"); } catch (e) {}
        location.reload();
      }
    });
  } catch (e) {}
})();

/* ---------- small helpers ---------- */
function parseHM(s) { if (!s) return null; const m = String(s).split(":"); if (m.length < 2) return null; return (parseInt(m[0], 10) || 0) * 60 + (parseInt(m[1], 10) || 0); }
function fmt12(hm) { const t = parseHM(hm); if (t == null) return hm || ""; let h = Math.floor(t / 60), mn = t % 60; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + (mn < 10 ? "0" + mn : mn) + " " + ap; }
function isOpenNow(hours) {
  if (!hours || !hours.open24 || !hours.close24) return { open: true, opensDisp: hours && hours.open };
  const o = parseHM(hours.open24), c = parseHM(hours.close24);
  const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes();
  const open = (c > o) ? (mins >= o && mins < c) : (mins >= o || mins < c);
  return { open: open, opensDisp: hours.open || fmt12(hours.open24) };
}
function money(n) { return "฿" + Number(n || 0).toLocaleString(); }
/* forgiving search: lowercase, strip punctuation, and also match on a
   consonant skeleton so "makbous" finds "Makboos", "biriani" finds "Biryani" */
function searchNorm(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, ""); }
function searchSkel(s) { return searchNorm(s).replace(/[aeiouwy]/g, ""); }
function searchMatch(hay, qRaw) {
  const q = searchNorm(qRaw);
  if (!q) return true;
  const h = searchNorm(hay);
  if (h.indexOf(q) >= 0) return true;
  const qs = searchSkel(qRaw);
  return qs.length >= 3 && searchSkel(hay).indexOf(qs) >= 0;
}
function priceLabel(p) {
  if (typeof p === "number") return "฿" + p.toLocaleString();
  return p; // e.g. "Ask"
}
/* rAF smooth-scroll fallback (some renderers ignore behavior:'smooth') */
function animateScroll(targetY, dur = 420) {
  const startY = window.scrollY || window.pageYOffset;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const endY = Math.max(0, Math.min(targetY, max));
  const dist = endY - startY;
  if (Math.abs(dist) < 2) return;
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    window.scrollTo(0, startY + dist * ease(p));
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function animateScrollEl(el, targetX, dur = 320) {
  const startX = el.scrollLeft;
  const dist = targetX - startX;
  if (Math.abs(dist) < 2) return;
  const t0 = performance.now();
  const ease = t => 1 - Math.pow(1 - t, 3);
  function step(now) {
    const p = Math.min(1, (now - t0) / dur);
    el.scrollLeft = startX + dist * ease(p);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}
function Pearl({ size = 7 }) {
  return (
    <span style={{
      display: "inline-block", width: size, height: size, borderRadius: "50%",
      background: "var(--accent)", verticalAlign: "middle"
    }} />
  );
}

/* ---------- brand hero ---------- */
function Hero({ openInfo }) {
  const b = DATA.brand;
  return (
    <header className="hero-banner" style={{ padding: "40px 26px 30px", textAlign: "center", background: "var(--bg)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ height: 1, width: 34, background: "var(--line-strong)" }} />
        <span style={{ fontSize: 10.5, letterSpacing: ".34em", color: "var(--ink-3)", textTransform: "uppercase", fontWeight: 600 }}>
          Est. Bangkok
        </span>
        <span style={{ height: 1, width: 34, background: "var(--line-strong)" }} />
      </div>

      <div className="ar ar-serif" style={{ fontFamily: "var(--ar-serif)", fontSize: 30, color: "var(--accent)", lineHeight: 1, marginBottom: 12 }}>
        {b.ar}
      </div>
      <h1 style={{
        margin: 0, fontFamily: "var(--serif)", fontWeight: 400,
        fontSize: 42, letterSpacing: ".14em", color: "var(--ink)", lineHeight: 1
      }}>
        {b.name}
      </h1>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "20px 0 16px" }}>
        <span style={{ height: 1, width: 28, background: "var(--line-strong)" }} />
        <Pearl />
        <span style={{ height: 1, width: 28, background: "var(--line-strong)" }} />
      </div>

      <p style={{ margin: "0 auto", maxWidth: 300, fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
        {b.blurb}<br />{b.tagline} · <span className="ar">{b.arTagline}</span>
      </p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginTop: 20 }}>
        {(IS_DINEIN ? ["Halal", "Dine-in", "Table service"] : ["Halal", "Delivery", "Pickup"]).map(t => (
          <span key={t} style={{
            fontSize: 11, letterSpacing: ".04em", color: "var(--ink-2)",
            border: "1px solid var(--line)", borderRadius: 999, padding: "5px 12px", background: "var(--paper)"
          }}>{t}</span>
        ))}
      </div>

      <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "7px 16px", borderRadius: 999, background: "var(--accent-soft)" }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: openInfo.open ? "#1f8a5b" : "#c0432f", boxShadow: "0 0 0 3px " + (openInfo.open ? "rgba(31,138,91,.2)" : "rgba(192,67,47,.18)") }} />
        <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--accent-deep)", letterSpacing: ".01em" }}>
          {openInfo.open ? "Open now" : "Closed"} · {b.hours.open} – {b.hours.close}
        </span>
      </div>
    </header>
  );
}

/* ---------- sticky search + tab strip ---------- */
function StickyNav({ navRef, query, setQuery, categories, active, goTo, onBrowse }) {
  const stripRef = useRef(null);

  // keep the active tab visible in the horizontal strip (no scrollIntoView)
  useEffect(() => {
    const strip = stripRef.current;
    if (!strip) return;
    const el = strip.querySelector(`[data-tab="${active}"]`);
    if (!el) return;
    const target = el.offsetLeft - strip.clientWidth / 2 + el.clientWidth / 2;
    animateScrollEl(strip, Math.max(0, target));
  }, [active]);

  return (
    <div ref={navRef} className="mobile-only" style={{
      position: "sticky", top: 0, zIndex: 30, background: "var(--bar-bg)",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      borderBottom: "1px solid var(--line)"
    }}>
      {/* brand line + search */}
      <div style={{ padding: "11px 16px 9px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontFamily: "var(--serif)", fontSize: 15, letterSpacing: ".12em", color: "var(--ink)", whiteSpace: "nowrap" }}>
          {DATA.brand.name}
        </span>
        <div style={{ position: "relative", flex: 1 }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="7" stroke="var(--ink-3)" strokeWidth="2" />
            <path d="M20 20l-3.2-3.2" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search dishes…"
            type="search" aria-label="Search dishes"
            style={{
              width: "100%", border: "1px solid var(--line-strong)", background: "var(--paper)",
              borderRadius: 999, padding: "9px 32px 9px 32px", fontSize: 13.5, color: "var(--ink)",
              outline: "none", fontFamily: "var(--sans)"
            }}
            onFocus={e => e.target.style.borderColor = "var(--accent)"}
            onBlur={e => e.target.style.borderColor = "var(--line-strong)"}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear" style={{
              position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)",
              width: 20, height: 20, borderRadius: "50%", background: "var(--line-strong)",
              color: "#fff", fontSize: 13, lineHeight: 1, display: "grid", placeItems: "center"
            }}>×</button>
          )}
        </div>
      </div>

      {/* category tabs */}
      {categories.length > 0 && (
        <div ref={stripRef} className="noscroll" style={{ display: "flex", gap: 6, overflowX: "auto", padding: "2px 14px 11px", scrollBehavior: "smooth" }}>
          <button onClick={onBrowse} aria-label="Browse all categories" style={{
            flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 13px", borderRadius: 999,
            fontSize: 13, fontWeight: 600, color: "var(--accent-deep)", background: "var(--accent-soft)", border: "1px solid var(--accent)"
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            All
          </button>
          {categories.map(c => {
            const on = c.id === active;
            return (
              <button key={c.id} data-tab={c.id} onClick={() => goTo(c.id)} style={{
                flex: "0 0 auto", padding: "7px 14px", borderRadius: 999, fontSize: 12.5,
                letterSpacing: ".02em", whiteSpace: "nowrap", transition: "background-color .18s ease, color .18s ease, border-color .18s ease, transform .14s cubic-bezier(.23,1,.32,1)",
                fontWeight: on ? 600 : 500,
                color: on ? "var(--on-accent)" : "var(--ink-2)",
                background: on ? "var(--accent)" : "transparent",
                border: on ? "1px solid var(--accent)" : "1px solid var(--line-strong)"
              }}>{c.en}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------- all-categories overview sheet ---------- */
function CategorySheet({ open, onClose, goTo }) {
  return (
    <Sheet open={open} onClose={onClose} title="All categories" desc="Tap a section to jump straight to it.">
      <div style={{ padding: "2px 12px 6px" }}>
        {DATA.categories.map((c, i) => (
          <button key={c.id} onClick={() => { onClose(); goTo(c.id); }} style={{
            width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 10px",
            textAlign: "left", borderBottom: i < DATA.categories.length - 1 ? "1px solid var(--line)" : "none"
          }}>
            <span style={{ flex: 1, fontSize: 15, fontWeight: 600, color: "var(--ink)" }}>{c.en}</span>
            <span className="ar" style={{ fontSize: 14, color: "var(--accent)" }}>{c.ar}</span>
            <span style={{ fontSize: 12, color: "var(--ink-3)", minWidth: 26, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c.items.length}</span>
          </button>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------- cart helpers ---------- */
const CART_KEY = "ghawas_cart_v1";
function loadCart() { try { const s = localStorage.getItem(CART_KEY); if (s) return JSON.parse(s) || {}; } catch (e) {} return {}; }
function saveCart(c) { try { localStorage.setItem(CART_KEY, JSON.stringify(c)); } catch (e) {} }
function itemKey(catId, it) { return catId + "|" + it.en; }
function cartCount(c) { return Object.values(c).reduce((n, x) => n + x.qty, 0); }
function cartTotal(c) { return Object.values(c).reduce((n, x) => n + (typeof x.price === "number" ? x.price * x.qty : 0), 0); }

/* ---------- qty stepper ---------- */
function Stepper({ qty, onAdd, onSub }) {
  if (!qty) {
    return (
      <button onClick={onAdd} aria-label="Add to order" style={{
        display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 999,
        border: "1px solid var(--accent)", background: "var(--accent-soft)", color: "var(--accent-deep)",
        fontSize: 12.5, fontWeight: 600
      }}>
        <span style={{ fontSize: 15, lineHeight: 0, marginTop: -1 }}>＋</span>Add
      </button>
    );
  }
  const btn = { width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--accent)", background: "#fff", color: "var(--accent)", fontSize: 17, lineHeight: 0, display: "grid", placeItems: "center", fontWeight: 700 };
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <button onClick={onSub} aria-label="Remove one" style={btn}>−</button>
      <span style={{ minWidth: 14, textAlign: "center", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{qty}</span>
      <button onClick={onAdd} aria-label="Add one" style={{ ...btn, background: "var(--accent)", color: "var(--on-accent)", borderColor: "var(--accent)" }}>+</button>
    </div>
  );
}

/* ---------- item row ---------- */
function itemChoices(it) {
  if (typeof it.choices === "string") return it.choices.split(",").map(s => s.trim()).filter(Boolean);
  if (Array.isArray(it.choices)) return it.choices;
  return [];
}
function ItemRow({ it, qtyOf, onAdd, onSub, ordering }) {
  const sig = it.tag === "Signature";
  const canOrder = ordering && typeof it.price === "number";
  const choices = itemChoices(it);
  const [picked, setPicked] = useState(null);
  const choice = choices.length ? (choices.indexOf(picked) >= 0 ? picked : choices[0]) : null;
  const qty = qtyOf ? qtyOf(choice) : 0;
  const askWa = DATA.brand.whatsapp && DATA.brand.whatsapp[0];
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 14,
      padding: "var(--row-py) 0", borderBottom: "1px solid var(--line)"
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: "var(--item-fs)", fontWeight: 600, color: "var(--ink)", lineHeight: 1.3, letterSpacing: ".005em" }}>
            {it.en}
          </span>
          {it.tag && (
            <span style={{
              fontSize: 9.5, letterSpacing: ".1em", textTransform: "uppercase", fontWeight: 700,
              padding: "2px 7px", borderRadius: 4,
              color: sig ? "var(--gold)" : "var(--accent)",
              background: sig ? "rgba(154,123,63,.1)" : "var(--accent-soft)"
            }}>{it.tag}</span>
          )}
        </div>
        <div className="ar" style={{ fontSize: 14, color: "var(--ink-2)", marginTop: 3, lineHeight: 1.5 }}>
          {it.ar}
        </div>
        {canOrder && choices.length > 0 && (
          <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
            {choices.map(c => {
              const on = c === choice;
              return (
                <button key={c} onClick={() => setPicked(c)} style={{
                  padding: "5px 12px", borderRadius: 999, fontSize: 12, fontWeight: on ? 700 : 500,
                  color: on ? "var(--on-accent)" : "var(--ink-2)",
                  background: on ? "var(--accent)" : "transparent",
                  border: on ? "1px solid var(--accent)" : "1px solid var(--line-strong)"
                }}>{c}</button>
              );
            })}
          </div>
        )}
        {canOrder && (
          <div style={{ marginTop: 9 }}>
            <Stepper qty={qty} onAdd={() => onAdd(choice)} onSub={() => onSub(choice)} />
          </div>
        )}
      </div>
      <div style={{
        fontSize: 15, fontWeight: 600, color: "var(--accent)", whiteSpace: "nowrap",
        fontVariantNumeric: "tabular-nums", paddingTop: 1, minWidth: 56, textAlign: "right"
      }}>
        {typeof it.price === "string" && !IS_DINEIN && askWa ? (
          <a href={"https://wa.me/" + askWa.num + "?text=" + encodeURIComponent("Hello " + DATA.brand.name + ", what is the price for: " + it.en + "?")} target="_blank" rel="noopener" style={{ color: "var(--accent)", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {priceLabel(it.price)}
          </a>
        ) : priceLabel(it.price)}
      </div>
    </div>
  );
}

/* ---------- a category block ---------- */
function Section({ cat, index, cart, onAdd, onSub, ordering }) {
  return (
    <section id={`sec-${cat.id}`} style={{ scrollMarginTop: 120, padding: "var(--sec-pt) 22px 6px" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <h2 style={{ margin: 0, fontFamily: "var(--serif)", fontWeight: 400, fontSize: 25, color: "var(--ink)", letterSpacing: "var(--head-tracking)", textTransform: "var(--head-transform)" }}>
            {cat.en}
          </h2>
          <span className="ar ar-serif" style={{ fontFamily: "var(--ar-serif)", fontSize: 19, color: "var(--accent)" }}>
            {cat.ar}
          </span>
        </div>
        {cat.note && (
          <p style={{ margin: "7px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>{cat.note}</p>
        )}
        <div style={{ height: 2, width: 38, background: "var(--accent)", marginTop: 12, borderRadius: 2 }} />
      </div>
      <div className="items-grid">
        {cat.items.map((it, i) => {
          return <ItemRow key={i} it={it} ordering={ordering}
            qtyOf={(choice) => { const k = itemKey(cat.id, it) + (choice ? "::" + choice : ""); return (cart[k] && cart[k].qty) || 0; }}
            onAdd={(choice) => onAdd(cat, it, choice)} onSub={(choice) => onSub(cat, it, choice)} />;
        })}
      </div>
    </section>
  );
}

/* ---------- bottom sheet shell ---------- */
function Sheet({ open, onClose, title, desc, children }) {
  const panelRef = useRef(null);
  const lastFocus = useRef(null);
  useEffect(() => {
    if (open) {
      lastFocus.current = document.activeElement;
      const id = setTimeout(() => { if (panelRef.current) panelRef.current.focus(); }, 60);
      const onKey = (e) => { if (e.key === "Escape") onClose(); };
      document.addEventListener("keydown", onKey);
      return () => { clearTimeout(id); document.removeEventListener("keydown", onKey); };
    } else if (lastFocus.current && lastFocus.current.focus) {
      lastFocus.current.focus(); lastFocus.current = null;
    }
  }, [open]);
  return (
    <div onClick={onClose} aria-hidden={!open} style={{
      position: "fixed", inset: 0, zIndex: 60, display: "flex",
      alignItems: "flex-end", justifyContent: "center",
      background: "rgba(20,20,18,.42)",
      opacity: open ? 1 : 0, visibility: open ? "visible" : "hidden", pointerEvents: open ? "auto" : "none",
      transition: open ? "opacity .28s ease-out" : "opacity .22s ease-out, visibility 0s linear .22s"
    }}>
      <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} onClick={e => e.stopPropagation()} style={{
        width: "100%", maxWidth: 460, background: "var(--bg)", borderRadius: "20px 20px 0 0", outline: "none",
        padding: "10px 0 calc(20px + env(safe-area-inset-bottom))", maxHeight: "82vh", overflowY: "auto",
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: open ? "transform .42s cubic-bezier(0.32,0.72,0,1)" : "transform .24s cubic-bezier(0.32,0.72,0,1)"
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--line-strong)", margin: "0 auto 8px" }} />
        <div style={{ padding: "10px 22px 0", fontSize: 12, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
          {title}
        </div>
        {desc && (
          <div style={{ padding: "5px 22px 8px", fontSize: 13, color: "var(--ink-2)", lineHeight: 1.5 }}>{desc}</div>
        )}
        <div style={{ padding: "4px 0 0" }}>{children}</div>
        <button onClick={onClose} aria-label="Close" style={{
          margin: "16px 22px 0", width: "calc(100% - 44px)", padding: "13px",
          borderRadius: 12, background: "var(--paper)", border: "1px solid var(--line)",
          fontSize: 14, fontWeight: 600, color: "var(--ink-2)"
        }}>Close</button>
      </div>
    </div>
  );
}

/* ---------- shared sheet row: clean number + tap action + copy (one look for all) ---------- */
function SheetRow({ title, subtitle, href, onClick, copy }) {
  const [copied, setCopied] = useState(false);
  const doCopy = (e) => {
    e.preventDefault(); e.stopPropagation();
    try { navigator.clipboard && navigator.clipboard.writeText(copy); } catch (_) {}
    setCopied(true); setTimeout(() => setCopied(false), 1400);
  };
  const ActionTag = href ? "a" : "button";
  const actionProps = href
    ? { href, target: href.startsWith("tel:") ? undefined : "_blank", rel: "noopener" }
    : { onClick };
  return (
    <div style={{ display: "flex", alignItems: "center", borderTop: "1px solid var(--line)" }}>
      <ActionTag {...actionProps} style={{
        flex: 1, minWidth: 0, display: "block", textDecoration: "none", color: "var(--ink)",
        background: "transparent", textAlign: "left", padding: "14px 6px 14px 22px", cursor: "pointer"
      }}>
        <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: "var(--ink)", fontVariantNumeric: "tabular-nums", lineHeight: 1.3 }}>{title}</span>
        {subtitle && <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>{subtitle}</span>}
      </ActionTag>
      <button onClick={doCopy} aria-label="Copy" style={{
        flex: "0 0 auto", margin: "0 16px 0 8px", display: "inline-flex", alignItems: "center", gap: 6,
        padding: "7px 12px", borderRadius: 9, border: "1px solid var(--line-strong)",
        background: copied ? "var(--accent-soft)" : "var(--paper)",
        color: copied ? "var(--accent)" : "var(--ink-2)", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap"
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {copied
            ? <path d="M5 12l5 5 9-10" />
            : <React.Fragment><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V5a2 2 0 0 1 2-2h10" /></React.Fragment>}
        </svg>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

/* ---------- branch group header (clear separation by location) ---------- */
function BranchGroup({ name, first, children }) {
  return (
    <div style={{ marginTop: first ? 6 : 14, borderTop: first ? "none" : "6px solid var(--paper)" }}>
      <div style={{ padding: "13px 22px 4px", fontSize: 12, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--accent)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
        {name}
      </div>
      {children}
    </div>
  );
}

/* ---------- call ---------- */
function CallSheet({ open, onClose }) {
  const locs = DATA.brand.locations;
  return (
    <Sheet open={open} onClose={onClose} title="Call to order" desc="Tap a number to call (or copy it).">
      {locs.map((loc, li) => {
        const lines = loc.phones.filter(p => p.label === "Landline");
        if (!lines.length) return null;
        return (
          <BranchGroup key={li} name={loc.name} first={li === 0}>
            {lines.map((p, i) => (
              <SheetRow key={i} title={p.disp} href={`tel:${p.num}`} copy={p.disp} />
            ))}
          </BranchGroup>
        );
      })}
    </Sheet>
  );
}

/* ---------- whatsapp ---------- */
function WhatsAppSheet({ open, onClose }) {
  const locs = DATA.brand.locations;
  const nums = DATA.brand.whatsapp;
  const msg = encodeURIComponent("Hello Al Ghawas, I'd like to place an order:");
  return (
    <Sheet open={open} onClose={onClose} title="Order on WhatsApp" desc="Tap to open a WhatsApp order (or copy the number).">
      {locs.map((loc, li) => {
        const branch = loc.name.split(" · ")[0];
        const mine = nums.filter(w => w.label === branch);
        if (!mine.length) return null;
        return (
          <BranchGroup key={li} name={loc.name} first={li === 0}>
            {mine.map((w, i) => (
              <SheetRow key={i} title={w.disp} href={`https://wa.me/${w.num}?text=${msg}`} copy={w.disp} />
            ))}
          </BranchGroup>
        );
      })}
    </Sheet>
  );
}

/* ---------- line ---------- */
function LineSheet({ open, onClose }) {
  const l = DATA.brand.line;
  const branchName = (DATA.brand.locations.find(x => l.label && x.name.startsWith(l.label)) || {}).name || l.label;
  const add = () => { window.open("https://line.me/R/nv/addFriends", "_blank", "noopener"); };
  return (
    <Sheet open={open} onClose={onClose} title="Message us on LINE" desc="Tap to add us on LINE (or copy the number).">
      <BranchGroup name={branchName} first={true}>
        <SheetRow title={l.disp} onClick={add} copy={l.disp} />
      </BranchGroup>
    </Sheet>
  );
}

/* ---------- directions (open exact Google Maps pin per branch) ---------- */
function LocationSheet({ open, onClose }) {
  const locs = DATA.brand.locations;
  return (
    <Sheet open={open} onClose={onClose} title="Get directions" desc="Tap a branch to open its exact pin in Google Maps.">
      {locs.map((loc, li) => (
        <a key={li} href={loc.mapsUrl} target="_blank" rel="noopener" style={{
          display: "flex", alignItems: "center", gap: 13, padding: "15px 22px",
          borderTop: "1px solid var(--line)", textDecoration: "none", color: "var(--ink)"
        }}>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 16, fontWeight: 600, color: "var(--ink)", lineHeight: 1.3 }}>{loc.name}</span>
            <span style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4 }}>{loc.address}</span>
          </span>
          <span style={{
            flex: "0 0 auto", display: "inline-flex", alignItems: "center", gap: 6,
            padding: "8px 13px", borderRadius: 9, background: "var(--accent)", color: "var(--on-accent)",
            fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap"
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--on-accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s-6.5-5.5-6.5-10a6.5 6.5 0 0 1 13 0c0 4.5-6.5 10-6.5 10z" /><circle cx="12" cy="11" r="2.3" />
            </svg>
            Open Maps
          </span>
        </a>
      ))}
    </Sheet>
  );
}

/* ---------- sticky bottom actions ---------- */
function ActionBar({ onCall, onWhatsapp, onLine, onDirections }) {
  const b = DATA.brand;
  const Btn = ({ children, onClick, href, primary }) => {
    const style = {
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
      padding: "9px 2px", borderRadius: 999, textDecoration: "none",
      background: primary ? "var(--accent)" : "var(--paper)",
      color: primary ? "var(--on-accent)" : "var(--ink)",
      border: primary ? "1px solid var(--accent)" : "1px solid var(--line-strong)",
      fontSize: 11, fontWeight: 600, letterSpacing: ".01em"
    };
    return href
      ? <a href={href} target="_blank" rel="noopener" style={style}>{children}</a>
      : <button onClick={onClick} style={style}>{children}</button>;
  };
  const ico = { width: 19, height: 19, fill: "none", strokeWidth: 1.9, strokeLinecap: "round", strokeLinejoin: "round" };
  return (
    <div className="mobile-only" style={{
      position: "fixed", bottom: "calc(12px + env(safe-area-inset-bottom))", left: "50%", transform: "translateX(-50%)",
      width: "calc(100% - 24px)", maxWidth: 432, zIndex: 40,
      background: "var(--bar-bg)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
      border: "1px solid var(--line)", borderRadius: 999,
      boxShadow: "0 6px 24px rgba(27,27,24,.16), 0 2px 6px rgba(27,27,24,.08)",
      padding: "8px 8px",
      display: "flex", gap: 7
    }}>
      <Btn primary onClick={onCall}>
        <svg {...ico} viewBox="0 0 24 24" stroke="var(--on-accent)"><path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" /></svg>
        Call
      </Btn>
      <Btn onClick={onWhatsapp}>
        <svg {...ico} viewBox="0 0 24 24" stroke="var(--accent)"><path d="M20 12a8 8 0 0 1-11.5 7.2L4 20l.9-4.3A8 8 0 1 1 20 12z" /><path d="M8.5 9c0 4 2.5 6.5 6.5 6.5.6 0 1.2-.6 1.2-1.2 0-.3-1.7-1.2-2-1.2s-.8.8-1.1.8-2.3-1.3-2.3-2.3c0-.3.8-.8.8-1.1s-.9-2-1.2-2C9.1 7.3 8.5 8 8.5 9z" /></svg>
        WhatsApp
      </Btn>
      <Btn onClick={onLine}>
        <svg {...ico} viewBox="0 0 24 24" stroke="var(--accent)"><path d="M21 11c0 4.1-4 7.3-9 7.3a11 11 0 0 1-2.6-.3L5 20l.8-3A6.7 6.7 0 0 1 3 11c0-4.1 4-7.3 9-7.3s9 3.2 9 7.3z" /></svg>
        LINE
      </Btn>
      <Btn onClick={onDirections}>
        <svg {...ico} viewBox="0 0 24 24" stroke="var(--accent)"><path d="M12 21s-6.5-5.5-6.5-10a6.5 6.5 0 0 1 13 0c0 4.5-6.5 10-6.5 10z" /><circle cx="12" cy="11" r="2.3" /></svg>
        Directions
      </Btn>
    </div>
  );
}

/* ---------- footer ---------- */
function Footer() {
  const b = DATA.brand;
  return (
    <footer style={{ background: "var(--paper)", borderTop: "1px solid var(--line)", padding: "34px 24px 30px", textAlign: "center", marginTop: 14 }}>
      <div className="ar ar-serif" style={{ fontFamily: "var(--ar-serif)", fontSize: 22, color: "var(--accent)", marginBottom: 6 }}>{b.ar}</div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 18, letterSpacing: ".12em", marginBottom: 18 }}>{b.name}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 320, margin: "0 auto 4px" }}>
        {b.locations.map((loc, i) => (
          <div key={i} style={{ paddingTop: i ? 14 : 0, borderTop: i ? "1px solid var(--line)" : "none" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent)", marginBottom: 4 }}>{loc.name}</div>
            <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.6 }}>{loc.address}</p>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, alignItems: "center", fontSize: 12.5, color: "var(--ink-2)", marginTop: 20 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
          <span><span style={{ color: "var(--ink)", fontWeight: 600 }}>{b.hours.days}</span> · {b.hours.open} – {b.hours.close}</span>
        </div>
        <div>Order on Talabat · <span style={{ color: "var(--ink)", fontWeight: 600 }}>{b.talabat}</span></div>
      </div>

      <div style={{
        margin: "22px auto 0", maxWidth: 340,
        border: "1px solid var(--line-strong)", borderRadius: 16, background: "var(--bg)", padding: "20px 20px 18px"
      }}>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 9 }}>
          {[0,1,2,3,4].map(i => (
            <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill="#f5a623"><path d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z" /></svg>
          ))}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginBottom: 3 }}>Enjoyed your meal?</div>
        <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5, marginBottom: 14 }}>
          Leave us a review on Google <span className="ar">· قيّمنا على جوجل</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {b.locations.map((loc, i) => (
            <a key={i} href={loc.googleReview} target="_blank" rel="noopener" style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
              padding: "11px 16px", borderRadius: 10, textDecoration: "none", fontSize: 13, fontWeight: 600,
              background: i === 0 ? "var(--accent)" : "var(--paper)",
              color: i === 0 ? "var(--on-accent)" : "var(--ink)",
              border: i === 0 ? "1px solid var(--accent)" : "1px solid var(--line-strong)"
            }}>
              Review {loc.name.split(" · ")[0]}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={i === 0 ? "var(--on-accent)" : "var(--accent)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </a>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 18 }}>
        {[
          { label: "Instagram", handle: "@" + b.instagram, url: "https://instagram.com/" + b.instagram },
          { label: "Facebook", handle: b.facebook.handle, url: b.facebook.url },
          { label: "Snapchat", handle: b.snapchat.handle, url: b.snapchat.url }
        ].map(s => (
          <a key={s.label} href={s.url} target="_blank" rel="noopener" style={{
            display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 2,
            textDecoration: "none", padding: "9px 14px", borderRadius: 12,
            border: "1px solid var(--line-strong)", background: "var(--bg)", minWidth: 92
          }}>
            <span style={{ fontSize: 10, letterSpacing: ".08em", textTransform: "uppercase", color: "var(--ink-3)", fontWeight: 700 }}>{s.label}</span>
            <span style={{ fontSize: 12.5, color: "var(--accent)", fontWeight: 600 }}>{s.handle}</span>
          </a>
        ))}
      </div>

      <div style={{ marginTop: 16, fontSize: 11.5, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-2)" }}>{b.web}</div>
      <div style={{ marginTop: 22, fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".03em" }}>
        Prices in Thai Baht (฿). Menu subject to seasonal availability.
      </div>
    </footer>
  );
}

/* ---------- empty search state ---------- */
function NoResults({ q, onPick }) {
  const picks = [];
  DATA.categories.forEach(c => c.items.forEach(it => {
    if (it.tag === "Signature" && picks.length < 3) picks.push({ it: it, catId: c.id });
  }));
  if (picks.length < 3) {
    DATA.categories.forEach(c => c.items.forEach(it => {
      if (picks.length < 3 && it.tag && !picks.some(p => p.it === it)) picks.push({ it: it, catId: c.id });
    }));
  }
  return (
    <div style={{ padding: "56px 30px 64px", textAlign: "center" }}>
      <Pearl size={9} />
      <p style={{ marginTop: 16, fontSize: 15, color: "var(--ink-2)" }}>No dishes match “{q}”.</p>
      <p style={{ fontSize: 13, color: "var(--ink-3)" }}>Try “mandi”, “shrimp”, or <span className="ar">مكبوس</span> — or one of our favourites:</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 9, maxWidth: 320, margin: "18px auto 0" }}>
        {picks.map((p, i) => (
          <button key={i} onClick={() => onPick(p.catId)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12,
            border: "1px solid var(--line-strong)", background: "var(--paper)", textAlign: "left"
          }}>
            <span style={{ flex: 1, minWidth: 0 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 600, color: "var(--ink)" }}>{p.it.en}</span>
              <span className="ar" style={{ display: "block", fontSize: 12.5, color: "var(--ink-3)", marginTop: 1 }}>{p.it.ar}</span>
            </span>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--accent)", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>{priceLabel(p.it.price)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ---------- tweak system ---------- */
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "pearl",
  "lettering": "refined",
  "density": "standard",
  "ordering": "on"
}/*EDITMODE-END*/;

const THEMES = {
  pearl: {
    "--bg": "#ffffff", "--paper": "#faf8f4", "--ink": "#1b1b18", "--ink-2": "#6f6c64",
    "--ink-3": "#837e6e", "--line": "#ece8e0", "--line-strong": "#ddd8cc",
    "--accent": "#0e5f66", "--accent-deep": "#0a474d", "--accent-soft": "#eef4f3",
    "--gold": "#9a7b3f", "--gutter": "#efece6", "--bar-bg": "rgba(255,255,255,.94)", "--on-accent": "#ffffff"
  },
  sand: {
    "--bg": "#f8f2e7", "--paper": "#f0e7d6", "--ink": "#2a2418", "--ink-2": "#6f6450",
    "--ink-3": "#857a63", "--line": "#e6dcc7", "--line-strong": "#d8cbb1",
    "--accent": "#b0653c", "--accent-deep": "#8c4e2c", "--accent-soft": "#f3e7da",
    "--gold": "#9a7b3f", "--gutter": "#e8dec9", "--bar-bg": "rgba(248,242,231,.94)", "--on-accent": "#fff7ec"
  },
  midnight: {
    "--bg": "#16150f", "--paper": "#1f1d15", "--ink": "#f2ecdd", "--ink-2": "#b2aa96",
    "--ink-3": "#9a917d", "--line": "#2c2a20", "--line-strong": "#3b3829",
    "--accent": "#cba24c", "--accent-deep": "#b0883a", "--accent-soft": "rgba(203,162,76,.14)",
    "--gold": "#cba24c", "--gutter": "#0c0b07", "--bar-bg": "rgba(22,21,15,.92)", "--on-accent": "#1a180f"
  }
};
const LETTERING = {
  refined: { "--serif": '"Marcellus", Georgia, serif', "--ar-serif": '"El Messiri","Tajawal",serif',
             "--head-tracking": ".01em", "--head-transform": "none" },
  modern:  { "--serif": '"Hanken Grotesk", system-ui, sans-serif', "--ar-serif": '"Tajawal", sans-serif',
             "--head-tracking": ".07em", "--head-transform": "uppercase" }
};
const DENSITY = {
  cozy:     { "--row-py": "18px", "--sec-pt": "40px", "--item-fs": "15.5px" },
  standard: { "--row-py": "15px", "--sec-pt": "30px", "--item-fs": "15px" },
  compact:  { "--row-py": "9px",  "--sec-pt": "22px", "--item-fs": "14px" }
};

/* ---------- order bar + order review sheet ---------- */
function OrderBar({ count, total, onClick }) {
  const popKey = useRef(0);
  const prev = useRef(count);
  if (count !== prev.current) { prev.current = count; popKey.current++; }
  if (!count) return null;
  return (
    <div className="order-bar">
      <button key={popKey.current} onClick={onClick} style={{ animation: popKey.current ? "ob-pop .32s cubic-bezier(.3,1.4,.5,1)" : "none",
        width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "13px 18px",
        borderRadius: 14, background: "var(--accent)", color: "var(--on-accent)",
        boxShadow: "0 8px 24px rgba(14,95,102,.34)", border: "none"
      }}>
        <span style={{ width: 26, height: 26, borderRadius: "50%", background: "rgba(255,255,255,.22)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700 }}>{count}</span>
        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: ".01em" }}>View order</span>
        <span style={{ marginLeft: "auto", fontSize: 15, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>฿{total.toLocaleString()}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--on-accent)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
      </button>
    </div>
  );
}

function OrderRow({ label, val }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "3px 0", fontSize: 13.5, color: "var(--ink-2)" }}>
      <span>{label}</span><span style={{ fontVariantNumeric: "tabular-nums" }}>{val}</span>
    </div>
  );
}
function OrderSheet({ open, onClose, cart, onAdd, onSub, onClear }) {
  const b = DATA.brand;
  const branches = [];
  b.whatsapp.forEach(w => { if (branches.indexOf(w.label) < 0) branches.push(w.label); });
  const [branch, setBranch] = useState(branches[0] || "");
  const [otype, setOtype] = useState("Delivery");
  const CUST_KEY = "ghawas_customer_v1";
  const [form, setForm] = useState(() => {
    const base = { name: "", phone: "", address: "", building: "", floor: "", time: "", notes: "", mapLink: "" };
    try { const s = JSON.parse(localStorage.getItem(CUST_KEY) || "null"); if (s) return { ...base, name: s.name || "", phone: s.phone || "", address: s.address || "", building: s.building || "", floor: s.floor || "" }; } catch (e) {}
    return base;
  });
  const [hasSaved, setHasSaved] = useState(() => { try { return !!localStorage.getItem(CUST_KEY); } catch (e) { return false; } });
  const [sentHint, setSentHint] = useState(false);
  const clearSaved = () => { try { localStorage.removeItem(CUST_KEY); } catch (e) {} setHasSaved(false); setForm(f => ({ ...f, name: "", phone: "", address: "", building: "", floor: "" })); };
  const [err, setErr] = useState("");
  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const addrRef = useRef(null);
  // Attach Google Places Autocomplete to the address box (when a key is set).
  useEffect(() => {
    if (!open || otype !== "Delivery" || !MAPS_KEY || !addrRef.current) return;
    let ac;
    loadMaps(MAPS_KEY).then(function () {
      if (!addrRef.current || !(window.google && window.google.maps && window.google.maps.places)) return;
      ac = new window.google.maps.places.Autocomplete(addrRef.current, { fields: ["formatted_address", "geometry"], types: ["address"] });
      ac.addListener("place_changed", function () {
        const p = ac.getPlace();
        if (p.formatted_address) setF("address", p.formatted_address);
        if (p.geometry && p.geometry.location) {
          setF("mapLink", "https://www.google.com/maps?q=" + p.geometry.location.lat() + "," + p.geometry.location.lng());
        }
      });
    }).catch(function () {});
  }, [open, otype]);
  const lines = Object.keys(cart).map(k => cart[k]);
  const subtotal = cartTotal(cart);
  const minOrder = Number(b.minOrder || 0);
  const feeRate = Number(b.deliveryFee || 0);
  const vatP = Number(b.vatPercent || 0);
  const isDelivery = otype === "Delivery";
  const vat = vatP > 0 ? Math.round(subtotal * vatP / 100) : 0;
  const fee = isDelivery ? feeRate : 0;
  const total = subtotal + vat + fee;

  const send = () => {
    const isDel = otype === "Delivery";
    if (!form.name.trim() || !form.phone.trim()) { setErr("Please add your name and phone number."); return; }
    if (isDel && !form.address.trim() && !form.mapLink) { setErr("Please add your address or share your location."); return; }
    if (isDel && minOrder > 0 && subtotal < minOrder) { setErr("Minimum order for delivery is " + money(minOrder) + "."); return; }
    setErr("");
    const wa = b.whatsapp.find(w => w.label === branch) || b.whatsapp[0];
    if (!wa) return;
    const add = (label, val) => { if (val && val.trim()) msg += "\n" + label + ": " + val.trim(); };
    let msg = "*" + (isDel ? "DELIVERY" : "PICKUP") + " ORDER*  —  " + b.name + " (" + branch + ")\n";
    msg += "\n*Items:*\n";
    lines.forEach(l => { msg += "• " + l.qty + "× " + l.en + (typeof l.price === "number" ? " — ฿" + (l.price * l.qty).toLocaleString() : "") + "\n"; });
    msg += "\nSubtotal: " + money(subtotal);
    if (vat > 0) msg += "\nVAT " + vatP + "%: " + money(vat);
    if (fee > 0) msg += "\nDelivery fee: " + money(fee);
    msg += "\n*Total: " + money(total) + "*\n";
    msg += "\n*" + (isDel ? "Deliver to" : "Pickup details") + ":*";
    add("Name", form.name);
    add("Phone", form.phone);
    if (isDel) {
      add("Address / area", form.address);
      add("Building / condo", form.building);
      add("Floor / unit / room", form.floor);
      add("Map", form.mapLink);
    } else {
      add("Pickup time", form.time || "ASAP");
    }
    add("Notes", form.notes);
    try { localStorage.setItem(CUST_KEY, JSON.stringify({ name: form.name, phone: form.phone, address: form.address, building: form.building, floor: form.floor })); setHasSaved(true); } catch (e) {}
    setSentHint(true);
    window.open("https://wa.me/" + wa.num + "?text=" + encodeURIComponent(msg), "_blank", "noopener");
  };

  const fieldStyle = { width: "100%", border: "1px solid var(--line-strong)", borderRadius: 10, padding: "10px 12px", fontSize: 13.5, fontFamily: "var(--sans)", color: "var(--ink)", outline: "none", background: "var(--paper)" };
  const Lbl = ({ children, htmlFor }) => { const st = { display: "block", fontSize: 11, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ink-3)", margin: "0 0 5px" }; return htmlFor ? <label htmlFor={htmlFor} style={st}>{children}</label> : <div style={st}>{children}</div>; };

  return (
    <Sheet open={open} onClose={onClose} title="Your order" desc="Review, add your details, then send on WhatsApp — we’ll confirm.">
      {lines.length === 0 ? (
        <div style={{ padding: "26px 22px", textAlign: "center", color: "var(--ink-3)", fontSize: 14 }}>Your order is empty.</div>
      ) : (
        <div>
          {lines.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 22px", borderTop: "1px solid var(--line)" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "var(--ink)" }}>{l.en}</div>
                <div className="ar" style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 1 }}>{l.ar}</div>
              </div>
              <Stepper qty={l.qty} onAdd={() => onAdd(null, l)} onSub={() => onSub(null, l)} />
              <div style={{ width: 64, textAlign: "right", fontSize: 14, fontWeight: 600, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
                {typeof l.price === "number" ? "฿" + (l.price * l.qty).toLocaleString() : "—"}
              </div>
            </div>
          ))}

          <div style={{ padding: "12px 22px 0", borderTop: "1px solid var(--line)" }}>
            <OrderRow label="Subtotal" val={money(subtotal)} />
            {vatP > 0 && <OrderRow label={"VAT " + vatP + "%"} val={money(vat)} />}
            {isDelivery && fee > 0 && <OrderRow label="Delivery fee" val={money(fee)} />}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8, paddingTop: 8, borderTop: "1px dashed var(--line-strong)" }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Total</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>{money(total)}</span>
            </div>
            {isDelivery && minOrder > 0 && subtotal < minOrder && (
              <div style={{ fontSize: 12, color: "#c0432f", marginTop: 8, fontWeight: 600 }}>Minimum order for delivery is {money(minOrder)} (add {money(minOrder - subtotal)} more).</div>
            )}
            {(minOrder > 0 || feeRate > 0) && (
              <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 7 }}>
                {minOrder > 0 ? "Min " + money(minOrder) + " for delivery" : ""}{minOrder > 0 && feeRate > 0 ? " · " : ""}{feeRate > 0 ? "Delivery " + money(feeRate) : ""}
              </div>
            )}
          </div>

          <div style={{ padding: "10px 22px 0" }}>
            <Lbl>Order type</Lbl>
            <div role="radiogroup" aria-label="Order type" style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              {["Delivery", "Pickup"].map(ot => (
                <button key={ot} role="radio" aria-checked={ot === otype} onClick={() => setOtype(ot)} style={{
                  flex: 1, padding: "11px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: "1px solid " + (ot === otype ? "var(--accent)" : "var(--line-strong)"),
                  background: ot === otype ? "var(--accent)" : "transparent",
                  color: ot === otype ? "var(--on-accent)" : "var(--ink-2)"
                }}>{ot}</button>
              ))}
            </div>

            {branches.length > 1 && (
              <div style={{ marginBottom: 14 }}>
                <Lbl>{otype === "Pickup" ? "Pick up at" : "Order from"}</Lbl>
                <div role="radiogroup" aria-label={otype === "Pickup" ? "Pick up at" : "Order from"} style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {branches.map(br => (
                    <button key={br} role="radio" aria-checked={br === branch} onClick={() => setBranch(br)} style={{
                      padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 600,
                      border: "1px solid " + (br === branch ? "var(--accent)" : "var(--line-strong)"),
                      background: br === branch ? "var(--accent)" : "transparent",
                      color: br === branch ? "var(--on-accent)" : "var(--ink-2)"
                    }}>{br}</button>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
              <div><Lbl htmlFor="of-name">Name</Lbl><input id="of-name" autoComplete="name" value={form.name} onChange={e => setF("name", e.target.value)} placeholder="Your name" style={fieldStyle} /></div>
              <div><Lbl htmlFor="of-phone">Phone</Lbl><input id="of-phone" type="tel" autoComplete="tel" value={form.phone} onChange={e => setF("phone", e.target.value)} placeholder="08x-xxx-xxxx" style={fieldStyle} inputMode="tel" /></div>
            </div>

            {otype === "Delivery" ? (
              <React.Fragment>
                <div style={{ marginBottom: 10 }}>
                  <Lbl htmlFor="of-addr">{MAPS_KEY ? "Address — search on Google Maps" : "Address / area"}</Lbl>
                  <input id="of-addr" autoComplete="street-address" ref={addrRef} value={form.address} onChange={e => { setF("address", e.target.value); }} placeholder={MAPS_KEY ? "Start typing, then pick your address…" : "Street, soi, district"} style={fieldStyle} />
                  {MAPS_KEY && <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 5 }}>Choose from the Google suggestions to attach an exact map pin.</div>}
                  {form.mapLink && <div style={{ fontSize: 12, color: "var(--accent)", marginTop: 6, fontWeight: 600 }}>📍 Map pin attached</div>}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                  <div><Lbl htmlFor="of-bldg">Building / condo</Lbl><input id="of-bldg" autoComplete="address-line2" value={form.building} onChange={e => setF("building", e.target.value)} placeholder="Name / no." style={fieldStyle} /></div>
                  <div><Lbl htmlFor="of-floor">Floor / unit / room</Lbl><input id="of-floor" value={form.floor} onChange={e => setF("floor", e.target.value)} placeholder="e.g. 12A / 1203" style={fieldStyle} /></div>
                </div>
              </React.Fragment>
            ) : (
              <div style={{ marginBottom: 10 }}><Lbl htmlFor="of-time">Pickup time</Lbl><input id="of-time" value={form.time} onChange={e => setF("time", e.target.value)} placeholder="e.g. in 30 min / 8:30 PM" style={fieldStyle} /></div>
            )}

            <div><Lbl htmlFor="of-notes">Notes (optional)</Lbl><textarea id="of-notes" value={form.notes} onChange={e => setF("notes", e.target.value)} rows={2} placeholder="Landmark, no onions, cutlery…" style={{ ...fieldStyle, resize: "vertical" }} /></div>

            {err && <div style={{ color: "var(--danger, #b3402f)", fontSize: 12.5, marginTop: 9, fontWeight: 600 }}>{err}</div>}
          </div>

          <div style={{ padding: "14px 22px 0", display: "flex", gap: 10 }}>
            <button onClick={onClear} style={{ flex: "0 0 auto", padding: "13px 16px", borderRadius: 12, border: "1px solid var(--line-strong)", background: "var(--paper)", color: "var(--ink-2)", fontSize: 13.5, fontWeight: 600 }}>Clear</button>
            <button onClick={send} style={{ flex: 1, padding: "13px", borderRadius: 12, background: "var(--accent)", color: "var(--on-accent)", fontSize: 14.5, fontWeight: 700, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--on-accent)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12a8 8 0 0 1-11.5 7.2L4 20l.9-4.3A8 8 0 1 1 20 12z" /></svg>
              Send {otype.toLowerCase()} on WhatsApp
            </button>
          </div>

          <div style={{ padding: "11px 22px 0", textAlign: "center" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: "var(--accent-deep)" }}>
              {otype === "Delivery"
                ? (b.etaDelivery ? "🕒 Delivery usually " + b.etaDelivery : null)
                : (b.etaPickup ? "🕒 Usually ready for pickup in " + b.etaPickup : null)}
            </div>
            <div style={{ marginTop: 6, fontSize: 12.5, color: sentHint ? "var(--accent-deep)" : "var(--ink-3)", fontWeight: sentHint ? 700 : 500, lineHeight: 1.5 }}>
              {sentHint
                ? "One more step — press Send ▸ inside WhatsApp. We’ll confirm your order shortly."
                : "WhatsApp opens with your order written for you — press Send there, and we’ll reply to confirm."}
            </div>
            {hasSaved && (
              <button onClick={clearSaved} style={{ marginTop: 7, fontSize: 11.5, color: "var(--ink-3)", textDecoration: "underline", textUnderlineOffset: 2 }}>
                Your details are saved on this device — clear them
              </button>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

/* ---------- desktop sidebar ---------- */
function Sidebar({ query, setQuery, categories, active, goTo, showActions, onCall, onWhatsapp, onLine, onDirections }) {
  const b = DATA.brand;
  const actions = [
    { key: "call", label: "Call", onClick: onCall, primary: true,
      path: "M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 13l5 2v3a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" },
    { key: "wa", label: "WhatsApp", onClick: onWhatsapp,
      path: "M20 12a8 8 0 0 1-11.5 7.2L4 20l.9-4.3A8 8 0 1 1 20 12z" },
    { key: "line", label: "LINE", onClick: onLine,
      path: "M21 11c0 4.1-4 7.3-9 7.3a11 11 0 0 1-2.6-.3L5 20l.8-3A6.7 6.7 0 0 1 3 11c0-4.1 4-7.3 9-7.3s9 3.2 9 7.3z" },
    { key: "dir", label: "Directions", onClick: onDirections,
      path: "M12 21s-6.5-5.5-6.5-10a6.5 6.5 0 0 1 13 0c0 4.5-6.5 10-6.5 10z" }
  ];
  return (
    <aside className="sidebar desktop-only noscroll">
      <div style={{ padding: "32px 26px 18px" }}>
        <div className="ar ar-serif" style={{ fontFamily: "var(--ar-serif)", fontSize: 26, color: "var(--accent)", lineHeight: 1, marginBottom: 9 }}>{b.ar}</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 24, letterSpacing: ".13em", color: "var(--ink)", lineHeight: 1 }}>{b.name}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 16, padding: "6px 13px", borderRadius: 999, background: "var(--accent-soft)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)" }} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--accent-deep)" }}>{b.hours.days} · {b.hours.open}–{b.hours.close}</span>
        </div>
      </div>

      <div style={{ padding: "4px 22px 14px", position: "relative" }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: "absolute", left: 34, top: 17, pointerEvents: "none" }}>
          <circle cx="11" cy="11" r="7" stroke="var(--ink-3)" strokeWidth="2" />
          <path d="M20 20l-3.2-3.2" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          value={query} onChange={e => setQuery(e.target.value)} placeholder="Search dishes…"
          type="search" aria-label="Search dishes"
          style={{
            width: "100%", border: "1px solid var(--line-strong)", background: "var(--paper)",
            borderRadius: 999, padding: "10px 14px 10px 34px", fontSize: 13.5, color: "var(--ink)",
            outline: "none", fontFamily: "var(--sans)"
          }}
          onFocus={e => e.target.style.borderColor = "var(--accent)"}
          onBlur={e => e.target.style.borderColor = "var(--line-strong)"} />
      </div>

      <nav style={{ padding: "2px 14px 18px" }}>
        {categories.map(c => {
          const on = c.id === active;
          return (
            <button key={c.id} onClick={() => goTo(c.id)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%",
              textAlign: "left", padding: "9px 12px", borderRadius: 9, marginBottom: 1,
              background: on ? "var(--accent-soft)" : "transparent",
              color: on ? "var(--accent-deep)" : "var(--ink-2)",
              fontSize: 13.5, fontWeight: on ? 600 : 500, transition: "background .15s"
            }}>
              <span>{c.en}</span>
              <span className="ar" style={{ fontSize: 12, opacity: .75 }}>{c.ar}</span>
            </button>
          );
        })}
      </nav>

      {showActions && (
      <div style={{ padding: "16px 20px 30px", borderTop: "1px solid var(--line)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        {actions.map(a => (
          <button key={a.key} onClick={a.onClick} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
            padding: "11px 6px", borderRadius: 11, fontSize: 12.5, fontWeight: 600,
            background: a.primary ? "var(--accent)" : "var(--paper)",
            color: a.primary ? "var(--on-accent)" : "var(--ink)",
            border: a.primary ? "1px solid var(--accent)" : "1px solid var(--line-strong)"
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={a.primary ? "var(--on-accent)" : "var(--accent)"} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d={a.path} />{a.key === "dir" && <circle cx="12" cy="11" r="2.3" />}
            </svg>
            {a.label}
          </button>
        ))}
      </div>
      )}
    </aside>
  );
}

/* ---------- root ---------- */
function App() {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(DATA.categories[0].id);
  const [callOpen, setCallOpen] = useState(false);
  const [waOpen, setWaOpen] = useState(false);
  const [lineOpen, setLineOpen] = useState(false);
  const [locOpen, setLocOpen] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [cart, setCart] = useState(() => loadCart());
  const navRef = useRef(null);
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [openInfo, setOpenInfo] = useState(() => isOpenNow(DATA.brand.hours));
  useEffect(() => { const id = setInterval(() => setOpenInfo(isOpenNow(DATA.brand.hours)), 60000); return () => clearInterval(id); }, []);
  const openNow = openInfo.open;
  const ordering = !IS_DINEIN && t.ordering !== "off" && openNow;

  function changeQty(key, info, delta) {
    setCart(prev => {
      const c = { ...prev };
      const cur = c[key] ? c[key].qty : 0;
      const q = Math.max(0, cur + delta);
      if (q === 0) delete c[key]; else c[key] = { ...(c[key] || info), qty: q };
      saveCart(c);
      return c;
    });
  }
  const addOne = (cat, it, choice) => { const base = cat ? itemKey(cat.id, it) : it.key; const key = choice ? base + "::" + choice : base; changeQty(key, { key: key, en: choice ? it.en + " — " + choice : it.en, ar: it.ar, price: it.price }, 1); };
  const subOne = (cat, it, choice) => { const base = cat ? itemKey(cat.id, it) : it.key; const key = choice ? base + "::" + choice : base; changeQty(key, it, -1); };
  const clearCart = () => { setCart({}); saveCart({}); setOrderOpen(false); };

  // apply tweak-derived CSS variables to the document root
  useEffect(() => {
    const vars = { ...THEMES[t.theme], ...LETTERING[t.lettering], ...DENSITY[t.density] };
    const root = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", THEMES[t.theme]["--bg"]);
  }, [t.theme, t.lettering, t.density]);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!q) return DATA.categories;
    return DATA.categories
      .map(c => ({ ...c, items: c.items.filter(it =>
        searchMatch(it.en, q) || (it.ar && it.ar.includes(query.trim())) || searchMatch(c.en, q)
      ) }))
      .filter(c => c.items.length > 0);
  }, [q, query]);

  // scroll-spy
  useEffect(() => {
    if (q) return; // skip while searching
    const navH = navRef.current ? navRef.current.offsetHeight : 110;
    const obs = new IntersectionObserver((entries) => {
      const vis = entries.filter(e => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      if (vis[0]) setActive(vis[0].target.id.replace("sec-", ""));
    }, { rootMargin: `-${navH + 8}px 0px -68% 0px`, threshold: 0 });
    visible.forEach(c => {
      const el = document.getElementById("sec-" + c.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [visible, q]);

  const goTo = (id) => {
    const el = document.getElementById("sec-" + id);
    if (!el) return;
    const navH = navRef.current ? navRef.current.offsetHeight : 110;
    const off = Math.max(navH, 18); // desktop has no sticky top bar
    const y = el.getBoundingClientRect().top + window.scrollY - off + 1;
    animateScroll(y);
    setActive(id);
  };

  return (
    <div>
      {DATA.brand.announcement ? (
        <div style={{ background: "var(--accent)", color: "var(--on-accent)", textAlign: "center", fontSize: 13, fontWeight: 600, padding: "9px 16px", letterSpacing: ".01em" }}>
          {DATA.brand.announcement}
        </div>
      ) : null}
      <Hero openInfo={openInfo} />
      {!IS_DINEIN && !openNow && (
        <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 22px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "rgba(192,67,47,.08)", border: "1px solid rgba(192,67,47,.25)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#c0432f", flex: "0 0 auto" }} />
            <span style={{ fontSize: 13, color: "var(--ink)", lineHeight: 1.4 }}>
              We’re closed right now — online ordering opens at <strong>{openInfo.opensDisp}</strong>. You can still browse the menu.
            </span>
          </div>
        </div>
      )}
      <div className="menu-layout">
        <Sidebar query={query} setQuery={setQuery} categories={visible} active={active} goTo={goTo}
          showActions={!IS_DINEIN}
          onCall={() => setCallOpen(true)} onWhatsapp={() => setWaOpen(true)}
          onLine={() => setLineOpen(true)} onDirections={() => setLocOpen(true)} />
        <div className="content">
          <StickyNav navRef={navRef} query={query} setQuery={setQuery}
            categories={visible} active={active} goTo={goTo} onBrowse={() => setCatsOpen(true)} />
          {visible.length === 0
            ? <NoResults q={query.trim()} onPick={(catId) => { setQuery(""); setTimeout(() => goTo(catId), 60); }} />
            : visible.map((c, i) => <Section key={c.id} cat={c} index={i} cart={cart} onAdd={addOne} onSub={subOne} ordering={ordering} />)}
        </div>
      </div>

      <Footer />
      {!IS_DINEIN && (
        <React.Fragment>
          <div className="mobile-only" style={{ height: 92 }} />
          <ActionBar onCall={() => setCallOpen(true)} onWhatsapp={() => setWaOpen(true)} onLine={() => setLineOpen(true)} onDirections={() => setLocOpen(true)} />
          <CallSheet open={callOpen} onClose={() => setCallOpen(false)} />
          <CategorySheet open={catsOpen} onClose={() => setCatsOpen(false)} goTo={(id) => { setQuery(""); setTimeout(() => goTo(id), 60); }} />
          <WhatsAppSheet open={waOpen} onClose={() => setWaOpen(false)} />
          <LineSheet open={lineOpen} onClose={() => setLineOpen(false)} />
          <LocationSheet open={locOpen} onClose={() => setLocOpen(false)} />
          {ordering && <OrderBar count={cartCount(cart)} total={cartTotal(cart)} onClick={() => setOrderOpen(true)} />}
          <OrderSheet open={orderOpen} onClose={() => setOrderOpen(false)} cart={cart} onAdd={addOne} onSub={subOne} onClear={clearCart} />
        </React.Fragment>
      )}

      <TweaksPanel>
        <TweakSection label="Atmosphere" />
        <TweakRadio label="Theme" value={t.theme}
          options={["pearl", "sand", "midnight"]}
          onChange={v => setTweak("theme", v)} />
        <TweakSection label="Lettering" />
        <TweakRadio label="Headings" value={t.lettering}
          options={["refined", "modern"]}
          onChange={v => setTweak("lettering", v)} />
        <TweakSection label="Rhythm" />
        <TweakRadio label="Density" value={t.density}
          options={["cozy", "standard", "compact"]}
          onChange={v => setTweak("density", v)} />
        {!IS_DINEIN && <TweakSection label="Ordering" />}
        {!IS_DINEIN && (
          <TweakRadio label="WhatsApp ordering" value={t.ordering}
            options={["on", "off"]}
            onChange={v => setTweak("ordering", v)} />
        )}
      </TweaksPanel>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);