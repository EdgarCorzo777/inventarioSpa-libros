# 📚 LibroStock — Guía paso a paso

Disección completa del proyecto: desde cómo arranca la app hasta cómo funciona cada operación del CRUD.

---

## 📍 Orden de aprendizaje

Seguimos el **flujo real de ejecución** de la app:

```
El navegador carga index.html
    → ejecuta los scripts
    → app.js arranca
    → verifica sesión (auth.js)
    → router decide qué vista mostrar
    → la vista se renderiza en el DOM
    → el usuario hace login (login.js)
    → el router protege rutas
    → el usuario hace CRUD (inventory.js ↔ api.js)
```

---

## Paso 1 — `index.html`: El único HTML de toda la app

```html
<main id="app">
  <!-- Las vistas se renderizan aquí -->
</main>
```

**¿Por qué solo un HTML?** Porque esto es una **SPA** (Single Page Application). En vez de tener `login.html`, `dashboard.html`, `inventory.html`... tienes **un solo div** (`#app`) donde JavaScript inyecta el HTML de cada "página". El navegador nunca recarga.

```html
<!-- El orden de carga importa -->
<script src="js/api.js"></script>      <!-- 1ro: capa de datos -->
<script src="js/auth.js"></script>     <!-- 2do: necesita API -->
<script src="js/views/login.js"></script>
<script src="js/views/dashboard.js"></script>
<script src="js/views/inventory.js"></script>
<script src="js/router.js"></script>   <!-- necesita las vistas -->
<script src="js/app.js"></script>      <!-- último: orquesta todo -->
```

Cada script se carga en **scope global** (sin módulos ES6), entonces el orden garantiza que cuando `router.js` usa `LoginView`, ese objeto ya existe.

---

## Paso 2 — `api.js`: La capa de comunicación

Todo lo que habla con JSON Server vive aquí. La idea es que **ningún otro archivo use `fetch()` directamente**.

```js
const API_URL = "http://localhost:3001";
```

Una sola constante. Si el día de mañana cambias el puerto, solo editas esta línea.

```js
const API = {
  async getBooks() {
    const response = await fetch(`${API_URL}/books`);
    return await response.json();
  }
}
```

**¿Qué pasa aquí paso a paso?**

```
fetch(url)
  → hace una petición HTTP GET al servidor
  → devuelve una Promise con la "respuesta cruda"

await response.json()
  → lee el cuerpo de la respuesta
  → lo convierte de texto JSON → objeto JavaScript
  → devuelve el array de libros
```

Para **crear** un libro (POST):

```js
async createBook(bookData) {
  const response = await fetch(`${API_URL}/books`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(bookData),
  });
  return await response.json();
}
```

`JSON.stringify({ title: "1984", author: "Orwell" })` convierte el objeto a texto:
`'{"title":"1984","author":"Orwell"}'`

Ese texto viaja en el cuerpo de la petición HTTP. El header `Content-Type: application/json` le dice al servidor *"lo que te mando es JSON, no un formulario"*.

**La diferencia entre los métodos HTTP:**

| Método | Cuándo usarlo | ¿Manda body? |
|--------|--------------|--------------|
| GET | Leer datos | No |
| POST | Crear nuevo registro | Sí |
| PUT | Reemplazar registro completo | Sí |
| DELETE | Eliminar | No |

---

## Paso 3 — `auth.js`: Sesión persistente con localStorage

```js
const SESSION_KEY = "librostock_user";

const Auth = {
  currentUser: null,   // usuario en memoria (RAM)
```

Hay **dos lugares** donde se guarda al usuario:

1. **`Auth.currentUser`** — en memoria. Vive mientras el tab está abierto.
2. **`localStorage`** — en el disco del navegador. Persiste aunque cierres el tab.

**Al hacer login:**

```js
async login(username, password) {
  // 1. Preguntar a la API
  const user = await API.loginUser(username, password);

  if (user) {
    // 2. Guardar en memoria
    this.currentUser = user;

    // 3. Guardar en localStorage
    // JSON.stringify: objeto → texto
    localStorage.setItem(SESSION_KEY, JSON.stringify(user));

    return user;
  }
  return null;
}
```

**Al cargar la app (sesión persistente):**

