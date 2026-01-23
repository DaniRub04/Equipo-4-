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
const digitsOnly = (s) => (s || "").toString().replace(/[^\d]/g, "");

// =====================
// Clases (POO)
// =====================
class Tarea {
  constructor(nombre, estado = false, telefono = "", email = "") {
    this.id = crypto.randomUUID();
    this.nombre = nombre.trim();
    this.telefono = telefono.trim(); // ejemplo: +52 55 1234 5678
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
      t.id = obj.id; // conservar id
      return t;
    });
  }

  borrarTodo() {
    this.tareas = [];
    this.guardar();
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
// Render (con filtro por nombre o número)
// =====================
const render = () => {
  const q = normalize(buscador?.value);
  const qNum = digitsOnly(buscador?.value);

  let tareas = gestor.tareas;

  // Filtrado: nombre (texto) o teléfono (solo números)
  if (q) {
    tareas = tareas.filter((t) => {
      const nombre = normalize(t.nombre);
      const telDigits = digitsOnly(t.telefono);

      const matchNombre = nombre.includes(q);
      const matchTelefono = qNum ? telDigits.includes(qNum) : false;

      return matchNombre || matchTelefono;
    });
  }

  // Pintar lista
  lista.innerHTML = "";

  tareas.forEach((t) => {
    const inicial = ((t.nombre || "?").trim()[0] || "?").toUpperCase();

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

  // Contador (muestra lo que se está viendo, ya filtrado)
  contador.textContent = `${tareas.length} contacto${tareas.length === 1 ? "" : "s"}`;
};

// =====================
// Eventos
// =====================
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value;
  const lada = selectLada ? selectLada.value : "";
  const telefonoLimpio = inputTelefono.value.replace(/\D/g, "");
  const email = inputEmail.value;

  // Validación básica
  if (!nombre.trim()) return setMensaje(mensaje, "El nombre no puede estar vacío.", "error");
  if (!telefonoLimpio) return setMensaje(mensaje, "El teléfono no puede estar vacío.", "error");

  // ✅ Validación 10 dígitos
  if (telefonoLimpio.length !== 10) {
    return setMensaje(mensaje, "El teléfono debe tener exactamente 10 dígitos.", "error");
  }

  // Unir lada + teléfono limpio
  const telefonoCompleto = lada ? `${lada} ${telefonoLimpio}` : telefonoLimpio;

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
    return;
  }

  if (accion === "editar") {
    const t = gestor.tareas.find((x) => x.id === id);
    if (!t) return;

    const nuevoNombre = prompt("Nombre:", t.nombre);
    if (nuevoNombre === null) return;

    // Aquí lo editas como string completo (incluye LADA). Es simple y funciona.
    const nuevoTelefono = prompt("Teléfono (con LADA, ej. +52 55 1234 5678):", t.telefono);
    if (nuevoTelefono === null) return;

    const nuevoEmail = prompt("Correo:", t.email);
    if (nuevoEmail === null) return;

    const err = validar({ nombre: nuevoNombre, telefono: nuevoTelefono });
    if (err) return setMensaje(mensaje, err, "error");

    gestor.editar(id, {
      nombre: nuevoNombre,
      telefono: nuevoTelefono,
      email: nuevoEmail,
    });

    setMensaje(mensaje, "Contacto actualizado.", "ok");
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
  if (!gestor.tareas.length) return setMensaje(mensaje, "No hay contactos para borrar.", "error");

  const ok = confirm("¿Seguro que deseas borrar todos los contactos?");
  if (!ok) return;

  gestor.borrarTodo();
  setMensaje(mensaje, "Lista borrada.", "ok");
  buscador.value = "";
  render();
});

// =====================
// Inicio
// =====================
render();
