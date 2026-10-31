// app.js – Logique enrichie & fun Dunkirk RDV & Guidage (Look Dunkirk Informatique)
    const BASEROW_BASE_URL = "https://baserow.fr.nocodespacelab.com/api";
    const BASEROW_TOKEN = "lgWHdzUYXFcvB3A7sbzXWPl337c7qlEY";
    const TABLE_ID = 1246;
    const USERS_TABLE_ID = 1273; // Table : Users Agenda Dorianne et Christophe
    const PASSWORD_FIELD_ID = 11950; // Champ Mot de passe Baserow (API auth activée)

    const apiHeaders = {
      "Content-Type": "application/json",
      Authorization: `Token ${BASEROW_TOKEN}`,
    };

    // =============================================================
    // GESTIONNAIRE DE SÉCURITÉ & AUTHENTIFICATION (Dunkirk IT)
    // Lié à la table Baserow : Users Agenda Dorianne et Christophe (ID 1273)
    // =============================================================
    window.togglePasswordVisibility = function (inputId) {
      const input = document.getElementById(inputId);
      if (!input) return;
      input.type = input.type === "password" ? "text" : "password";
    };

    const DEFAULT_AUTH_CONFIG = {
      requireAuth: true,
      baserowConnected: true,
      users: {
        "christophe.gontier@outlook.fr": {
          id: 1,
          email: "christophe.gontier@outlook.fr",
          name: "Christophe",
          displayName: "Christophe",
          role: "admin",
          roleLabel: "Administrateur",
          title: "Administrateur & Fondateur",
          avatar: "👨",
          phone: "0783141740",
          password: "Macfly59*",
          active: true,
          lastLogin: null
        },
        "dorianne.dbe@free.fr": {
          id: 2,
          email: "dorianne.dbe@free.fr",
          name: "Dorianne",
          displayName: "Dorianne",
          role: "user",
          roleLabel: "Planning",
          title: "Utilisatrice Planning",
          avatar: "👩",
          phone: "0651631615",
          password: "1234",
          active: true,
          lastLogin: null
        },
        "Christophe": {
          id: 1,
          email: "christophe.gontier@outlook.fr",
          name: "Christophe",
          displayName: "Christophe",
          role: "admin",
          roleLabel: "Administrateur",
          title: "Administrateur & Fondateur",
          avatar: "👨",
          phone: "0783141740",
          password: "Macfly59*",
          active: true,
          lastLogin: null
        },
        "Dorianne": {
          id: 2,
          email: "dorianne.dbe@free.fr",
          name: "Dorianne",
          displayName: "Dorianne",
          role: "user",
          roleLabel: "Planning",
          title: "Utilisatrice Planning",
          avatar: "👩",
          phone: "0651631615",
          password: "1234",
          active: true,
          lastLogin: null
        }
      },
      auditLog: [
        { timestamp: new Date().toISOString(), user: "Système", action: "Module d'authentification par courriel et alertes SMS lié à la table Baserow 1273 initialisé" }
      ]
    };

    function loadAuthConfig() {
      const data = localStorage.getItem("dunkirk_auth_config_v1");
      if (!data) {
        saveAuthConfig(DEFAULT_AUTH_CONFIG);
        return DEFAULT_AUTH_CONFIG;
      }
      try {
        const parsed = JSON.parse(data);
        if (!parsed.users) parsed.users = {};
        if (parsed.users.Christophe) {
          parsed.users.Christophe.email = parsed.users.Christophe.email || "christophe.gontier@outlook.fr";
          parsed.users.Christophe.phone = parsed.users.Christophe.phone || "0783141740";
          if (!parsed.users["christophe.gontier@outlook.fr"]) {
            parsed.users["christophe.gontier@outlook.fr"] = parsed.users.Christophe;
          }
        }
        if (parsed.users.Dorianne) {
          parsed.users.Dorianne.email = parsed.users.Dorianne.email || "dorianne.dbe@free.fr";
          parsed.users.Dorianne.phone = parsed.users.Dorianne.phone || "0651631615";
          if (!parsed.users["dorianne.dbe@free.fr"]) {
            parsed.users["dorianne.dbe@free.fr"] = parsed.users.Dorianne;
          }
        }
        return parsed;
      } catch (e) {
        return DEFAULT_AUTH_CONFIG;
      }
    }

    function saveAuthConfig(cfg) {
      localStorage.setItem("dunkirk_auth_config_v1", JSON.stringify(cfg));
    }

    function addAuditLog(action, user = null) {
      const cfg = loadAuthConfig();
      const userName = user || (window.__currentUser?.displayName || "Anonyme");
      if (!cfg.auditLog) cfg.auditLog = [];
      cfg.auditLog.unshift({
        timestamp: new Date().toISOString(),
        user: userName,
        action: action
      });
      if (cfg.auditLog.length > 50) cfg.auditLog = cfg.auditLog.slice(0, 50);
      saveAuthConfig(cfg);
    }

    // -------------------------------------------------------------
    // FONCTIONS API BASEROW : UTILISATEURS & MOTS DE PASSE (TABLE 1273)
    // -------------------------------------------------------------
    export async function fetchBaserowUsers() {
      try {
        const res = await fetch(`${BASEROW_BASE_URL}/database/rows/table/${USERS_TABLE_ID}/?user_field_names=true`, {
          headers: apiHeaders
        });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.results) && data.results.length > 0) {
            const cfg = loadAuthConfig();
            const updatedUsers = { ...cfg.users };
            data.results.forEach(r => {
              const name = (r.Nom || "").trim();
              const email = (r.Courriel || "").trim().toLowerCase();
              const phone = (r["Téléphone"] || "").trim();
              if (!name && !email) return;

              const roleStr = (r["Rôle"] || "").toLowerCase();
              const isAdmin = roleStr.includes("admin") || name.toLowerCase() === "christophe" || email.includes("christophe");

              const userObj = {
                id: r.id,
                email: email || (isAdmin ? "christophe.gontier@outlook.fr" : "dorianne.dbe@free.fr"),
                name: name || (isAdmin ? "Christophe" : "Dorianne"),
                displayName: name || (isAdmin ? "Christophe" : "Dorianne"),
                role: isAdmin ? "admin" : "user",
                roleLabel: r["Rôle"] || (isAdmin ? "Administrateur" : "Utilisatrice"),
                active: r.Actif !== false,
                avatar: r.Avatar || (isAdmin ? "👨" : "👩"),
                phone: phone || (isAdmin ? "0783141740" : "0651631615"),
                title: isAdmin ? "Administrateur & Fondateur" : "Utilisatrice Planning",
                password: (name && updatedUsers[name]?.password) || (email && updatedUsers[email]?.password) || (isAdmin ? "Macfly59*" : "1234"),
                lastLogin: (name && updatedUsers[name]?.lastLogin) || (email && updatedUsers[email]?.lastLogin) || null
              };

              if (email) updatedUsers[email] = userObj;
              if (name) updatedUsers[name] = userObj;
            });
            cfg.users = updatedUsers;
            cfg.baserowConnected = true;
            cfg.lastUsersSync = new Date().toISOString();
            saveAuthConfig(cfg);
            renderUserSelectorButtons();
            return updatedUsers;
          }
        }
      } catch (err) {
        console.warn("Connexion Baserow table 1273 impossible :", err);
      }
      return null;
    }

    export async function verifyBaserowPassword(userRowId, password) {
      try {
        const res = await fetch(`${BASEROW_BASE_URL}/database/fields/password-authentication/`, {
          method: "POST",
          headers: apiHeaders,
          body: JSON.stringify({
            field_id: PASSWORD_FIELD_ID,
            row_id: userRowId,
            password: password
          })
        });
        if (res.ok) {
          const data = await res.json();
          return { success: !!data.is_correct };
        }
        const err = await res.json().catch(() => ({}));
        if (res.status === 401 || err.error === "ERROR_INVALID_PASSWORD_FIELD_PASSWORD") {
          return { success: false, reason: "invalid_password" };
        }
        return { success: false, reason: err.detail || "error" };
      } catch (err) {
        return { success: false, reason: "offline" };
      }
    }

    export async function updateBaserowPassword(userRowId, newPassword) {
      try {
        const res = await fetch(`${BASEROW_BASE_URL}/database/rows/table/${USERS_TABLE_ID}/${userRowId}/?user_field_names=true`, {
          method: "PATCH",
          headers: apiHeaders,
          body: JSON.stringify({
            "Mot de passe": newPassword
          })
        });
        return res.ok;
      } catch (err) {
        console.error("Erreur mise à jour mot de passe Baserow :", err);
        return false;
      }
    }

    // =============================================================
    // GESTION DES NOTIFICATIONS SMS (Table Baserow Users 1273)
    // =============================================================
    export function getRegisteredUsersInfo() {
      const cfg = loadAuthConfig();
      const all = Object.values(cfg.users || {});
      const userChristophe = all.find(u => (u.displayName || "").toLowerCase() === "christophe" || (u.email || "").includes("christophe")) || {
        id: 1,
        name: "Christophe",
        displayName: "Christophe",
        email: "christophe.gontier@outlook.fr",
        phone: "0783141740"
      };
      const userDorianne = all.find(u => (u.displayName || "").toLowerCase() === "dorianne" || (u.email || "").includes("dorianne")) || {
        id: 2,
        name: "Dorianne",
        displayName: "Dorianne",
        email: "dorianne.dbe@free.fr",
        phone: "0651631615"
      };
      return { userChristophe, userDorianne };
    }

    export function buildAppointmentSmsText(appt, senderName = null) {
      const sender = senderName || window.__currentUser?.displayName || "Agenda Dunkirk";
      const dateStr = appt.date || "";
      const timeStr = appt.heure ? ` à ${appt.heure}` : "";
      const placeStr = appt.adresse ? ` (${appt.adresse})` : "";
      return `🚨 Agenda Dunkirk: Nouveau RDV "${appt.titre || 'Rendez-vous'}" le ${dateStr}${timeStr}${placeStr}. Inscrit par ${sender}.`;
    }

    export async function dispatchSmsGateway(cleanPhone, rawPhone, messageText, recipient) {
      // 1. Passerelle Free Mobile SMS officielle directe (100% gratuit et instantané via smsapi.free-mobile.fr)
      const freeUser = localStorage.getItem("dunkirk_freemobile_user_v1");
      const freePass = localStorage.getItem("dunkirk_freemobile_pass_v1");
      if (freeUser && freePass && freeUser.trim() && freePass.trim()) {
        try {
          const freeUrl = `https://smsapi.free-mobile.fr/sendmsg?user=${encodeURIComponent(freeUser.trim())}&pass=${encodeURIComponent(freePass.trim())}&msg=${encodeURIComponent(messageText)}`;
          await fetch(freeUrl, { mode: "no-cors" });
          console.log(`[SMS Gateway Free Mobile] Alerte SMS expédiée pour ${recipient?.displayName || cleanPhone}`);
        } catch (err) {
          console.warn("[SMS Gateway Free Mobile] Erreur :", err);
        }
      }

      // 2. Passerelle Webhook si configurée
      const webhookUrl = localStorage.getItem("dunkirk_sms_gateway_v1");
      if (webhookUrl && webhookUrl.trim()) {
        try {
          if (webhookUrl.includes("smsapi.free-mobile.fr")) {
            const sep = webhookUrl.includes("?") ? "&" : "?";
            const finalUrl = `${webhookUrl}${sep}msg=${encodeURIComponent(messageText)}`;
            await fetch(finalUrl, { mode: "no-cors" });
          } else {
            await fetch(webhookUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                event: "NEW_APPOINTMENT_SMS",
                recipientName: recipient?.displayName || recipient?.name || "Tous",
                recipientPhone: cleanPhone,
                rawPhone: rawPhone,
                message: messageText,
                timestamp: new Date().toISOString()
              })
            });
          }
          console.log(`[SMS Gateway Webhook] Envoyé avec succès à ${recipient?.displayName || cleanPhone}`);
        } catch (err) {
          console.warn(`[SMS Gateway Webhook] Erreur envoi automatique :`, err);
        }
      }
    }

    export function triggerAppointmentSmsNotification(appt, isNew = true) {
      const { userChristophe, userDorianne } = getRegisteredUsersInfo();
      const currentUserName = window.__currentUser?.displayName || "Agenda Dunkirk";

      // Prévenir TOUS les utilisateurs enregistrés (Christophe ET Dorianne) pour tout nouveau rendez-vous
      const recipients = [userChristophe, userDorianne].filter(Boolean);

      recipients.forEach(r => {
        const rawPhone = (r.phone || "").replace(/\s+/g, "");
        if (!rawPhone) return;
        const cleanPhone = rawPhone.startsWith("0") ? "+33" + rawPhone.slice(1) : rawPhone;
        const smsMessage = buildAppointmentSmsText(appt, currentUserName);

        // Journal d'audit
        addAuditLog(`📱 Alerte SMS générée pour ${r.displayName} (${rawPhone}) : "${appt.titre}"`, currentUserName);

        // Notification visuelle
        showToast(`📱 SMS d'alerte préparé pour ${r.displayName} (${rawPhone})`, "📱");

        // Envoi via passerelle automatique si configurée
        dispatchSmsGateway(cleanPhone, rawPhone, smsMessage, r);
      });
    }

    function renderUserSelectorButtons() {
      const container = document.querySelector(".auth-user-selector");
      if (!container) return;
      const cfg = loadAuthConfig();
      const seen = new Set();
      const uniqueUsers = [];
      Object.values(cfg.users || {}).forEach(u => {
        const key = u.email || u.displayName || u.id;
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueUsers.push(u);
        }
      });
      if (uniqueUsers.length === 0) return;

      container.innerHTML = "";
      uniqueUsers.forEach(u => {
        const name = u.displayName || u.name;
        const email = u.email || "";
        const isSelected = selectedAuthUser === email || selectedAuthUser === name;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `auth-user-btn ${name.toLowerCase()}-auth ${isSelected ? "active" : ""}`;
        btn.id = `auth-select-${name.toLowerCase()}`;
        const roleDesc = u.role === "admin" ? `🛡️ ${u.roleLabel || "Administrateur"}` : `📅 ${u.roleLabel || "Planning"}`;
        btn.innerHTML = `
      <span class="auth-avatar">${u.avatar || (u.role === "admin" ? "👨" : "👩")}</span>
      <span class="auth-user-name">${name}</span>
      <span class="auth-user-email">${email}</span>
      <span class="auth-user-role">${roleDesc}</span>
    `;
        btn.addEventListener("click", () => {
          playSound('click');
          selectAuthUser(email || name);
        });
        container.appendChild(btn);
      });
    }

    let currentUser = null;
    let selectedAuthUser = "christophe.gontier@outlook.fr";

    async function initAuth() {
      const cfg = loadAuthConfig();
      fetchBaserowUsers().catch(() => { });

      const sessionData = localStorage.getItem("dunkirk_session_v1");
      if (sessionData) {
        try {
          const sess = JSON.parse(sessionData);
          if (sess && sess.user) {
            const foundUser = cfg.users[sess.user] || Object.values(cfg.users).find(u => u.email === sess.user || u.displayName === sess.user);
            if (foundUser) {
              setLoggedInUser(sess.user, false);
              return;
            }
          }
        } catch (e) { }
      }

      if (!cfg.requireAuth) {
        setLoggedInUser("christophe.gontier@outlook.fr", false);
        return;
      }

      showAuthOverlay();
    }

    function showAuthOverlay() {
      const overlay = document.getElementById("auth-overlay");
      if (overlay) overlay.classList.remove("hidden");
      renderUserSelectorButtons();
      selectAuthUser(selectedAuthUser || "christophe.gontier@outlook.fr");
      const pwdInput = document.getElementById("auth-password-input");
      if (pwdInput) {
        pwdInput.value = "";
        setTimeout(() => pwdInput.focus(), 100);
      }
      const errorMsg = document.getElementById("auth-error-msg");
      if (errorMsg) errorMsg.classList.add("hidden");
    }

    function hideAuthOverlay() {
      const overlay = document.getElementById("auth-overlay");
      if (overlay) overlay.classList.add("hidden");
    }

    function selectAuthUser(identifier) {
      const cfg = loadAuthConfig();
      let u = cfg.users[identifier];
      if (!u) {
        u = Object.values(cfg.users || {}).find(item => item.email === identifier || item.displayName === identifier || item.name === identifier);
      }
      if (!u) {
        const isDorianne = identifier && (identifier.toLowerCase().includes("dorianne") || identifier === "2");
        u = isDorianne
          ? { id: 2, displayName: "Dorianne", name: "Dorianne", email: "dorianne.dbe@free.fr", role: "user", avatar: "👩", phone: "0651631615" }
          : { id: 1, displayName: "Christophe", name: "Christophe", email: "christophe.gontier@outlook.fr", role: "admin", avatar: "👨", phone: "0783141740" };
      }

      selectedAuthUser = u.email || u.displayName;

      document.querySelectorAll(".auth-user-btn").forEach(b => b.classList.remove("active"));
      const btnId = (u.displayName || u.name || "").toLowerCase().includes("dorianne") ? "auth-select-dorianne" : "auth-select-christophe";
      const currentBtn = document.getElementById(btnId);
      if (currentBtn) currentBtn.classList.add("active");

      const emailInput = document.getElementById("auth-email-input");
      if (emailInput) {
        emailInput.value = u.email || "";
      }

      const labelSelected = document.getElementById("auth-selected-name");
      if (labelSelected) {
        labelSelected.textContent = `${u.displayName} (${u.email})`;
      }

      const pwdInput = document.getElementById("auth-password-input");
      if (pwdInput) {
        pwdInput.value = "";
        pwdInput.focus();
      }
      const errorMsg = document.getElementById("auth-error-msg");
      if (errorMsg) errorMsg.classList.add("hidden");
    }

    async function attemptLogin(password, rememberMe = true, emailParam = null) {
      const cfg = loadAuthConfig();
      const typedEmail = (emailParam || document.getElementById("auth-email-input")?.value || "").trim().toLowerCase();

      let userData = null;
      const allUsers = Object.values(cfg.users || {});
      if (typedEmail) {
        userData = allUsers.find(u => u.email && u.email.toLowerCase() === typedEmail);
        if (!userData) {
          userData = allUsers.find(u => (u.displayName && u.displayName.toLowerCase() === typedEmail) || (u.name && u.name.toLowerCase() === typedEmail));
        }
      }
      if (!userData && selectedAuthUser) {
        userData = cfg.users[selectedAuthUser] || allUsers.find(u => u.email === selectedAuthUser || u.displayName === selectedAuthUser);
      }
      if (!userData) {
        if (typedEmail.includes("dorianne")) {
          userData = { id: 2, displayName: "Dorianne", name: "Dorianne", email: "dorianne.dbe@free.fr", role: "user", avatar: "👩", phone: "0651631615", password: "1234" };
        } else {
          userData = { id: 1, displayName: "Christophe", name: "Christophe", email: "christophe.gontier@outlook.fr", role: "admin", avatar: "👨", phone: "0783141740", password: "Macfly59*" };
        }
      }

      const submitBtn = document.getElementById("btn-auth-unlock");
      const origBtnText = submitBtn ? submitBtn.innerHTML : "";
      if (submitBtn) {
        submitBtn.innerHTML = `<span>⏳ Vérification Baserow...</span>`;
        submitBtn.disabled = true;
      }

      const card = document.getElementById("auth-card");
      const errorMsg = document.getElementById("auth-error-msg");
      if (errorMsg) errorMsg.classList.add("hidden");

      if (userData.active === false) {
        if (submitBtn) {
          submitBtn.innerHTML = origBtnText;
          submitBtn.disabled = false;
        }
        playSound('click');
        if (card) {
          card.classList.remove("auth-shake");
          void card.offsetWidth;
          card.classList.add("auth-shake");
        }
        if (errorMsg) {
          errorMsg.textContent = "Ce compte utilisateur est désactivé dans la table Baserow 1273.";
          errorMsg.classList.remove("hidden");
        }
        addAuditLog(`Tentative de connexion sur compte inactif: ${userData.email || userData.displayName}`, userData.displayName);
        return false;
      }

      const userRowId = userData.id || (userData.displayName === "Christophe" || userData.email?.includes("christophe") ? 1 : 2);
      const verifyResult = await verifyBaserowPassword(userRowId, password);

      let isAuthenticated = false;

      if (verifyResult.success) {
        isAuthenticated = true;
      } else if (verifyResult.reason === "offline") {
        const expected = userRowId === 1 ? "Macfly59*" : "1234";
        if (password === userData.password || password === expected) {
          isAuthenticated = true;
          showToast("Connexion validée en mode local (hors-ligne)", "⚠️");
        }
      }

      if (submitBtn) {
        submitBtn.innerHTML = origBtnText;
        submitBtn.disabled = false;
      }

      if (isAuthenticated) {
        userData.lastLogin = new Date().toISOString();
        userData.password = password;
        saveAuthConfig(cfg);

        if (rememberMe) {
          localStorage.setItem("dunkirk_session_v1", JSON.stringify({
            user: userData.email || userData.displayName,
            name: userData.displayName,
            loggedInAt: Date.now()
          }));
        } else {
          localStorage.removeItem("dunkirk_session_v1");
        }

        setLoggedInUser(userData.email || userData.displayName, true);
        addAuditLog(`Connexion réussie via Baserow pour ${userData.email} (${userData.displayName})`, userData.displayName);
        hideAuthOverlay();
        playSound('fanfare');
        launchConfetti();
        showToast(`Bienvenue ${userData.displayName} (${userData.email}) ! ✨`, userData.avatar);
        return true;
      } else {
        playSound('click');
        if (card) {
          card.classList.remove("auth-shake");
          void card.offsetWidth;
          card.classList.add("auth-shake");
        }
        if (errorMsg) {
          errorMsg.textContent = `Mot de passe incorrect dans Baserow (Table Users 1273) pour ${userData.email || userData.displayName}.`;
          errorMsg.classList.remove("hidden");
        }
        addAuditLog(`Échec de connexion pour ${userData.email || userData.displayName}`, userData.displayName);
        return false;
      }
    }

    function setLoggedInUser(identifier, notify = false) {
      const cfg = loadAuthConfig();
      let userData = cfg.users[identifier];
      if (!userData) {
        userData = Object.values(cfg.users || {}).find(u => u.email === identifier || u.displayName === identifier || u.name === identifier);
      }
      if (!userData) {
        userData = cfg.users["christophe.gontier@outlook.fr"] || cfg.users["Christophe"];
      }

      currentUser = {
        name: userData.displayName || userData.name || "Christophe",
        email: userData.email || "christophe.gontier@outlook.fr",
        phone: userData.phone || "0783141740",
        ...userData
      };
      window.__currentUser = currentUser;

      const headerAvatar = document.getElementById("header-avatar");
      const headerName = document.getElementById("header-user-label");
      const headerRole = document.getElementById("header-role-tag");

      if (headerAvatar) headerAvatar.textContent = userData.avatar;
      if (headerName) headerName.textContent = userData.displayName;
      if (headerRole) {
        headerRole.textContent = userData.role === "admin" ? "Admin" : "Utilisatrice";
        headerRole.className = `header-role-tag ${userData.role === "admin" ? "" : "user"}`;
      }

      const adminNavBtn = document.getElementById("bottom-nav-admin");
      if (adminNavBtn) {
        adminNavBtn.style.display = userData.role === "admin" ? "flex" : "none";
      }

      const currentActiveTab = document.querySelector(".tab-view.active")?.id;
      if (currentActiveTab === "view-admin" && userData.role !== "admin") {
        app.switchTab("planning");
      }

      if (userData.role === "admin") {
        renderAdminDashboard();
      }
    }

    function lockCurrentSession() {
      localStorage.removeItem("dunkirk_session_v1");
      currentUser = null;
      window.__currentUser = null;
      playSound('click');
      showToast("Session verrouillée 🔒", "🛡️");
      showAuthOverlay();
    }

    function renderAdminDashboard() {
      const cfg = loadAuthConfig();
      const appointments = window.__appointments || loadLocalAppointments();

      const toggleAuth = document.getElementById("admin-toggle-require-auth");
      if (toggleAuth) {
        toggleAuth.checked = cfg.requireAuth !== false;
      }

      const total = appointments.length;
      const countDorianne = appointments.filter(a => a.user === "Dorianne").length;
      const countChristophe = appointments.filter(a => a.user === "Christophe").length;
      const countBoth = appointments.filter(a => a.user === "Tous les deux" || a.user === "Les deux").length;

      const todayStr = new Date().toISOString().split("T")[0];
      const countUpcoming = appointments.filter(a => a.date >= todayStr).length;
      const countPast = appointments.filter(a => a.date < todayStr).length;
      const countGps = appointments.filter(a => a.latitude && a.longitude).length;

      const baserowStatus = document.getElementById("admin-baserow-status-badge");
      if (baserowStatus) {
        baserowStatus.textContent = cfg.baserowConnected ? "Lié & Actif" : "Hors-ligne";
        baserowStatus.style.background = cfg.baserowConnected ? "#10B981" : "#EF4444";
      }

      const elTot = document.getElementById("admin-kpi-total");
      const elDori = document.getElementById("admin-kpi-dorianne");
      const elChris = document.getElementById("admin-kpi-christophe");
      const elBoth = document.getElementById("admin-kpi-both");
      const elUpc = document.getElementById("admin-kpi-upcoming");
      const elPast = document.getElementById("admin-kpi-past");
      const elGps = document.getElementById("admin-kpi-gps");

      if (elTot) elTot.textContent = total;
      if (elDori) elDori.textContent = countDorianne;
      if (elChris) elChris.textContent = countChristophe;
      if (elBoth) elBoth.textContent = countBoth;
      if (elUpc) elUpc.textContent = countUpcoming;
      if (elPast) elPast.textContent = countPast;
      if (elGps) elGps.textContent = countGps;

      const auditList = document.getElementById("admin-audit-log-list");
      if (auditList) {
        auditList.innerHTML = "";
        const logs = cfg.auditLog || [];
        if (logs.length === 0) {
          auditList.innerHTML = `<div style="color:var(--text-muted); padding:0.5rem; text-align:center;">Aucune activité récente.</div>`;
        } else {
          logs.forEach(log => {
            const item = document.createElement("div");
            item.className = "audit-item";
            const dateObj = new Date(log.timestamp);
            const timeFormatted = isNaN(dateObj.getTime()) ? "--:--" : `${String(dateObj.getHours()).padStart(2, "0")}:${String(dateObj.getMinutes()).padStart(2, "0")}`;
            item.innerHTML = `
          <span class="audit-time">${timeFormatted}</span>
          <span><strong>${log.user}:</strong> ${log.action}</span>
        `;
            auditList.appendChild(item);
          });
        }
      }
    }

    // =============================================================
    // SYNTHÉTISEUR AUDIO WEB API (Effets Fun Dunkirk IT 100% Hors-Ligne)
    // =============================================================
    let audioCtx = null;
    let soundEnabled = true;

    function getAudioContext() {
      if (!audioCtx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
          audioCtx = new AudioContextClass();
        }
      }
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      return audioCtx;
    }

    export function playSound(type) {
      if (!soundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      try {
        if (type === 'carillon') {
          // Carillon Flandre Or : 4 notes harmoniques chaleureuses (A4, C#5, E5, A5)
          const freqs = [440, 554.37, 659.25, 880];
          freqs.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.12);

            gain.gain.setValueAtTime(0, now + idx * 0.12);
            gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.12 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.8);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.12);
            osc.stop(now + idx * 0.12 + 0.85);
          });
        } else if (type === 'brume') {
          // Corne de brume Port de Dunkerque (Basse puissante maritime)
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          const filter = ctx.createBiquadFilter();

          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(115, now);
          osc.frequency.exponentialRampToValueAtTime(105, now + 1.2);

          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(320, now);

          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.4, now + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.25);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 1.3);
        } else if (type === 'vroum') {
          // Turbo Vroum / Accélération Sportive Fun
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(130, now);
          osc.frequency.exponentialRampToValueAtTime(520, now + 0.6);

          gain.gain.setValueAtTime(0.1, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.3);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.7);
        } else if (type === 'cyber') {
          // Bip Cyber Dunkirk Informatique (8-bit arpège montant)
          const notes = [523.25, 659.25, 783.99, 1046.50];
          notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);

            gain.gain.setValueAtTime(0.12, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.1);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.12);
          });
        } else if (type === 'fanfare') {
          // Fanfare de Victoire / Mission Accomplie
          const chords = [
            { f: 523.25, d: 0.1 },
            { f: 659.25, d: 0.1 },
            { f: 783.99, d: 0.1 },
            { f: 1046.50, d: 0.35 }
          ];
          let offset = 0;
          chords.forEach((c) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(c.f, now + offset);

            gain.gain.setValueAtTime(0.25, now + offset);
            gain.gain.exponentialRampToValueAtTime(0.001, now + offset + c.d);

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now + offset);
            osc.stop(now + offset + c.d + 0.05);
            offset += 0.11;
          });
        } else if (type === 'click') {
          // Micro-clic haptique
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, now);
          gain.gain.setValueAtTime(0.05, now);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now);
          osc.stop(now + 0.05);
        }
      } catch (err) {
        console.warn("Audio synth warning:", err);
      }
    }

    // =============================================================
    // MOTEUR DE CONFETTIS D'AMBIANCE & CÉLÉBRATION
    // =============================================================
    export function launchConfetti() {
      const canvas = document.getElementById("confetti-canvas");
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ["#DDA727", "#FDE68A", "#38BDF8", "#EC4899", "#FFFFFF", "#10B981"];
      const particles = [];
      const count = 90;

      for (let i = 0; i < count; i++) {
        particles.push({
          x: canvas.width / 2 + (Math.random() - 0.5) * 160,
          y: canvas.height * 0.45,
          vx: (Math.random() - 0.5) * 14,
          vy: (Math.random() - 1.2) * 12,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          vRot: (Math.random() - 0.5) * 10,
          alpha: 1,
          decay: Math.random() * 0.015 + 0.008
        });
      }

      function frame() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let active = false;
        particles.forEach(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.35; // gravité
          p.rotation += p.vRot;
          p.alpha -= p.decay;

          if (p.alpha > 0) {
            active = true;
            ctx.save();
            ctx.globalAlpha = Math.max(0, p.alpha);
            ctx.translate(p.x, p.y);
            ctx.rotate((p.rotation * Math.PI) / 180);
            ctx.fillStyle = p.color;
            ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.3);
            ctx.restore();
          }
        });

        if (active) {
          requestAnimationFrame(frame);
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }
      requestAnimationFrame(frame);
    }

    // =============================================================
    // DONNÉES DÉMO PAR DÉFAUT (Pour Dorianne & Christophe)
    // =============================================================
    const DEFAULT_APPOINTMENTS = [
      {
        id: 101,
        user: "Christophe",
        categorie: "Co-transportage",
        titre: "Co-transportage Gare TGV Dunkerque",
        date: new Date().toISOString().split("T")[0],
        heure: "14:30",
        adresse: "Place de la Gare, 59140 Dunkerque",
        latitude: 51.0319,
        longitude: 2.3698,
        contact: "Marc Legrand",
        telephone: "06 12 34 56 78",
        alerte_minutes: 30,
        notes: "Arrivée TGV Voie 2. Bagages volumineux prévus dans le coffre."
      },
      {
        id: 102,
        user: "Dorianne",
        categorie: "Coiffeur",
        titre: "Rendez-vous Coiffure & Soin Malo",
        date: new Date().toISOString().split("T")[0],
        heure: "16:00",
        adresse: "Digue des Alliés, 59240 Dunkerque",
        latitude: 51.0505,
        longitude: 2.3995,
        contact: "Salon L’Élégance",
        telephone: "03 28 00 11 22",
        alerte_minutes: 30,
        notes: "Coupe & brushing avec Sophie. Parking facile digue."
      },
      {
        id: 103,
        user: "Tous les deux",
        categorie: "Dépannage PC",
        titre: "Livraison PC & Installation Pro Dunkirk IT",
        date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
        heure: "10:00",
        adresse: "Boulevard Sainte-Barbe, 59140 Dunkerque",
        latitude: 51.0362,
        longitude: 2.3785,
        contact: "Cabinet Flandres Conseil",
        telephone: "03 28 66 55 44",
        alerte_minutes: 45,
        notes: "Installation poste fixe sécurisé et configuration messagerie."
      }
    ];

    const DEFAULT_STYLES = [
      { name: "Co-transportage", emoji: "🚗", color: "#38BDF8" },
      { name: "Coiffeur", emoji: "✂️", color: "#EC4899" },
      { name: "Médical", emoji: "🩺", color: "#10B981" },
      { name: "Dépannage PC", emoji: "💻", color: "#DDA727" },
      { name: "Perso", emoji: "☕", color: "#A855F7" },
    ];

    // =============================================================
    // STOCKAGE LOCAL ET SYNCHRONISATION BASEROW
    // =============================================================
    function loadLocalAppointments() {
      const data = localStorage.getItem("appointments_dk");
      if (!data) {
        saveLocalAppointments(DEFAULT_APPOINTMENTS);
        return DEFAULT_APPOINTMENTS;
      }
      try {
        return JSON.parse(data);
      } catch (e) {
        return DEFAULT_APPOINTMENTS;
      }
    }

    function saveLocalAppointments(list) {
      localStorage.setItem("appointments_dk", JSON.stringify(list));
    }

    function loadCustomStyles() {
      const s = localStorage.getItem("custom_styles_dk");
      return s ? JSON.parse(s) : DEFAULT_STYLES;
    }

    function saveCustomStyles(styles) {
      localStorage.setItem("custom_styles_dk", JSON.stringify(styles));
    }

    function formatBaserowPayload(data) {
      // Nettoyage strict et sécurisé des données numériques et textuelles pour Baserow Table 1246
      let lat = null;
      if (data.latitude !== undefined && data.latitude !== null && data.latitude !== "") {
        const parsedLat = parseFloat(String(data.latitude).replace(",", "."));
        lat = isNaN(parsedLat) ? 51.0343 : parsedLat;
      } else {
        lat = 51.0343;
      }

      let lon = null;
      if (data.longitude !== undefined && data.longitude !== null && data.longitude !== "") {
        const parsedLon = parseFloat(String(data.longitude).replace(",", "."));
        lon = isNaN(parsedLon) ? 2.3768 : parsedLon;
      } else {
        lon = 2.3768;
      }

      let alerte = 30;
      if (data.alerte_minutes !== undefined && data.alerte_minutes !== null && data.alerte_minutes !== "") {
        const parsedAlert = parseInt(data.alerte_minutes, 10);
        alerte = isNaN(parsedAlert) ? 30 : parsedAlert;
      }

      return {
        Titre: (data.titre || "").trim(),
        Utilisateur: (data.user || "Dorianne").trim(),
        Categorie: (data.categorie || "Co-transportage").trim(),
        Date: (data.date || new Date().toISOString().split("T")[0]).trim(),
        Heure: (data.heure || "12:00").trim(),
        Adresse: (data.adresse || "Dunkerque (59140)").trim(),
        Latitude: lat,
        Longitude: lon,
        Contact: (data.contact || "").trim(),
        Telephone: (data.telephone || "").trim(),
        AlerteMinutes: alerte,
        Notes: (data.notes || "").trim()
      };
    }

    async function apiFetch(path, options = {}) {
      const resp = await fetch(`${BASEROW_BASE_URL}${path}`, {
        ...options,
        headers: { ...(options.headers || {}), ...apiHeaders },
      });
      if (!resp.ok) {
        let errBody = "";
        try { errBody = await resp.text(); } catch (_) {}
        console.error(`[Baserow Error ${resp.status}]`, errBody);
        throw new Error(`Baserow request failed: ${resp.status} - ${errBody}`);
      }
      return resp.json();
    }

    // =============================================================
    // NOTIFICATION TOAST
    // =============================================================
    function showToast(message, emoji = "✨") {
      const container = document.getElementById("toast-container");
      if (!container) return;
      const toast = document.createElement("div");
      toast.className = "toast";
      toast.innerHTML = `<span style="font-size:1.2rem;">${emoji}</span><span>${message}</span>`;
      container.appendChild(toast);
      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(-10px)";
        toast.style.transition = "all 0.3s ease";
        setTimeout(() => toast.remove(), 300);
      }, 3200);
    }

    // =============================================================
    // RENDU DES CARTES RENDEZ-VOUS
    // =============================================================
    let currentFilterUser = "all";
    let currentFilterCategory = "all";
    let currentSearchQuery = "";

    function formatDateTime(dateStr, timeStr) {
      if (!dateStr) return "--";
      const [y, m, d] = dateStr.split("-");
      return `${d}/${m}/${y} à ${timeStr || "--:--"}`;
    }

    function createAppointmentCard(appt) {
      const card = document.createElement("div");
      const userClass = appt.user === "Dorianne" ? "user-dorianne" : (appt.user === "Christophe" ? "user-christophe" : "");
      card.className = `appointment-card ${userClass}`;
      card.dataset.id = appt.id;

      const userEmoji = appt.user === "Dorianne" ? "👩" : (appt.user === "Christophe" ? "👨" : "👫");
      const userBadgeClass = appt.user === "Dorianne" ? "dorianne" : (appt.user === "Christophe" ? "christophe" : "");

      const isTempId = !appt.id || Number(appt.id) > 100000 || isNaN(Number(appt.id));
      const idBadge = isTempId
        ? `<span class="badge-sync-pending" onclick="event.stopPropagation(); app.syncNow();" title="Cliquez pour forcer la synchronisation avec Baserow" style="cursor:pointer; font-size:0.68rem; background:rgba(221,167,39,0.18); color:var(--dk-gold); border:1px solid rgba(221,167,39,0.4); border-radius:12px; padding:0.15rem 0.5rem; font-weight:700;">⏳ Synchro...</span>`
        : `<span style="font-size:0.75rem; color:#94A3B8; font-weight:700;">#${appt.id}</span>`;

      card.innerHTML = `
    <div class="card-top-row">
      <div class="badge-group">
        <span class="user-mini-badge ${userBadgeClass}">${userEmoji} ${appt.user}</span>
        <span class="dest-badge">${appt.categorie || "RDV"}</span>
      </div>
      ${idBadge}
    </div>
    <h3 class="card-title">${appt.titre || "Rendez-vous"}</h3>
    <div class="card-meta-line">
      <span>📅 ${formatDateTime(appt.date, appt.heure)}</span>
    </div>
    <div class="card-address-line">
      <span>📍 ${appt.adresse || "Lieu non renseigné"}</span>
    </div>
    ${appt.contact ? `
      <div class="card-contact-line">
        <span>👤 ${appt.contact}</span>
        ${appt.telephone ? `<a href="tel:${appt.telephone.replace(/\s+/g, '')}" class="phone-chip" onclick="event.stopPropagation()">📞 ${appt.telephone}</a>` : ''}
      </div>
    ` : ''}
    <div class="card-quick-actions">
      <button class="btn-card-action btn-action-guide" title="Lancer le guidage GPS">
        🧭 Guidage
      </button>
      <button class="btn-card-action btn-depart" title="Départ immédiat !">
        🚗 Départ !
      </button>
    </div>
  `;

      // Clic sur toute la carte pour ouvrir la vue détaillée
      card.addEventListener("click", () => {
        playSound('click');
        openDetailModal(appt);
      });

      // Action rapide : Guidage direct
      card.querySelector(".btn-action-guide").addEventListener("click", (e) => {
        e.stopPropagation();
        playSound('cyber');
        selectAndGuide(appt);
      });

      // Action rapide : Départ !
      card.querySelector(".btn-depart").addEventListener("click", (e) => {
        e.stopPropagation();
        playSound('vroum');
        launchConfetti();
        showToast(`En route pour : ${appt.titre} ! 🚗💨`, "🏁");
        selectAndGuide(appt);
      });

      return card;
    }

    function renderAppointments(list) {
      const container = document.getElementById("appointments-list");
      if (!container) return;
      container.innerHTML = "";

      let filtered = list;

      // Filtre Utilisateur (Dorianne, Christophe, all)
      if (currentFilterUser !== "all") {
        filtered = filtered.filter(a => a.user === currentFilterUser || a.user === "Tous les deux");
      }

      // Filtre Catégorie
      if (currentFilterCategory !== "all") {
        filtered = filtered.filter(a => a.categorie === currentFilterCategory);
      }

      // Recherche textuelle
      if (currentSearchQuery.trim() !== "") {
        const q = currentSearchQuery.toLowerCase();
        filtered = filtered.filter(a =>
          (a.titre && a.titre.toLowerCase().includes(q)) ||
          (a.adresse && a.adresse.toLowerCase().includes(q)) ||
          (a.contact && a.contact.toLowerCase().includes(q)) ||
          (a.categorie && a.categorie.toLowerCase().includes(q))
        );
      }

      // TRI CROISSANT PAR DATE puis HEURE (le plus proche en premier)
      filtered.sort((a, b) => {
        const dateA = `${a.date || '9999-12-31'}T${a.heure || '00:00'}`;
        const dateB = `${b.date || '9999-12-31'}T${b.heure || '00:00'}`;
        return dateA.localeCompare(dateB);
      });

      filtered.forEach(a => container.appendChild(createAppointmentCard(a)));

      const empty = document.getElementById("empty-state");
      if (empty) {
        if (filtered.length === 0) {
          empty.classList.remove("hidden");
        } else {
          empty.classList.add("hidden");
        }
      }

      // Mettre à jour le sélecteur dans l'onglet Guidage
      updateGuidanceSelect(list);
      // Vérifier les départs imminents
      checkImminentDepartures(list);
      // Mettre à jour les statistiques et nombres de rendez-vous
      updateStats(list);
    }

    function updateStats(list) {
      const currentList = Array.isArray(list) ? list : (window.__appointments || loadLocalAppointments());
      const todayStr = new Date().toISOString().split("T")[0];
      const today = currentList.filter(a => a.date === todayStr);
      const upcoming = currentList.filter(a => a.date >= todayStr);

      const elToday = document.getElementById("stats-today");
      const elUpcoming = document.getElementById("stats-upcoming");
      const elTotal = document.getElementById("stats-total");

      if (elToday) elToday.textContent = today.length;
      if (elUpcoming) elUpcoming.textContent = upcoming.length;
      if (elTotal) elTotal.textContent = currentList.length;

      // Mise à jour du badge Planning sur la barre de navigation
      const planBadge = document.getElementById("planning-badge-count");
      if (planBadge) {
        planBadge.textContent = currentList.length;
        planBadge.classList.toggle("hidden", currentList.length === 0);
      }

      // Titre de la liste avec le nombre de rendez-vous
      const listTitle = document.getElementById("list-group-title");
      if (listTitle) {
        listTitle.textContent = `Rendez-vous programmés (${currentList.length})`;
      }

      // Tableau des scores par utilisateur
      const countDorianne = currentList.filter(a => a.user === "Dorianne").length;
      const countChristophe = currentList.filter(a => a.user === "Christophe").length;
      const countBoth = currentList.filter(a => a.user === "Tous les deux").length;
      const elScoreDorianne = document.getElementById("score-dorianne");
      const elScoreChristophe = document.getElementById("score-christophe");
      const elScoreBoth = document.getElementById("score-both");
      if (elScoreDorianne) elScoreDorianne.textContent = countDorianne;
      if (elScoreChristophe) elScoreChristophe.textContent = countChristophe;
      if (elScoreBoth) elScoreBoth.textContent = countBoth;
    }

    // =============================================================
    // ALERTES & DÉPARTS IMMINENTS
    // =============================================================
    function checkImminentDepartures(list) {
      const banner = document.getElementById("urgent-alert-banner");
      const titleEl = document.getElementById("urgent-title");
      const detailsEl = document.getElementById("urgent-details");
      const feed = document.getElementById("active-alerts-feed");
      const badgeCount = document.getElementById("alerts-badge-count");

      if (!banner || !feed) return;

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const todayAppts = list.filter(a => a.date === todayStr);

      let urgentCount = 0;
      let minDiff = Infinity;
      let mostUrgent = null;

      if (todayAppts.length === 0) {
        const upcoming = list
          .filter(a => a.date >= todayStr)
          .sort((a, b) => `${a.date} ${a.heure}`.localeCompare(`${b.date} ${b.heure}`))
          .slice(0, 4);

        if (upcoming.length > 0) {
          feed.innerHTML = `<div style="font-size:0.75rem; font-weight:800; color:var(--dk-gold); text-transform:uppercase; margin-bottom:0.6rem; letter-spacing:0.5px;">Prochaines alertes planifiées</div>`;
          upcoming.forEach(a => {
            const item = document.createElement("div");
            item.className = "alert-item-card";
            const lead = a.alerte_minutes || 30;
            const leadText = lead >= 60 ? `${Math.round(lead / 60)}h` : `${lead} min`;
            item.innerHTML = `
          <div class="alert-item-time">${a.heure}</div>
          <div class="alert-item-text">
            <div class="alert-item-title">${a.titre}</div>
            <div class="alert-item-sub">👤 ${a.user} • 📅 ${a.date} • 🔔 Rappel -${leadText}</div>
          </div>
          <button class="mini-pill-btn secondary" onclick="app.selectAndGuideById('${a.id}')">Voir</button>
        `;
            feed.appendChild(item);
          });
        } else {
          feed.innerHTML = `
        <div style="text-align:center; padding:1.5rem 1rem; color:var(--text-muted); font-size:0.85rem;">
          <div style="font-size:1.8rem; margin-bottom:0.4rem;">🔔</div>
          Toutes les alertes sont à jour. Les rappels sonores se déclencheront selon le délai configuré.
        </div>
      `;
        }
      } else {
        feed.innerHTML = "";
        todayAppts.forEach(a => {
          if (!a.heure) return;
          const [h, m] = a.heure.split(":").map(Number);
          const rdvDate = new Date();
          rdvDate.setHours(h, m, 0, 0);

          const diffMinutes = Math.round((rdvDate - now) / 60000);
          const lead = a.alerte_minutes || 30;

          // Créer la carte d'alerte dans l'onglet alertes
          const item = document.createElement("div");
          item.className = "alert-item-card";

          let statusText = "";
          if (diffMinutes < 0) {
            statusText = `Passé depuis ${Math.abs(diffMinutes)} min`;
          } else if (diffMinutes === 0) {
            statusText = "Départ maintenant !";
          } else {
            statusText = `Dans ${diffMinutes} min (Alerte à -${lead} min)`;
          }

          item.innerHTML = `
        <div class="alert-item-time">${a.heure}</div>
        <div class="alert-item-text">
          <div class="alert-item-title">${a.titre}</div>
          <div class="alert-item-sub">👤 ${a.user} • 📍 ${a.adresse || "Dunkerque"} • ${statusText}</div>
        </div>
        <button class="mini-pill-btn" onclick="app.selectAndGuideById('${a.id}')">Guider</button>
      `;
          feed.appendChild(item);

          // Détection imminente (entre 0 et le délai de prévenance)
          if (diffMinutes >= 0 && diffMinutes <= lead) {
            urgentCount++;
            if (diffMinutes < minDiff) {
              minDiff = diffMinutes;
              mostUrgent = a;
            }
          }
        });
      }

      if (badgeCount) {
        if (urgentCount > 0) {
          badgeCount.textContent = urgentCount;
          badgeCount.classList.remove("hidden");
        } else {
          badgeCount.classList.add("hidden");
        }
      }

      if (mostUrgent) {
        banner.classList.remove("hidden");
        titleEl.textContent = `Départ imminent pour ${mostUrgent.user} !`;
        detailsEl.textContent = `${mostUrgent.titre} à ${mostUrgent.heure} (dans ${minDiff} min)`;
        banner.dataset.rdvId = mostUrgent.id;
      } else {
        banner.classList.add("hidden");
      }
    }

    // =============================================================
    // GESTIONNAIRE D'ALERTES ET NOTIFICATIONS MULTI-UTILISATEURS (Dunkirk IT)
    // =============================================================
    function getMySessionId() {
      let sid = sessionStorage.getItem("dunkirk_tab_session_id");
      if (!sid) {
        sid = "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 6);
        sessionStorage.setItem("dunkirk_tab_session_id", sid);
      }
      return sid;
    }

    function getMyLocallyAddedIds() {
      try {
        return JSON.parse(localStorage.getItem("dunkirk_my_created_ids") || "[]");
      } catch (e) {
        return [];
      }
    }

    function markIdAsLocallyCreated(id) {
      try {
        const list = getMyLocallyAddedIds();
        const strId = String(id);
        if (!list.includes(strId)) {
          list.push(strId);
          if (list.length > 100) list.shift();
          localStorage.setItem("dunkirk_my_created_ids", JSON.stringify(list));
        }
      } catch (e) { }
    }

    function getKnownAppointmentIds() {
      try {
        return JSON.parse(localStorage.getItem("dunkirk_known_ids") || "[]");
      } catch (e) {
        return [];
      }
    }

    function markIdAsKnown(id) {
      try {
        const known = getKnownAppointmentIds();
        const strId = String(id);
        if (!known.includes(strId)) {
          known.push(strId);
          localStorage.setItem("dunkirk_known_ids", JSON.stringify(known));
        }
      } catch (e) { }
    }

    function saveKnownAppointmentIds(ids) {
      try {
        const unique = Array.from(new Set(ids.map(String)));
        localStorage.setItem("dunkirk_known_ids", JSON.stringify(unique));
      } catch (e) { }
    }

    // Canal de synchronisation inter-onglets instantané
    const syncChannel = ('BroadcastChannel' in window) ? new BroadcastChannel('dunkirk_rdv_channel') : null;

    if (syncChannel) {
      syncChannel.onmessage = (event) => {
        if (event.data && event.data.type === 'NEW_APPOINTMENT_ADDED') {
          const { appointment, senderSessionId } = event.data;
          if (senderSessionId !== getMySessionId()) {
            notifyNewAppointmentFromOtherUser(appointment);
            loadAndRender();
          }
        }
      };
    }

    export function triggerSystemNotification(title, body, icon = "icons/icon-192.png") {
      if (!("Notification" in window)) return;
      if (Notification.permission === "granted") {
        try {
          if ("serviceWorker" in navigator) {
            navigator.serviceWorker.ready.then(reg => {
              if (reg && reg.showNotification) {
                reg.showNotification(title, {
                  body: body,
                  icon: icon,
                  badge: icon,
                  vibrate: [200, 100, 200],
                  tag: "dunkirk-rdv-" + Date.now(),
                  renotify: true,
                  data: { url: "./" }
                });
              } else {
                new Notification(title, { body, icon, badge: icon });
              }
            }).catch(() => {
              try { new Notification(title, { body, icon, badge: icon }); } catch (_) {}
            });
          } else {
            new Notification(title, { body, icon, badge: icon });
          }
        } catch (e) {
          console.warn("Erreur déclenchement notification:", e);
        }
      }
    }

    function formatFrenchFullDate(dateStr, timeStr) {
      if (!dateStr) return timeStr || "--";
      try {
        const [y, m, d] = dateStr.split("-").map(Number);
        const dateObj = new Date(y, m - 1, d);
        const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
        const months = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
        const dayName = days[dateObj.getDay()] || "";
        const monthName = months[dateObj.getMonth()] || "";
        return `${dayName} ${d} ${monthName}${timeStr ? ` à ${timeStr}` : ""}`;
      } catch (e) {
        return `${dateStr} à ${timeStr}`;
      }
    }

    export function showAppointmentAlert(appt, isNew = true, isFromOtherUser = false) {
      const modal = document.getElementById("new-rdv-alert-modal");
      if (!modal) return;

      const headingEl = modal.querySelector(".alert-modal-heading");
      if (headingEl) {
        if (isFromOtherUser) {
          headingEl.textContent = `🚨 Alerte : ${appt.user} a ajouté un rendez-vous !`;
        } else {
          headingEl.textContent = isNew ? "🚨 Alerte : Nouveau Rendez-vous !" : "🔔 Rendez-vous Mis à Jour !";
        }
      }

      const userPill = document.getElementById("alert-modal-user");
      if (userPill) {
        userPill.className = "alert-user-pill";
        if (appt.user === "Dorianne") {
          userPill.classList.add("dorianne");
          userPill.textContent = "👩 Dorianne";
        } else if (appt.user === "Christophe") {
          userPill.classList.add("christophe");
          userPill.textContent = "👨 Christophe";
        } else {
          userPill.classList.add("both");
          userPill.textContent = "👥 Tous les deux";
        }
      }

      const titleEl = document.getElementById("alert-modal-title");
      if (titleEl) titleEl.textContent = appt.titre || "Rendez-vous";

      const dtEl = document.getElementById("alert-modal-datetime");
      if (dtEl) dtEl.textContent = formatFrenchFullDate(appt.date, appt.heure);

      const addrEl = document.getElementById("alert-modal-address");
      if (addrEl) addrEl.textContent = appt.adresse || "Dunkerque (non précisée)";

      const contactRow = document.getElementById("alert-modal-contact-row");
      const contactEl = document.getElementById("alert-modal-contact");
      if (contactRow && contactEl) {
        if (appt.contact || appt.telephone) {
          contactRow.style.display = "flex";
          contactEl.textContent = `${appt.contact || ""}${appt.telephone ? ` (${appt.telephone})` : ""}`;
        } else {
          contactRow.style.display = "none";
        }
      }

      const lead = appt.alerte_minutes || 30;
      const leadText = lead >= 60 ? `${Math.round(lead / 60)}h` : `${lead} min`;
      const reminderEl = document.getElementById("alert-modal-reminder-text");
      if (reminderEl) {
        reminderEl.textContent = `Rappel sonore & notification programmés ${leadText} avant le départ`;
      }
      const timeLeadSub = document.getElementById("alert-modal-time-lead");
      if (timeLeadSub) {
        timeLeadSub.textContent = isFromOtherUser ? "Nouveau rendez-vous en direct" : `Alerte active (-${leadText})`;
      }

      modal.dataset.rdvId = String(appt.id);
      modal.classList.remove("hidden");

      // Bouton d'alerte SMS directe vers tous les utilisateurs (Christophe & Dorianne)
      const alertSmsBtn = document.getElementById("alert-modal-btn-sms");
      if (alertSmsBtn) {
        const { userChristophe, userDorianne } = getRegisteredUsersInfo();
        const phoneChristophe = userChristophe?.phone || "0783141740";
        const phoneDorianne = userDorianne?.phone || "0651631615";
        const cleanChris = phoneChristophe.startsWith("0") ? "+33" + phoneChristophe.slice(1) : phoneChristophe;
        const cleanDori = phoneDorianne.startsWith("0") ? "+33" + phoneDorianne.slice(1) : phoneDorianne;
        const smsText = buildAppointmentSmsText(appt, window.__currentUser?.displayName);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const separator = isIOS ? ";" : ",";
        const allPhones = `${cleanChris}${separator}${cleanDori}`;
        alertSmsBtn.href = `sms:${allPhones}?body=${encodeURIComponent(smsText)}`;
        alertSmsBtn.textContent = `📱 Alerter par SMS (Christophe & Dorianne)`;
        alertSmsBtn.style.display = "inline-flex";
        alertSmsBtn.onclick = () => {
          addAuditLog(`📱 Alerte SMS préparée pour Christophe (${phoneChristophe}) et Dorianne (${phoneDorianne}) : "${appt.titre}"`);
          showToast(`SMS préparé pour Christophe et Dorianne ! 🚀`, "📱");
        };
      }

      // Alerte sonore et célébration
      playSound('carillon');

      // Notification Web / Mobile sur smartphone
      triggerSystemNotification(
        isFromOtherUser ? `🚨 ${appt.user} a ajouté un rendez-vous !` : `🚨 Nouveau rendez-vous pour ${appt.user}`,
        `${appt.titre} • ${formatFrenchFullDate(appt.date, appt.heure)}`
      );
    }

    export function notifyNewAppointmentFromOtherUser(appt) {
      playSound('carillon');
      if (navigator.vibrate) {
        try { navigator.vibrate([300, 150, 300]); } catch (e) { }
      }
      showToast(`🚨 Alerte : ${appt.user} a ajouté "${appt.titre}" !`, "🔔");
      triggerSystemNotification(
        `🚨 Nouveau rendez-vous pour ${appt.user} !`,
        `"${appt.titre}" prévu le ${formatDateTime(appt.date, appt.heure)}`
      );
      triggerAppointmentSmsNotification(appt, true);
      showAppointmentAlert(appt, true, true);
      launchConfetti();
    }

    export function closeAppointmentAlert() {
      const modal = document.getElementById("new-rdv-alert-modal");
      if (modal) modal.classList.add("hidden");
    }

    // =============================================================
    // MODAL DÉTAILS
    // =============================================================
    function openDetailModal(appt) {
      const modal = document.getElementById("rdv-detail-modal");
      if (!modal) return;

      const userBadge = document.getElementById("modal-user-badge");
      const catBadge = document.getElementById("modal-category-badge");
      const title = document.getElementById("modal-rdv-title");
      const datetime = document.getElementById("modal-datetime");
      const address = document.getElementById("modal-address");
      const contact = document.getElementById("modal-contact");
      const callBtn = document.getElementById("modal-call-btn");
      const alertInfo = document.getElementById("modal-alert-info");
      const notes = document.getElementById("modal-notes");

      const userEmoji = appt.user === "Dorianne" ? "👩" : (appt.user === "Christophe" ? "👨" : "👫");
      const userBadgeClass = appt.user === "Dorianne" ? "dorianne" : (appt.user === "Christophe" ? "christophe" : "");
      const isApptTemp = !appt.id || Number(appt.id) > 100000 || isNaN(Number(appt.id));
      const idLabel = isApptTemp ? " (⏳ En attente de synchro Baserow)" : ` (Fiche #${appt.id})`;
      userBadge.textContent = `${userEmoji} ${appt.user}${idLabel}`;
      userBadge.className = `user-mini-badge ${userBadgeClass}`;
      catBadge.textContent = appt.categorie || "Déplacement";
      title.textContent = appt.titre;
      datetime.textContent = formatDateTime(appt.date, appt.heure);
      address.textContent = appt.adresse || "Non renseigné";
      contact.textContent = appt.contact || "Aucun contact spécifié";

      if (appt.telephone) {
        callBtn.href = `tel:${appt.telephone.replace(/\s+/g, '')}`;
        callBtn.classList.remove("hidden");
      } else {
        callBtn.classList.add("hidden");
      }

      alertInfo.textContent = `${appt.alerte_minutes || 30} minutes avant le départ`;
      notes.textContent = appt.notes || "Aucune consigne particulière.";

      window.__selectedAppointment = appt;
      modal.classList.remove("hidden");
    }

    function closeDetailModal() {
      const modal = document.getElementById("rdv-detail-modal");
      if (modal) modal.classList.add("hidden");
    }

    // =============================================================
    // ÉDITION ET FORMULAIRE
    // =============================================================
    // ÉDITION ET FORMULAIRE
    // =============================================================
    let isEditingMode = false;

    // Gestion visuelle & interactive des boutons radio utilisateur
    function updateUserRadioVisuals() {
      document.querySelectorAll(".user-radio-chip").forEach(chip => {
        const radio = chip.querySelector("input[name='rdv-user']");
        if (radio && radio.checked) {
          chip.classList.add("selected");
        } else {
          chip.classList.remove("selected");
        }
      });
    }

    function setupUserRadioChips() {
      document.querySelectorAll(".user-radio-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          const radio = chip.querySelector("input[name='rdv-user']");
          if (radio) {
            document.querySelectorAll("input[name='rdv-user']").forEach(r => r.checked = false);
            radio.checked = true;
            updateUserRadioVisuals();
          }
        });
      });
      updateUserRadioVisuals();
    }

    function editCurrentAppointment() {
      const appt = window.__selectedAppointment;
      if (!appt) return;

      closeDetailModal();
      isEditingMode = true;
      app.switchTab("new");

      document.getElementById("form-heading").textContent = "Modifier le Rendez-vous";
      document.getElementById("edit-rdv-id").value = String(appt.id);

      // Normalisation rigoureuse de l'utilisateur (gère 'Tous les deux', 'Les deux', 'Christophe', 'Dorianne')
      let targetUser = (appt.user || "Dorianne").trim();
      if (targetUser === "Les deux" || targetUser === "Tous" || targetUser.toLowerCase() === "tous les deux") {
        targetUser = "Tous les deux";
      } else if (targetUser.toLowerCase() === "christophe") {
        targetUser = "Christophe";
      } else {
        targetUser = "Dorianne";
      }

      // Décocher tous les radios puis cocher précisément celui de l'utilisateur
      document.querySelectorAll("input[name='rdv-user']").forEach(r => {
        r.checked = (r.value === targetUser);
      });
      updateUserRadioVisuals();

      // Radio style
      const styleRadio = document.querySelector(`input[name="rdv-style"][value="${appt.categorie}"]`);
      if (styleRadio) styleRadio.checked = true;

      document.getElementById("rdv-title").value = appt.titre || "";
      document.getElementById("rdv-date").value = appt.date || "";
      document.getElementById("rdv-time").value = appt.heure || "";
      document.getElementById("rdv-address").value = appt.adresse || "";
      document.getElementById("rdv-lat").value = appt.latitude || "51.0343";
      document.getElementById("rdv-lon").value = appt.longitude || "2.3768";
      document.getElementById("rdv-contact-name").value = appt.contact || "";
      document.getElementById("rdv-contact-phone").value = appt.telephone || "";
      document.getElementById("rdv-alert-lead").value = String(appt.alerte_minutes || "30");
      document.getElementById("rdv-notes").value = appt.notes || "";

      document.getElementById("btn-cancel-edit").classList.remove("hidden");
      document.getElementById("btn-save-rdv").textContent = "Enregistrer les modifications";
    }

    function deleteCurrentAppointment() {
      const appt = window.__selectedAppointment;
      if (!appt) return;

      if (confirm(`Voulez-vous vraiment supprimer le rendez-vous "${appt.titre}" ?`)) {
        let local = loadLocalAppointments();
        local = local.filter(a => a.id != appt.id);
        saveLocalAppointments(local);
        window.__appointments = local;
        renderAppointments(local);
        updateStats(local);
        closeDetailModal();
        playSound('click');
        showToast("Rendez-vous supprimé avec succès.", "🗑️");

        // Tentative de suppression Baserow si possible
        apiFetch(`/database/rows/table/${TABLE_ID}/${appt.id}/`, { method: "DELETE" })
          .catch(err => console.warn("Baserow delete error:", err));
      }
    }

    function resetForm() {
      const form = document.getElementById("appointment-form");
      if (form) form.reset();

      const idInput = document.getElementById("edit-rdv-id");
      if (idInput) idInput.value = "";

      const heading = document.getElementById("form-heading");
      if (heading) heading.textContent = "Nouveau Rendez-vous";

      const cancelBtn = document.getElementById("btn-cancel-edit");
      if (cancelBtn) cancelBtn.classList.add("hidden");

      const saveBtn = document.getElementById("btn-save-rdv");
      if (saveBtn) saveBtn.textContent = "Enregistrer le rendez-vous";

      // Toujours forcer la date à aujourd'hui, avec une plage large pour les années futures
      const dateInput = document.getElementById("rdv-date");
      if (dateInput) {
        dateInput.value = new Date().toISOString().split("T")[0];
        dateInput.min = "2020-01-01";
        dateInput.max = "2099-12-31";
      }

      // Toujours réinitialiser l'heure
      const timeInput = document.getElementById("rdv-time");
      if (timeInput) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const mins = String(Math.ceil(now.getMinutes() / 5) * 5 % 60).padStart(2, "0");
        timeInput.value = `${hours}:${mins}`;
      }

      const latInput = document.getElementById("rdv-lat");
      if (latInput) latInput.value = "51.0343";
      const lonInput = document.getElementById("rdv-lon");
      if (lonInput) lonInput.value = "2.3768";

      // Réinitialiser les boutons radio sur Dorianne par défaut
      document.querySelectorAll("input[name='rdv-user']").forEach(r => {
        r.checked = (r.value === "Dorianne");
      });
      updateUserRadioVisuals();

      const firstStyle = document.querySelector("input[name='rdv-style']");
      if (firstStyle) firstStyle.checked = true;

      isEditingMode = false;
      window.__selectedAppointment = null;
    }

    let isFormSubmittingLock = false;
    async function submitForm(e) {
      if (e) {
        try { if (typeof e.preventDefault === "function") e.preventDefault(); } catch (_) {}
        try { if (typeof e.stopPropagation === "function") e.stopPropagation(); } catch (_) {}
      }
      if (isFormSubmittingLock) {
        console.warn("[submitForm] Soumission déjà en cours...");
        return;
      }

      // Validation préalable
      const titreInput = document.getElementById("rdv-title");
      const titre = (titreInput?.value || "").trim();
      if (!titre) {
        showToast("Veuillez saisir un motif pour le rendez-vous ✍️", "⚠️");
        if (titreInput) titreInput.focus();
        return;
      }

      isFormSubmittingLock = true;

      try {
        const id = (document.getElementById("edit-rdv-id")?.value || "").trim();

        // Récupération fiable de l'utilisateur sélectionné
        let selectedUser = "Dorianne";
        const checkedRadio = document.querySelector("input[name='rdv-user']:checked");
        if (checkedRadio && checkedRadio.value) {
          selectedUser = checkedRadio.value;
        }

        const dateVal = document.getElementById("rdv-date")?.value || new Date().toISOString().split("T")[0];
        const heureVal = document.getElementById("rdv-time")?.value || "12:00";
        const adresseVal = (document.getElementById("rdv-address")?.value || "").trim();
        const latVal = parseFloat(document.getElementById("rdv-lat")?.value);
        const lonVal = parseFloat(document.getElementById("rdv-lon")?.value);

        const data = {
          user: selectedUser,
          categorie: document.querySelector("input[name='rdv-style']:checked")?.value || "Co-transportage",
          titre: titre,
          date: dateVal,
          heure: heureVal,
          adresse: adresseVal || "Dunkerque (59140)",
          latitude: isNaN(latVal) ? 51.0343 : latVal,
          longitude: isNaN(lonVal) ? 2.3768 : lonVal,
          contact: (document.getElementById("rdv-contact-name")?.value || "").trim(),
          telephone: (document.getElementById("rdv-contact-phone")?.value || "").trim(),
          notes: (document.getElementById("rdv-notes")?.value || "").trim(),
          alerte_minutes: parseInt(document.getElementById("rdv-alert-lead")?.value, 10) || 30,
        };

        const baserowData = formatBaserowPayload(data);

        let finalId = null;
        let baserowSuccess = false;

        // === ÉTAPE 1 : ENVOI DIRECT DANS BASEROW (PRIORITÉ ABSOLUE) ===
        if (!id) {
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
              console.log("[submitForm] Enregistré avec succès dans Baserow Table 1246, ID:", created.id);
            }
          } catch (baserowErr) {
            console.warn("[submitForm] Erreur réseau Baserow, passage en temporaire :", baserowErr);
          }
          if (!finalId) {
            finalId = Date.now();
          }
        } else {
          try {
            await apiFetch(`/database/rows/table/${TABLE_ID}/${id}/?user_field_names=true`, {
              method: "PATCH",
              body: JSON.stringify(baserowData),
            });
            finalId = id;
            baserowSuccess = true;
          } catch (baserowErr) {
            console.warn("[submitForm] Erreur PATCH Baserow :", baserowErr);
            finalId = id;
          }
        }

        // === ÉTAPE 2 : SAUVEGARDE LOCALE AVEC LE VRAI ID BASEROW ===
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

        saveLocalAppointments(local);
        window.__appointments = local;

        // Réinitialiser les filtres du planning pour afficher immédiatement le rendez-vous créé
        currentFilterUser = "all";
        currentFilterCategory = "all";
        currentSearchQuery = "";
        document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
        document.querySelector(".filter-chip[data-category='all']")?.classList.add("active");
        const searchInput = document.getElementById("search-input");
        if (searchInput) searchInput.value = "";
        const clearSearch = document.getElementById("clear-search-btn");
        if (clearSearch) clearSearch.classList.add("hidden");

        const targetAppt = { ...data, id: finalId };
        if (id) window.__selectedAppointment = targetAppt;

        renderAppointments(local);
        updateStats(local);
        checkCloudStatus(baserowSuccess);

        playSound('carillon');
        launchConfetti();

        // Message de confirmation clair lors de l'ajout
        if (baserowSuccess) {
          showToast(id ? "Rendez-vous modifié avec succès !" : `Rendez-vous enregistré dans Baserow ! (#${finalId})`, "✅");
        } else {
          showToast(id ? "Rendez-vous modifié avec succès !" : "Rendez-vous ajouté avec succès !", "✅");
        }

        markIdAsLocallyCreated(finalId);
        markIdAsKnown(finalId);

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

      } catch (fatalErr) {
        console.error("Erreur générale enregistrement RDV:", fatalErr);
        showToast("Erreur inattendue lors de l'enregistrement", "❌");
      } finally {
        setTimeout(() => { isFormSubmittingLock = false; }, 400);
      }
    }

    function cancelEdit() {
      resetForm();
      app.switchTab("planning");
    }

    // =============================================================
    // GUIDAGE GPS & CARTE LEAFLET
    // =============================================================
    let mapInstance = null;
    let currentMarker = null;

    function initMap() {
      const mapContainer = document.getElementById("interactive-map");
      if (!mapContainer || mapInstance) return mapInstance;

      mapInstance = L.map("interactive-map", {
        zoomControl: true,
        attributionControl: false
      }).setView([51.0343, 2.3768], 13); // Centre de Dunkerque

      // Carte avec tuiles lisibles et modernes
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(mapInstance);

      return mapInstance;
    }

    function updateGuidanceSelect(list) {
      const sel = document.getElementById("guidance-rdv-select");
      if (!sel) return;
      const currentVal = sel.value;

      sel.innerHTML = `<option value="">Sélectionner un rendez-vous à guider...</option>`;
      list.forEach(a => {
        const opt = document.createElement("option");
        opt.value = a.id;
        opt.textContent = `${a.heure || "--:--"} - ${a.titre} (${a.user})`;
        sel.appendChild(opt);
      });

      if (currentVal) sel.value = currentVal;
    }

    function selectAndGuide(appt) {
      if (!appt) return;
      app.switchTab("guidance");

      const sel = document.getElementById("guidance-rdv-select");
      if (sel) sel.value = appt.id;

      showGuidance(appt);
    }

    function showGuidance(appt) {
      if (!appt) return;
      window.__guidedAppointment = appt;

      document.getElementById("guide-badge-user").textContent = `${appt.user === "Dorianne" ? "👩" : (appt.user === "Christophe" ? "👨" : "👫")} ${appt.user}`;
      document.getElementById("guide-badge-style").textContent = appt.categorie || "Trajet";
      document.getElementById("guide-dest-title").textContent = appt.titre;
      document.getElementById("guide-dest-address").textContent = appt.adresse || "Dunkerque";
      document.getElementById("guide-time").textContent = appt.heure || "--:--";

      const map = initMap();
      setTimeout(() => map.invalidateSize(), 200);

      const lat = parseFloat(appt.latitude) || 51.0343;
      const lon = parseFloat(appt.longitude) || 2.3768;

      if (currentMarker) map.removeLayer(currentMarker);

      // Marker personnalisé avec bouclier Dunkirk IT
      const goldIcon = L.divIcon({
        className: 'custom-gold-marker',
        html: `
      <div style="background:#07162C; border:2px solid #DDA727; border-radius:50%; width:34px; height:34px; display:flex; align-items:center; justify-content:center; box-shadow:0 0 15px rgba(221,167,39,0.7); font-size:16px;">
        ${appt.user === "Dorianne" ? "👩" : (appt.user === "Christophe" ? "👨" : "👫")}
      </div>
    `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      currentMarker = L.marker([lat, lon], { icon: goldIcon }).addTo(map);
      map.setView([lat, lon], 14);

      // Estimation de distance simulée par rapport au centre de Dunkerque
      const dist = (Math.random() * 4 + 1.5).toFixed(1);
      const dur = Math.round(dist * 2.8 + 3);
      document.getElementById("guide-distance").textContent = `${dist} km`;
      document.getElementById("guide-duration").textContent = `${dur} min`;
    }

    // Lanceurs GPS externes (Waze, Google Maps, Apple Maps)
    function launchExternalGps(appType) {
      const appt = window.__guidedAppointment || window.__selectedAppointment;
      if (!appt) {
        showToast("Veuillez sélectionner un rendez-vous d'abord !", "📍");
        return;
      }

      const lat = appt.latitude || 51.0343;
      const lon = appt.longitude || 2.3768;
      const encodedAddr = encodeURIComponent(appt.adresse || "Dunkerque");

      playSound('vroum');

      if (appType === 'waze') {
        window.open(`https://waze.com/ul?ll=${lat},${lon}&navigate=yes`, '_blank');
      } else if (appType === 'gmaps') {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`, '_blank');
      } else if (appType === 'apple') {
        window.open(`https://maps.apple.com/?daddr=${lat},${lon}&q=${encodedAddr}`, '_blank');
      }
    }

    // =============================================================
    // RECHERCHE INTELLIGENTE : ADRESSES POSTALES & NOMS D'ENTREPRISES
    // Connecté à l'API Recherche d'entreprises (Gouv) & Base Adresse Nationale (BAN)
    // =============================================================
    let addressDebounceTimer = null;

    function escapeHtml(str) {
      if (!str) return "";
      return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    function setupAddressAutocomplete() {
      const input = document.getElementById("rdv-address");
      const dropdown = document.getElementById("address-suggestions");
      if (!input || !dropdown) return;

      input.addEventListener("input", () => {
        clearTimeout(addressDebounceTimer);
        const query = input.value.trim();
        if (query.length < 2) {
          dropdown.classList.add("hidden");
          dropdown.innerHTML = "";
          return;
        }

        addressDebounceTimer = setTimeout(async () => {
          try {
            dropdown.innerHTML = `
          <div style="padding:0.6rem 0.8rem; font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:0.5rem;">
            <span>⏳</span> <span>Recherche adresses & entreprises...</span>
          </div>`;
            dropdown.classList.remove("hidden");

            const encoded = encodeURIComponent(query);

            // Interrogation simultanée de l'API Entreprises et de l'API Adresse officielle
            const [respEnt, respBan] = await Promise.allSettled([
              fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${encoded}&per_page=4`),
              fetch(`https://api-adresse.data.gouv.fr/search/?q=${encoded}&limit=4`)
            ]);

            const suggestions = [];
            const seenLabels = new Set();

            // 1. Résultats Entreprises & Commerces (SIRENE Gouv France)
            if (respEnt.status === "fulfilled" && respEnt.value.ok) {
              try {
                const dataEnt = await respEnt.value.json();
                if (dataEnt && Array.isArray(dataEnt.results)) {
                  dataEnt.results.forEach(item => {
                    const nom = (item.nom_complet || item.nom_raison_sociale || "").trim();
                    const siege = item.siege || {};
                    const etabs = item.matching_etablissements || [];
                    const etab = etabs[0] || siege;
                    const adr = etab.geo_adresse || etab.adresse || siege.geo_adresse || siege.adresse || "";
                    const lat = etab.latitude || siege.latitude || null;
                    const lon = etab.longitude || siege.longitude || null;

                    const key = `${nom.toLowerCase()}_${adr.toLowerCase()}`;
                    if (nom && adr && !seenLabels.has(key)) {
                      seenLabels.add(key);
                      suggestions.push({
                        type: "enterprise",
                        badgeText: "🏢 Entreprise",
                        title: nom,
                        subtitle: adr,
                        fullAddress: `${nom} - ${adr}`,
                        lat: lat ? parseFloat(lat) : null,
                        lon: lon ? parseFloat(lon) : null
                      });
                    }
                  });
                }
              } catch (e) { }
            }

            // 2. Résultats Adresses Postales (Base Adresse Nationale BAN)
            if (respBan.status === "fulfilled" && respBan.value.ok) {
              try {
                const dataBan = await respBan.value.json();
                if (dataBan && Array.isArray(dataBan.features)) {
                  dataBan.features.forEach(f => {
                    const props = f.properties || {};
                    const coords = f.geometry?.coordinates || [];
                    const label = (props.label || "").trim();
                    const sub = props.context || props.city || "";

                    const key = label.toLowerCase();
                    if (label && coords.length >= 2 && !seenLabels.has(key)) {
                      seenLabels.add(key);
                      suggestions.push({
                        type: "address",
                        badgeText: "📍 Adresse",
                        title: label,
                        subtitle: sub,
                        fullAddress: label,
                        lat: parseFloat(coords[1]),
                        lon: parseFloat(coords[0])
                      });
                    }
                  });
                }
              } catch (e) { }
            }

            dropdown.innerHTML = "";
            if (suggestions.length > 0) {
              suggestions.slice(0, 8).forEach(s => {
                const item = document.createElement("div");
                item.className = "address-item";
                item.innerHTML = `
              <div class="addr-header">
                <span class="addr-title">${escapeHtml(s.title)}</span>
                <span class="addr-badge ${s.type}">${s.badgeText}</span>
              </div>
              <div class="addr-sub">${escapeHtml(s.subtitle || "")}</div>
            `;
                item.addEventListener("click", () => {
                  input.value = s.fullAddress;
                  if (s.lat && s.lon) {
                    document.getElementById("rdv-lat").value = s.lat;
                    document.getElementById("rdv-lon").value = s.lon;
                  } else {
                    // Géocodage de secours automatique pour les entreprises si nécessaire
                    geocodeAddressFallback(s.subtitle || s.fullAddress);
                  }

                  // Si le champ titre est encore vide et qu'on a sélectionné une entreprise, pré-remplir le titre
                  const titleInput = document.getElementById("rdv-title");
                  if (titleInput && !titleInput.value.trim() && s.type === "enterprise") {
                    titleInput.value = s.title;
                  }

                  dropdown.classList.add("hidden");
                  playSound('click');
                  showToast(
                    s.type === "enterprise" ? "Entreprise sélectionnée !" : "Adresse sélectionnée !",
                    s.type === "enterprise" ? "🏢" : "📍"
                  );
                });
                dropdown.appendChild(item);
              });
              dropdown.classList.remove("hidden");
            } else {
              dropdown.innerHTML = `
            <div style="padding:0.6rem 0.8rem; font-size:0.75rem; color:var(--text-muted); text-align:center;">
              Aucun résultat pour "${escapeHtml(query)}"
            </div>`;
              dropdown.classList.remove("hidden");
            }
          } catch (err) {
            console.warn("Erreur recherche adresse / entreprise:", err);
            dropdown.classList.add("hidden");
          }
        }, 280);
      });

      // Fermer quand on clique dehors
      document.addEventListener("click", (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
          dropdown.classList.add("hidden");
        }
      });

      // Bouton ma position actuelle
      const posBtn = document.getElementById("btn-use-current-pos");
      if (posBtn) {
        posBtn.addEventListener("click", () => {
          if (!navigator.geolocation) {
            alert("La géolocalisation n'est pas supportée par votre navigateur.");
            return;
          }
          posBtn.textContent = "📍 Recherche...";
          navigator.geolocation.getCurrentPosition((pos) => {
            document.getElementById("rdv-lat").value = pos.coords.latitude;
            document.getElementById("rdv-lon").value = pos.coords.longitude;
            input.value = "Position actuelle (Dunkerque & Flandres)";
            posBtn.textContent = "📍 Ma position actuelle";
            playSound('click');
            showToast("Position GPS enregistrée !", "📍");
          }, () => {
            posBtn.textContent = "📍 Ma position actuelle";
            alert("Impossible d'obtenir la position.");
          });
        });
      }
    }

    // Fonction de géocodage de secours pour les entreprises sans coordonnées directes
    async function geocodeAddressFallback(addressStr) {
      if (!addressStr) return;
      try {
        const r = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(addressStr)}&limit=1`);
        if (r.ok) {
          const data = await r.json();
          const first = data.features?.[0];
          if (first && first.geometry?.coordinates) {
            document.getElementById("rdv-lat").value = first.geometry.coordinates[1];
            document.getElementById("rdv-lon").value = first.geometry.coordinates[0];
          }
        }
      } catch (e) { }
    }

    // =============================================================
    // STATUT CLOUD & CHARGEMENT PRINCIPAL
    // =============================================================
    function checkCloudStatus(isOnline) {
      const badge = document.getElementById("cloud-status-badge");
      const text = document.getElementById("cloud-status-text");
      const settingBadge = document.getElementById("cloud-badge-setting");

      if (isOnline) {
        if (badge) {
          badge.classList.remove("offline");
          badge.classList.add("online");
        }
        if (text) text.textContent = "En-ligne";
        if (settingBadge) {
          settingBadge.className = "badge-status-cloud online";
          settingBadge.innerHTML = `<span class="dot"></span><span>Connecté & Sécurisé</span>`;
        }
      } else {
        if (badge) {
          badge.classList.remove("online");
          badge.classList.add("offline");
        }
        if (text) text.textContent = "Hors-ligne";
        if (settingBadge) {
          settingBadge.className = "badge-status-cloud offline";
          settingBadge.innerHTML = `<span class="dot"></span><span>Mode Hors-ligne (LocalStorage)</span>`;
        }
      }
    }

    let isSyncingPendingLock = false;
    async function syncPendingLocalAppointments() {
      if (isSyncingPendingLock) return;
      isSyncingPendingLock = true;
      try {
        const local = loadLocalAppointments();
        const pending = local.filter(a => isNaN(Number(a.id)) || Number(a.id) > 100000);
        for (const appt of pending) {
          const baserowData = formatBaserowPayload(appt);
          try {
            const created = await apiFetch(`/database/rows/table/${TABLE_ID}/?user_field_names=true`, {
              method: "POST",
              body: JSON.stringify(baserowData),
            });
            if (created && created.id) {
              let current = loadLocalAppointments();
              const idx = current.findIndex(a => String(a.id) === String(appt.id));
              if (idx >= 0) {
                current[idx].id = created.id;
              }
              markIdAsLocallyCreated(created.id);
              markIdAsKnown(created.id);
              saveLocalAppointments(current);
              window.__appointments = current;
              renderAppointments(current);
              updateStats(current);
              console.log("[syncPending] Rendez-vous synchronisé avec succès dans Baserow, nouvel ID:", created.id);
            }
          } catch (syncErr) {
            console.warn("[syncPending] Erreur synchronisation fiche", appt.id, syncErr);
          }
        }
      } catch (e) {
        // Différé si hors ligne
      } finally {
        isSyncingPendingLock = false;
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

    function renderDynamicStyles() {
      const styles = loadCustomStyles();

      // 1. Filtres carrousel dans la vue Planning
      const filterList = document.getElementById("category-filters-list");
      if (filterList) {
        filterList.innerHTML = `
      <button class="filter-chip active" data-category="all">
        <span>✨</span><span>Tous</span>
      </button>
    `;
        styles.forEach(s => {
          const chip = document.createElement("button");
          chip.className = "filter-chip";
          chip.dataset.category = s.name;
          chip.innerHTML = `<span>${s.emoji || "🏷️"}</span><span>${s.name}</span>`;
          chip.addEventListener("click", () => {
            playSound('click');
            document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentFilterCategory = s.name;
            renderAppointments(window.__appointments || loadLocalAppointments());
          });
          filterList.appendChild(chip);
        });

        // Clic sur "Tous"
        filterList.querySelector("[data-category='all']").addEventListener("click", (e) => {
          playSound('click');
          document.querySelectorAll(".filter-chip").forEach(c => c.classList.remove("active"));
          e.currentTarget.classList.add("active");
          currentFilterCategory = "all";
          renderAppointments(window.__appointments || loadLocalAppointments());
        });
      }

      // 2. Sélecteur de styles dans le formulaire Nouveau RDV
      const formRadios = document.getElementById("style-selector-radios");
      if (formRadios) {
        formRadios.innerHTML = "";
        styles.forEach((s, idx) => {
          const label = document.createElement("label");
          label.className = "style-radio-label";
          label.innerHTML = `
        <input type="radio" name="rdv-style" value="${s.name}" ${idx === 0 ? "checked" : ""}>
        <span class="style-radio-btn">
          <span>${s.emoji || "🚗"}</span>
          <span>${s.name}</span>
        </span>
      `;
          formRadios.appendChild(label);
        });
      }

      // 3. Liste dans l'onglet Paramètres
      const customList = document.getElementById("custom-styles-list");
      if (customList) {
        customList.innerHTML = "";
        styles.forEach(s => {
          const badge = document.createElement("span");
          badge.className = "style-badge";
          badge.innerHTML = `<span>${s.emoji || "🚗"}</span><span>${s.name}</span>`;
          customList.appendChild(badge);
        });
      }
    }

    // =============================================================
    // INITIALISATION DE L'APPLICATION
    // =============================================================
    document.addEventListener("DOMContentLoaded", () => {
      // 1. Navigation par onglets
      document.querySelectorAll(".nav-item").forEach(btn => {
        btn.addEventListener("click", () => {
          const tab = btn.dataset.tab;
          if (tab) {
            playSound('click');
            if (tab === "new") {
              resetForm();
            }
            app.switchTab(tab);
          }
        });
      });

      // 2. Filtres Utilisateur (Dorianne, Christophe, Tous)
      document.querySelectorAll(".user-pill-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          playSound('click');
          document.querySelectorAll(".user-pill-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          currentFilterUser = btn.dataset.userFilter;
          renderAppointments(window.__appointments || loadLocalAppointments());
        });
      });

      // 3. Barre de recherche
      const searchInput = document.getElementById("search-input");
      const clearSearch = document.getElementById("clear-search-btn");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          currentSearchQuery = e.target.value;
          if (clearSearch) {
            if (currentSearchQuery) clearSearch.classList.remove("hidden");
            else clearSearch.classList.add("hidden");
          }
          renderAppointments(window.__appointments || loadLocalAppointments());
        });
      }
      if (clearSearch) {
        clearSearch.addEventListener("click", () => {
          searchInput.value = "";
          currentSearchQuery = "";
          clearSearch.classList.add("hidden");
          renderAppointments(window.__appointments || loadLocalAppointments());
        });
      }

      // 4. Formulaire RDV (soumission unique et sécurisée)
      const form = document.getElementById("appointment-form");
      if (form) form.addEventListener("submit", submitForm);

      const saveRdvBtn = document.getElementById("btn-save-rdv");
      if (saveRdvBtn) {
        saveRdvBtn.addEventListener("click", (e) => {
          submitForm(e);
        });
      }

      const cancelBtn = document.getElementById("btn-cancel-edit");
      if (cancelBtn) cancelBtn.addEventListener("click", resetForm);

      // 5. Modale actions
      const closeModalBtn = document.getElementById("btn-close-modal");
      if (closeModalBtn) closeModalBtn.addEventListener("click", closeDetailModal);

      const editModalBtn = document.getElementById("modal-btn-edit");
      if (editModalBtn) editModalBtn.addEventListener("click", editCurrentAppointment);

      const deleteModalBtn = document.getElementById("modal-btn-delete");
      if (deleteModalBtn) deleteModalBtn.addEventListener("click", deleteCurrentAppointment);

      const guideModalBtn = document.getElementById("modal-btn-guide");
      if (guideModalBtn) {
        guideModalBtn.addEventListener("click", () => {
          const appt = window.__selectedAppointment;
          closeDetailModal();
          selectAndGuide(appt);
        });
      }

      // 6. Lanceurs GPS Externes
      document.getElementById("btn-open-waze")?.addEventListener("click", () => launchExternalGps('waze'));
      document.getElementById("btn-open-gmaps")?.addEventListener("click", () => launchExternalGps('gmaps'));
      document.getElementById("btn-open-applemaps")?.addEventListener("click", () => launchExternalGps('apple'));

      // 7. Sélecteur de RDV dans l'onglet Guidage
      document.getElementById("guidance-rdv-select")?.addEventListener("change", (e) => {
        const id = e.target.value;
        const appt = (window.__appointments || loadLocalAppointments()).find(a => a.id == id);
        if (appt) showGuidance(appt);
      });

      // 8. Bouton recentrer carte
      document.getElementById("btn-recenter-user")?.addEventListener("click", () => {
        playSound('click');
        if (mapInstance && currentMarker) {
          mapInstance.setView(currentMarker.getLatLng(), 15);
        }
      });

      // 9. Bannière d'alerte imminente
      document.getElementById("banner-action-guide")?.addEventListener("click", () => {
        const id = document.getElementById("urgent-alert-banner")?.dataset.rdvId;
        const appt = (window.__appointments || loadLocalAppointments()).find(a => a.id == id);
        if (appt) selectAndGuide(appt);
      });
      document.getElementById("banner-dismiss")?.addEventListener("click", () => {
        document.getElementById("urgent-alert-banner")?.classList.add("hidden");
      });

      // Gestionnaire de la Modal Alerte Rendez-vous
      document.getElementById("btn-close-alert-modal")?.addEventListener("click", closeAppointmentAlert);
      document.getElementById("alert-modal-btn-ok")?.addEventListener("click", closeAppointmentAlert);
      document.getElementById("alert-modal-btn-planning")?.addEventListener("click", () => {
        closeAppointmentAlert();
        app.switchTab("planning");
      });
      document.getElementById("alert-modal-btn-guide")?.addEventListener("click", () => {
        const modal = document.getElementById("new-rdv-alert-modal");
        const id = modal?.dataset.rdvId;
        closeAppointmentAlert();
        if (id) {
          app.selectAndGuideById(id);
        } else {
          app.switchTab("guidance");
        }
      });

      // Activation des notifications système Web / Mobile
      const btnReqNotif = document.getElementById("btn-request-notifications");
      if (btnReqNotif) {
        if ("Notification" in window && Notification.permission === "granted") {
          btnReqNotif.textContent = "Activé ✅";
          btnReqNotif.classList.add("secondary");
        }
        btnReqNotif.addEventListener("click", async () => {
          if (!("Notification" in window)) {
            showToast("Notifications non supportées sur ce navigateur", "⚠️");
            return;
          }
          try {
            const perm = await Notification.requestPermission();
            if (perm === "granted") {
              btnReqNotif.textContent = "Activé ✅";
              btnReqNotif.classList.add("secondary");
              showToast("Notifications Web & Mobiles activées !", "🔔");
              triggerSystemNotification("🔔 Dunkirk RDV Activé", "Vous recevrez une alerte pour chaque nouveau rendez-vous !");
            } else {
              showToast("Notifications refusées", "❌");
            }
          } catch (e) {
            console.warn("Erreur demande permission notifications:", e);
          }
        });
      }

      // 10. Boîte à Sons interactive (Web Audio Synth Dunkirk IT)
      document.querySelectorAll(".btn-fun-sound").forEach(btn => {
        btn.addEventListener("click", () => {
          const sound = btn.dataset.sound;
          playSound(sound);
          if (sound === 'fanfare') launchConfetti();
        });
      });

      // Bouton tester son dans paramètres alertes
      document.getElementById("btn-test-sound")?.addEventListener("click", () => {
        playSound('carillon');
        showToast("Carillon Dunkirk IT testé avec succès !", "🔔");
      });

      // Bascule audio dans header
      const toggleAudioBtn = document.getElementById("toggle-audio-btn");
      if (toggleAudioBtn) {
        toggleAudioBtn.addEventListener("click", () => {
          soundEnabled = !soundEnabled;
          toggleAudioBtn.classList.toggle("active", soundEnabled);
          showToast(soundEnabled ? "Effets sonores activés" : "Effets sonores coupés", soundEnabled ? "🔊" : "🔇");
        });
      }

      // Bouton confetti rapide dans le header
      document.getElementById("quick-celebrate-btn")?.addEventListener("click", () => {
        playSound('fanfare');
        launchConfetti();
        showToast("Ambiance Dunkerquoise au max ! 🥳", "⚓");
      });

      // 11. Ajout de nouveau style personnalisé
      document.getElementById("btn-add-style")?.addEventListener("click", () => {
        const nameInput = document.getElementById("new-style-name");
        const emojiInput = document.getElementById("new-style-emoji");
        const colorInput = document.getElementById("new-style-color");

        const name = nameInput.value.trim();
        if (!name) return;

        const styles = loadCustomStyles();
        styles.push({
          name,
          emoji: emojiInput.value.trim() || "🚗",
          color: colorInput.value || "#DDA727"
        });
        saveCustomStyles(styles);
        renderDynamicStyles();
        nameInput.value = "";
        playSound('click');
        showToast(`Nouveau style "${name}" ajouté !`, "🎨");
      });

      // 12. Sauvegardes & Restauration JSON
      document.getElementById("btn-export-json")?.addEventListener("click", () => {
        const data = JSON.stringify(loadLocalAppointments(), null, 2);
        const blob = new Blob([data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dunkirk-rdv-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        playSound('click');
        showToast("Sauvegarde JSON téléchargée !", "💾");
      });

      document.getElementById("import-file-input")?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const imported = JSON.parse(event.target.result);
            if (Array.isArray(imported)) {
              saveLocalAppointments(imported);
              renderAppointments(imported);
              updateStats(imported);
              playSound('fanfare');
              launchConfetti();
              showToast("Données restaurées avec succès !", "✅");
            }
          } catch (err) {
            alert("Fichier JSON invalide.");
          }
        };
        reader.readAsText(file);
      });

      document.getElementById("btn-reset-demo")?.addEventListener("click", () => {
        if (confirm("Recharger les données de démonstration pour Dorianne & Christophe ?")) {
          saveLocalAppointments(DEFAULT_APPOINTMENTS);
          renderAppointments(DEFAULT_APPOINTMENTS);
          updateStats(DEFAULT_APPOINTMENTS);
          playSound('fanfare');
          showToast("Données démo rechargées !", "✨");
        }
      });

      // Bouton recharger dans planning (synchronisation immédiate)
      document.getElementById("refresh-data-btn")?.addEventListener("click", async () => {
        playSound('click');
        showToast("Synchronisation Baserow en cours...", "⏳");
        await syncPendingLocalAppointments();
        await loadAndRender();
        showToast("Synchronisation actualisée !", "🔄");
      });

      // Bouton tester la connexion Baserow
      document.getElementById("btn-test-baserow")?.addEventListener("click", async () => {
        const feedback = document.getElementById("baserow-feedback");
        if (!feedback) return;
        feedback.className = "feedback-msg";
        feedback.textContent = "Test de connexion en cours...";
        feedback.classList.remove("hidden");

        try {
          const resp = await apiFetch(`/database/rows/table/${TABLE_ID}/?page_size=1&user_field_names=true`);
          feedback.className = "feedback-msg success";
          feedback.textContent = `✅ Connexion réussie à la table ${TABLE_ID} ! (${resp.count || 0} enregistrements dans Baserow)`;
          checkCloudStatus(true);
          playSound('carillon');
          showToast("Connexion Baserow validée avec succès !", "⚡");
        } catch (err) {
          feedback.className = "feedback-msg error";
          feedback.textContent = `❌ Erreur : ${err.message}`;
          checkCloudStatus(false);
        }
      });

      // Bouton synchroniser dans Baserow
      document.getElementById("btn-sync-baserow")?.addEventListener("click", async () => {
        playSound('click');
        showToast("Envoi des fiches en attente vers Baserow...", "⏳");
        await syncPendingLocalAppointments();
        await loadAndRender();
        showToast("Synchronisation Baserow terminée !", "🔄");
      });

      // 13. Authentification & Événements Back-Office
      document.getElementById("btn-user-profile")?.addEventListener("click", () => {
        playSound('click');
        if (confirm("Voulez-vous verrouiller la session actuelle et changer d'utilisateur ?")) {
          lockCurrentSession();
        }
      });

      document.getElementById("admin-lock-session-btn")?.addEventListener("click", () => {
        lockCurrentSession();
      });

      // Sélection rapide par boutons utilisateur
      document.getElementById("auth-select-christophe")?.addEventListener("click", () => {
        playSound('click');
        selectAuthUser("christophe.gontier@outlook.fr");
      });

      document.getElementById("auth-select-dorianne")?.addEventListener("click", () => {
        playSound('click');
        selectAuthUser("dorianne.dbe@free.fr");
      });

      // Détection automatique lors de la frappe dans le champ Courriel
      document.getElementById("auth-email-input")?.addEventListener("input", (e) => {
        const val = e.target.value.trim().toLowerCase();
        const btnChristophe = document.getElementById("auth-select-christophe");
        const btnDorianne = document.getElementById("auth-select-dorianne");
        if (val.includes("dorianne")) {
          btnChristophe?.classList.remove("active");
          btnDorianne?.classList.add("active");
          selectedAuthUser = "dorianne.dbe@free.fr";
          const lbl = document.getElementById("auth-selected-name");
          if (lbl) lbl.textContent = "Dorianne (dorianne.dbe@free.fr)";
        } else if (val.includes("christophe")) {
          btnDorianne?.classList.remove("active");
          btnChristophe?.classList.add("active");
          selectedAuthUser = "christophe.gontier@outlook.fr";
          const lbl = document.getElementById("auth-selected-name");
          if (lbl) lbl.textContent = "Christophe (christophe.gontier@outlook.fr)";
        }
      });

      document.getElementById("auth-form")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const emailVal = document.getElementById("auth-email-input")?.value.trim() || "";
        const pwd = document.getElementById("auth-password-input")?.value.trim() || "";
        const rem = document.getElementById("auth-remember-me")?.checked ?? true;
        await attemptLogin(pwd, rem, emailVal);
      });

      // Gestionnaire de passerelle SMS dans l'Admin
      const savedSmsWebhook = localStorage.getItem("dunkirk_sms_gateway_v1") || "";
      const smsWebhookInput = document.getElementById("admin-sms-webhook-input");
      if (smsWebhookInput && savedSmsWebhook) {
        smsWebhookInput.value = savedSmsWebhook;
      }
      // Free Mobile SMS gateway listeners
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

      document.getElementById("btn-save-sms-webhook")?.addEventListener("click" , () => {
        const val = document.getElementById("admin-sms-webhook-input")?.value.trim() || "";
        localStorage.setItem("dunkirk_sms_gateway_v1", val);
        playSound('click');
        showToast("Passerelle SMS enregistrée ! 📱", "💾");
        addAuditLog(`Passerelle SMS configurée: ${val || 'désactivée'}`);
      });

      // Boutons de test SMS direct Admin
      document.getElementById("btn-test-sms-christophe")?.addEventListener("click", () => {
        addAuditLog("Test SMS déclenché pour Christophe (0783141740)");
        showToast("SMS de test préparé pour Christophe (07 83 14 17 40) !", "📱");
      });
      document.getElementById("btn-test-sms-dorianne")?.addEventListener("click", () => {
        addAuditLog("Test SMS déclenché pour Dorianne (0651631615)");
        showToast("SMS de test préparé pour Dorianne (06 51 63 16 15) !", "📱");
      });

      // Bouton de synchronisation manuelle des utilisateurs Baserow
      document.getElementById("btn-sync-baserow-users")?.addEventListener("click", async () => {
        const btn = document.getElementById("btn-sync-baserow-users");
        if (btn) btn.style.transform = "rotate(360deg)";
        playSound('click');
        showToast("Synchronisation des identifiants Baserow...", "⏳");
        const users = await fetchBaserowUsers();
        if (users) {
          showToast("Identifiants synchronisés avec Baserow ! ✨", "✅");
          renderAdminDashboard();
        } else {
          showToast("Synchronisation locale (Baserow hors-ligne)", "⚠️");
        }
        setTimeout(() => { if (btn) btn.style.transform = ""; }, 600);
      });

      // Bascule exigence mot de passe dans le Back-Office
      document.getElementById("admin-toggle-require-auth")?.addEventListener("change", (e) => {
        const cfg = loadAuthConfig();
        cfg.requireAuth = e.target.checked;
        saveAuthConfig(cfg);
        playSound('click');
        addAuditLog(`Exigence de mot de passe ${cfg.requireAuth ? "activée" : "désactivée"}`);
        showToast(`Sécurité : mot de passe ${cfg.requireAuth ? "activé" : "désactivé"} au démarrage`, "🔐");
      });

      // Sauvegarde mot de passe Christophe dans Baserow (Table Users)
      document.getElementById("btn-save-pwd-christophe")?.addEventListener("click", async () => {
        const btn = document.getElementById("btn-save-pwd-christophe");
        const newPwd = document.getElementById("admin-pwd-christophe")?.value.trim();
        if (!newPwd) {
          alert("Veuillez saisir un mot de passe.");
          return;
        }
        const origText = btn.innerHTML;
        btn.innerHTML = "⏳ Synchronisation Baserow...";
        btn.disabled = true;

        const cfg = loadAuthConfig();
        const userObj = cfg.users["Christophe"] || {};
        const rowId = userObj.id || 1;

        const ok = await updateBaserowPassword(rowId, newPwd);
        btn.innerHTML = origText;
        btn.disabled = false;

        cfg.users["Christophe"].password = newPwd;
        saveAuthConfig(cfg);
        playSound('carillon');
        addAuditLog("Mot de passe administrateur Christophe mis à jour dans Baserow", "Christophe");
        document.getElementById("admin-pwd-christophe").value = "";
        const fb = document.getElementById("admin-pwd-feedback");
        if (fb) {
          fb.className = "feedback-msg success";
          fb.textContent = ok
            ? "✅ Mot de passe Christophe mis à jour directement dans Baserow (Table Users Agenda Dorianne et Christophe) !"
            : "⚠️ Mot de passe enregistré localement (connexion Baserow en attente).";
          fb.classList.remove("hidden");
          setTimeout(() => fb.classList.add("hidden"), 4000);
        }
        showToast("Mot de passe Christophe enregistré dans Baserow !", "🔒");
        renderAdminDashboard();
      });

      // Sauvegarde mot de passe Dorianne dans Baserow (Table Users)
      document.getElementById("btn-save-pwd-dorianne")?.addEventListener("click", async () => {
        const btn = document.getElementById("btn-save-pwd-dorianne");
        const newPwd = document.getElementById("admin-pwd-dorianne")?.value.trim();
        if (!newPwd) {
          alert("Veuillez saisir un mot de passe pour Dorianne.");
          return;
        }
        const origText = btn.innerHTML;
        btn.innerHTML = "⏳ Synchro...";
        btn.disabled = true;

        const cfg = loadAuthConfig();
        const userObj = cfg.users["Dorianne"] || {};
        const rowId = userObj.id || 2;

        const ok = await updateBaserowPassword(rowId, newPwd);
        btn.innerHTML = origText;
        btn.disabled = false;

        cfg.users["Dorianne"].password = newPwd;
        saveAuthConfig(cfg);
        playSound('carillon');
        addAuditLog("Mot de passe de Dorianne modifié dans Baserow", "Christophe");
        document.getElementById("admin-pwd-dorianne").value = "";
        const fb = document.getElementById("admin-pwd-feedback");
        if (fb) {
          fb.className = "feedback-msg success";
          fb.textContent = ok
            ? "✅ Mot de passe de Dorianne mis à jour directement dans Baserow !"
            : "⚠️ Mot de passe Dorianne sauvegardé localement.";
          fb.classList.remove("hidden");
          setTimeout(() => fb.classList.add("hidden"), 4000);
        }
        showToast("Mot de passe Dorianne synchronisé dans Baserow !", "🔒");
        renderAdminDashboard();
      });

      // Réinitialisation mot de passe Dorianne à 1234 dans Baserow
      document.getElementById("btn-reset-pwd-dorianne")?.addEventListener("click", async () => {
        if (confirm("Réinitialiser le mot de passe de Dorianne à '1234' dans Baserow ?")) {
          const cfg = loadAuthConfig();
          const userObj = cfg.users["Dorianne"] || {};
          const rowId = userObj.id || 2;

          await updateBaserowPassword(rowId, "1234");
          cfg.users["Dorianne"].password = "1234";
          saveAuthConfig(cfg);
          playSound('click');
          addAuditLog("Mot de passe de Dorianne réinitialisé à 1234 dans Baserow", "Christophe");
          const fb = document.getElementById("admin-pwd-feedback");
          if (fb) {
            fb.className = "feedback-msg success";
            fb.textContent = "✅ Mot de passe de Dorianne réinitialisé à '1234' dans Baserow.";
            fb.classList.remove("hidden");
            setTimeout(() => fb.classList.add("hidden"), 4000);
          }
          showToast("Mot de passe Dorianne remis à 1234 dans Baserow", "🔄");
          renderAdminDashboard();
        }
      });

      // Effacer l'historique d'audit
      document.getElementById("btn-clear-audit")?.addEventListener("click", () => {
        if (confirm("Effacer l'historique d'activité du journal ?")) {
          const cfg = loadAuthConfig();
          cfg.auditLog = [{ timestamp: new Date().toISOString(), user: "Christophe", action: "Journal d'audit effacé" }];
          saveAuthConfig(cfg);
          renderAdminDashboard();
          showToast("Journal effacé", "🧹");
        }
      });

      // Purge des RDV passés (> 30 jours)
      document.getElementById("btn-admin-purge-old")?.addEventListener("click", () => {
        const list = loadLocalAppointments();
        const thresholdDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
        const initialCount = list.length;
        const kept = list.filter(a => a.date >= thresholdDate);
        const removedCount = initialCount - kept.length;

        if (removedCount === 0) {
          alert("Aucun rendez-vous antérieur à 30 jours n'a été trouvé.");
          return;
        }

        if (confirm(`Purger ${removedCount} ancien(s) rendez-vous archivé(s) ?`)) {
          saveLocalAppointments(kept);
          window.__appointments = kept;
          renderAppointments(kept);
          updateStats(kept);
          renderAdminDashboard();
          addAuditLog(`Purge de ${removedCount} rendez-vous anciens`, "Christophe");
          playSound('click');
          showToast(`${removedCount} rendez-vous purgés avec succès !`, "🧹");
        }
      });

      // Export complet admin
      document.getElementById("btn-admin-full-export")?.addEventListener("click", () => {
        const exportData = {
          exportedAt: new Date().toISOString(),
          exportedBy: "Christophe (Admin)",
          appointments: loadLocalAppointments(),
          styles: loadCustomStyles()
        };
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `dunkirk-rdv-admin-backup-${new Date().toISOString().split("T")[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addAuditLog("Sauvegarde admin complète exportée", "Christophe");
        playSound('fanfare');
        showToast("Sauvegarde admin complète téléchargée !", "💾");
      });

      // Forcer synchronisation Cloud Baserow
      document.getElementById("btn-admin-force-sync")?.addEventListener("click", async () => {
        playSound('click');
        showToast("Synchronisation Cloud en cours...", "🔄");
        await loadAndRender();
        renderAdminDashboard();
        addAuditLog("Synchronisation Cloud Baserow forcée", "Christophe");
        showToast("Synchronisation Cloud réussie !", "⚡");
      });

      // Initialisations
      setupUserRadioChips();
      setupAddressAutocomplete();
      renderDynamicStyles();
      loadAndRender();

      // Initialisation Authentification & Profil
      initAuth();

      // Date du formulaire par défaut
      resetForm();

      // Vérification périodique des départs imminents
      setInterval(() => {
        checkImminentDepartures(window.__appointments || loadLocalAppointments());
      }, 60000);

      // Polling automatique en arrière-plan toutes les 8 secondes pour détecter les rendez-vous ajoutés par les autres utilisateurs
      setInterval(() => {
        loadAndRender();
      }, 8000);

      // Synchronisation instantanée dès que l'utilisateur déverrouille son smartphone ou revient sur l'application
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          loadAndRender();
        }
      });
      window.addEventListener("focus", () => {
        loadAndRender();
      });
    });

    // Exportation globale pour les onclick inline
    export const app = {
      switchTab: (name) => {
        // Si Dorianne tente d'accéder au Back-Office
        if (name === "admin" && window.__currentUser && window.__currentUser.role !== "admin") {
          playSound('click');
          showToast("Accès restreint : Réservé à l'administrateur Christophe 🔒", "🛡️");
          return;
        }

        document.querySelectorAll(".tab-view").forEach(el => el.classList.remove("active"));
        const target = document.getElementById(`view-${name}`);
        if (target) target.classList.add("active");

        document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
        const nav = document.querySelector(`.nav-item[data-tab='${name}']`);
        if (nav) nav.classList.add("active");

        if (name === "admin") {
          renderAdminDashboard();
        }

        if (name === "guidance" && mapInstance) {
          setTimeout(() => mapInstance.invalidateSize(), 150);
        }
      },
      openNewAppointmentForm: () => {
        resetForm();
        app.switchTab("new");
      },
      selectAndGuideById: (id) => {
        const appt = (window.__appointments || loadLocalAppointments()).find(a => a.id == id);
        if (appt) selectAndGuide(appt);
      },
      lockCurrentSession,
      showAuthOverlay,
      renderAdminDashboard,
      fetchBaserowUsers,
      verifyBaserowPassword,
      updateBaserowPassword,
      cancelEdit,
      launchConfetti,
      playSound,
      showAppointmentAlert,
      closeAppointmentAlert,
      notifyNewAppointmentFromOtherUser,
      triggerSystemNotification,
      submitForm,
      syncNow: async () => {
        showToast("Synchronisation forcée avec Baserow...", "⏳");
        await syncPendingLocalAppointments();
        await loadAndRender();
        showToast("Synchronisation terminée !", "🔄");
      }
    };

    window.app = app;