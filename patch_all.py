import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add Free Mobile HTML block if not present
if 'id="admin-freemobile-user"' not in html:
    needle = '<!-- Passerelle Webhook optionnelle pour envoi automatique en arrière-plan -->'
    replacement = """<!-- Passerelle Free Mobile SMS officielle directe (100% gratuit) -->
            <div
              style="background:rgba(7,22,44,0.5); border-radius:8px; padding:0.75rem; border:1px solid rgba(255,255,255,0.06); margin-bottom: 0.75rem;">
              <label
                style="font-size:0.75rem; font-weight:700; color:var(--text-light); display:block; margin-bottom:0.35rem;">
                📱 Passerelle Free Mobile SMS officielle (Optionnel - https://smsapi.free-mobile.fr)
              </label>
              <div style="display:flex; gap:0.5rem; margin-bottom:0.4rem;">
                <input type="text" id="admin-freemobile-user" class="form-control" placeholder="Identifiant Free Mobile" style="font-size:0.78rem; padding:0.45rem;">
                <input type="password" id="admin-freemobile-pass" class="form-control" placeholder="Clé API SMS Free" style="font-size:0.78rem; padding:0.45rem;">
                <button type="button" id="btn-save-freemobile" class="btn btn-outline-gold" style="font-size:0.78rem; padding:0.45rem 0.85rem; white-space:nowrap;">
                  💾 Enregistrer
                </button>
              </div>
              <div style="font-size:0.68rem; color:var(--text-muted);">
                Permet d'envoyer automatiquement et gratuitement des notifications SMS en arrière-plan via smsapi.free-mobile.fr.
              </div>
            </div>

            <!-- Passerelle Webhook optionnelle pour envoi automatique en arrière-plan -->"""
    if needle in html:
        html = html.replace(needle, replacement)
        print("Added Free Mobile HTML block to index.html")
    else:
        print("Needle for Free Mobile HTML block not found")

# 2. Add Free Mobile JS listener if not present
if 'btn-save-freemobile' not in html[html.find('<script type="module">'):]:
    js_needle = 'document.getElementById("btn-save-sms-webhook")?.addEventListener("click"'
    js_free = """// Free Mobile SMS gateway listeners
      const savedFreeUser = localStorage.getItem("dunkirk_freemobile_user_v1") || "";
      const savedFreePass = localStorage.getItem("dunkirk_freemobile_pass_v1") || "";
      const freeUserEl = document.getElementById("admin-freemobile-user");
      const freePassEl = document.getElementById("admin-freemobile-pass");
      if (freeUserEl && savedFreeUser) freeUserEl.value = savedFreeUser;
      if (freePassEl && savedFreePass) freePassEl.value = savedFreePass;

      document.getElementById("btn-save-freemobile")?.addEventListener("click", () => {
        const userVal = document.getElementById("admin-freemobile-user")?.value.trim() || "";
        const passVal = document.getElementById("admin-freemobile-pass")?.value.trim() || "";
        localStorage.setItem("dunkirk_freemobile_user_v1", userVal);
        localStorage.setItem("dunkirk_freemobile_pass_v1", passVal);
        playSound('click');
        showToast("Identifiants Free Mobile SMS sauvegardés ! 📱", "💾");
        addAuditLog("Passerelle Free Mobile SMS mise à jour");
      });

      document.getElementById("btn-save-sms-webhook")?.addEventListener("click" """
    if js_needle in html:
        html = html.replace(js_needle, js_free)
        print("Added Free Mobile JS listener to index.html")

with open('index.html', 'w', encoding='utf-8', newline='') as f:
    f.write(html)
print("Saved index.html")

# Synchronize js/app.js from index.html
start_marker = '<script type="module">'
start = html.find(start_marker)
end = html.rfind('</script>')
inline_js = html[start + len(start_marker):end].strip()

config_consts = """const BASEROW_BASE_URL = "https://baserow.fr.nocodespacelab.com/api";
const BASEROW_TOKEN = "lgWHdzUYXFcvB3A7sbzXWPl337c7qlEY";
const TABLE_ID = 1246;
const USERS_TABLE_ID = 1273; // Table : Users Agenda Dorianne et Christophe
const PASSWORD_FIELD_ID = 11950; // Champ Mot de passe Baserow (API auth activée)"""

config_import = 'import { BASEROW_BASE_URL, BASEROW_TOKEN, TABLE_ID, USERS_TABLE_ID, PASSWORD_FIELD_ID } from "./config.js";'

app_js_content = inline_js.replace(config_consts, config_import)
with open('js/app.js', 'w', encoding='utf-8', newline='') as f:
    f.write(app_js_content)
print("Synchronized js/app.js")

