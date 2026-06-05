// ============================================================
// api.js — Capa de comunicación con JSON Server
// ============================================================
// Este archivo es el ÚNICO lugar donde se habla con el server.
// Ventaja: si mañana cambias la URL del server, solo editas aquí.
//
// JSON Server corre en http://localhost:3001
// Endpoints disponibles:
//   GET    /books         → trae todos los libros
//   GET    /books/:id     → trae un libro por ID
//   POST   /books         → crea un libro nuevo
//   PUT    /books/:id     → reemplaza un libro completo
//   DELETE /books/:id     → elimina un libro
//   GET    /users         → trae usuarios (para login)
// ============================================================

const API_URL = "http://localhost:3001";

// ── Objeto "API" que exportamos al scope global ──────────────
// Usamos un objeto literal como "namespace" para no contaminar
// el scope global con muchas funciones sueltas.

const API = {

  // ── LIBROS ──────────────────────────────────────────────

  /**
   * Trae TODOS los libros.
   * GET /books
   */
  async getBooks() {
    const response = await fetch(`${API_URL}/books`);
    // .json() convierte la respuesta de texto a objeto JavaScript
    return await response.json();
  },

  /**
   * Trae UN libro por su ID.
   * GET /books/1
   */
  async getBookById(id) {
    const response = await fetch(`${API_URL}/books/${id}`);
    return await response.json();
  },

  /**
   * Crea un libro nuevo.
   * POST /books
   * @param {Object} bookData - Los datos del libro sin ID (el server asigna el ID)
   */
  async createBook(bookData) {
    const response = await fetch(`${API_URL}/books`, {
      method: "POST",
      // Le decimos al server que mandamos JSON
      headers: { "Content-Type": "application/json" },
      // JSON.stringify convierte el objeto JS a texto JSON
      body: JSON.stringify(bookData),
    });
    return await response.json();
  },

  /**
   * Edita un libro existente (reemplaza todos sus campos).
   * PUT /books/1
   * @param {string} id - ID del libro a editar
   * @param {Object} bookData - Los datos nuevos completos
   */
  async updateBook(id, bookData) {
    const response = await fetch(`${API_URL}/books/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookData),
    });
    return await response.json();
  },

  /**
   * Elimina un libro.
   * DELETE /books/1
   */
  async deleteBook(id) {
    await fetch(`${API_URL}/books/${id}`, {
      method: "DELETE",
    });
    // DELETE no retorna cuerpo, así que no hacemos .json()
    return true;
  },

  // ── USUARIOS / AUTENTICACIÓN ─────────────────────────────

  /**
   * Busca un usuario por username y password.
   * GET /users?username=admin&password=admin123
   *
   * Nota: En un proyecto REAL nunca mandarías la contraseña
   * en texto plano. Aquí lo hacemos así por simplicidad educativa.
   */
  async loginUser(username, password) {
    const response = await fetch(
      `${API_URL}/users?username=${username}&password=${password}`
    );
    const users = await response.json();
    // Si encontró un usuario, devuelve el primero. Si no, devuelve null.
    return users.length > 0 ? users[0] : null;
  },
};
