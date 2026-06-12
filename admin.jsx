const { useState, useEffect, useRef } = React;
const store = window.GHAWAS_STORE;

/* ---------------- tiny helpers ---------------- */
function deepClone(o) { return JSON.parse(JSON.stringify(o)); }
function priceVal(v) { const t = String(v).trim(); return /^\d+(\.\d+)?$/.test(t) ? Number(t) : v; }
function digits(v) { return String(v).replace(/[^\d]/g, ""); }
function branchKey(name) { return String(name || "").split(" · ")[0]; }
function fmtHM12(hm) { if (!hm) return ""; const p = String(hm).split(":"); let h = parseInt(p[0], 10) || 0; const mn = parseInt(p[1], 10) || 0; const ap = h >= 12 ? "PM" : "AM"; let hh = h % 12; if (hh === 0) hh = 12; return hh + ":" + (mn < 10 ? "0" + mn : mn) + " " + ap; }
function numVal(v) { return Number(String(v).replace(/[^\d.]/g, "")) || 0; }

/* Build a human-readable list of what changed between two saves (for history). */
function summarize(prev, next) {
  const lines = [];
  const money = v => (typeof v === "number" ? "฿" + v.toLocaleString() : v);
  const pById = {}; prev.categories.forEach(c => pById[c.id] = c);
  const nById = {}; next.categories.forEach(c => nById[c.id] = c);
  prev.categories.forEach(c => { if (!nById[c.id]) lines.push('Removed section “' + (c.en || "—") + '”'); });
  next.categories.forEach(c => {
    const p = pById[c.id];
    if (!p) { lines.push('Added section “' + (c.en || "—") + '”'); return; }
    if (p.en !== c.en) lines.push('Renamed section “' + (p.en || "—") + '” → “' + (c.en || "—") + '”');
    const pk = {}; p.items.forEach(it => pk[it.en] = it);
    const nk = {}; c.items.forEach(it => nk[it.en] = it);
    p.items.forEach(it => { if (!(it.en in nk)) lines.push('Removed “' + (it.en || "—") + '” from ' + c.en); });
    c.items.forEach(it => {
      const pit = pk[it.en];
      if (!pit) { lines.push('Added “' + (it.en || "—") + '” to ' + c.en); return; }
      if (pit.price !== it.price) lines.push('Price “' + it.en + '”: ' + money(pit.price) + " → " + money(it.price));
      if ((pit.ar || "") !== (it.ar || "")) lines.push('Arabic name updated: “' + it.en + '”');
      if ((pit.tag || "") !== (it.tag || "")) lines.push('Badge “' + it.en + '”: ' + (pit.tag || "none") + " → " + (it.tag || "none"));
      if ((pit.choices || "") !== (it.choices || "")) lines.push('Choices updated: “' + it.en + '”');
    });
  });
  const bj = (a, b) => JSON.stringify(a) !== JSON.stringify(b);
  if (bj(prev.brand.locations, next.brand.locations)) lines.push("Updated branches / phone numbers");
  if (bj(prev.brand.whatsapp, next.brand.whatsapp)) lines.push("Updated WhatsApp numbers");
  if (bj(prev.brand.line, next.brand.line)) lines.push("Updated LINE number");
  if (bj(prev.brand.hours, next.brand.hours)) lines.push("Updated opening hours");
  if (bj(prev.brand.facebook, next.brand.facebook)) lines.push("Updated Facebook");
  if (bj(prev.brand.snapchat, next.brand.snapchat)) lines.push("Updated Snapchat");
  ["instagram", "talabat", "web", "name", "ar", "blurb"].forEach(k => { if (prev.brand[k] !== next.brand[k]) lines.push("Updated " + k); });
  return lines;
}
function download(name, text, type) {
  const blob = new Blob([text], { type: type || "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const UI = {
  input: { width: "100%", padding: "9px 11px", border: "1px solid var(--line-strong)", borderRadius: 8, background: "#fff", color: "var(--ink)", outline: "none" },
  label: { fontSize: 11, fontWeight: 700, letterSpacing: ".05em", textTransform: "uppercase", color: "var(--ink-3)", marginBottom: 5, display: "block" },
  card: { background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 14, boxShadow: "var(--shadow)" }
};

/* ---------------- form atoms ---------------- */
function Field({ label, value, onChange, placeholder, ar, mono, area, prefix }) {
  const style = {
    ...UI.input,
    ...(ar ? { fontFamily: "var(--ar)", direction: "rtl" } : {}),
    ...(mono ? { fontVariantNumeric: "tabular-nums" } : {}),
    ...(prefix ? { paddingLeft: 26 } : {})
  };
  return (
    <label style={{ display: "block" }}>
      {label && <span style={UI.label}>{label}</span>}
      <span style={{ position: "relative", display: "block" }}>
        {prefix && <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--ink-3)", fontWeight: 600, pointerEvents: "none" }}>{prefix}</span>}
        {area
          ? <textarea value={value == null ? "" : value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={2} style={{ ...style, resize: "vertical" }} />
          : <input value={value == null ? "" : value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />}
      </span>
    </label>
  );
}

function Picker({ label, value, onChange, options }) {
  return (
    <label style={{ display: "block" }}>
      {label && <span style={UI.label}>{label}</span>}
      <select value={value == null ? "" : value} onChange={e => onChange(e.target.value)} style={{ ...UI.input, appearance: "auto" }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Mini({ onClick, title, danger, disabled, children }) {
  return (
    <button onClick={onClick} title={title} disabled={disabled} style={{
      width: 34, height: 34, borderRadius: 8, flex: "0 0 auto",
      border: "1px solid " + (danger ? "var(--danger)" : "var(--line-strong)"),
      background: danger ? "var(--danger-soft)" : "#fff",
      color: danger ? "var(--danger)" : "var(--ink-2)",
      display: "grid", placeItems: "center", fontSize: 15, opacity: disabled ? 0.35 : 1,
      cursor: disabled ? "default" : "pointer"
    }}>{children}</button>
  );
}

function AddBtn({ onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 9,
      border: "1.5px dashed var(--line-strong)", background: "#fff", color: "var(--accent)", fontWeight: 600, fontSize: 14
    }}>
      <span style={{ fontSize: 18, lineHeight: 0, marginTop: -2 }}>＋</span>{children}
    </button>
  );
}

const Trash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
  </svg>
);

/* ---------------- a single dish row ---------------- */
function ItemEditor({ it, onPatch, onDelete, onMove, isFirst, isLast }) {
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 10, marginBottom: 8, background: "#fcfbf8" }}>
      <div className="grid2">
        <Field value={it.en} onChange={v => onPatch({ en: v })} placeholder="Dish name (English)" />
        <Field value={it.ar} onChange={v => onPatch({ ar: v })} placeholder="الاسم بالعربية" ar />
      </div>
      <div style={{ marginTop: 8 }}>
        <Field value={it.choices} onChange={v => onPatch({ choices: v || undefined })} placeholder="Choices customers can pick (optional) — e.g. Grilled, Fried" />
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: 130 }}>
          <Field value={it.price} onChange={v => onPatch({ price: priceVal(v) })} placeholder="250 or Ask" prefix="฿" mono />
        </div>
        <select value={it.tag || ""} onChange={e => onPatch({ tag: e.target.value || undefined })} style={{ ...UI.input, width: "auto", appearance: "auto" }}>
          <option value="">No badge</option>
          <option value="Signature">Signature</option>
          <option value="Sharing">Sharing</option>
        </select>
        <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
          <Mini onClick={() => onMove(-1)} disabled={isFirst} title="Move up">↑</Mini>
          <Mini onClick={() => onMove(1)} disabled={isLast} title="Move down">↓</Mini>
          <Mini danger onClick={onDelete} title="Delete dish"><Trash /></Mini>
        </div>
      </div>
    </div>
  );
}

