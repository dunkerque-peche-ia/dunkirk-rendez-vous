// app.js – Logique enrichie & fun Dunkirk RDV & Guidage (Look Dunkirk Informatique)
import { BASEROW_BASE_URL, BASEROW_TOKEN, TABLE_ID } from "./config.js";

const apiHeaders = {
  "Content-Type": "application/json",
  Authorization: `Token ${BASEROW_TOKEN}`,
};

// =============================================================
// GESTIONNAIRE DE SÉCURITÉ & AUTHENTIFICATION (Dunkirk IT)
// =============================================================
window.togglePasswordVisibility = function(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;
  input.type = input.type === "password" ? "text" : "password";
};

const DEFAULT_AUTH_CONFIG = {
  requireAuth: true,
  users: {
    "Christophe": {
      role: "admin",
      displayName: "Christophe",
      title: "Administrateur & Fondateur",
      avatar: "👨",
      password: "1234",
      lastLogin: null
    },
    "Dorianne": {
      role: "user",
      displayName: "Dorianne",
      title: "Utilisatrice Planning",
      avatar: "👩",
      password: "1234",
      lastLogin: null
    }
  },
  auditLog: [
    { timestamp: new Date().toISOString(), user: "Système", action: "Module d'authentification Dunkirk IT initialisé" }
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
    if (!parsed.users || !parsed.users.Christophe || !parsed.users.Dorianne) {
      const merged = { ...DEFAULT_AUTH_CONFIG, ...parsed };
      saveAuthConfig(merged);
      return merged;
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

let currentUser = null;
let selectedAuthUser = "Christophe";

function initAuth() {
  const cfg = loadAuthConfig();
  const sessionData = localStorage.getItem("dunkirk_session_v1");

  if (sessionData) {
    try {
      const sess = JSON.parse(sessionData);
      if (sess && sess.user && cfg.users[sess.user]) {
        setLoggedInUser(sess.user, false);
        return;
      }
    } catch(e) {}
  }

  if (!cfg.requireAuth) {
    setLoggedInUser("Christophe", false);
    return;
  }

  showAuthOverlay();
}

function showAuthOverlay() {
  const overlay = document.getElementById("auth-overlay");
  if (overlay) overlay.classList.remove("hidden");
  selectAuthUser(selectedAuthUser || "Christophe");
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

function selectAuthUser(userName) {
  selectedAuthUser = userName;
  const btnChristophe = document.getElementById("auth-select-christophe");
  const btnDorianne = document.getElementById("auth-select-dorianne");
  const labelSelected = document.getElementById("auth-selected-name");

  if (userName === "Christophe") {
    btnChristophe?.classList.add("active");
    btnDorianne?.classList.remove("active");
    if (labelSelected) labelSelected.textContent = "Christophe (Admin)";
  } else {
    btnDorianne?.classList.add("active");
    btnChristophe?.classList.remove("active");
    if (labelSelected) labelSelected.textContent = "Dorianne";
  }

  const pwdInput = document.getElementById("auth-password-input");
  if (pwdInput) {
    pwdInput.value = "";
    pwdInput.focus();
  }
  const errorMsg = document.getElementById("auth-error-msg");
  if (errorMsg) errorMsg.classList.add("hidden");
}

function attemptLogin(password, rememberMe = true) {
  const cfg = loadAuthConfig();
  const userData = cfg.users[selectedAuthUser];

  if (!userData) return false;

  if (password === userData.password) {
    userData.lastLogin = new Date().toISOString();
    saveAuthConfig(cfg);

    if (rememberMe) {
      localStorage.setItem("dunkirk_session_v1", JSON.stringify({
        user: selectedAuthUser,
        loggedInAt: Date.now()
      }));
    } else {
      localStorage.removeItem("dunkirk_session_v1");
    }

    setLoggedInUser(selectedAuthUser, true);
    addAuditLog(`Connexion réussie de ${selectedAuthUser}`, selectedAuthUser);
    hideAuthOverlay();
    playSound('fanfare');
    launchConfetti();
    showToast(`Bienvenue ${userData.displayName} ! ✨`, userData.avatar);
    return true;
  } else {
    const card = document.getElementById("auth-card");
    const errorMsg = document.getElementById("auth-error-msg");
    playSound('click');
    if (card) {
      card.classList.remove("auth-shake");
      void card.offsetWidth;
      card.classList.add("auth-shake");
    }
    if (errorMsg) {
      errorMsg.textContent = "Mot de passe incorrect. Réessayez (par défaut : 1234)";
      errorMsg.classList.remove("hidden");
    }
    addAuditLog(`Échec de connexion (mot de passe erroné) pour ${selectedAuthUser}`, selectedAuthUser);
    return false;
  }
}

function setLoggedInUser(userName, notify = false) {
  const cfg = loadAuthConfig();
  const userData = cfg.users[userName] || cfg.users["Christophe"];

  currentUser = {
    name: userName,
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
    if (userData.role === "admin") {
      adminNavBtn.style.display = "flex";
    } else {
      adminNavBtn.style.display = "none";
    }
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

async function apiFetch(path, options = {}) {
  const resp = await fetch(`${BASEROW_BASE_URL}${path}`, {
    ...options,
    headers: { ...(options.headers || {}), ...apiHeaders },
  });
  if (!resp.ok) throw new Error(`Baserow request failed: ${resp.status}`);
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

  card.innerHTML = `
    <div class="card-top-row">
      <div class="badge-group">
        <span class="user-mini-badge ${userBadgeClass}">${userEmoji} ${appt.user}</span>
        <span class="dest-badge">${appt.categorie || "RDV"}</span>
      </div>
      <span style="font-size:0.75rem; color:#94A3B8; font-weight:700;">#${appt.id}</span>
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
  } catch (e) {}
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
  } catch (e) {}
}

function saveKnownAppointmentIds(ids) {
  try {
    const unique = Array.from(new Set(ids.map(String)));
    localStorage.setItem("dunkirk_known_ids", JSON.stringify(unique));
  } catch (e) {}
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
      new Notification(title, {
        body,
        icon,
        badge: icon
      });
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
    try { navigator.vibrate([300, 150, 300]); } catch (e) {}
  }
  showToast(`🚨 Alerte : ${appt.user} a ajouté "${appt.titre}" !`, "🔔");
  triggerSystemNotification(
    `🚨 Nouveau rendez-vous pour ${appt.user} !`,
    `"${appt.titre}" prévu le ${formatDateTime(appt.date, appt.heure)}`
  );
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
  userBadge.textContent = `${userEmoji} ${appt.user}`;
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

async function submitForm(e) {
  e.preventDefault();
  const id = document.getElementById("edit-rdv-id").value.trim();

  // Récupération fiable de l'utilisateur sélectionné
  let selectedUser = "Dorianne";
  const checkedRadio = document.querySelector("input[name='rdv-user']:checked");
  if (checkedRadio && checkedRadio.value) {
    selectedUser = checkedRadio.value;
  }

  const data = {
    user: selectedUser,
    categorie: document.querySelector("input[name='rdv-style']:checked")?.value || "Co-transportage",
    titre: document.getElementById("rdv-title").value.trim(),
    date: document.getElementById("rdv-date").value || new Date().toISOString().split("T")[0],
    heure: document.getElementById("rdv-time").value || "12:00",
    adresse: document.getElementById("rdv-address").value.trim(),
    latitude: parseFloat(document.getElementById("rdv-lat").value) || 51.0343,
    longitude: parseFloat(document.getElementById("rdv-lon").value) || 2.3768,
    contact: document.getElementById("rdv-contact-name").value.trim(),
    telephone: document.getElementById("rdv-contact-phone").value.trim(),
    notes: document.getElementById("rdv-notes").value.trim(),
    alerte_minutes: parseInt(document.getElementById("rdv-alert-lead").value, 10) || 30,
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

  // Mettre à jour window.__selectedAppointment si on était en mode édition
  // (corrige le prénom dans la modal après modification de la personne assignée)
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

  // Informer instantanément les autres fenêtres / onglets
  const targetAppt = local.find(a => String(a.id) === String(id || createdLocalId)) || { ...data, id: createdLocalId };
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
    if (typeof showAppointmentAlert === 'function') {
      showAppointmentAlert(targetAppt, !id, false);
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
        } else if (currentLocal.length > 0) {
          currentLocal[0].id = created.id;
        }
        saveLocalAppointments(currentLocal);
        window.__appointments = currentLocal;
      }
    }
    checkCloudStatus(true);
  } catch (err) {
    console.warn("Synchronisation Baserow différée (mode hors-ligne actif):", err);
    checkCloudStatus(false);
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
        ${appt.user === "Dorianne" ? "👩" : "👨"}
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
// AUTOCOMPLÉTION ADRESSE (API Adresse Gouv France)
// =============================================================
let addressDebounceTimer = null;

function setupAddressAutocomplete() {
  const input = document.getElementById("rdv-address");
  const dropdown = document.getElementById("address-suggestions");
  if (!input || !dropdown) return;

  input.addEventListener("input", () => {
    clearTimeout(addressDebounceTimer);
    const query = input.value.trim();
    if (query.length < 3) {
      dropdown.classList.add("hidden");
      dropdown.innerHTML = "";
      return;
    }

    addressDebounceTimer = setTimeout(async () => {
      try {
        const resp = await fetch(`https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&limit=5`);
        if (!resp.ok) return;
        const json = await resp.json();

        dropdown.innerHTML = "";
        if (json.features && json.features.length > 0) {
          json.features.forEach(f => {
            const item = document.createElement("div");
            item.className = "address-item";
            item.textContent = f.properties.label;
            item.addEventListener("click", () => {
              input.value = f.properties.label;
              document.getElementById("rdv-lat").value = f.geometry.coordinates[1];
              document.getElementById("rdv-lon").value = f.geometry.coordinates[0];
              dropdown.classList.add("hidden");
              playSound('click');
            });
            dropdown.appendChild(item);
          });
          dropdown.classList.remove("hidden");
        } else {
          dropdown.classList.add("hidden");
        }
      } catch (err) {
        console.warn("Erreur API adresse:", err);
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

async function loadAndRender() {
  let appointments = [];
  try {
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

// =============================================================
// RENDU DYNAMIQUE DES STYLES & FILTRES
// =============================================================
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

  // 4. Formulaire RDV
  const form = document.getElementById("appointment-form");
  if (form) form.addEventListener("submit", submitForm);

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

  // Bouton recharger dans planning
  document.getElementById("refresh-data-btn")?.addEventListener("click", () => {
    playSound('click');
    loadAndRender();
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

  document.getElementById("auth-select-christophe")?.addEventListener("click", () => {
    playSound('click');
    selectAuthUser("Christophe");
  });

  document.getElementById("auth-select-dorianne")?.addEventListener("click", () => {
    playSound('click');
    selectAuthUser("Dorianne");
  });

  document.getElementById("auth-form")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const pwd = document.getElementById("auth-password-input")?.value.trim() || "";
    const rem = document.getElementById("auth-remember-me")?.checked ?? true;
    attemptLogin(pwd, rem);
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

  // Sauvegarde mot de passe Christophe
  document.getElementById("btn-save-pwd-christophe")?.addEventListener("click", () => {
    const newPwd = document.getElementById("admin-pwd-christophe")?.value.trim();
    if (!newPwd) {
      alert("Veuillez saisir un mot de passe.");
      return;
    }
    const cfg = loadAuthConfig();
    cfg.users["Christophe"].password = newPwd;
    saveAuthConfig(cfg);
    playSound('carillon');
    addAuditLog("Mot de passe administrateur Christophe mis à jour", "Christophe");
    document.getElementById("admin-pwd-christophe").value = "";
    const fb = document.getElementById("admin-pwd-feedback");
    if (fb) {
      fb.className = "feedback-msg success";
      fb.textContent = "✅ Mot de passe Christophe mis à jour avec succès !";
      fb.classList.remove("hidden");
      setTimeout(() => fb.classList.add("hidden"), 3500);
    }
    showToast("Mot de passe Christophe enregistré !", "🔒");
    renderAdminDashboard();
  });

  // Sauvegarde mot de passe Dorianne
  document.getElementById("btn-save-pwd-dorianne")?.addEventListener("click", () => {
    const newPwd = document.getElementById("admin-pwd-dorianne")?.value.trim();
    if (!newPwd) {
      alert("Veuillez saisir un mot de passe pour Dorianne.");
      return;
    }
    const cfg = loadAuthConfig();
    cfg.users["Dorianne"].password = newPwd;
    saveAuthConfig(cfg);
    playSound('carillon');
    addAuditLog("Mot de passe de Dorianne modifié par l'administrateur", "Christophe");
    document.getElementById("admin-pwd-dorianne").value = "";
    const fb = document.getElementById("admin-pwd-feedback");
    if (fb) {
      fb.className = "feedback-msg success";
      fb.textContent = "✅ Mot de passe de Dorianne mis à jour avec succès !";
      fb.classList.remove("hidden");
      setTimeout(() => fb.classList.add("hidden"), 3500);
    }
    showToast("Mot de passe Dorianne enregistré !", "🔒");
    renderAdminDashboard();
  });

  // Réinitialisation mot de passe Dorianne à 1234
  document.getElementById("btn-reset-pwd-dorianne")?.addEventListener("click", () => {
    if (confirm("Réinitialiser le mot de passe de Dorianne à '1234' ?")) {
      const cfg = loadAuthConfig();
      cfg.users["Dorianne"].password = "1234";
      saveAuthConfig(cfg);
      playSound('click');
      addAuditLog("Mot de passe de Dorianne réinitialisé à 1234", "Christophe");
      const fb = document.getElementById("admin-pwd-feedback");
      if (fb) {
        fb.className = "feedback-msg success";
        fb.textContent = "✅ Mot de passe de Dorianne réinitialisé à '1234'.";
        fb.classList.remove("hidden");
        setTimeout(() => fb.classList.add("hidden"), 3500);
      }
      showToast("Mot de passe Dorianne remis à 1234", "🔄");
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
  cancelEdit,
  launchConfetti,
  playSound,
  showAppointmentAlert,
  closeAppointmentAlert,
  notifyNewAppointmentFromOtherUser,
  triggerSystemNotification
};

window.app = app;
