// ===== Helpers =====
const $ = (selector) => document.querySelector(selector);

const setMensaje = (el, texto, tipo = "") => {
  el.textContent = texto;
  el.className = "mensaje";
  if (tipo === "error") el.classList.add("mensaje--error");
  if (tipo === "ok") el.classList.add("mensaje--ok");
};

// Normaliza texto para búsquedas (quita espacios extra, minúsculas)
const normalize = (s) => (s || "").toString().trim().toLowerCase();

// Normaliza números (quita espacios, guiones, paréntesis)
const normalizePhone = (s) => (s || "").toString().replace(/[^\d]/g, "");

// ===== POO (NOMBRES que te piden en la consigna) =====
class Tarea {
  // En UI representa un contacto
  constructor(nombre, estado = false, telefono = "", email = "") {
    this.id = crypto.randomUUID();
    this.nombre = nombre.trim();
    this.telefono = telefono.trim();
    this.email = email.trim();
    this.estado = Boolean(estado); // completa/incompleta (lo usamos como "activo")
  }

  actualizarEstado(nuevoEstado) {
    this.estado = Boolean(nuevoEstado);
  }

  editarContenido({ nombre, telefono, email }) {
    if (nombre !== undefined) this.nombre = nombre.trim();
    if (telefono !== undefined) this.telefono = telefono.trim();
    if (email !== undefined) this.email = email.trim();
  }

  eliminar() {
    return this.id;
  }
}

class GestorDeTareas {
  constructor() {
    this.tareas = [];
    this.ordenAZ = false;
    this.cargarDesdeLocalStorage();
  }

  agregarTarea(tarea) {
    this.tareas.push(tarea);
    this.guardarEnLocalStorage();
  }

  actualizarEstado(id, estado) {
    const t = this.tareas.find((x) => x.id === id);
    if (t) t.actualizarEstado(estado);
    this.guardarEnLocalStorage();
  }

  editarTarea(id, data) {
    const t = this.tareas.find((x) => x.id === id);
    if (t) t.editarContenido(data);
    this.guardarEnLocalStorage();
  }

  eliminarTarea(id) {
    this.tareas = this.tareas.filter((x) => x.id !== id);
    this.guardarEnLocalStorage();
  }

  borrarTodo() {
    this.tareas = [];
    this.guardarEnLocalStorage();
  }

  toggleOrden() {
    this.ordenAZ = !this.ordenAZ;
  }

