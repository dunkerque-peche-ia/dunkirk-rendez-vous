import sys
sys.stdout.reconfigure(encoding='utf-8')

# Read index.html
with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# -------------------------------------------------------------------------
# Fix submitForm in index.html
# -------------------------------------------------------------------------
old_submit_start = content.find('async function submitForm(e) {')
old_submit_end = content.find('function cancelEdit() {', old_submit_start)

assert old_submit_start != -1, "Cannot find submitForm start"
assert old_submit_end != -1, "Cannot find cancelEdit start"

fixed_submit_form = """async function submitForm(e) {
      if (e) {
        if (typeof e.preventDefault === "function") e.preventDefault();
        if (typeof e.stopPropagation === "function") e.stopPropagation();
      }

      const form = document.getElementById("appointment-form");
      if (form && typeof form.checkValidity === "function" && !form.checkValidity()) {
        if (typeof form.reportValidity === "function") form.reportValidity();
        return;
      }

      const id = (document.getElementById("edit-rdv-id")?.value || "").trim();

      // Récupération fiable de l'utilisateur sélectionné
      let selectedUser = "Dorianne";
      const checkedRadio = document.querySelector("input[name='rdv-user']:checked");
      if (checkedRadio && checkedRadio.value) {
        selectedUser = checkedRadio.value;
      }

      const titre = (document.getElementById("rdv-title")?.value || "").trim();
      if (!titre) {
        showToast("Veuillez saisir un motif pour le rendez-vous ✍️", "⚠️");
        document.getElementById("rdv-title")?.focus();
        return;
      }

      const dateVal = document.getElementById("rdv-date")?.value || new Date().toISOString().split("T")[0];
      const heureVal = document.getElementById("rdv-time")?.value || "12:00";
      const adresseVal = (document.getElementById("rdv-address")?.value || "").trim();

      const data = {
        user: selectedUser,
        categorie: document.querySelector("input[name='rdv-style']:checked")?.value || "Co-transportage",
        titre: titre,
        date: dateVal,
        heure: heureVal,
        adresse: adresseVal || "Dunkerque (59140)",
        latitude: parseFloat(document.getElementById("rdv-lat")?.value) || 51.0343,
        longitude: parseFloat(document.getElementById("rdv-lon")?.value) || 2.3768,
        contact: (document.getElementById("rdv-contact-name")?.value || "").trim(),
        telephone: (document.getElementById("rdv-contact-phone")?.value || "").trim(),
        notes: (document.getElementById("rdv-notes")?.value || "").trim(),
        alerte_minutes: parseInt(document.getElementById("rdv-alert-lead")?.value, 10) || 30,
      };

      let local = loadLocalAppointments();
      let createdLocalId = null;

      if (id) {
        const idx = local.findIndex(a => String(a.id) === String(id));
        if (idx >= 0) {
          local[idx] = { ...local[idx], ...data };
        } else {
          local.unshift({ id: isNaN(Number(id)) ? id : Number(id), ...data });
        }
      } else {
        createdLocalId = Date.now();
        local.unshift({ id: createdLocalId, ...data });
      }

      saveLocalAppointments(local);
      window.__appointments = local;

      // IMPORTANT : Déclaration prioritaire de targetAppt AVANT toute utilisation
      const targetAppt = local.find(a => String(a.id) === String(id || createdLocalId)) || { ...data, id: id || createdLocalId };

      // Mettre à jour window.__selectedAppointment si on était en mode édition
      if (id) {
        const updatedAppt = local.find(a => String(a.id) === String(id));
        if (updatedAppt) window.__selectedAppointment = updatedAppt;
      }

      renderAppointments(local);
      updateStats(local);

      playSound('carillon');
      launchConfetti();

      // Message de confirmation clair lors de l'ajout
      showToast(id ? "Rendez-vous modifié avec succès !" : "Rendez-vous ajouté avec succès !", "✅");

      // Mémoriser l'ID créé par nous pour ne pas s'auto-alerter
      markIdAsLocallyCreated(id || createdLocalId);
      markIdAsKnown(id || createdLocalId);

      // Avertissement par SMS automatique pour les utilisateurs (Table Baserow 1273)
      if (!id) {
        try {
          triggerAppointmentSmsNotification(targetAppt, true);
        } catch(smsErr) {
          console.warn("Erreur déclenchement SMS automatique:", smsErr);
        }
      }

      // Informer instantanément les autres fenêtres / onglets
      if (syncChannel) {
        syncChannel.postMessage({
          type: 'NEW_APPOINTMENT_ADDED',
          appointment: targetAppt,
          senderSessionId: getMySessionId()
        });
      }

      resetForm();
      app.switchTab("planning");

      // Afficher la modal d'alerte pour confirmer l'ajout / modification
      setTimeout(() => {
        try {
          showAppointmentAlert(targetAppt, !id, false);
        } catch (err) {
          console.warn("Erreur affichage modal alerte:", err);
        }
      }, 400);

      // Synchronisation asynchrone avec Baserow (capitalisé pour Baserow)
      const baserowData = {
        Titre: data.titre,
        Utilisateur: data.user,
        Categorie: data.categorie,
        Date: data.date,
        Heure: data.heure,
        Adresse: data.adresse,
        Latitude: data.latitude,
        Longitude: data.longitude,
        Contact: data.contact,
        Telephone: data.telephone,
        AlerteMinutes: data.alerte_minutes,
        Notes: data.notes
      };

      try {
        if (id && !isNaN(Number(id)) && Number(id) < 100000) {
          await apiFetch(`/database/rows/table/${TABLE_ID}/${id}/?user_field_names=true`, {
            method: "PATCH",
            body: JSON.stringify(baserowData),
          });
        } else {
          const created = await apiFetch(`/database/rows/table/${TABLE_ID}/?user_field_names=true`, {
            method: "POST",
            body: JSON.stringify(baserowData),
          });
          if (created && created.id) {
            let currentLocal = loadLocalAppointments();
            const foundIdx = currentLocal.findIndex(a => a.id === createdLocalId);
            if (foundIdx >= 0) {
              currentLocal[foundIdx].id = created.id;
            } else {
              // Si non présent dans le local (cas de concurrence), l'insérer
              if (!currentLocal.some(a => String(a.id) === String(created.id))) {
                currentLocal.unshift({ ...data, id: created.id });
              }
            }
            markIdAsLocallyCreated(created.id);
            markIdAsKnown(created.id);
            saveLocalAppointments(currentLocal);
            window.__appointments = currentLocal;
            renderAppointments(currentLocal);
            updateStats(currentLocal);
          }
        }
        checkCloudStatus(true);
      } catch (err) {
        console.warn("Synchronisation Baserow différée (mode hors-ligne actif):", err);
        checkCloudStatus(false);
      }
    }

    """

