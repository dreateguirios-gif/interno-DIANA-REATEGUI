// Sistema de autenticación — Diana Reátegui · Uso Interno
// Modificar este archivo para agregar/quitar usuarios

const _USERS = {
  "diana.reategui@gruposmartec.com": "1bc00376fdc4055ed329a480851e086d5f4f125e6d1195ef8b2f7a3f5e31085f",
  "comercial1@smartimport-corp.com":  "38249b3f8ae2492ece1f96585fa2af01222da3dcf842daf49550f4a2a7e69138",
  "audiovisual@gruposmartec.com":     "532c9cd33c95be4ce1d29a36fcdd44fea334838554f61f659c7da0b57d094d70",
  "juan.reategui@gruposmartec.com":   "d2c6471262eea2ce65145edd08d5962a31612240dd2373ca30f3836aeb7ead9f"
};

const _KEY = "dr_auth_v1";

function _isLoggedIn() {
  try {
    const s = JSON.parse(sessionStorage.getItem(_KEY) || "{}");
    return s.ok === true && !!_USERS[s.email];
  } catch { return false; }
}

// Llama esto en el <head> de cada página protegida
function requireAuth() {
  if (!_isLoggedIn()) {
    sessionStorage.setItem("dr_return", location.pathname + location.search);
    location.replace("login.html");
  } else {
    // Inyecta botón de cerrar sesión cuando el DOM esté listo
    document.addEventListener("DOMContentLoaded", _injectLogout);
  }
}

function _injectLogout() {
  const s = JSON.parse(sessionStorage.getItem(_KEY));
  const btn = document.createElement("div");
  btn.id = "auth-bar";
  btn.innerHTML = `
    <span style="opacity:.5;">${s.email}</span>
    <button onclick="authLogout()" title="Cerrar sesión">Salir</button>
  `;
  btn.style.cssText = [
    "position:fixed", "bottom:20px", "right:20px", "z-index:9999",
    "display:flex", "align-items:center", "gap:12px",
    "background:rgba(10,10,10,0.92)", "border:1px solid rgba(184,122,78,0.3)",
    "padding:8px 14px 8px 16px", "border-radius:2px",
    "font-family:'Space Mono',monospace,sans-serif", "font-size:9px",
    "letter-spacing:1px", "color:#F8F4EE"
  ].join(";");
  btn.querySelector("button").style.cssText = [
    "background:rgba(184,122,78,0.15)", "border:1px solid rgba(184,122,78,0.4)",
    "color:#B87A4E", "font-family:inherit", "font-size:9px",
    "letter-spacing:2px", "text-transform:uppercase", "cursor:pointer",
    "padding:4px 10px"
  ].join(";");
  document.body.appendChild(btn);
}

function authLogout() {
  sessionStorage.removeItem(_KEY);
  location.replace("login.html");
}

// Usado por login.html
async function _sha256(text) {
  const buf = await crypto.subtle.digest("SHA-256",
    new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,"0")).join("");
}

async function authLogin(email, password, btnEl, errEl) {
  btnEl.disabled = true;
  btnEl.textContent = "Verificando...";
  errEl.textContent = "";
  const e = email.toLowerCase().trim();
  const h = await _sha256(password);
  if (_USERS[e] && _USERS[e] === h) {
    sessionStorage.setItem(_KEY, JSON.stringify({ ok: true, email: e }));
    const ret = sessionStorage.getItem("dr_return") || "index.html";
    sessionStorage.removeItem("dr_return");
    location.replace(ret);
  } else {
    errEl.textContent = "Correo o contraseña incorrectos.";
    btnEl.disabled = false;
    btnEl.textContent = "Ingresar";
  }
}
