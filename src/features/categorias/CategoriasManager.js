import { useState } from "react";
import { ConfirmModal } from "../common/Common";
import { clean } from "../../services/normalizers";

export default function CategoriasManager({ data, user, s, showToast }) {
  const { categorias, clientes, fs } = data;
  const [nombre, setNombre] = useState("");
  const [confirm, setConfirm] = useState(null);

  const agregar = async () => {
    const n = clean(nombre).slice(0, 60);
    if (!n) return;
    try { await fs.agregarCategoria(n); setNombre(""); showToast("Categoría añadida"); }
    catch (e) { showToast(e.message || "No se pudo añadir", true); }
  };
  const eliminar = async (k) => {
    try { await fs.eliminarCategoria(k.id); showToast("Categoría eliminada"); }
    catch (e) { showToast(e.message || "No se pudo eliminar", true); }
  };

  return (
    <div>
      <div style={s.title}>CATEGORÍAS</div>
      <div style={s.card}>
        {user.isAdmin
          ? <div style={s.row}>
              <input style={{ ...s.input, flex: 1 }} placeholder="Nueva categoría (ej. Estudiante)" value={nombre} onChange={(e) => setNombre(e.target.value)} onKeyDown={(e) => e.key === "Enter" && agregar()} />
              <button style={s.btn()} onClick={agregar}>Añadir</button>
            </div>
          : <div style={s.muted}>Solo el administrador puede añadir o eliminar categorías.</div>}
      </div>
      <div style={s.card}>
        {categorias.slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).map((k) => (
          <div key={k.id} style={{ ...s.row, padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
            <div><b>{k.nombre}</b><div style={s.muted}>{clientes.filter((c) => c.categoriaId === k.id).length} cliente(s)</div></div>
            {user.isAdmin && <button style={s.btn("danger")} onClick={() => setConfirm(k)}>Eliminar</button>}
          </div>
        ))}
        {!categorias.length && <div style={s.muted}>No hay categorías.</div>}
      </div>
      {confirm && <ConfirmModal s={s} msg={`¿Eliminar la categoría «${confirm.nombre}»? Sus clientes quedarán sin categoría.`} onYes={() => eliminar(confirm)} onClose={() => setConfirm(null)} />}
    </div>
  );
}
