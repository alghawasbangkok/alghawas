/* Al Ghawas — shared menu store.
   The menu pages and the admin both read/write the live menu here.
   - On a device, edits saved in the admin update that device instantly (localStorage).
   - To publish to ALL customers, set up Live publishing in the admin (Firebase):
     pull() reads the published menu, push() signs in and writes it. */
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
      window.GHAWAS_STORE.lastPushError = "";
      return fetch("https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=" + encodeURIComponent(c.apiKey), {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: c.email, password: c.password, returnSecureToken: true })
      }).then(function (r) { return r.json().catch(function () { return null; }).then(function (j) { return { ok: r.ok, body: j }; }); })
        .then(function (res) {
          if (!res || !res.ok || !res.body || !res.body.idToken) {
            var code = res && res.body && res.body.error && res.body.error.message ? res.body.error.message : "LOGIN_FAILED";
            if (code.indexOf("INVALID_LOGIN_CREDENTIALS") >= 0 || code.indexOf("INVALID_PASSWORD") >= 0 || code.indexOf("EMAIL_NOT_FOUND") >= 0) window.GHAWAS_STORE.lastPushError = "Login failed — wrong email or password. Check Authentication → Users in Firebase.";
            else if (code.indexOf("PASSWORD_LOGIN_DISABLED") >= 0 || code.indexOf("OPERATION_NOT_ALLOWED") >= 0) window.GHAWAS_STORE.lastPushError = "Email/Password sign-in is turned off — enable it in Firebase → Authentication → Sign-in method.";
            else if (code.indexOf("API_KEY") >= 0 || code.indexOf("API key") >= 0) window.GHAWAS_STORE.lastPushError = "The Web API Key looks wrong — recopy it from Project settings → General.";
            else if (code.indexOf("TOO_MANY_ATTEMPTS") >= 0) window.GHAWAS_STORE.lastPushError = "Too many tries — wait a few minutes and try again.";
            else window.GHAWAS_STORE.lastPushError = "Login failed (" + code + ").";
            return false;
          }
          var url = c.dbUrl.replace(/\/+$/, "") + "/menu.json?auth=" + res.body.idToken;
          return fetch(url, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
            .then(function (rr) {
              if (rr.ok) return true;
              if (rr.status === 401 || rr.status === 403) window.GHAWAS_STORE.lastPushError = "Login worked, but the database refused the write — set Rules to { \".read\": true, \".write\": \"auth != null\" } and Publish them.";
              else if (rr.status === 404) window.GHAWAS_STORE.lastPushError = "Database not found — check the Database URL matches the one shown in Realtime Database.";
              else window.GHAWAS_STORE.lastPushError = "Database write failed (HTTP " + rr.status + ").";
              return false;
            });
        }).catch(function () {
          window.GHAWAS_STORE.lastPushError = "Couldn’t reach Firebase — check the Database URL (it may end in .firebasedatabase.app for your region) and your internet.";
          return false;
        });
    }
  };
})();