/* ---------------- a category card ---------------- */
function CategoryEditor({ cat, ci, total, mutate }) {
  const [open, setOpen] = useState(true);
  const last = cat.items.length - 1;
  return (
    <div style={{ ...UI.card, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <Mini onClick={() => mutate(d => { const a = d.categories; if (ci > 0)[a[ci - 1], a[ci]] = [a[ci], a[ci - 1]]; })} disabled={ci === 0} title="Move category up">↑</Mini>
          <Mini onClick={() => mutate(d => { const a = d.categories; if (ci < total - 1)[a[ci + 1], a[ci]] = [a[ci], a[ci + 1]]; })} disabled={ci === total - 1} title="Move category down">↓</Mini>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="grid2">
            <Field label="Category (English)" value={cat.en} onChange={v => mutate(d => { d.categories[ci].en = v; })} placeholder="e.g. Grills" />
            <Field label="Category (Arabic)" value={cat.ar} onChange={v => mutate(d => { d.categories[ci].ar = v; })} placeholder="مشاوي" ar />
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Note under the title (optional)" value={cat.note} onChange={v => mutate(d => { d.categories[ci].note = v || undefined; })} placeholder="e.g. Over charcoal" />
          </div>
        </div>
        <Mini danger title="Delete this category"
          onClick={() => { if (confirm('Delete the entire "' + (cat.en || "Untitled") + '" category and all its dishes?')) mutate(d => { d.categories.splice(ci, 1); }); }}>
          <Trash />
        </Mini>
      </div>

      <button onClick={() => setOpen(!open)} style={{ marginTop: 12, marginBottom: open ? 12 : 0, fontSize: 13, fontWeight: 600, color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: 6 }}>
        <span style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "none", transition: "transform .15s" }}>▸</span>
        {cat.items.length} {cat.items.length === 1 ? "dish" : "dishes"} {open ? "— hide" : "— show & edit"}
      </button>

      {open && (
        <div style={{ borderTop: "1px solid var(--line)", paddingTop: 12 }}>
          {cat.items.map((it, ii) => (
            <ItemEditor key={ii} it={it} isFirst={ii === 0} isLast={ii === last}
              onPatch={patch => mutate(d => { Object.assign(d.categories[ci].items[ii], patch); })}
              onDelete={() => mutate(d => { d.categories[ci].items.splice(ii, 1); })}
              onMove={dir => mutate(d => { const a = d.categories[ci].items; const j = ii + dir; if (j >= 0 && j < a.length)[a[j], a[ii]] = [a[ii], a[j]]; })} />
          ))}
          <AddBtn onClick={() => mutate(d => { d.categories[ci].items.push({ en: "", ar: "", price: 0 }); })}>Add dish</AddBtn>
        </div>
      )}
    </div>
  );
}

/* ---------------- MENU tab ---------------- */
function MenuTab({ data, mutate }) {
  return (
    <div>
      <Hint>Each card is a menu section. Edit names &amp; prices, drag order with ↑ ↓, and add or remove dishes and whole sections. There’s no limit.</Hint>
      {data.categories.map((cat, ci) => (
        <CategoryEditor key={ci} cat={cat} ci={ci} total={data.categories.length} mutate={mutate} />
      ))}
      <AddBtn onClick={() => mutate(d => { d.categories.push({ id: "cat" + Date.now(), en: "New Category", ar: "", items: [] }); })}>Add category</AddBtn>
    </div>
  );
}