  getTareasOrdenadas(tareas) {
    if (!this.ordenAZ) return tareas;
    return [...tareas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }

  guardarEnLocalStorage() {
    localStorage.setItem("tareas", JSON.stringify(this.tareas));
    localStorage.setItem("ordenAZ", JSON.stringify(this.ordenAZ));
  }

  cargarDesdeLocalStorage() {
    const data = JSON.parse(localStorage.getItem("tareas") || "[]");
    this.ordenAZ = JSON.parse(localStorage.getItem("ordenAZ") || "false");

    this.tareas = data.map((obj) => {
      const t = new Tarea(obj.nombre, obj.estado, obj.telefono, obj.email);
      t.id = obj.id;
      return t;
    });
  }
}

// ===== DOM =====
const gestor = new GestorDeTareas();

const form = $("#formContacto");
const inputNombre = $("#nombre");
const inputTelefono = $("#telefono");
const inputEmail = $("#email");
const mensaje = $("#mensaje");

const buscador = $("#buscador");
const lista = $("#listaTareas");
const contador = $("#contador");

const btnBorrarTodo = $("#btnBorrarTodo");
const btnOrdenar = $("#btnOrdenar");

// Modal
const overlay = $("#modalOverlay");
const btnCerrarModal = $("#btnCerrarModal");
const btnCancelar = $("#btnCancelar");
const formEditar = $("#formEditar");
const editId = $("#editId");
const editNombre = $("#editNombre");
const editTelefono = $("#editTelefono");
const editEmail = $("#editEmail");
const mensajeModal = $("#mensajeModal");

// ===== Validación =====
const validarContacto = ({ nombre, telefono, email }) => {
  if (!nombre.trim()) return "El nombre no puede estar vacío.";
  if (email.trim() && !email.includes("@")) return "El correo no parece válido.";
  if (telefono.trim() && normalizePhone(telefono).length > 0 && normalizePhone(telefono).length < 7) {
    return "El teléfono es muy corto.";
  }
  return "";
};

const limpiarFormulario = () => {
  inputNombre.value = "";
  inputTelefono.value = "";
  inputEmail.value = "";
  inputNombre.focus();
};

const actualizarContador = (total) => {
  contador.textContent = `${total} contacto${total === 1 ? "" : "s"}`;
};

// ===== Render con filtro y orden =====
const getFiltradas = () => {
  const q = normalize(buscador.value);
  const phoneQ = normalizePhone(buscador.value);

  // si no hay búsqueda, regresamos todas
  if (!q) return gestor.getTareasOrdenadas(gestor.tareas);

  const filtradas = gestor.tareas.filter((t) => {
    const n = normalize(t.nombre);
    const p = normalizePhone(t.telefono);
    return n.includes(q) || (phoneQ && p.includes(phoneQ));
  });

  return gestor.getTareasOrdenadas(filtradas);
};

const render = () => {
  const tareasParaMostrar = getFiltradas();

  lista.innerHTML = "";

  // forEach (consigna)
  tareasParaMostrar.forEach((t) => {
    const inicial = (t.nombre.trim()[0] || "?").toUpperCase();

    const li = document.createElement("li");
    li.className = "item";

    // template literals (consigna)
    li.innerHTML = `
      <div class="itemLeft">
        <div class="avatar" aria-hidden="true">${inicial}</div>

        <div class="itemInfo">
          <p class="itemTitle">${t.nombre}</p>

          <div class="metaRow">
            <span><i class="fa-solid fa-phone"></i> ${t.telefono ? t.telefono : "(sin teléfono)"}</span>
            <span><i class="fa-solid fa-envelope"></i> ${t.email ? t.email : "(sin correo)"}</span>
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

  // contador basado en lo que se muestra (queda mejor con búsqueda)
  actualizarContador(tareasParaMostrar.length);
};

// ===== Modal =====
const abrirModal = (tarea) => {
  editId.value = tarea.id;
  editNombre.value = tarea.nombre;
  editTelefono.value = tarea.telefono;
  editEmail.value = tarea.email;
  setMensaje(mensajeModal, "");
  overlay.classList.remove("hidden");
  editNombre.focus();
};

const cerrarModal = () => {
  overlay.classList.add("hidden");
  setMensaje(mensajeModal, "");
};

btnCerrarModal.addEventListener("click", cerrarModal);
btnCancelar.addEventListener("click", cerrarModal);

// cerrar modal al dar click fuera
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) cerrarModal();
});

// ESC cierra modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !overlay.classList.contains("hidden")) cerrarModal();
});

// ===== Eventos =====
form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nombre = inputNombre.value;
  const telefono = inputTelefono.value;
  const email = inputEmail.value;

  const error = validarContacto({ nombre, telefono, email });
  if (error) return setMensaje(mensaje, error, "error");

  const nueva = new Tarea(nombre, false, telefono, email);
  gestor.agregarTarea(nueva);

  setMensaje(mensaje, "Contacto agregado.", "ok");
  limpiarFormulario();
  render();
});

buscador.addEventListener("input", () => {
  render();
});

// Delegación (editar/eliminar/estado)
lista.addEventListener("click", (e) => {
  const el = e.target.closest("[data-accion]");
  if (!el) return;

  const accion = el.dataset.accion;
  const id = el.dataset.id;

  if (accion === "eliminar") {
    gestor.eliminarTarea(id);
    setMensaje(mensaje, "Contacto eliminado.", "ok");
    render();
    return;
  }

  if (accion === "editar") {
    const tarea = gestor.tareas.find((x) => x.id === id);
    if (!tarea) return;
    abrirModal(tarea);
  }
});

lista.addEventListener("change", (e) => {
  const chk = e.target.closest('[data-accion="estado"]');
  if (!chk) return;

  gestor.actualizarEstado(chk.dataset.id, chk.checked);
  setMensaje(mensaje, "Estado actualizado.", "ok");
  render();
});

// Guardar edición desde modal
formEditar.addEventListener("submit", (e) => {
  e.preventDefault();

  const id = editId.value;
  const nombre = editNombre.value;
  const telefono = editTelefono.value;
  const email = editEmail.value;

  const error = validarContacto({ nombre, telefono, email });
  if (error) return setMensaje(mensajeModal, error, "error");

  gestor.editarTarea(id, { nombre, telefono, email });
  setMensaje(mensaje, "Contacto actualizado.", "ok");
  cerrarModal();
  render();
});

btnBorrarTodo.addEventListener("click", () => {
  if (gestor.tareas.length === 0) return setMensaje(mensaje, "No hay contactos para borrar.", "error");
  const ok = confirm("¿Seguro que quieres borrar todos los contactos?");
  if (!ok) return;

  gestor.borrarTodo();
  setMensaje(mensaje, "Lista borrada.", "ok");
  buscador.value = "";
  render();
});

btnOrdenar.addEventListener("click", () => {
  gestor.toggleOrden();
  gestor.guardarEnLocalStorage();
  setMensaje(mensaje, gestor.ordenAZ ? "Orden A–Z activado." : "Orden A–Z desactivado.", "ok");
  render();
});

// Primer render
render();
