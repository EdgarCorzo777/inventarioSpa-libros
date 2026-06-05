// ============================================================
// router.js — Sistema de rutas de la SPA
// ============================================================
// En una SPA no hay múltiples .html. En cambio, usamos el HASH
// de la URL para saber qué "página" mostrar.
//
// Ejemplos de URLs:
//   http://localhost:3000/index.html#login      → vista login
//   http://localhost:3000/index.html#dashboard  → vista dashboard
//   http://localhost:3000/index.html#inventory  → vista inventario
//
// El "hash" es todo lo que viene después del #
// Cuando el hash cambia, el navegador NO recarga la página.
// Nosotros escuchamos ese cambio y renderizamos la vista correcta.
// ============================================================

const Router = {

  // ── REGISTRO DE RUTAS ────────────────────────────────────
  // Aquí mapeamos: nombre de ruta → función que la renderiza
  routes: {
    login:     () => LoginView.render(),
    dashboard: () => DashboardView.render(),
    inventory: () => InventoryView.render(),
  },

  // ── RUTAS PROTEGIDAS ────────────────────────────────────
  // Si el usuario NO está autenticado y intenta entrar aquí,
  // lo redirigimos al login automáticamente.
  protectedRoutes: ["dashboard", "inventory"],

  // ── INICIALIZAR EL ROUTER ────────────────────────────────
  /**
   * Configura los listeners y navega a la ruta inicial.
   * Se llama UNA vez al arrancar la app.
   */
  init() {
    // Escuchar cuando el hash de la URL cambie
    // Esto dispara cada vez que el usuario hace click en un link #
    window.addEventListener("hashchange", () => this.handleRoute());

    // Escuchar clicks en los links de la navbar (data-route)
    document.addEventListener("click", (e) => {
      const link = e.target.closest("[data-route]");
      if (link) {
        e.preventDefault();
        const route = link.dataset.route;
        this.navigate(route);
      }
    });

    // Manejar la ruta actual al cargar la app
    this.handleRoute();
  },

  // ── MANEJAR UNA RUTA ────────────────────────────────────
  /**
   * Lee el hash actual y decide qué vista mostrar.
   * Es el "corazón" del router.
   */
  handleRoute() {
    // Leer el hash de la URL, quitar el # y minúsculas
    // Si no hay hash, la ruta por defecto es "login"
    const hash = window.location.hash.replace("#", "") || "login";

    // ¿La ruta existe en nuestro registro?
    const routeExists = this.routes[hash];
    if (!routeExists) {
      // Ruta no encontrada → ir al inicio
      this.navigate("login");
      return;
    }

    // ── LÓGICA DE RUTAS PROTEGIDAS ──────────────────────
    const isProtected = this.protectedRoutes.includes(hash);
    const isLoggedIn  = Auth.isAuthenticated();

    if (isProtected && !isLoggedIn) {
      // Quiere entrar a una ruta protegida sin estar logueado
      // → Mandarlo al login
      this.navigate("login");
      return;
    }

    if (hash === "login" && isLoggedIn) {
      // Ya está logueado e intenta ir al login
      // → Mandarlo al dashboard (no tiene sentido que vea el login)
      this.navigate("dashboard");
      return;
    }

    // ── TODO BIEN: RENDERIZAR LA VISTA ──────────────────
    this.renderView(hash);
  },

  // ── RENDERIZAR UNA VISTA ────────────────────────────────
  /**
   * Ejecuta la función de render de la vista correspondiente.
   * También actualiza los links activos de la navbar.
   */
  renderView(routeName) {
    // Actualizar links activos en la navbar
    document.querySelectorAll("[data-route]").forEach((link) => {
      link.classList.toggle("active", link.dataset.route === routeName);
    });

    // Llamar a la función de render de la vista
    // this.routes["dashboard"]() llama a DashboardView.render()
    this.routes[routeName]();
  },

  // ── NAVEGAR A UNA RUTA ───────────────────────────────────
  /**
   * Cambia el hash de la URL para navegar.
   * Esto dispara automáticamente el evento "hashchange".
   * @param {string} routeName - Nombre de la ruta (sin #)
   */
  navigate(routeName) {
    window.location.hash = routeName;
  },
};