content = content[:old_submit_start] + fixed_submit_form + content[old_submit_end:]
print("Fixed submitForm in index.html (targetAppt TDZ resolved!)")

# -------------------------------------------------------------------------
# Fix loadAndRender and add syncPendingLocalAppointments
# -------------------------------------------------------------------------
old_load_start = content.find('async function loadAndRender() {')
old_load_end = content.find('function renderDynamicStyles() {', old_load_start)

assert old_load_start != -1, "Cannot find loadAndRender start"
assert old_load_end != -1, "Cannot find renderDynamicStyles start"

fixed_load_and_render = """async function syncPendingLocalAppointments() {
      try {
        const local = loadLocalAppointments();
        const pending = local.filter(a => isNaN(Number(a.id)) || Number(a.id) > 100000);
        for (const appt of pending) {
          const baserowData = {
            Titre: appt.titre,
            Utilisateur: appt.user,
            Categorie: appt.categorie,
            Date: appt.date,
            Heure: appt.heure,
            Adresse: appt.adresse,
            Latitude: appt.latitude,
            Longitude: appt.longitude,
            Contact: appt.contact,
            Telephone: appt.telephone,
            AlerteMinutes: appt.alerte_minutes,
            Notes: appt.notes
          };
          const created = await apiFetch(`/database/rows/table/${TABLE_ID}/?user_field_names=true`, {
            method: "POST",
            body: JSON.stringify(baserowData),
          });
          if (created && created.id) {
            let current = loadLocalAppointments();
            const idx = current.findIndex(a => a.id === appt.id);
            if (idx >= 0) {
              current[idx].id = created.id;
            }
            markIdAsLocallyCreated(created.id);
            markIdAsKnown(created.id);
            saveLocalAppointments(current);
            window.__appointments = current;
          }
        }
      } catch (e) {
        // Différé si hors ligne
      }
    }

    async function loadAndRender() {
      let appointments = [];
      try {
        // Si des RDV locaux étaient restés non synchronisés, tenter de les envoyer
        await syncPendingLocalAppointments();

        const resp = await apiFetch(`/database/rows/table/${TABLE_ID}/?page_size=200&user_field_names=true`);
        if (resp.results && resp.results.length > 0) {
          // Filtrer les lignes vides (gabarits sans titre)
          const validRows = resp.results.filter(r => (r.Titre && r.Titre.trim()) || (r.titre && r.titre.trim()));
          appointments = validRows.map(r => ({
            id: r.id,
            user: r.Utilisateur || r.user || "Dorianne",
            categorie: r.Categorie || r.categorie || "Déplacement",
            titre: r.Titre || r.titre || "Rendez-vous",
            date: r.Date || r.date || new Date().toISOString().split("T")[0],
            heure: r.Heure || r.heure || "12:00",
            adresse: r.Adresse || r.adresse || "",
            latitude: r.Latitude || r.latitude || 51.0343,
            longitude: r.Longitude || r.longitude || 2.3768,
            contact: r.Contact || r.contact || "",
            telephone: r.Telephone || r.telephone || "",
            notes: r.Notes || r.notes || "",
            alerte_minutes: r.AlerteMinutes || r.alerte_minutes || 30,
          }));

          // CRITICAL: Conserver et fusionner les RDV locaux non encore synchronisés avec Baserow
          // (IDs temporaires = grands timestamps > 100000 qui ne sont pas dans Baserow)
          const baserowIds = new Set(appointments.map(a => String(a.id)));
          const localData = loadLocalAppointments();
          const localOnlyAppts = localData.filter(a => !baserowIds.has(String(a.id)));
          if (localOnlyAppts.length > 0) {
            appointments = [...localOnlyAppts, ...appointments];
          }

          if (appointments.length > 0) {
            // Détection des nouveaux rendez-vous créés par un autre utilisateur
            try {
              const storedKnown = getKnownAppointmentIds();
              const myLocalIds = getMyLocallyAddedIds();
              if (storedKnown.length > 0) {
                const brandNewFromOthers = appointments.filter(a =>
                  !storedKnown.includes(String(a.id)) && !myLocalIds.includes(String(a.id))
                );
                if (brandNewFromOthers.length > 0) {
                  brandNewFromOthers.forEach(newAppt => {
                    notifyNewAppointmentFromOtherUser(newAppt);
                  });
                }
              }
              saveKnownAppointmentIds(appointments.map(a => a.id));
            } catch (e) {
              console.warn("Erreur vérification alertes sync:", e);
            }

            saveLocalAppointments(appointments);
          } else {
            appointments = loadLocalAppointments();
          }
          checkCloudStatus(true);
        } else {
          appointments = loadLocalAppointments();
        }
      } catch (err) {
        console.warn("Baserow inaccessible, chargement des données locales :", err);
        appointments = loadLocalAppointments();
        checkCloudStatus(false);
      }

      window.__appointments = appointments;
      renderAppointments(appointments);
      updateStats(appointments);
    }

    """

