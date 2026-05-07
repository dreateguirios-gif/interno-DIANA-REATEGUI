// Sistema de autenticación — Diana Reátegui · Uso Interno
// Modificar este archivo para agregar/quitar usuarios

const _USERS = {
  "diana.reategui@gruposmartec.com": "1bc00376fdc4055ed329a480851e086d5f4f125e6d1195ef8b2f7a3f5e31085f",
  "comercial1@smartimport-corp.com":  "38249b3f8ae2492ece1f96585fa2af01222da3dcf842daf49550f4a2a7e69138",
  "audiovisual@gruposmartec.com":     "532c9cd33c95be4ce1d29a36fcdd44fea334838554f61f659c7da0b57d094d70",
  "juan.reategui@gruposmartec.com":   "d2c6471262eea2ce65145edd08d5962a31612240dd2373ca30f3836aeb7ead9f"
};

// director = acceso total · team = páginas operativas únicamente
const _ROLES = {
  "diana.reategui@gruposmartec.com": "director",
  "juan.reategui@gruposmartec.com":  "director",
  "comercial1@smartimport-corp.com": "team",
  "audiovisual@gruposmartec.com":    "team"
};

const _KEY  = "dr_auth_v1";
const _TTL  = 8 * 60 * 60 * 1000; // 8 horas en ms

function _isLoggedIn() {
  try {
    const s = JSON.parse(localStorage.getItem(_KEY) || "{}");
    if (s.ok !== true || !_USERS[s.email]) return false;
    if (Date.now() - s.ts > _TTL) {          // sesión vencida
      localStorage.removeItem(_KEY);
      return false;
    }
    return true;
  } catch { return false; }
}

function _getRole() {
  try {
    const s = JSON.parse(localStorage.getItem(_KEY) || "{}");
    return _ROLES[s.email] || "team";
  } catch { return "team"; }
}

// Llama esto en el <head> de cada página protegida
function requireAuth() {
  if (!_isLoggedIn()) {
    localStorage.setItem("dr_return", location.href);
    location.replace(_loginPath());
  } else {
    document.addEventListener("DOMContentLoaded", _injectLogout);
  }
}

// Llama esto en páginas exclusivas para directivos
function requireDirector() {
  if (!_isLoggedIn()) {
    localStorage.setItem("dr_return", location.href);
    location.replace(_loginPath());
    return;
  }
  if (_getRole() !== "director") {
    document.addEventListener("DOMContentLoaded", _injectAccessDenied);
  } else {
    document.addEventListener("DOMContentLoaded", _injectLogout);
  }
}

function _injectAccessDenied() {
  document.body.innerHTML = "";
  document.body.style.cssText = "margin:0;padding:0;background:#0A0A0A;color:#F8F4EE;font-family:'DM Sans',sans-serif;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;";
  document.body.innerHTML = `
    <div style="text-align:center;max-width:380px;padding:24px;">
      <div style="font-family:'Cormorant Garamond',serif;font-size:72px;font-weight:700;color:rgba(184,122,78,0.15);line-height:1;margin-bottom:32px;">✕</div>
      <p style="font-family:'Space Mono',monospace;font-size:9px;letter-spacing:4px;color:#B87A4E;text-transform:uppercase;margin-bottom:16px;">Acceso Restringido</p>
      <p style="font-size:15px;font-weight:300;color:#7A7470;line-height:1.6;margin-bottom:32px;">Esta sección es solo para directivos del sistema. Si crees que esto es un error, contacta a Diana.</p>
      <a href="index.html" style="display:inline-block;background:#B87A4E;color:#0A0A0A;font-family:'Montserrat',sans-serif;font-size:11px;font-weight:700;letter-spacing:3px;text-transform:uppercase;text-decoration:none;padding:14px 28px;">← Volver al Inicio</a>
    </div>
  `;
}

// Calcula la ruta a login.html relativa a la página actual
function _loginPath() {
  // Todas las páginas están al mismo nivel: ./login.html
  return "login.html";
}

function _injectLogout() {
  try {
    const s = JSON.parse(localStorage.getItem(_KEY));
    const bar = document.createElement("div");
    bar.id = "auth-bar";
    bar.innerHTML = `
      <span style="opacity:.45;">${s.email}</span>
      <button onclick="authLogout()">Salir</button>
    `;
    bar.style.cssText = [
      "position:fixed","bottom:20px","right:20px","z-index:9999",
      "display:flex","align-items:center","gap:12px",
      "background:rgba(10,10,10,0.94)","border:1px solid rgba(184,122,78,0.28)",
      "padding:8px 14px 8px 16px","border-radius:2px",
      "font-family:'Space Mono',monospace,sans-serif","font-size:9px",
      "letter-spacing:1px","color:#F8F4EE","box-shadow:0 2px 12px rgba(0,0,0,.5)"
    ].join(";");
    bar.querySelector("button").style.cssText = [
      "background:rgba(184,122,78,0.15)","border:1px solid rgba(184,122,78,0.4)",
      "color:#B87A4E","font-family:inherit","font-size:9px",
      "letter-spacing:2px","text-transform:uppercase","cursor:pointer",
      "padding:4px 10px"
    ].join(";");
    document.body.appendChild(bar);
  } catch {}
}

function authLogout() {
  localStorage.removeItem(_KEY);
  location.replace("login.html");
}

// ── Usado por login.html ──────────────────────────────────
async function _sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0")).join("");
}

async function authLogin(email, password, btnEl, errEl) {
  btnEl.disabled = true;
  btnEl.textContent = "Verificando...";
  errEl.textContent = "";
  const e = email.toLowerCase().trim();
  const h = await _sha256(password);
  if (_USERS[e] && _USERS[e] === h) {
    localStorage.setItem(_KEY, JSON.stringify({ ok: true, email: e, ts: Date.now() }));
    const ret = localStorage.getItem("dr_return") || "index.html";
    localStorage.removeItem("dr_return");
    location.replace(ret);
  } else {
    errEl.textContent = "Correo o contraseña incorrectos.";
    btnEl.disabled = false;
    btnEl.textContent = "Ingresar";
  }
}