/* ---------------- LOCATIONS & CONTACT tab ---------------- */
function ContactTab({ data, mutate }) {
  const b = data.brand;
  const branches = b.locations.map(l => branchKey(l.name));
  const branchOpts = branches.map(x => ({ value: x, label: x }));

  return (
    <div>
      <Hint>Update branch addresses, phone numbers, map pins and messaging numbers. Numbers added here appear in the menu’s Call / WhatsApp / LINE / Directions buttons.</Hint>

      <SectionTitle>Branches</SectionTitle>
      {b.locations.map((loc, li) => (
        <div key={li} style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <strong style={{ fontSize: 15 }}>Branch {li + 1}</strong>
            <Mini danger title="Remove branch"
              onClick={() => { if (confirm("Remove this branch?")) mutate(d => { d.brand.locations.splice(li, 1); }); }}><Trash /></Mini>
          </div>
          <div className="grid2">
            <Field label="Branch name" value={loc.name} onChange={v => mutate(d => { d.brand.locations[li].name = v; })} placeholder="Sukhumvit 3 · Main Branch" />
            <Field label="Map pin link (Google Maps)" value={loc.mapsUrl} onChange={v => mutate(d => { d.brand.locations[li].mapsUrl = v; })} placeholder="https://maps.app.goo.gl/…" />
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Address" value={loc.address} onChange={v => mutate(d => { d.brand.locations[li].address = v; })} area placeholder="Street, district, city, postcode" />
          </div>
          <div style={{ marginTop: 10 }}>
            <Field label="Google Place ID (for the review button)" value={loc.placeId}
              onChange={v => mutate(d => { d.brand.locations[li].placeId = v; d.brand.locations[li].googleReview = v ? "https://search.google.com/local/writereview?placeid=" + v : ""; })}
              placeholder="ChIJ…" mono />
          </div>

          <div style={{ marginTop: 16, fontSize: 12, fontWeight: 700, color: "var(--ink-3)", letterSpacing: ".04em", textTransform: "uppercase" }}>Phone numbers</div>
          {loc.phones.map((p, pi) => (
            <div key={pi} style={{ display: "flex", gap: 8, marginTop: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 180px" }}>
                <Field value={p.disp} onChange={v => mutate(d => { const ph = d.brand.locations[li].phones[pi]; ph.disp = v; ph.num = "+" + digits(v); })} placeholder="+66 2 655 7145" mono />
              </div>
              <select value={p.label} onChange={e => mutate(d => { d.brand.locations[li].phones[pi].label = e.target.value; })} style={{ ...UI.input, width: "auto", appearance: "auto" }}>
                <option value="Landline">Landline (shows in Call)</option>
                <option value="Mobile">Mobile</option>
              </select>
              <Mini danger title="Remove number" onClick={() => mutate(d => { d.brand.locations[li].phones.splice(pi, 1); })}><Trash /></Mini>
            </div>
          ))}
          <div style={{ marginTop: 10 }}>
            <AddBtn onClick={() => mutate(d => { d.brand.locations[li].phones.push({ label: "Landline", disp: "", num: "" }); })}>Add number</AddBtn>
          </div>
        </div>
      ))}
      <AddBtn onClick={() => mutate(d => { d.brand.locations.push({ name: "New Branch", address: "", mapsUrl: "", placeId: "", googleReview: "", phones: [] }); })}>Add branch</AddBtn>

      <SectionTitle>WhatsApp numbers</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        {b.whatsapp.map((w, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginTop: i ? 8 : 0, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 180px" }}>
              <Field value={w.disp} onChange={v => mutate(d => { const x = d.brand.whatsapp[i]; x.disp = v; x.num = digits(v); })} placeholder="+66 90 383 8381" mono />
            </div>
            <select value={w.label} onChange={e => mutate(d => { d.brand.whatsapp[i].label = e.target.value; })} style={{ ...UI.input, width: "auto", appearance: "auto" }}>
              {branchOpts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <Mini danger title="Remove" onClick={() => mutate(d => { d.brand.whatsapp.splice(i, 1); })}><Trash /></Mini>
          </div>
        ))}
        <div style={{ marginTop: 12 }}>
          <AddBtn onClick={() => mutate(d => { d.brand.whatsapp.push({ disp: "", num: "", label: branches[0] || "" }); })}>Add WhatsApp number</AddBtn>
        </div>
      </div>

      <SectionTitle>LINE</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 180px" }}>
            <Field label="LINE number" value={b.line.disp} onChange={v => mutate(d => { d.brand.line.disp = v; d.brand.line.num = digits(v); })} placeholder="+66 80 338 1899" mono />
          </div>
          <div>
            <Picker label="Branch" value={b.line.label} onChange={v => mutate(d => { d.brand.line.label = v; })} options={branchOpts} />
          </div>
        </div>
      </div>

      <SectionTitle>Social &amp; ordering</SectionTitle>
      <div style={{ ...UI.card, padding: 16 }}>
        <div className="grid2">
          <Field label="Instagram handle" value={b.instagram} onChange={v => mutate(d => { d.brand.instagram = v; })} placeholder="alghawasbkk" />
          <Field label="Talabat name" value={b.talabat} onChange={v => mutate(d => { d.brand.talabat = v; })} placeholder="Al Ghawas Kitchen…" />
          <Field label="Facebook label" value={b.facebook.handle} onChange={v => mutate(d => { d.brand.facebook.handle = v; })} placeholder="Ghawas Thai" />
          <Field label="Facebook link" value={b.facebook.url} onChange={v => mutate(d => { d.brand.facebook.url = v; })} placeholder="https://facebook.com/…" />
          <Field label="Snapchat handle" value={b.snapchat.handle} onChange={v => mutate(d => { d.brand.snapchat.handle = v; })} placeholder="alghawasbkk" />
          <Field label="Snapchat link" value={b.snapchat.url} onChange={v => mutate(d => { d.brand.snapchat.url = v; })} placeholder="https://snapchat.com/add/…" />
          <Field label="Website" value={b.web} onChange={v => mutate(d => { d.brand.web = v; })} placeholder="www.alghawasrestaurant.com" />
        </div>
      </div>
    </div>
  );
}

/* ---------------- SETTINGS tab ---------------- */
function SiteQrCard({ data, mutate, flash }) {
  const url = (data.brand.siteUrl || "").trim();
  const canvasRef = useRef(null);
  const [libReady, setLibReady] = useState(() => !!window.QRCode);
  useEffect(() => {
    if (libReady) return;
    const on = () => setLibReady(true);
    window.addEventListener("qrlib-ready", on);
    return () => window.removeEventListener("qrlib-ready", on);
  }, [libReady]);
  useEffect(() => {
    if (!canvasRef.current) return;
    if (libReady && window.QRCode && url) {
      window.QRCode.toCanvas(canvasRef.current, url, { width: 180, margin: 1, color: { dark: "#0e5f66", light: "#ffffff" } }, function () {
        if (canvasRef.current) { canvasRef.current.style.width = "130px"; canvasRef.current.style.height = "130px"; }
      });
    } else {
      const x = canvasRef.current.getContext("2d"); x.clearRect(0, 0, 180, 180);
    }
  }, [url, libReady]);
  const download = () => {
    if (!canvasRef.current || !url) { flash("Add the site link first"); return; }
    const a = document.createElement("a");
    a.href = canvasRef.current.toDataURL("image/png");
    a.download = "alghawas-menu-qr.png";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };
  const copy = () => {
    if (!url) { flash("Add the site link first"); return; }
    const done = () => flash("Link copied ✓");
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done).catch(() => flash(url));
    else flash(url);
  };
  return (
    <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
        This is the link your customers open (and what the QR codes point to). If your site address ever changes, update it here and <strong>Publish</strong> — the QR below and the “QR &amp; share” on the landing page update automatically.
      </p>
      <Field label="Site link (your menu's web address)" value={data.brand.siteUrl} onChange={v => mutate(d => { d.brand.siteUrl = v; })} placeholder="https://…" mono />
      <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 14, flexWrap: "wrap" }}>
        <canvas ref={canvasRef} width="180" height="180" style={{ width: 130, height: 130, border: "1px solid var(--line)", borderRadius: 12, padding: 8, background: "#fff" }}></canvas>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          <ToolBtn primary onClick={download}>Download QR (PNG)</ToolBtn>
          <ToolBtn onClick={copy}>Copy link</ToolBtn>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ data, mutate, onExport, onImport, onDownload, onReset, flash }) {
  const b = data.brand;
  return (
    <div>
      <Hint>Opening hours, the restaurant blurb, and backups. Use “Download data file” to publish your changes to every customer’s phone.</Hint>

      <SectionTitle>Opening hours</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="Days" value={b.hours.days} onChange={v => mutate(d => { d.brand.hours.days = v; })} placeholder="Open daily" />
          <label style={{ display: "block" }}><span style={UI.label}>Opens</span>
            <input type="time" value={b.hours.open24 || ""} onChange={e => mutate(d => { d.brand.hours.open24 = e.target.value; d.brand.hours.open = fmtHM12(e.target.value); })} style={UI.input} /></label>
          <label style={{ display: "block" }}><span style={UI.label}>Closes</span>
            <input type="time" value={b.hours.close24 || ""} onChange={e => mutate(d => { d.brand.hours.close24 = e.target.value; d.brand.hours.close = fmtHM12(e.target.value); })} style={UI.input} /></label>
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>Customers see an “Open now / Closed” badge, and online ordering pauses automatically outside these hours.</p>
      </div>

      <SectionTitle>Storefront</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        <Field label="Announcement banner (leave blank to hide)" value={b.announcement} onChange={v => mutate(d => { d.brand.announcement = v; })} placeholder="e.g. New: Lamb Ouzi! · Ramadan hours 6pm–2am" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <Field label="Delivery time estimate" value={b.etaDelivery} onChange={v => mutate(d => { d.brand.etaDelivery = v; })} placeholder="e.g. 30–45 min" />
          <Field label="Pickup time estimate" value={b.etaPickup} onChange={v => mutate(d => { d.brand.etaPickup = v; })} placeholder="e.g. 15–20 min" />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
          <Field label="Min order — delivery (฿)" value={b.minOrder} onChange={v => mutate(d => { d.brand.minOrder = numVal(v); })} placeholder="0" mono />
          <Field label="Delivery fee (฿)" value={b.deliveryFee} onChange={v => mutate(d => { d.brand.deliveryFee = numVal(v); })} placeholder="0" mono />
          <Field label="VAT / service %" value={b.vatPercent} onChange={v => mutate(d => { d.brand.vatPercent = numVal(v); })} placeholder="0" mono />
        </div>
        <p style={{ margin: "10px 0 0", fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.5 }}>Set any to 0 to turn it off. VAT is added on top of the order total — leave 0 if your menu prices already include tax.</p>
      </div>

      <SectionTitle>Header text</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        <div className="grid2">
          <Field label="Restaurant name" value={b.name} onChange={v => mutate(d => { d.brand.name = v; })} />
          <Field label="Name in Arabic" value={b.ar} onChange={v => mutate(d => { d.brand.ar = v; })} ar />
          <Field label="Subtitle (English)" value={b.tagline} onChange={v => mutate(d => { d.brand.tagline = v; })} placeholder="Restaurant & Kitchen" />
          <Field label="Subtitle (Arabic)" value={b.arTagline} onChange={v => mutate(d => { d.brand.arTagline = v; })} ar placeholder="مطعم و مطبخ" />
        </div>
        <div style={{ marginTop: 10 }}>
          <Field label="Short blurb" value={b.blurb} onChange={v => mutate(d => { d.brand.blurb = v; })} area />
        </div>
      </div>

      <SectionTitle>Landing page (main screen)</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        {(() => { const H = b.home || {}; const setH = (k, v) => mutate(d => { d.brand.home = Object.assign({}, d.brand.home, { [k]: v }); }); return (
          <React.Fragment>
            <div style={{ marginBottom: 10 }}><Field label="Tagline" value={H.tagline} onChange={v => setH("tagline", v)} placeholder="Authentic Emirati & Khaleeji kitchen." /></div>
            <div style={{ marginBottom: 10 }}><Field label="Prompt" value={H.prompt} onChange={v => setH("prompt", v)} placeholder="How would you like to dine?" /></div>
            <div className="grid2">
              <Field label="Delivery button title" value={H.deliveryTitle} onChange={v => setH("deliveryTitle", v)} placeholder="Delivery & Pickup" />
              <Field label="Delivery button subtitle" value={H.deliverySub} onChange={v => setH("deliverySub", v)} placeholder="Order on WhatsApp…" />
              <Field label="Dine-in button title" value={H.dineTitle} onChange={v => setH("dineTitle", v)} placeholder="Dine-In Menu" />
              <Field label="Dine-in button subtitle" value={H.dineSub} onChange={v => setH("dineSub", v)} placeholder="Browse the full menu…" />
            </div>
            <div style={{ marginTop: 10 }}><Field label="Footer line" value={H.foot} onChange={v => setH("foot", v)} placeholder="Halal · Nana, Sukhumvit · Bangkok" /></div>
          </React.Fragment>
        ); })()}
      </div>

      <SectionTitle>Address autofill (optional)</SectionTitle>
      <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Paste a <strong>Google Maps API key</strong> to let delivery customers search and pick their address from Google (it autofills + attaches a map pin). Leave blank and they’ll just type the address. Get a key at <em>console.cloud.google.com</em> → enable “Maps JavaScript API” + “Places API”, and restrict it to your website address.
        </p>
        <Field label="Google Maps API key" value={b.mapsApiKey} onChange={v => mutate(d => { d.brand.mapsApiKey = v; })} placeholder="AIza…" mono />
      </div>

      <SectionTitle>Admin passcode</SectionTitle>
      <PasscodeCard flash={flash} />

      <SectionTitle>Site link &amp; QR code</SectionTitle>
      <SiteQrCard data={data} mutate={mutate} flash={flash} />

      <SectionTitle>Live publishing (optional)</SectionTitle>
      <CloudCard flash={flash} />

      <SectionTitle>Backup &amp; publish</SectionTitle>
      <div style={{ ...UI.card, padding: 16 }}>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
          Pressing <strong>Save</strong> updates the menu on this device immediately. To publish to <strong>all customers</strong>, download the data file and have your website person replace <code style={{ background: "var(--accent-soft)", padding: "1px 5px", borderRadius: 4 }}>menu-data.js</code> with it.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
          <ToolBtn onClick={onDownload} primary>⬇ Download data file (publish)</ToolBtn>
          <ToolBtn onClick={onExport}>Export backup (.json)</ToolBtn>
          <ToolBtn onClick={onImport}>Import backup…</ToolBtn>
          <ToolBtn onClick={onReset} danger>Reset to original menu</ToolBtn>
        </div>
      </div>
    </div>
  );
}

