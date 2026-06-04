/* Al Ghawas — shared menu store.
   The menu page and the admin page both read/write the live menu here.
   Storage is the browser's localStorage, so on a given device/host, saving in
   the admin instantly updates what the menu shows. To publish changes to ALL
   customers, use the admin's "Download data file" and replace menu-data.js. */
(function () {
  var KEY = "ghawas_menu_v1";
  var HKEY = "ghawas_history_v1";
  var CKEY = "ghawas_cloud_v1";

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function isValid(d) {
    return d && d.brand && Array.isArray(d.categories);
  }

  window.GHAWAS_STORE = {
    KEY: KEY,
    // Current live menu: saved override if present & valid, else the default seed.
    load: function () {
      try {
        var s = localStorage.getItem(KEY);
        if (s) {
          var parsed = JSON.parse(s);
          if (isValid(parsed)) return parsed;
        }
      } catch (e) {}
      return clone(window.GHAWAS_DEFAULT);
    },
    // Persist an edited menu. Returns true on success.
    save: function (data) {
      if (!isValid(data)) return false;
      try {
        localStorage.setItem(KEY, JSON.stringify(data));
        return true;
      } catch (e) { return false; }
    },
    // Forget the override and fall back to the built-in default seed.
    reset: function () {
      try { localStorage.removeItem(KEY); } catch (e) {}
    },
    // A fresh copy of the built-in default seed.
    defaults: function () { return clone(window.GHAWAS_DEFAULT); },
    // True if a saved override exists.
    hasOverride: function () {
      try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    },
    // Call cb(newData) when the menu changes in ANOTHER tab/window.
    onChange: function (cb) {
      window.addEventListener("storage", function (e) {
        if (e.key === KEY) cb(window.GHAWAS_STORE.load());
      });
    },

    /* ---------- change history ---------- */
    history: function () {
      try {
        var s = localStorage.getItem(HKEY);
        if (s) { var a = JSON.parse(s); if (Array.isArray(a)) return a; }
      } catch (e) {}
      return [];
    },
    logChange: function (entry) {
      var list = window.GHAWAS_STORE.history();
      list.unshift(entry);             // newest first
      if (list.length > 300) list = list.slice(0, 300);
      try { localStorage.setItem(HKEY, JSON.stringify(list)); } catch (e) {}
      return list;
    },
    clearHistory: function () {
      try { localStorage.removeItem(HKEY); } catch (e) {}
    },

    /* ---------- optional live cloud publishing ---------- */
    cloudConfig: function () {
      try { var s = localStorage.getItem(CKEY); if (s) return JSON.parse(s) || {}; } catch (e) {}
      return {};
    },
    setCloudConfig: function (cfg) {
      try { localStorage.setItem(CKEY, JSON.stringify(cfg || {})); } catch (e) {}
    },
    // Read the latest menu from the cloud endpoint (GET JSON). Returns data or null.
    // Admin device uses its saved write URL; customers fall back to the public read
    // URL baked into the menu (brand.cloudUrl), so everyone gets live updates.
    pull: function () {
      var c = window.GHAWAS_STORE.cloudConfig();
      var base = c.dbUrl ? c.dbUrl.replace(/\/+$/, "") + "/menu.json" : "";
      var url = base || (window.GHAWAS_DEFAULT && window.GHAWAS_DEFAULT.brand && window.GHAWAS_DEFAULT.brand.cloudUrl) || "";
      if (!url) return Promise.resolve(null);
      return fetch(url, { cache: "no-store" })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { return isValid(j) ? j : null; })
        .catch(function () { return null; });
    },
    // Publish the menu: sign in to Firebase Auth, then PUT with the ID token so
    // only the owner's account can write (rules: { ".read": true, ".write": "auth != null" }).
    push: function (data) {
      var c = window.GHAWAS_STORE.cloudConfig();
      if (!c.dbUrl || !c.apiKey || !c.email || !c.password) return Promise.resolve(false);
      if (!isValid(data)) return Promise.resolve(false);
      return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(c.apiKey), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: c.email, password: c.password, returnSecureToken: true })
      }).then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) {
          if (!j || !j.idToken) return false;
          var url = c.dbUrl.replace(/\/+$/, "") + "/menu.json?auth=" + j.idToken;
          return fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
            .then(function (rr) { return rr.ok; });
        }).catch(function () { return false; });
    }
  };
})();