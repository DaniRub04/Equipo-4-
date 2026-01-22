// =====================
// Helpers
// =====================
const $ = (selector) => document.querySelector(selector);

const setMensaje = (el, texto, tipo = "") => {
  el.textContent = texto;
  el.className = "mensaje";
  if (tipo === "error") el.classList.add("mensaje--error");
  if (tipo === "ok") el.classList.add("mensaje--ok");
};

const normalize = (s) => (s || "").toString().trim().toLowerCase();
const normalizePhone = (s) => (s || "").toString().replace(/[^\d]/g, "");

// =====================
// Clases (POO)
// =====================
class Tarea {
  constructor(nombre, estado = false, telefono = "", email = "") {
    this.id = crypto.randomUUID();
    this.nombre = nombre.trim();
    this.telefono = telefono.trim(); // +52 55 1234 5678
    this.email = email.trim();
    this.estado = Boolean(estado);
  }

  actualizarEstado(nuevoEstado) {
    this.estado = Boolean(nuevoEstado);
  }

  editarContenido({ nombre, telefono, email }) {
    if (nombre !== undefined) this.nombre = nombre.trim();
    if (telefono !== undefined) this.telefono = telefono.trim();
    if (email !== undefined) this.email = email.trim();
  }
}

class GestorDeTareas {
  constructor() {
    this.tareas = [];
    this.cargar();
  }

  agregar(tarea) {
    this.tareas.push(tarea);
    this.guardar();
  }

  eliminar(id) {
    this.tareas = this.tareas.filter((t) => t.id !== id);
    this.guardar();
  }

  editar(id, data) {
    const t = this.tareas.find((x) => x.id === id);
    if (t) t.editarContenido(data);
    this.guardar();
  }

  actualizarEstado(id, estado) {
    const t = this.tareas.find((x) => x.id === id);
    if (t) t.actualizarEstado(estado);
    this.guardar();
  }

  guardar() {
    localStorage.setItem("tareas", JSON.stringify(this.tareas));
  }

  cargar() {
    const data = JSON.parse(localStorage.getItem("tareas") || "[]");
    this.tareas = data.map((obj) => {
      const t = new Tarea(obj.nombre, obj.estado, obj.telefono, obj.email);
      t.id = obj.id;
      return t;
    });
  }
}

// =====================
// DOM
// =====================
const gestor = new GestorDeTareas();

const form = $("#formContacto");
const inputNombre = $("#nombre");
const inputTelefono = $("#telefono");
const inputEmail = $("#email");
const selectLada = $("#lada");

const buscador = $("#buscador");
const lista = $("#listaTareas");
const contador = $("#contador");
const mensaje = $("#mensaje");
const btnBorrarTodo = $("#btnBorrarTodo");

// =====================
// Validación
// =====================
const validar = ({ nombre, telefono }) => {
  if (!nombre.trim()) return "El nombre no puede estar vacío.";
  if (!telefono.trim()) return "El teléfono no puede estar vacío.";
  return "";
};

// =====================
// Render
// =====================
const render = () => {
  const filtro = normalize(buscador.value);
  const phoneFiltro = normalizePhone(buscador.value);

  let tareas = gestor.tareas;

  if (filtro) {
    tareas = tareas.filter((t) => {
      return (
        normalize(t.nombre).includes(filtro) ||
        normalizePhone(t.telefono).includes(phoneFiltro)
      );
    });
  }

  lista.innerHTML = "";

  tareas.forEach((t) => {
    const inicial = (t.nombre[0] || "?").toUpperCase();

    const li = document.createElement("li");
    li.className = "item";

    li.innerHTML = `
      <div class="itemLeft">
        <div class="avatar">${inicial}</div>

        <div class="itemInfo">
          <p class="itemTitle">${t.nombre}</p>

          <div class="metaRow">
            <span><i class="fa-solid fa-phone"></i> ${t.telefono}</span>
            <span><i class="fa-solid fa-envelope"></i> ${t.email || "(sin correo)"}</span>
          </div>

          <label class="badge">
            <input type="checkbox" ${t.estado ? "checked" : ""} data-accion="estado" data-id="${t.id}">
            Activo
          </label>
        </div>
      </div>

      <div class="itemActions">
        <button class="btn" data-accion="editar" data-id="${t.id}">
          <i class="fa-solid fa-pen"></i> Editar
        </button>
        <button class="btn btnDanger" data-accion="eliminar" data-id="${t.id}">
          <i class="fa-solid fa-trash"></i> Eliminar
        </button>
      </div>
    `;

    lista.appendChild(li);
  });

  contador.textContent = `${tareas.length} contacto${tareas.length === 1 ? "" : "s"}`;
};

// =====================
// Eventos
// =====================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value;
  const lada = selectLada.value;
  const telefono = inputTelefono.value;
  const email = inputEmail.value;

  const error = validar({ nombre, telefono });
  if (error) return setMensaje(mensaje, error, "error");

  // 👉 AQUÍ SE UNE LA LADA + TELÉFONO
  const telefonoCompleto = `${lada} ${telefono}`;

  const nueva = new Tarea(nombre, false, telefonoCompleto, email);
  gestor.agregar(nueva);

  setMensaje(mensaje, "Contacto agregado correctamente.", "ok");

  form.reset();
  render();
});

lista.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-accion]");
  if (!btn) return;

  const id = btn.dataset.id;
  const accion = btn.dataset.accion;

  if (accion === "eliminar") {
    gestor.eliminar(id);
    setMensaje(mensaje, "Contacto eliminado.", "ok");
    render();
  }

  if (accion === "editar") {
    const t = gestor.tareas.find((x) => x.id === id);
    if (!t) return;

    const nuevoNombre = prompt("Nombre:", t.nombre);
    if (nuevoNombre === null) return;

    const nuevoTelefono = prompt("Teléfono (con LADA):", t.telefono);
    if (nuevoTelefono === null) return;

    const nuevoEmail = prompt("Correo:", t.email);
    if (nuevoEmail === null) return;

    gestor.editar(id, {
      nombre: nuevoNombre,
      telefono: nuevoTelefono,
      email: nuevoEmail,
    });

    render();
  }
});

lista.addEventListener("change", (e) => {
  const chk = e.target.closest('[data-accion="estado"]');
  if (!chk) return;

  gestor.actualizarEstado(chk.dataset.id, chk.checked);
  render();
});

buscador.addEventListener("input", render);

btnBorrarTodo.addEventListener("click", () => {
  if (!gestor.tareas.length) return;

  const ok = confirm("¿Seguro que deseas borrar todos los contactos?");
  if (!ok) return;

  gestor.tareas = [];
  gestor.guardar();
  render();
});

// =====================
// Inicio
// =====================
render();