content = content[:old_load_start] + fixed_load_and_render + content[old_load_end:]
print("Fixed loadAndRender in index.html (merging local appointments!)")

# -------------------------------------------------------------------------
# Add saveBtn click listener & app export for submitForm
# -------------------------------------------------------------------------
if 'const saveRdvBtn = document.getElementById("btn-save-rdv");' not in content:
    form_reg = 'const form = document.getElementById("appointment-form");\n      if (form) form.addEventListener("submit", submitForm);'
    form_reg_crlf = 'const form = document.getElementById("appointment-form");\r\n      if (form) form.addEventListener("submit", submitForm);'
    form_reg_new = """const form = document.getElementById("appointment-form");
      if (form) form.addEventListener("submit", submitForm);

      const saveRdvBtn = document.getElementById("btn-save-rdv");
      if (saveRdvBtn) {
        saveRdvBtn.addEventListener("click", (e) => {
          submitForm(e);
        });
      }"""
    if form_reg in content:
        content = content.replace(form_reg, form_reg_new)
        print("Added saveRdvBtn click listener in index.html")
    elif form_reg_crlf in content:
        content = content.replace(form_reg_crlf, form_reg_new)
        print("Added saveRdvBtn click listener (CRLF) in index.html")

# Export submitForm on window.app
if 'submitForm\n    };' not in content and 'submitForm\r\n    };' not in content:
    app_exp = 'triggerSystemNotification\n    };'
    app_exp_crlf = 'triggerSystemNotification\r\n    };'
    if app_exp in content:
        content = content.replace(app_exp, 'triggerSystemNotification,\n      submitForm\n    };')
        print("Added submitForm to app exports in index.html")
    elif app_exp_crlf in content:
        content = content.replace(app_exp_crlf, 'triggerSystemNotification,\r\n      submitForm\r\n    };')
        print("Added submitForm to app exports (CRLF) in index.html")