/* ---------------- shared bits ---------------- */
function Hint({ children }) {
  return <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6, background: "var(--accent-soft)", padding: "12px 14px", borderRadius: 10 }}>{children}</p>;
}
function SectionTitle({ children }) {
  return <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase", color: "var(--ink-3)", margin: "26px 2px 12px" }}>{children}</h2>;
}
function ToolBtn({ onClick, children, primary, danger }) {
  return (
    <button onClick={onClick} style={{
      padding: "10px 16px", borderRadius: 9, fontWeight: 600, fontSize: 13.5,
      border: "1px solid " + (primary ? "var(--accent)" : danger ? "var(--danger)" : "var(--line-strong)"),
      background: primary ? "var(--accent)" : danger ? "var(--danger-soft)" : "#fff",
      color: primary ? "#fff" : danger ? "var(--danger)" : "var(--ink)"
    }}>{children}</button>
  );
}

/* ---------------- HISTORY tab ---------------- */
function HistoryTab({ history, onClear }) {
  const fmt = t => {
    try { return new Date(t).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }); }
    catch (e) { return new Date(t).toString(); }
  };
  return (
    <div>
      <Hint>Every time you press Save, a dated entry is added here showing what changed. Newest first.</Hint>
      {history.length === 0 ? (
        <div style={{ ...UI.card, padding: 28, textAlign: "center", color: "var(--ink-3)" }}>
          No changes logged yet. Edit something and press <strong>Save</strong>.
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{history.length} saved {history.length === 1 ? "change" : "changes"}</span>
            <button onClick={onClear} style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", padding: "7px 12px", borderRadius: 8, border: "1px solid var(--danger)", background: "var(--danger-soft)" }}>Clear history</button>
          </div>
          {history.map((h, i) => (
            <div key={i} style={{ ...UI.card, padding: 14, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: h.changes && h.changes.length ? 8 : 0 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flex: "0 0 auto" }} />
                <span style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{fmt(h.time)}</span>
                {h.published && <span style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: ".04em", textTransform: "uppercase", color: "var(--ok)", background: "#e8f5ee", padding: "2px 7px", borderRadius: 5 }}>Published</span>}
              </div>
              {h.changes && h.changes.length ? (
                <ul style={{ margin: "0 0 0 2px", padding: "0 0 0 18px", color: "var(--ink-2)", fontSize: 13.5, lineHeight: 1.6 }}>
                  {h.changes.map((c, j) => <li key={j}>{c}</li>)}
                </ul>
              ) : (
                <div style={{ fontSize: 13, color: "var(--ink-3)", paddingLeft: 15 }}>Saved (no field changes detected)</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------- cloud publishing card ---------------- */
function CloudCard({ flash }) {
  const [cfg, setCfg] = useState(() => store.cloudConfig());
  const [busy, setBusy] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const save = (patch) => { const next = { ...cfg, ...patch }; setCfg(next); store.setCloudConfig(next); };
  const ready = cfg.dbUrl && cfg.apiKey && cfg.email && cfg.password;
  const publishNow = () => {
    if (!ready) { flash("Fill in all four fields first"); return; }
    setBusy(true);
    store.push(store.load()).then(ok => { setBusy(false); setErrMsg(ok ? "" : (store.lastPushError || "Publish failed — check the details below")); flash(ok ? "Published to all customers ✓" : "Publish failed"); });
  };
  return (
    <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
        <strong>Optional — one-click publishing to all customers.</strong> Sign in with a Firebase account so only you can publish (both menus share the same data). Set this up once on your own device; your password is saved only here, never on the public site. Leave blank to keep changes on this device only.
      </p>
      <Field label="Database URL" value={cfg.dbUrl} onChange={v => save({ dbUrl: v })} placeholder="https://alghawasbkk-default-rtdb.firebaseio.com" mono />
      <div style={{ marginTop: 10 }}>
        <Field label="Web API Key" value={cfg.apiKey} onChange={v => save({ apiKey: v })} placeholder="AIza…" mono />
      </div>
      <div className="grid2" style={{ marginTop: 10 }}>
        <Field label="Login email" value={cfg.email} onChange={v => save({ email: v })} placeholder="you@email.com" />
        <label style={{ display: "block" }}><span style={UI.label}>Login password</span>
          <input type="password" autoComplete="new-password" value={cfg.password || ""} onChange={e => save({ password: e.target.value })} placeholder="••••••••" style={UI.input} /></label>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <ToolBtn onClick={publishNow} primary>{busy ? "Publishing…" : "Publish now (Delivery + Dine-in)"}</ToolBtn>
        {(cfg.dbUrl || cfg.apiKey) && <ToolBtn onClick={() => { setCfg({}); store.setCloudConfig({}); setErrMsg(""); }} danger>Turn off live publishing</ToolBtn>}
      </div>
      {errMsg && (
        <div style={{ marginTop: 12, background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 9, padding: "11px 13px", fontSize: 13, fontWeight: 600, lineHeight: 1.5 }}>
          {errMsg}
        </div>
      )}
    </div>
  );
}

/* ---------------- passcode gate (deters anyone who guesses the admin URL) ---------------- */
var DEFAULT_ADMIN_CODE = "ghawas";   // FIRST-RUN ONLY — change it immediately in Settings
var PW_SALT = "ghawas_pw_salt", PW_HASH = "ghawas_pw_hash", PW_FAILS = "ghawas_pw_fails", PW_UNTIL = "ghawas_pw_until";
var MAX_FAILS = 5;

function bufToHex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ("0" + b.toString(16)).slice(-2); }).join(""); }
function hexToBytes(hex) { var a = new Uint8Array(hex.length / 2); for (var i = 0; i < a.length; i++) a[i] = parseInt(hex.substr(i * 2, 2), 16); return a; }
function randSaltHex() { var a = new Uint8Array(16); crypto.getRandomValues(a); return bufToHex(a.buffer); }
async function deriveHash(code, saltHex) {
  var km = await crypto.subtle.importKey("raw", new TextEncoder().encode(code), { name: "PBKDF2" }, false, ["deriveBits"]);
  var bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt: hexToBytes(saltHex), iterations: 150000, hash: "SHA-256" }, km, 256);
  return bufToHex(bits);
}
async function setAdminCode(code) { var salt = randSaltHex(); var hash = await deriveHash(code, salt); localStorage.setItem(PW_SALT, salt); localStorage.setItem(PW_HASH, hash); }
async function verifyAdminCode(code) {
  try {
    var salt = localStorage.getItem(PW_SALT), hash = localStorage.getItem(PW_HASH);
    if (!salt || !hash) return code === DEFAULT_ADMIN_CODE;       // first run
    if (!(crypto && crypto.subtle)) return false;
    return (await deriveHash(code, salt)) === hash;
  } catch (e) { return false; }
}
function lockSecs() { var u = parseInt(localStorage.getItem(PW_UNTIL) || "0", 10); return u > Date.now() ? Math.ceil((u - Date.now()) / 1000) : 0; }
function fmtWait(s) { return s >= 60 ? Math.ceil(s / 60) + " min" : s + "s"; }
function recordFail() { var f = (parseInt(localStorage.getItem(PW_FAILS) || "0", 10)) + 1; localStorage.setItem(PW_FAILS, String(f)); if (f >= MAX_FAILS) { localStorage.setItem(PW_UNTIL, String(Date.now() + 20 * 60 * 1000)); } return f; }
function clearFails() { localStorage.removeItem(PW_FAILS); localStorage.removeItem(PW_UNTIL); }
function usingDefault() { try { return !localStorage.getItem(PW_HASH); } catch (e) { return true; } }

function Gate({ children }) {
  const [ok, setOk] = useState(() => { try { return sessionStorage.getItem("ghawas_admin_ok") === "1"; } catch (e) { return false; } });
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const [wait, setWait] = useState(() => lockSecs());
  useEffect(() => { if (!wait) return; const id = setInterval(() => { const w = lockSecs(); setWait(w); if (!w) { setErr(""); clearInterval(id); } }, 1000); return () => clearInterval(id); }, [wait]);
  if (ok) return children;
  const submit = async e => {
    e.preventDefault();
    if (lockSecs()) { setErr("Too many attempts — locked. Try again later."); return; }
    if (await verifyAdminCode(val)) { clearFails(); try { sessionStorage.setItem("ghawas_admin_ok", "1"); } catch (_) {} setOk(true); }
    else { const f = recordFail(); setVal(""); const w = lockSecs(); setWait(w); setErr(w ? "Too many attempts — locked. Try again later." : ("Wrong passcode (" + f + "/" + MAX_FAILS + ")")); }
  };
  const locked = wait > 0;
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 20 }}>
      <form onSubmit={submit} style={{ ...UI.card, padding: 28, width: "100%", maxWidth: 340, textAlign: "center" }}>
        <div style={{ fontSize: 26, marginBottom: 6 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 17 }}>Al Ghawas — Menu Admin</div>
        <div style={{ fontSize: 13, color: "var(--ink-3)", margin: "6px 0 18px" }}>Enter the passcode to continue.</div>
        <input autoFocus type="password" autoComplete="current-password" value={val} disabled={locked} onChange={e => { setVal(e.target.value); setErr(""); }} placeholder="Passcode"
          style={{ ...UI.input, textAlign: "center", borderColor: err ? "var(--danger)" : "var(--line-strong)", opacity: locked ? 0.5 : 1 }} />
        {err && <div style={{ color: "var(--danger)", fontSize: 12.5, marginTop: 8 }}>{err}</div>}
        <button type="submit" disabled={locked} style={{ marginTop: 14, width: "100%", padding: "11px", borderRadius: 9, background: "var(--accent)", color: "#fff", fontWeight: 700, fontSize: 14.5, opacity: locked ? 0.5 : 1 }}>{locked ? "Locked" : "Unlock"}</button>
      </form>
    </div>
  );
}