```js
checkSession() {
  const savedUser = localStorage.getItem(SESSION_KEY);

  if (savedUser) {
    // JSON.parse: texto → objeto
    this.currentUser = JSON.parse(savedUser);
    return this.currentUser;
  }
  return null;
}
```

**Visualiza el localStorage así:**

```
localStorage["librostock_user"] = '{"id":"1","name":"Administrador","role":"admin"}'
                                   ↑ esto es un STRING, no un objeto
```

Por eso necesitas `JSON.parse()` para leerlo como objeto JS.

**Al hacer logout:**

```js
logout() {
  this.currentUser = null;              // limpiar memoria
  localStorage.removeItem(SESSION_KEY); // limpiar disco
}
```

---

## Paso 4 — `router.js`: El corazón de la SPA

El router usa el **hash de la URL**:

```
http://localhost:3000/index.html#dashboard
                                 ↑ esto es el hash
```

Cuando el hash cambia, el navegador **NO recarga la página**. Nosotros escuchamos ese cambio.

**Registro de rutas:**

```js
routes: {
  login:     () => LoginView.render(),
  dashboard: () => DashboardView.render(),
  inventory: () => InventoryView.render(),
},
```

Un objeto que mapea nombre → función. Cuando el router quiere mostrar una vista, ejecuta `this.routes["dashboard"]()`, que es lo mismo que `DashboardView.render()`.

**El método `handleRoute()` — el corazón del router:**

```js
handleRoute() {
  // Leer el hash actual: "#dashboard" → "dashboard"
  const hash = window.location.hash.replace("#", "") || "login";

  // ¿Ruta protegida + usuario no logueado?
  const isProtected = this.protectedRoutes.includes(hash);
  const isLoggedIn  = Auth.isAuthenticated();

  if (isProtected && !isLoggedIn) {
    this.navigate("login");  // → redirigir
    return;
  }

  if (hash === "login" && isLoggedIn) {
    this.navigate("dashboard"); // → no tiene sentido ver el login
    return;
  }

  // Todo bien: renderizar
  this.renderView(hash);
}
```

**Diagrama de flujo del router:**

```
URL cambia a #inventory
    ↓
¿"inventory" está en protectedRoutes?  → SÍ
    ↓
¿Auth.currentUser !== null?
    ├── NO  → navigate("login")
    └── SÍ  → renderView("inventory")
                  ↓
              InventoryView.render()
                  ↓
              document.getElementById("app").innerHTML = ...
```

**Escuchar el cambio de hash:**

```js
window.addEventListener("hashchange", () => this.handleRoute());
```

Y para navegar:

```js
navigate(routeName) {
  window.location.hash = routeName;
  // Esto dispara automáticamente el evento "hashchange"
}
```

---

## Paso 5 — `app.js`: El director de orquesta

```js
document.addEventListener("DOMContentLoaded", () => {
```

`DOMContentLoaded` se dispara cuando el HTML está completamente parseado. Es el momento seguro para tocar el DOM.

```js
  // 1. ¿Hay sesión guardada?
  const savedUser = Auth.checkSession();
  if (savedUser) {
    showNavbar(savedUser); // mostrar barra de navegación
  }

  // 2. Botón de logout
  document.getElementById("btn-logout").addEventListener("click", () => {
    Auth.logout();
    hideNavbar();
    Router.navigate("login");
  });

  // 3. Iniciar el router
  Router.init();
```

**Flujo completo al abrir la app por primera vez:**

```
DOMContentLoaded
  → Auth.checkSession() → null (no hay sesión)
  → Router.init()
      → handleRoute()
          → hash = "" → default "login"
          → "login" no es protegida
          → LoginView.render()
              → app.innerHTML = "<form>..."
```

**Flujo al volver a abrir la app (sesión existente):**

```
DOMContentLoaded
  → Auth.checkSession() → { id: "1", name: "Admin" }
  → showNavbar({ name: "Admin" })
  → Router.init()
      → handleRoute()
          → hash = "" → default "login"
          → hash === "login" && isLoggedIn → navigate("dashboard")
              → hashchange → handleRoute()
                  → DashboardView.render()
```

---

## Paso 6 — `login.js`: La vista del formulario

