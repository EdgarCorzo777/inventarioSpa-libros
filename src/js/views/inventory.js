// ============================================================
// views/inventory.js — Vista del CRUD de Inventario
// ============================================================
// Esta es la vista más compleja del proyecto.
// Implementa el CRUD completo:
//   C → Create  (botón "Nuevo libro" → formulario → POST)
//   R → Read    (tabla con todos los libros → GET)
//   U → Update  (botón "Editar" → formulario prellenado → PUT)
//   D → Delete  (botón "Eliminar" → confirmación → DELETE)
//
// También incluye búsqueda en tiempo real (filtrado local).
// ============================================================

const InventoryView = {

  // Variable local para guardar los libros en memoria
  // (evita hacer fetch cada vez que filtramos)
  books: [],

  async render() {
    const app = document.getElementById("app");

    app.innerHTML = `
      <div class="page inventory-page">
        <div class="page-header">
          <div>
            <h1 class="page-title">Inventario</h1>
            <p class="page-subtitle">Gestión de libros</p>
          </div>
          <button id="btn-new-book" class="btn-primary">
            + Nuevo libro
          </button>
        </div>

        <!-- Barra de búsqueda -->
        <div class="search-bar">
          <input
            type="text"
            id="search-input"
            placeholder="🔍 Buscar por título, autor o género..."
            class="search-input"
          />
        </div>

        <!-- Aquí se renderiza la tabla de libros -->
        <div id="books-container">
          <p class="loading-text">Cargando inventario...</p>
        </div>

        <!-- MODAL del formulario (oculto por defecto) -->
        <!-- El modal es un overlay que aparece encima del contenido -->
        <div id="book-modal" class="modal hidden">
          <div class="modal-overlay" id="modal-overlay"></div>
          <div class="modal-content">
            <div class="modal-header">
              <h2 id="modal-title">Nuevo libro</h2>
              <button id="btn-close-modal" class="btn-close">✕</button>
            </div>
            <form id="book-form" class="book-form">

              <!-- Campo oculto que guarda el ID cuando editamos -->
              <input type="hidden" id="book-id" />

              <div class="form-row">
                <div class="form-group">
                  <label for="book-title">Título *</label>
                  <input type="text" id="book-title" required placeholder="Título del libro" />
                </div>
                <div class="form-group">
                  <label for="book-author">Autor *</label>
                  <input type="text" id="book-author" required placeholder="Nombre del autor" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="book-genre">Género *</label>
                  <select id="book-genre" required>
                    <option value="">Seleccionar género</option>
                    <option value="Novela">Novela</option>
                    <option value="Clásico">Clásico</option>
                    <option value="Ficción">Ficción</option>
                    <option value="Distopía">Distopía</option>
                    <option value="Infantil">Infantil</option>
                    <option value="Ciencia">Ciencia</option>
                    <option value="Historia">Historia</option>
                    <option value="Poesía">Poesía</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                <div class="form-group">
                  <label for="book-isbn">ISBN</label>
                  <input type="text" id="book-isbn" placeholder="978-0-00-000000-0" />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label for="book-price">Precio (COP) *</label>
                  <input type="number" id="book-price" required min="0" placeholder="25000" />
                </div>
                <div class="form-group">
                  <label for="book-stock">Stock *</label>
                  <input type="number" id="book-stock" required min="0" placeholder="10" />
                </div>
              </div>

              <div class="form-actions">
                <button type="button" id="btn-cancel" class="btn-secondary">Cancelar</button>
                <button type="submit" id="btn-save" class="btn-primary">Guardar libro</button>
              </div>

            </form>
          </div>
        </div>

      </div>
    `;

    // Cargar los libros desde la API
    await this.loadBooks();

    // Configurar todos los eventos de esta vista
    this.setupEvents();
  },

  // ── CARGAR LIBROS (READ) ─────────────────────────────────
  async loadBooks() {
    try {
      this.books = await API.getBooks();
      this.renderTable(this.books);
    } catch (error) {
      document.getElementById("books-container").innerHTML = `
        <div class="error-card">
          <p>⚠️ No se pudo cargar el inventario. ¿Está corriendo el servidor?</p>
        </div>
      `;
    }
  },

  // ── RENDERIZAR TABLA ────────────────────────────────────
  /**
   * Construye la tabla de libros y la inyecta en el DOM.
   * @param {Array} books - Array de libros a mostrar (puede ser filtrado)
   */
  renderTable(books) {
    const container = document.getElementById("books-container");

    if (books.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <p>📭 No se encontraron libros.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="table-info">
        Mostrando <strong>${books.length}</strong> libro(s)
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Título</th>
            <th>Autor</th>
            <th>Género</th>
            <th>ISBN</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${books.map(book => `
            <tr>
              <td><strong>${book.title}</strong></td>
              <td>${book.author}</td>
              <td><span class="genre-badge">${book.genre}</span></td>
              <td class="isbn-cell">${book.isbn || "—"}</td>
              <td>$${book.price.toLocaleString("es-CO")}</td>
              <td>
                <span class="stock-badge ${this.getStockClass(book.stock)}">
                  ${book.stock} uds.
                </span>
              </td>
              <td class="actions-cell">
                <!-- data-id guarda el ID para saber qué libro editar/eliminar -->
                <button class="btn-edit btn-icon" data-id="${book.id}" title="Editar">✏️</button>
                <button class="btn-delete btn-icon" data-id="${book.id}" title="Eliminar">🗑️</button>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;
  },

  // ── CONFIGURAR EVENTOS ───────────────────────────────────
  setupEvents() {
    // Botón "Nuevo libro" → abrir modal vacío
    document.getElementById("btn-new-book").addEventListener("click", () => {
      this.openModal();
    });

    // Búsqueda en tiempo real
    document.getElementById("search-input").addEventListener("input", (e) => {
      this.filterBooks(e.target.value);
    });

    // Cerrar modal (botón X y botón Cancelar)
    document.getElementById("btn-close-modal").addEventListener("click", () => this.closeModal());
    document.getElementById("btn-cancel").addEventListener("click", () => this.closeModal());

    // Cerrar modal al hacer click en el overlay
    document.getElementById("modal-overlay").addEventListener("click", () => this.closeModal());

    // Submit del formulario → crear o editar según si hay ID
    document.getElementById("book-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      await this.saveBook();
    });

    // Delegación de eventos para editar y eliminar
    // En vez de poner un listener en CADA botón, ponemos UNO
    // en el contenedor y chequeamos cuál botón fue clickeado.
    document.getElementById("books-container").addEventListener("click", async (e) => {
      const editBtn   = e.target.closest(".btn-edit");
      const deleteBtn = e.target.closest(".btn-delete");

      if (editBtn)   await this.editBook(editBtn.dataset.id);
      if (deleteBtn) await this.deleteBook(deleteBtn.dataset.id);
    });
  },

  // ── CREAR / EDITAR (CREATE + UPDATE) ────────────────────
  async saveBook() {
    const id    = document.getElementById("book-id").value;
    const btnSave = document.getElementById("btn-save");

    // Recoger datos del formulario
    const bookData = {
      title:     document.getElementById("book-title").value.trim(),
      author:    document.getElementById("book-author").value.trim(),
      genre:     document.getElementById("book-genre").value,
      isbn:      document.getElementById("book-isbn").value.trim(),
      price:     parseInt(document.getElementById("book-price").value),
      stock:     parseInt(document.getElementById("book-stock").value),
      createdAt: id ? undefined : new Date().toISOString().split("T")[0],
    };

    // Si hay fecha previa (edición), conservarla
    if (id) {
      const existing = this.books.find(b => b.id === id);
      bookData.createdAt = existing?.createdAt;
    }

    btnSave.disabled = true;
    btnSave.textContent = "Guardando...";

    try {
      if (id) {
        // ── UPDATE: ya tiene ID → PUT ──────────────────────
        await API.updateBook(id, { ...bookData, id });
      } else {
        // ── CREATE: sin ID → POST ──────────────────────────
        await API.createBook(bookData);
      }

      this.closeModal();
      await this.loadBooks(); // Recargar la tabla con los datos actualizados

    } catch (error) {
      alert("Error al guardar. ¿Está corriendo el servidor?");
    }

    btnSave.disabled = false;
    btnSave.textContent = "Guardar libro";
  },

  // ── EDITAR (prellenar formulario) ────────────────────────
  async editBook(id) {
    // Buscar el libro en el array local (no hacemos fetch extra)
    const book = this.books.find(b => b.id === id);
    if (!book) return;

    // Abrir modal en modo edición
    this.openModal("Editar libro");

    // Prellenar el formulario con los datos del libro
    document.getElementById("book-id").value     = book.id;
    document.getElementById("book-title").value  = book.title;
    document.getElementById("book-author").value = book.author;
    document.getElementById("book-genre").value  = book.genre;
    document.getElementById("book-isbn").value   = book.isbn || "";
    document.getElementById("book-price").value  = book.price;
    document.getElementById("book-stock").value  = book.stock;
  },

  // ── ELIMINAR (DELETE) ────────────────────────────────────
  async deleteBook(id) {
    const book = this.books.find(b => b.id === id);
    if (!book) return;

    // Pedir confirmación antes de eliminar
    const confirmed = confirm(`¿Eliminar "${book.title}"?\nEsta acción no se puede deshacer.`);
    if (!confirmed) return;

    try {
      await API.deleteBook(id);
      await this.loadBooks(); // Recargar tabla
    } catch (error) {
      alert("Error al eliminar. ¿Está corriendo el servidor?");
    }
  },

  // ── BÚSQUEDA / FILTRADO ──────────────────────────────────
  /**
   * Filtra el array de libros en MEMORIA (sin hacer fetch).
   * Así la búsqueda es instantánea.
   */
  filterBooks(query) {
    const q = query.toLowerCase().trim();

    if (!q) {
      // Si el input está vacío, mostrar todos
      this.renderTable(this.books);
      return;
    }

    const filtered = this.books.filter(book =>
      book.title.toLowerCase().includes(q)  ||
      book.author.toLowerCase().includes(q) ||
      book.genre.toLowerCase().includes(q)
    );

    this.renderTable(filtered);
  },

  // ── HELPERS DEL MODAL ────────────────────────────────────
  openModal(title = "Nuevo libro") {
    document.getElementById("modal-title").textContent = title;
    document.getElementById("book-form").reset();  // Limpiar formulario
    document.getElementById("book-id").value = ""; // Limpiar ID oculto
    document.getElementById("book-modal").classList.remove("hidden");
  },

  closeModal() {
    document.getElementById("book-modal").classList.add("hidden");
  },

  /** Clase CSS según nivel de stock */
  getStockClass(stock) {
    if (stock === 0) return "stock-out";
    if (stock < 5)  return "stock-low";
    return "stock-ok";
  },
};