function PasscodeCard({ flash }) {
  const [code, setCode] = useState("");
  const [code2, setCode2] = useState("");
  const [isDefault, setIsDefault] = useState(() => usingDefault());
  const save = async () => {
    const v = (code || "").trim();
    if (v.length < 8) { flash("Use at least 8 characters"); return; }
    if (!/[A-Za-z]/.test(v) || !/[0-9]/.test(v)) { flash("Use both letters and numbers"); return; }
    if (v !== code2) { flash("Passcodes don’t match"); return; }
    if (!(crypto && crypto.subtle)) { flash("Needs a secure (HTTPS) page"); return; }
    try { await setAdminCode(v); clearFails(); setIsDefault(false); setCode(""); setCode2(""); flash("Passcode updated ✓"); }
    catch (e) { flash("Couldn’t update the passcode"); }
  };
  return (
    <div style={{ ...UI.card, padding: 16, marginBottom: 14 }}>
      {isDefault && (
        <div style={{ background: "var(--danger-soft)", color: "var(--danger)", borderRadius: 9, padding: "10px 12px", fontSize: 12.5, fontWeight: 600, marginBottom: 12 }}>
          ⚠ You’re still on the default passcode. Set your own now.
        </div>
      )}
      <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--ink-2)", lineHeight: 1.6 }}>
        <strong>Passcode rules:</strong> at least <strong>8 characters</strong>, using a mix of <strong>letters and numbers</strong>, and typed twice so both fields match. The admin locks after {MAX_FAILS} wrong attempts and logs out automatically when idle.
      </p>
      <div className="grid2">
        <label style={{ display: "block" }}><span style={UI.label}>New passcode (min 8)</span>
          <input type="password" autoComplete="new-password" value={code} onChange={e => setCode(e.target.value)} placeholder="••••••••" style={UI.input} /></label>
        <label style={{ display: "block" }}><span style={UI.label}>Confirm passcode</span>
          <input type="password" autoComplete="new-password" value={code2} onChange={e => setCode2(e.target.value)} placeholder="••••••••" style={UI.input} /></label>
      </div>
      <div style={{ marginTop: 12 }}><ToolBtn primary onClick={save}>Update passcode</ToolBtn></div>
    </div>
  );
}

