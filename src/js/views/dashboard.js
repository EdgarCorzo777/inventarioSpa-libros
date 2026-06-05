// ============================================================
// views/dashboard.js — Vista del Dashboard
// ============================================================
// El dashboard muestra estadísticas del inventario:
//   - Total de libros (títulos únicos)
//   - Total de unidades en stock
//   - Libros con stock bajo (menos de 5)
//   - Libros agotados (stock = 0)
//   - Lista de los 5 últimos libros añadidos
//
// Concepto clave: RENDER ASÍNCRONO
//   Primero mostramos un "skeleton" (estructura vacía),
//   luego pedimos los datos a la API, y cuando llegan,
//   actualizamos el DOM con los valores reales.
// ============================================================

const DashboardView = {

  async render() {
    const app = document.getElementById("app");
    const user = Auth.currentUser;

    // 1. Mostrar estructura mientras carga
    app.innerHTML = `
      <div class="page dashboard-page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Dashboard</h1>
            <p class="page-subtitle">Bienvenido, ${user.name}</p>
          </div>
        </div>

        <!-- Tarjetas de estadísticas -->
        <!-- Los id los usamos para actualizar los números cuando lleguen los datos -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">📖</div>
            <div class="stat-info">
              <div class="stat-number" id="stat-titles">—</div>
              <div class="stat-label">Títulos</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📦</div>
            <div class="stat-info">
              <div class="stat-number" id="stat-units">—</div>
              <div class="stat-label">Unidades en stock</div>
            </div>
          </div>
          <div class="stat-card stat-warning">
            <div class="stat-icon">⚠️</div>
            <div class="stat-info">
              <div class="stat-number" id="stat-low">—</div>
              <div class="stat-label">Stock bajo (&lt;5)</div>
            </div>
          </div>
          <div class="stat-card stat-danger">
            <div class="stat-icon">🚫</div>
            <div class="stat-info">
              <div class="stat-number" id="stat-out">—</div>
              <div class="stat-label">Agotados</div>
            </div>
          </div>
        </div>

        <!-- Tabla de últimos libros -->
        <div class="section-card">
          <h2 class="section-title">Últimos libros añadidos</h2>
          <div id="recent-books">
            <p class="loading-text">Cargando...</p>
          </div>
        </div>
      </div>
    `;

    // 2. Pedir datos a la API (operación async)
    try {
      const books = await API.getBooks();
      // 3. Actualizar el DOM con los datos reales
      this.updateStats(books);
      this.renderRecentBooks(books);
    } catch (error) {
      app.innerHTML = `
        <div class="page">
          <div class="error-card">
            <p>⚠️ No se pudo conectar al servidor.</p>
            <p>Asegúrate de que JSON Server esté corriendo en el puerto 3001.</p>
            <code>npm run server</code>
          </div>
        </div>
      `;
    }
  },

  /**
   * Actualiza los números de las tarjetas de estadísticas.
   * Manipulación directa del DOM con getElementById + textContent.
   */
  updateStats(books) {
    // Total de títulos = cantidad de libros en el array
    document.getElementById("stat-titles").textContent = books.length;

    // Total de unidades = suma de todos los stocks
    // reduce() acumula valores: empieza en 0, suma cada book.stock
    const totalUnits = books.reduce((sum, book) => sum + book.stock, 0);
    document.getElementById("stat-units").textContent = totalUnits;

    // Libros con stock bajo: stock > 0 pero < 5
    const lowStock = books.filter(b => b.stock > 0 && b.stock < 5).length;
    document.getElementById("stat-low").textContent = lowStock;

    // Libros agotados: stock === 0
    const outOfStock = books.filter(b => b.stock === 0).length;
    document.getElementById("stat-out").textContent = outOfStock;
  },

  /**
   * Renderiza la tabla de los últimos 5 libros añadidos.
   */
  renderRecentBooks(books) {
    const container = document.getElementById("recent-books");

    if (books.length === 0) {
      container.innerHTML = `<p class="empty-text">No hay libros registrados aún.</p>`;
      return;
    }

    // Tomar los últimos 5 libros (los más recientes)
    const recent = [...books].slice(-5).reverse();

    // Construir la tabla como string HTML
    // map() transforma cada libro en un string de <tr>
    // join("") une todos los strings sin separador
    container.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Género</th>
            <th>Stock</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${recent.map(book => `
            <tr>
              <td>${book.title}</td>
              <td>${book.author}</td>
              <td><span class="genre-badge">${book.genre}</span></td>
              <td>
                <span class="stock-badge ${this.getStockClass(book.stock)}">
                  ${book.stock}
                </span>
              </td>
              <td>$${book.price.toLocaleString("es-CO")}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  /** Retorna una clase CSS según el nivel de stock */
  getStockClass(stock) {
    if (stock === 0) return "stock-out";
    if (stock < 5)  return "stock-low";
    return "stock-ok";
  },
};