# Save index.html
with open('index.html', 'w', encoding='utf-8', newline='') as f:
    f.write(content)
print("Saved index.html successfully!")

# -------------------------------------------------------------------------
# Synchronize js/app.js
# -------------------------------------------------------------------------
start_marker = '<script type="module">'
start = content.find(start_marker)
end = content.rfind('</script>')
inline_js = content[start + len(start_marker):end].strip()

# Replace config consts with config import for js/app.js
config_consts = """const BASEROW_BASE_URL = "https://baserow.fr.nocodespacelab.com/api";
const BASEROW_TOKEN = "lgWHdzUYXFcvB3A7sbzXWPl337c7qlEY";
const TABLE_ID = 1246;
const USERS_TABLE_ID = 1273; // Table : Users Agenda Dorianne et Christophe
const PASSWORD_FIELD_ID = 11950; // Champ Mot de passe Baserow (API auth activée)"""

config_import = 'import { BASEROW_BASE_URL, BASEROW_TOKEN, TABLE_ID, USERS_TABLE_ID, PASSWORD_FIELD_ID } from "./config.js";'

app_js_content = inline_js.replace(config_consts, config_import)
with open('js/app.js', 'w', encoding='utf-8', newline='') as f:
    f.write(app_js_content)
print("Synchronized js/app.js successfully!")

# -------------------------------------------------------------------------
# Bump sw.js cache name to dunkirk-rdv-v2
# -------------------------------------------------------------------------
with open('sw.js', 'r', encoding='utf-8') as f:
    sw_content = f.read()
sw_content = sw_content.replace("'dunkirk-rdv-v1'", "'dunkirk-rdv-v2'")
with open('sw.js', 'w', encoding='utf-8', newline='') as f:
    f.write(sw_content)
print("Bumped sw.js cache to dunkirk-rdv-v2!")