/* ---------------- root ---------------- */
function Admin() {
  const [data, setData] = useState(() => store.load());
  const [tab, setTab] = useState("menu");
  const [toast, setToast] = useState(null);
  const [status, setStatus] = useState("saved");   // saving | saved | publishing | published
  const [history, setHistory] = useState(() => store.history());
  const fileRef = useRef(null);
  const timer = useRef(null);
  const lastLogged = useRef(deepClone(store.load()));
  const first = useRef(true);

  function mutate(fn) { setData(prev => { const d = deepClone(prev); fn(d); return d; }); }
  function flash(msg) { setToast(msg); clearTimeout(flash._t); flash._t = setTimeout(() => setToast(null), 2400); }

  // Persist the current data: save locally, log a history entry for what changed,
  // and (if a cloud URL is set) publish to all customers — all automatic.
  function persist(snapshot) {
    store.save(snapshot);
    const changes = summarize(lastLogged.current, snapshot);
    const entry = changes.length ? { time: Date.now(), changes: changes } : null;
    const cloudOn = !!(store.cloudConfig().dbUrl);
    if (cloudOn) {
      setStatus("publishing");
      store.push(snapshot).then(ok => {
        if (entry) { entry.published = ok; setHistory(store.logChange(entry)); }
        setStatus(ok ? "published" : "saved");
      });
    } else {
      if (entry) setHistory(store.logChange(entry));
      setStatus("saved");
    }
    lastLogged.current = deepClone(snapshot);
  }

  // Auto-save: 1.2s after the last edit settles.
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(data), 1200);
    return () => clearTimeout(timer.current);
  }, [data]);

  // Auto-logout after 15 minutes of inactivity.
  useEffect(() => {
    let idle;
    const reset = () => { clearTimeout(idle); idle = setTimeout(() => { try { sessionStorage.removeItem("ghawas_admin_ok"); } catch (_) {} location.reload(); }, 15 * 60 * 1000); };
    const evs = ["mousemove", "keydown", "click", "touchstart", "scroll"];
    evs.forEach(e => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => { clearTimeout(idle); evs.forEach(e => window.removeEventListener(e, reset)); };
  }, []);

  function saveNow() { clearTimeout(timer.current); persist(data); flash("Saved ✓"); }
  function publishNow() {
    clearTimeout(timer.current);
    persist(data);
    const cloudOn = !!(store.cloudConfig().dbUrl);
    flash(cloudOn ? "Publishing to Delivery + Dine-in…" : "Saved on this device — set up Live publishing in Settings to reach all customers");
  }
  function lock() { try { sessionStorage.removeItem("ghawas_admin_ok"); } catch (_) {} location.reload(); }
  function clearHistory() { if (confirm("Clear the change history log?")) { store.clearHistory(); setHistory([]); } }
  function resetDefaults() {
    if (confirm("Reset everything back to the original built-in menu? This replaces all sections, prices and contact details right away.")) {
      const d = store.defaults(); setData(d); flash("Reset to the original menu");
    }
  }
  function exportBackup() { download("al-ghawas-menu-backup.json", JSON.stringify(data, null, 2), "application/json"); }
  function downloadDataFile() {
    const text = "/* Al Ghawas — menu data. Generated by the admin page. Replace menu-data.js with this file to publish to all customers. */\nwindow.GHAWAS_DEFAULT = " + JSON.stringify(data, null, 2) + ";\n";
    download("menu-data.js", text, "text/javascript");
  }
  function importBackup() { fileRef.current && fileRef.current.click(); }
  function onFile(e) {
    const f = e.target.files && e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result);
        if (parsed && parsed.brand && Array.isArray(parsed.categories)) { setData(parsed); flash("Backup loaded & saved"); }
        else flash("That file doesn’t look like a menu backup");
      } catch (_) { flash("Could not read that file"); }
    };
    r.readAsText(f);
    e.target.value = "";
  }

  const statusText = { saving: "Saving…", saved: "✓ Saved automatically", publishing: "Publishing…", published: "✓ Published to everyone" }[status];
  const statusColor = status === "saving" || status === "publishing" ? "var(--ink-3)" : "var(--ok)";
  const tabs = [["menu", "Menu & Prices"], ["contact", "Locations & Contact"], ["history", "History"], ["settings", "Settings & Backup"]];

  return (
    <div style={{ paddingBottom: 40 }}>
      <div style={{ position: "sticky", top: 0, zIndex: 20, background: "rgba(244,242,236,.92)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
        <div className="wrap" style={{ paddingTop: 12, paddingBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div style={{ fontWeight: 700, fontSize: 16, letterSpacing: ".02em" }}>Al Ghawas — Menu Admin</div>
              <div style={{ fontSize: 12, color: statusColor, marginTop: 2, fontWeight: 600 }}>{statusText}</div>
            </div>
            <a href="delivery.html" target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line-strong)", background: "#fff" }}>Delivery ↗</a>
            <a href="dinein.html" target="_blank" rel="noopener" style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", textDecoration: "none", padding: "9px 12px", borderRadius: 9, border: "1px solid var(--line-strong)", background: "#fff" }}>Dine-in ↗</a>
            <button onClick={lock} title="Lock the admin" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-2)", padding: "9px 14px", borderRadius: 9, border: "1px solid var(--line-strong)", background: "#fff" }}>Lock</button>
            <button onClick={publishNow} style={{ fontSize: 14, fontWeight: 700, color: "#fff", padding: "10px 18px", borderRadius: 9, background: "var(--accent)", boxShadow: "0 2px 8px rgba(14,95,102,.3)" }}>Publish</button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto" }}>
            {tabs.map(([key, lbl]) => (
              <button key={key} className="chip-tab" data-on={tab === key} onClick={() => setTab(key)} style={{
                padding: "8px 15px", borderRadius: 999, fontSize: 13.5, fontWeight: 600, whiteSpace: "nowrap",
                border: "1px solid var(--line-strong)", background: "#fff", color: "var(--ink-2)"
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="wrap" style={{ paddingTop: 22 }}>
        {tab === "menu" && <MenuTab data={data} mutate={mutate} />}
        {tab === "contact" && <ContactTab data={data} mutate={mutate} />}
        {tab === "history" && <HistoryTab history={history} onClear={clearHistory} />}
        {tab === "settings" && <SettingsTab data={data} mutate={mutate} onExport={exportBackup} onImport={importBackup} onDownload={downloadDataFile} onReset={resetDefaults} flash={flash} />}
      </div>

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={onFile} style={{ display: "none" }} />

      {toast && (
        <div style={{ position: "fixed", bottom: 22, left: "50%", transform: "translateX(-50%)", zIndex: 50, background: "var(--ink)", color: "#fff", padding: "12px 20px", borderRadius: 10, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,.25)" }}>
          {toast}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<Gate><Admin /></Gate>);