// ============================================================
// views/login.js — Vista de Login
// ============================================================
// Esta vista tiene DOS responsabilidades:
//   1. render()   → Construir y mostrar el HTML del formulario
//   2. Manejar el submit del formulario → llamar a Auth.login()
//
// Concepto clave: INYECCIÓN DE HTML
//   En lugar de tener un <form> en el HTML, nosotros lo
//   CREAMOS con JavaScript y lo metemos en el #app.
//   Así funciona una SPA.
// ============================================================

const LoginView = {

  /**
   * Renderiza la vista de login en el elemento #app.
   * Se llama desde el Router cuando la ruta es "login".
   */
  render() {
    const app = document.getElementById("app");

    // innerHTML = "inyectar HTML como string"
    // Así reemplazamos el contenido anterior del #app
    app.innerHTML = `
      <div class="login-page">
        <div class="login-card">

          <div class="login-header">
            <div class="login-logo">📚</div>
            <h1 class="login-title">LibroStock</h1>
            <p class="login-subtitle">Gestión de inventario</p>
          </div>

          <!-- El id="login-form" lo usamos abajo para escuchar el submit -->
          <form id="login-form" class="login-form">

            <div class="form-group">
              <label for="username">Usuario</label>
              <input
                type="text"
                id="username"
                placeholder="Ej: admin"
                autocomplete="username"
                required
              />
            </div>

            <div class="form-group">
              <label for="password">Contraseña</label>
              <input
                type="password"
                id="password"
                placeholder="Tu contraseña"
                autocomplete="current-password"
                required
              />
            </div>

            <!-- Aquí se muestran los errores si el login falla -->
            <div id="login-error" class="error-message hidden">
              ❌ Usuario o contraseña incorrectos
            </div>

            <button type="submit" id="btn-login" class="btn-primary btn-full">
              Ingresar
            </button>

          </form>

          <!-- Credenciales de demo para facilitar las pruebas -->
          <div class="login-hint">
            <p><strong>Admin:</strong> admin / admin123</p>
            <p><strong>Librarian:</strong> librarian / lib123</p>
          </div>

        </div>
      </div>
    `;

    // Después de inyectar el HTML, configurar los eventos
    this.setupEvents();
  },

  /**
   * Configura los event listeners del formulario.
   * IMPORTANTE: Debe llamarse DESPUÉS de render(), porque
   * los elementos deben existir en el DOM para poder escucharlos.
   */
  setupEvents() {
    const form = document.getElementById("login-form");

    // Escuchar el evento "submit" del formulario
    form.addEventListener("submit", async (e) => {
      // preventDefault evita que el form recargue la página
      e.preventDefault();

      // Leer los valores de los inputs
      const username = document.getElementById("username").value.trim();
      const password = document.getElementById("password").value;
      const errorDiv = document.getElementById("login-error");
      const btnLogin = document.getElementById("btn-login");

      // Deshabilitar botón mientras carga (UX)
      btnLogin.disabled = true;
      btnLogin.textContent = "Ingresando...";

      // Intentar login
      const user = await Auth.login(username, password);

      if (user) {
        // ✅ Login exitoso
        showNavbar(user);          // Mostrar navbar con el nombre
        Router.navigate("dashboard"); // Ir al dashboard
      } else {
        // ❌ Login fallido: mostrar error
        errorDiv.classList.remove("hidden");
        btnLogin.disabled = false;
        btnLogin.textContent = "Ingresar";

        // Ocultar el error después de 3 segundos
        setTimeout(() => {
          errorDiv.classList.add("hidden");
        }, 3000);
      }
    });
  },
};
