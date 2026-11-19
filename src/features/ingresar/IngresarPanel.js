import { useState, useMemo, useRef } from "react";
import { Avatar } from "../common/Common";
import { norm, porNombre, limaStamp } from "../../services/normalizers";

export default function IngresarPanel({ data, user, s, Y, showToast, onNuevo, onVer }) {
  const { clientes, categorias, resumenHoy, fs, loaded } = data;
  const [q, setQ] = useState("");
  const [cm, setCm] = useState("");
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  const lista = useMemo(() => {
    const k = norm(q);
    return clientes.filter((c) => !k || norm(`${c.nombres} ${c.apellidos} ${c.apodo} ${c.dni}`).includes(k)).sort(porNombre).slice(0, 30);
  }, [clientes, q]);
  const catName = (id) => (categorias.find((k) => k.id === id) || {}).nombre || "";

  const registrar = async (c) => {
    if (busy) return;
    setBusy(true);
    try {
      const r = await fs.registrarIngreso(c, cm, user);
      showToast(`✔ ${c.nombres} · ${limaStamp(Date.now()).slice(11)}${r.n > 1 ? ` (ingreso n.º ${r.n} hoy)` : ""}`);
      setQ(""); setCm(""); ref.current && ref.current.focus();
    } catch (e) { showToast(e.message || "No se pudo registrar", true); }
    finally { setBusy(false); }
  };
  const enter = (e) => { if (e.key !== "Enter") return; if (lista[0]) registrar(lista[0]); else if (q.trim()) onNuevo(q); };

  return (
    <div>
      <div style={s.title}>INGRESAR</div>
      <div style={s.card}>
        <input ref={ref} autoFocus style={s.input} placeholder="DNI, nombre o apodo y Enter…" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={enter} />
        <input style={{ ...s.input, marginTop: 8 }} placeholder="Comentario del ingreso (opcional)" value={cm} maxLength={500} onChange={(e) => setCm(e.target.value)} onKeyDown={enter} />
      </div>
      <div style={s.card}>
        {!loaded && <div style={s.muted}>Cargando clientes…</div>}
        {lista.map((c) => {
          const hoy = resumenHoy && resumenHoy.porCliente ? resumenHoy.porCliente[c.id] : 0;
          return (
            <div key={c.id} style={{ ...s.row, flexWrap: "nowrap", padding: "8px 0", borderBottom: "1px solid #2a2a2a" }}>
              <Avatar c={c} Y={Y} onClick={() => onVer(c)} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800 }}>{c.nombres} {c.apellidos} {c.apodo && <span style={s.muted}>«{c.apodo}»</span>}</div>
                <div style={s.muted}>{c.dni ? `DNI ${c.dni}` : "sin DNI"} {catName(c.categoriaId) && <span style={s.tag("#2a2a2a", "#aaa")}>{catName(c.categoriaId)}</span>} {hoy > 0 && <span style={s.tag("#4a3b00", Y)}>hoy: {hoy}</span>}</div>
              </div>
              <button style={s.btn()} disabled={busy} onClick={() => registrar(c)}>Registrar</button>
            </div>
          );
        })}
        {loaded && q.trim() && lista.length === 0 && (
          <div style={{ ...s.row, padding: "8px 0" }}><span style={s.muted}>No existe ese cliente.</span><button style={s.btn("secondary")} onClick={() => onNuevo(q)}>Crear cliente</button></div>
        )}
        {loaded && !clientes.length && <div style={s.muted}>Aún no hay clientes. Ve a «Clientes» para añadir el primero.</div>}
      </div>
    </div>
  );
}