```js
render() {
  const app = document.getElementById("app");

  // Inyectar HTML en el div #app
  app.innerHTML = `
    <div class="login-page">
      <form id="login-form">
        <input type="text" id="username" />
        <input type="password" id="password" />
        <button type="submit">Ingresar</button>
      </form>
    </div>
  `;

  // IMPORTANTE: primero render, después eventos
  this.setupEvents();
}
```

**¿Por qué llamar `setupEvents()` DESPUÉS de `render()`?**

Porque si intentas hacer `document.getElementById("login-form")` antes de que exista en el DOM, obtienes `null`. El HTML debe estar inyectado primero.

```js
setupEvents() {
  const form = document.getElementById("login-form");

  form.addEventListener("submit", async (e) => {
    e.preventDefault(); // ← CRÍTICO: evita recarga de página

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    const user = await Auth.login(username, password);

    if (user) {
      showNavbar(user);
      Router.navigate("dashboard");
    } else {
      // Mostrar error
      document.getElementById("login-error").classList.remove("hidden");
    }
  });
}
```

`e.preventDefault()` es lo que evita que el formulario recargue la página al hacer submit (comportamiento nativo del HTML).

---

## Paso 7 — `dashboard.js`: Render asíncrono

```js
async render() {
  const app = document.getElementById("app");

  // FASE 1: Estructura inmediata (con placeholders "—")
  app.innerHTML = `
    <div class="stat-number" id="stat-titles">—</div>
    ...
  `;

  // FASE 2: Pedir datos (puede tardar)
  const books = await API.getBooks();

  // FASE 3: Actualizar el DOM con los datos reales
  this.updateStats(books);
}
```

**¿Por qué mostrar primero la estructura vacía?**

Sin esto, el usuario vería pantalla en blanco durante la petición. Con esto, ve los números `—` y luego se actualizan. Se llama *skeleton loading*.

**Cálculos estadísticos:**

```js
updateStats(books) {
  // reduce() acumula valores
  // empieza en 0, por cada libro suma su stock
  const totalUnits = books.reduce((sum, book) => sum + book.stock, 0);
  //                              ↑acumulador  ↑elemento actual

  // filter() devuelve solo los que cumplen la condición
  const lowStock   = books.filter(b => b.stock > 0 && b.stock < 5).length;
  const outOfStock = books.filter(b => b.stock === 0).length;
}
```

**Construir la tabla con `map()` + `join()`:**

```js
`<tbody>
  ${books.map(book => `
    <tr>
      <td>${book.title}</td>
      <td>${book.stock}</td>
    </tr>
  `).join("")}
</tbody>`
```

`map()` transforma cada libro en un string `<tr>...</tr>`. El resultado es un array de strings. `join("")` los une en un solo string sin separadores. El resultado es el HTML completo de la tabla.

---

## Paso 8 — `inventory.js`: El CRUD completo

### READ — Cargar libros

```js
async loadBooks() {
  this.books = await API.getBooks(); // guardar en memoria local
  this.renderTable(this.books);      // pintar la tabla
}
```

Guardamos los libros en `this.books` para poder filtrarlos localmente sin hacer un fetch adicional.

### CREATE — Crear libro

```js
async saveBook() {
  const id = document.getElementById("book-id").value; // "" si es nuevo

  const bookData = {
    title:  document.getElementById("book-title").value.trim(),
    price:  parseInt(document.getElementById("book-price").value),
    stock:  parseInt(document.getElementById("book-stock").value),
    // ...
  };

  if (id) {
    await API.updateBook(id, { ...bookData, id }); // PUT
  } else {
    await API.createBook(bookData);                // POST
  }

  this.closeModal();
  await this.loadBooks(); // recargar la tabla
}
```

El `<input type="hidden" id="book-id">` es el truco para distinguir "crear" de "editar". Si está vacío → POST. Si tiene un valor → PUT.

### UPDATE — Editar libro (prellenar formulario)

```js
async editBook(id) {
  // Buscar en el array LOCAL (sin fetch)
  const book = this.books.find(b => b.id === id);

  // Abrir modal
  this.openModal("Editar libro");

  // Prellenar CADA campo con los datos actuales
  document.getElementById("book-id").value    = book.id;    // ← el truco
  document.getElementById("book-title").value = book.title;
  document.getElementById("book-stock").value = book.stock;
  // ...
}
```

