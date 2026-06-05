// ============================================================
// app.js — Punto de entrada de la aplicación
// ============================================================
// Este es el primer archivo que "orquesta" todo.
// Su trabajo es sencillo:
//   1. Esperar a que el HTML esté listo
//   2. Verificar si ya hay una sesión guardada
//   3. Configurar el botón de logout
//   4. Iniciar el router para que muestre la vista correcta
// ============================================================

// DOMContentLoaded se dispara cuando el HTML está completamente
// cargado y analizado (antes de que carguen imágenes, etc.)
document.addEventListener("DOMContentLoaded", () => {

  // ── 1. VERIFICAR SESIÓN EXISTENTE ───────────────────────
  // Antes de hacer CUALQUIER cosa, revisamos si el usuario
  // ya tenía una sesión guardada en localStorage.
  const savedUser = Auth.checkSession();

  if (savedUser) {
    // Si hay sesión, mostramos la navbar con su nombre
    showNavbar(savedUser);
  }

  // ── 2. CONFIGURAR BOTÓN DE LOGOUT ───────────────────────
  document.getElementById("btn-logout").addEventListener("click", () => {
    Auth.logout();        // Limpiar sesión en auth.js
    hideNavbar();         // Ocultar la navbar
    Router.navigate("login"); // Ir al login
  });

  // ── 3. INICIALIZAR EL ROUTER ────────────────────────────
  // A partir de aquí, el router toma el control y decide
  // qué vista mostrar según la URL actual.
  Router.init();
});

// ── HELPERS DE NAVBAR ────────────────────────────────────────

/**
 * Muestra la navbar y escribe el nombre del usuario.
 * Se llama después del login o al detectar sesión existente.
 */
function showNavbar(user) {
  const navbar = document.getElementById("navbar");
  const usernameSpan = document.getElementById("nav-username");

  navbar.classList.remove("hidden");
  usernameSpan.textContent = `👤 ${user.name}`;
}

/**
 * Oculta la navbar.
 * Se llama después del logout.
 */
function hideNavbar() {
  document.getElementById("navbar").classList.add("hidden");
}

// Hacer showNavbar global para que las vistas puedan llamarla
// (por ejemplo, la vista de login la llama después del login exitoso)
window.showNavbar = showNavbar;
window.hideNavbar = hideNavbar;
