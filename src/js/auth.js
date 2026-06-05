// ============================================================
// auth.js — Autenticación y persistencia de sesión
// ============================================================
// ¿Qué es la persistencia de sesión?
//   Cuando el usuario hace login, guardamos sus datos en
//   localStorage. Así, si cierra el tab y vuelve, sigue
//   "logueado" sin tener que escribir su contraseña de nuevo.
//
// localStorage es como un "cajón" del navegador donde puedes
// guardar texto. Solo acepta strings, por eso usamos:
//   - JSON.stringify() para guardar objetos → texto
//   - JSON.parse()     para leer texto → objetos
//
// La clave que usamos en localStorage:
const SESSION_KEY = "librostock_user";
// ============================================================

const Auth = {

  // ── ESTADO ACTUAL DEL USUARIO ────────────────────────────
  // Esta propiedad guarda al usuario en memoria mientras
  // la app está abierta. Se llena al hacer login o al
  // iniciar la app si ya había sesión guardada.
  currentUser: null,

  // ── LOGIN ────────────────────────────────────────────────
  /**
   * Hace login: llama a la API, guarda la sesión y retorna el usuario.
   * @param {string} username
   * @param {string} password
   * @returns {Object|null} El usuario si las credenciales son correctas, null si no.
   */
  async login(username, password) {
    // 1. Preguntarle a la API si existe ese usuario
    const user = await API.loginUser(username, password);

    if (user) {
      // 2. Guardar en memoria (para esta sesión activa)
      this.currentUser = user;

      // 3. Guardar en localStorage (para que persista entre recargas)
      //    JSON.stringify convierte { id: "1", name: "Admin" } → '{"id":"1","name":"Admin"}'
      localStorage.setItem(SESSION_KEY, JSON.stringify(user));

      return user;
    }

    return null; // Credenciales incorrectas
  },

  // ── LOGOUT ───────────────────────────────────────────────
  /**
   * Cierra la sesión: limpia memoria y localStorage.
   */
  logout() {
    this.currentUser = null;
    // Eliminar del cajón del navegador
    localStorage.removeItem(SESSION_KEY);
  },

  // ── VERIFICAR SI HAY SESIÓN ACTIVA ───────────────────────
  /**
   * Revisa si el usuario ya estaba logueado (sesión persistente).
   * Se llama al INICIAR la app, antes de mostrar cualquier vista.
   * @returns {Object|null} El usuario guardado, o null si no hay sesión.
   */
  checkSession() {
    // Intentar leer del localStorage
    const savedUser = localStorage.getItem(SESSION_KEY);

    if (savedUser) {
      // JSON.parse convierte el texto de vuelta a objeto JS
      this.currentUser = JSON.parse(savedUser);
      return this.currentUser;
    }

    return null;
  },

  // ── HELPERS ──────────────────────────────────────────────

  /** ¿Está el usuario logueado? */
  isAuthenticated() {
    return this.currentUser !== null;
  },

  /** ¿Es el usuario administrador? */
  isAdmin() {
    return this.currentUser?.role === "admin";
  },
};
