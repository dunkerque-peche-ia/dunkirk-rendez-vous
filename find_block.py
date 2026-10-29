import re

# Read both files
for filepath in ['index.html', 'js/app.js']:
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # The new bulletproof submitForm
    new_submitform = '''    let isFormSubmittingLock = false;
    async function submitForm(e) {
      if (e) {
        try { if (typeof e.preventDefault === "function") e.preventDefault(); } catch (_) {}
        try { if (typeof e.stopPropagation === "function") e.stopPropagation(); } catch (_) {}
      }
      if (isFormSubmittingLock) {
        console.warn("[submitForm] Soumission deja en cours, ignoree.");
        return;
      }

      // Validation AVANT de verrouiller
      const titreInput = document.getElementById("rdv-title");
      const titre = (titreInput?.value || "").trim();
      if (!titre) {
        showToast("Veuillez saisir un motif pour le rendez-vous", "\\u26a0\\ufe0f");
        if (titreInput) titreInput.focus();
        return; // sortie propre sans verrouiller
      }

      isFormSubmittingLock = true;
      console.log("[submitForm] Demarrage enregistrement RDV:", titre);

      try {
        const id = (document.getElementById("edit-rdv-id")?.value || "").trim();

        let selectedUser = "Dorianne";
        const checkedRadio = document.querySelector("input[name=\\'rdv-user\\']:checked");
        if (checkedRadio && checkedRadio.value) {
          selectedUser = checkedRadio.value;
        }

        const dateVal = document.getElementById("rdv-date")?.value || new Date().toISOString().split("T")[0];
        const heureVal = document.getElementById("rdv-time")?.value || "12:00";
        const adresseVal = (document.getElementById("rdv-address")?.value || "").trim();
        const latRaw = parseFloat(document.getElementById("rdv-lat")?.value);
        const lonRaw = parseFloat(document.getElementById("rdv-lon")?.value);

        const data = {
          user: selectedUser,
          categorie: document.querySelector("input[name=\\'rdv-style\\']:checked")?.value || "Co-transportage",
          titre: titre,
          date: dateVal,
          heure: heureVal,
          adresse: adresseVal || "Dunkerque (59140)",
          latitude: isNaN(latRaw) ? 51.0343 : latRaw,
          longitude: isNaN(lonRaw) ? 2.3768 : lonRaw,
          contact: (document.getElementById("rdv-contact-name")?.value || "").trim(),
          telephone: (document.getElementById("rdv-contact-phone")?.value || "").trim(),
          notes: (document.getElementById("rdv-notes")?.value || "").trim(),
          alerte_minutes: parseInt(document.getElementById("rdv-alert-lead")?.value, 10) || 30,
        };

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

        // === BASEROW EN PREMIER : on obtient le vrai ID tout de suite ===
        let finalId = null;
        let baserowSuccess = false;

        if (!id) {
          // Nouveau rendez-vous
          try {
            const created = await apiFetch(`/database/rows/table/${TABLE_ID}/?user_field_names=true`, {
              method: "POST",
              body: JSON.stringify(baserowData),
            });
            if (created && created.id) {
              finalId = created.id;
              baserowSuccess = true;
              markIdAsLocallyCreated(created.id);
              markIdAsKnown(created.id);
              console.log("[submitForm] Baserow POST OK, id Baserow:", created.id);
            }
          } catch (err) {
            console.warn("[submitForm] Baserow inaccessible, mode hors-ligne:", err);
          }
          if (!finalId) {
            finalId = Date.now(); // Fallback hors-ligne
          }
        } else {
          // Modification
          try {
            await apiFetch(`/database/rows/table/${TABLE_ID}/${id}/?user_field_names=true`, {
              method: "PATCH",
              body: JSON.stringify(baserowData),
            });
            baserowSuccess = true;
            console.log("[submitForm] Baserow PATCH OK, id:", id);
          } catch (err) {
            console.warn("[submitForm] Baserow PATCH echoue:", err);
          }
          finalId = id;
        }

        // === SAUVEGARDE LOCALE avec le vrai ID Baserow ===
        let local = loadLocalAppointments();
        if (id) {
          const idx = local.findIndex(a => String(a.id) === String(id));
          if (idx >= 0) {
            local[idx] = { ...local[idx], ...data, id: finalId };
          } else {
            local.unshift({ ...data, id: finalId });
          }
        } else {
          local = local.filter(a => String(a.id) !== String(finalId));
          local.unshift({ ...data, id: finalId });
        }

        markIdAsLocallyCreated(finalId);
        markIdAsKnown(finalId);
        saveLocalAppointments(local);
        window.__appointments = local;

        // Reinitialiser les filtres pour afficher immediatement le nouveau RDV
        currentFilterUser = "all";
        currentFilterCategory = "all";
        currentSearchQuery = "";
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        document.querySelector(".filter-chip[data-category=\\'all\\']")?.classList.add("active");
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.value = "";
        const clearSearch = document.getElementById("clear-search-btn");
        if (clearSearch) clearSearch.classList.add("hidden");

        const targetAppt = { ...data, id: finalId };
        if (id) window.__selectedAppointment = targetAppt;

        renderAppointments(local);
        updateStats(local);
        checkCloudStatus(baserowSuccess);

        playSound(\\'carillon\\');
        launchConfetti();

        if (baserowSuccess) {
          showToast(id ? "Rendez-vous modifie et synchronise !" : `Rendez-vous ajoute dans Baserow ! (#${finalId})`, "\\u2705");
        } else {
          showToast(id ? "Rendez-vous modifie (hors-ligne)" : "Rendez-vous ajoute localement (hors-ligne)", "\\ud83d\\udcf4");
        }

        if (!id) {
          try { triggerAppointmentSmsNotification(targetAppt, true); } catch(smsErr) {}
        }

        if (syncChannel) {
          syncChannel.postMessage({
            type: \\'NEW_APPOINTMENT_ADDED\\',
            appointment: targetAppt,
            senderSessionId: getMySessionId()
          });
        }

        resetForm();
        app.switchTab("planning");

        setTimeout(() => {
          try { showAppointmentAlert(targetAppt, !id, false); } catch (err) {}
        }, 400);

      } catch (fatalErr) {
        console.error("[submitForm] Erreur generale:", fatalErr);
        showToast("Erreur inattendue lors de l\\'enregistrement", "\\u274c");
      } finally {
        setTimeout(() => { isFormSubmittingLock = false; }, 400);
      }
    }'''

    # Use regex to replace the entire submitForm block
    pattern = r'let isFormSubmittingLock = false;\s*\n\s*async function submitForm\(e\).*?^    \}'
    match = re.search(pattern, content, re.DOTALL | re.MULTILINE)
    if match:
        print(f"[{filepath}] Found submitForm block at {match.start()}-{match.end()}")
    else:
        print(f"[{filepath}] WARNING: could not find submitForm block with regex")

print("Pattern search done. Now writing directly with Python string replacement.")