### DELETE — Eliminar

```js
async deleteBook(id) {
  const book = this.books.find(b => b.id === id);

  // Confirmar antes de borrar (UX)
  const confirmed = confirm(`¿Eliminar "${book.title}"?`);
  if (!confirmed) return;

  await API.deleteBook(id);
  await this.loadBooks(); // actualizar tabla
}
```

### Delegación de eventos

En vez de poner un listener en cada botón ✏️🗑️ de cada fila (que se recrean cada vez que se re-renderiza la tabla), ponemos **uno solo** en el contenedor:

```js
document.getElementById("books-container").addEventListener("click", async (e) => {
  // e.target = el elemento exacto que se clickeó
  // .closest() sube por el DOM hasta encontrar el selector
  const editBtn   = e.target.closest(".btn-edit");
  const deleteBtn = e.target.closest(".btn-delete");

  if (editBtn)   await this.editBook(editBtn.dataset.id);
  if (deleteBtn) await this.deleteBook(deleteBtn.dataset.id);
});
```

`data-id` es un atributo HTML personalizado que guarda el ID del libro en cada botón:

```html
<button class="btn-edit" data-id="3">✏️</button>
```

`editBtn.dataset.id` lee ese atributo → `"3"`.

### Búsqueda en tiempo real

```js
document.getElementById("search-input").addEventListener("input", (e) => {
  this.filterBooks(e.target.value);
});

filterBooks(query) {
  const q = query.toLowerCase().trim();

  if (!q) {
    this.renderTable(this.books); // mostrar todos
    return;
  }

  // Filtrar el array en memoria (sin fetch)
  const filtered = this.books.filter(book =>
    book.title.toLowerCase().includes(q)  ||
    book.author.toLowerCase().includes(q) ||
    book.genre.toLowerCase().includes(q)
  );

  this.renderTable(filtered); // renderizar solo los que coinciden
}
```

El evento `input` se dispara con cada tecla. Filtramos el array `this.books` que ya está en memoria — no hacemos ningún fetch — por eso es instantáneo.

---

## 🗺️ Resumen visual del flujo completo

```
index.html carga los scripts
        ↓
app.js: DOMContentLoaded
        ↓
   Auth.checkSession()
   ├── SÍ hay sesión → showNavbar() → Router.init() → dashboard
   └── NO hay sesión → Router.init() → login
        ↓
LoginView.render() → inyecta el form en #app
        ↓
Usuario escribe y da submit
        ↓
Auth.login() → API.loginUser() → fetch GET /users?username=...
        ↓
   ├── null → mostrar error en el DOM
   └── user → localStorage.setItem() → navigate("dashboard")
                    ↓
              hashchange → Router.handleRoute()
                    ↓
              ¿protectedRoutes? ¿isAuthenticated? → SÍ
                    ↓
              DashboardView.render()
              → inyecta estructura vacía
              → await API.getBooks()
              → updateStats() → getElementById().textContent = valor
```

---

## 📋 Conceptos clave — Resumen rápido

| Concepto | Qué hace | Dónde |
|---|---|---|
| `innerHTML` | Inyecta HTML como string en el DOM | Todas las vistas |
| `addEventListener` | Escucha eventos (click, submit, input) | Todas las vistas |
| `fetch()` | Hace peticiones HTTP | `api.js` |
| `JSON.stringify()` | Objeto JS → texto JSON | `auth.js`, `api.js` |
| `JSON.parse()` | Texto JSON → objeto JS | `auth.js` |
| `localStorage` | Guardar datos en el navegador | `auth.js` |
| `hashchange` | Detectar cambio de ruta | `router.js` |
| `e.preventDefault()` | Evitar recarga del formulario | `login.js` |
| `data-id` | Atributo personalizado en HTML | `inventory.js` |
| `dataset.id` | Leer atributo `data-id` en JS | `inventory.js` |
| `.closest()` | Subir por el DOM hasta un selector | `inventory.js` |
| `reduce()` | Acumular valores de un array | `dashboard.js` |
| `filter()` | Filtrar elementos de un array | `dashboard.js`, `inventory.js` |
| `map()` + `join("")` | Convertir array en string HTML | `dashboard.js`, `inventory.js` |
