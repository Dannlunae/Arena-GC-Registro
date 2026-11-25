import { useState, useMemo, useEffect } from "react";
import { Avatar, Modal, ConfirmModal } from "../common/Common";
import { norm, porNombre, normalizarCliente, validarCliente, nom } from "../../services/normalizers";
import { subirArchivo, borrarArchivo, urlArchivo } from "../../services/files";
import { FOTOS_ACTIVAS } from "../../constants";

const VACIO = { nombres: "", apellidos: "", dni: "", apodo: "", categoriaId: "" };

export function PhotoViewer({ s, localId, c, onClose }) {
  const [url, setUrl] = useState(null), [err, setErr] = useState("");
  useEffect(() => { urlArchivo(localId, c.id).then(setUrl).catch(() => setErr("No se pudo cargar el archivo")); }, [localId, c.id]);
  return (
    <Modal s={s} onClose={onClose} title={nom(c)}>
      {err && <div style={{ color: "#b91c1c" }}>{err}</div>}
      {!url && !err && <div style={s.muted}>Cargando…</div>}
      {url && (c.foto === "pdf"
        ? <a href={url} target="_blank" rel="noopener noreferrer" style={{ ...s.btn(), textDecoration: "none", display: "inline-block" }}>Abrir PDF</a>
        : <img src={url} alt="" style={{ maxWidth: "100%", borderRadius: 10 }} />)}
      <div style={{ ...s.row, justifyContent: "flex-end", marginTop: 12 }}><button style={s.btn("secondary")} onClick={onClose}>Cerrar</button></div>
    </Modal>
  );
}

export default function ClientesManager({ data, user, s, showToast, nuevoPre, onNuevoConsumido, onVer }) {
  const { clientes, categorias, fs, localId } = data;
  const [q, setQ] = useState("");
  const [form, setForm] = useState(null); // null = cerrado · {id?, ...campos}
  const [file, setFile] = useState(null);
  const [quitar, setQuitar] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  useEffect(() => { // viene desde «Ingresar» con lo que se buscó
    if (typeof nuevoPre !== "string") return;
    const pre = nuevoPre.trim();
    setForm({ ...VACIO, ...(/^\d{8}$/.test(pre) ? { dni: pre } : { nombres: pre }) }); setFile(null); setQuitar(false);
    onNuevoConsumido();
  }, [nuevoPre]); // eslint-disable-line

  const lista = useMemo(() => {
    const k = norm(q);
    return clientes.filter((c) => !k || norm(`${c.nombres} ${c.apellidos} ${c.apodo} ${c.dni}`).includes(k)).sort(porNombre);
  }, [clientes, q]);
  const catName = (id) => (categorias.find((k) => k.id === id) || {}).nombre || "";
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const abrir = (c) => { setForm(c ? { ...c } : { ...VACIO }); setFile(null); setQuitar(false); };

  const guardar = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const c = normalizarCliente(form); validarCliente(c);
      let id = form.id;
      if (id) await fs.editarCliente(id, c); else id = await fs.crearCliente(c);
      if (quitar && form.foto) { await borrarArchivo(localId, id); await fs.setFoto(id, ""); }
      if (file) {
        try { const tipo = await subirArchivo(localId, id, file); await fs.setFoto(id, tipo); }
        catch (e) { showToast("Cliente guardado, pero el archivo no se subió: " + e.message, true); setForm(null); return; }
      }
      showToast("Guardado"); setForm(null);
    } catch (e) { showToast(e.message || "No se pudo guardar", true); }
    finally { setSaving(false); }
  };
  const eliminar = async () => {
    try {
      await fs.eliminarCliente(form.id);
      if (form.foto) await borrarArchivo(localId, form.id);
      showToast("Cliente eliminado"); setForm(null);
    } catch (e) { showToast(e.message || "No se pudo eliminar", true); }
  };

  return (
    <div>
      <div style={s.title}>CLIENTES</div>
      <div style={s.card}>
        <div style={s.row}>
          <input style={{ ...s.input, flex: 1, minWidth: 180 }} placeholder="Buscar por DNI, nombre o apodo…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button style={s.btn()} onClick={() => abrir(null)}>+ Nuevo cliente</button>
        </div>
      </div>
      <div style={s.card}>
        {lista.map((c) => (
          <div key={c.id} style={{ ...s.row, flexWrap: "nowrap", padding: "8px 0", borderBottom: "1px solid #e5e7eb" }}>
            <Avatar c={c} onClick={() => onVer(c)} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800 }}>{c.nombres} {c.apellidos} {c.apodo && <span style={s.muted}>«{c.apodo}»</span>}</div>
              <div style={s.muted}>{c.dni ? `DNI ${c.dni}` : "sin DNI"} {catName(c.categoriaId) && <span style={s.tag("#f3f4f6", "#6b7280")}>{catName(c.categoriaId)}</span>}</div>
            </div>
            <button style={s.btn("secondary")} onClick={() => abrir(c)}>Editar</button>
          </div>
        ))}
        {!lista.length && <div style={s.muted}>Sin clientes.</div>}
      </div>

      {form && (
        <Modal s={s} onClose={() => setForm(null)} title={form.id ? "EDITAR CLIENTE" : "NUEVO CLIENTE"}>
          <div style={{ display: "grid", gap: 8 }}>
            <input style={s.input} placeholder="Nombres" maxLength={80} value={form.nombres} onChange={set("nombres")} autoFocus />
            <input style={s.input} placeholder="Apellidos" maxLength={80} value={form.apellidos} onChange={set("apellidos")} />
            <input style={s.input} placeholder="DNI (8 números)" inputMode="numeric" maxLength={8} value={form.dni} onChange={set("dni")} />
            <input style={s.input} placeholder="Apodo (opcional)" maxLength={40} value={form.apodo} onChange={set("apodo")} />
            <select style={s.input} value={form.categoriaId} onChange={set("categoriaId")}>
              <option value="">Sin categoría</option>
              {categorias.map((k) => <option key={k.id} value={k.id}>{k.nombre}</option>)}
            </select>
            {FOTOS_ACTIVAS ? (
              <>
              <div style={s.muted}>Foto (JPG) o PDF, opcional · máx. 8 MB</div>
            <input style={s.input} type="file" accept="image/jpeg,application/pdf" onChange={(e) => setFile(e.target.files[0] || null)} />
            {form.id && form.foto && <label style={s.muted}><input type="checkbox" checked={quitar} onChange={(e) => setQuitar(e.target.checked)} /> Quitar la foto/PDF actual</label>}
              </>
            ) : <div style={s.muted}>La foto y el PDF del cliente se activarán más adelante.</div>}
          </div>
          <div style={{ ...s.row, justifyContent: "flex-end", marginTop: 14 }}>
            {form.id && user.isAdmin && <button style={s.btn("danger")} onClick={() => setConfirm(`¿Eliminar a ${nom(form)}? Sus ingresos pasados se conservan en el registro.`)}>Eliminar</button>}
            <button style={s.btn("secondary")} onClick={() => setForm(null)}>Cancelar</button>
            <button style={{ ...s.btn(), opacity: saving ? 0.5 : 1 }} onClick={guardar}>Guardar</button>
          </div>
        </Modal>
      )}
      {confirm && <ConfirmModal s={s} msg={confirm} onYes={eliminar} onClose={() => setConfirm(null)} />}
    </div>
  );
}
