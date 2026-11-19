import { useState, useEffect, useMemo } from "react";
import { PromptModal } from "../common/Common";
import { norm, limaStamp } from "../../services/normalizers";
import { downloadCsv } from "../../services/downloads";

export default function RegistrosPanel({ data, s, Y, showToast }) {
  const { fs, hoy, ingresosHoy, resumenHoy } = data;
  const [dia, setDia] = useState(hoy);
  const [dniQ, setDniQ] = useState("");
  const [q, setQ] = useState("");
  const [lista, setLista] = useState([]);
  const [dias, setDias] = useState([]);
  const [loading, setLoading] = useState(false);
  const [edit, setEdit] = useState(null);
  const esDni = /^\d{8}$/.test(dniQ);

  useEffect(() => { fs.getDias().then(setDias).catch(() => {}); }, [fs]); // resumen de los últimos días (1 lectura por día)

  useEffect(() => { // hoy se escucha en vivo; otro día o un DNI se leen solo cuando los pides
    if (!esDni && dia === hoy) return;
    let vivo = true;
    setLoading(true);
    (esDni ? fs.getPorDni(dniQ) : fs.getDia(dia))
      .then((l) => vivo && setLista(l))
      .catch((e) => showToast("No se pudo leer: " + (e.code || e.message), true))
      .finally(() => vivo && setLoading(false));
    return () => { vivo = false; };
  }, [fs, dia, hoy, dniQ, esDni]); // eslint-disable-line

  const base = !esDni && dia === hoy ? ingresosHoy : lista;
  const filas = useMemo(() => {
    const k = norm(q);
    return base.filter((e) => !k || norm(`${e.dni} ${e.nombres} ${e.apodo} ${e.comentario} ${e.usuario}`).includes(k));
  }, [base, q]);

  const guardarComentario = async (texto) => {
    try {
      await fs.comentarIngreso(edit.id, texto);
      setLista((l) => l.map((e) => (e.id === edit.id ? { ...e, comentario: texto.trim() } : e)));
      showToast("Comentario guardado");
    } catch (e) { showToast(e.message || "No se pudo guardar", true); }
  };
  const exportar = () => downloadCsv(`registros-${esDni ? dniQ : dia}.csv`,
    [["Fecha", "Hora", "DNI", "Nombres", "Apodo", "Ingreso del día", "Comentario", "Registró"],
      ...filas.map((e) => { const t = limaStamp(e.tsMs); return [t.slice(0, 10), t.slice(11), e.dni, e.nombres, e.apodo, e.n, e.comentario, e.usuario]; })]);

  const chips = [{ dia: hoy, total: resumenHoy ? resumenHoy.total : 0 }, ...dias.filter((d) => d.dia !== hoy)].slice(0, 10);

  return (
    <div>
      <div style={s.title}>REGISTROS</div>
      <div style={s.card}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input style={{ ...s.input, flex: "1 1 160px" }} placeholder="Escribe un DNI de 8 números…" inputMode="numeric" maxLength={8} value={dniQ} onChange={(e) => setDniQ(e.target.value.replace(/\D/g, ""))} />
          <input style={{ ...s.input, flex: "1 1 160px", opacity: esDni ? 0.4 : 1 }} type="date" value={dia} max={hoy} disabled={esDni} onChange={(e) => setDia(e.target.value || hoy)} />
          <input style={{ ...s.input, flex: "1 1 160px" }} placeholder="Filtrar lo mostrado…" value={q} onChange={(e) => setQ(e.target.value)} />
          <button style={s.btn("secondary")} onClick={exportar}>Excel (CSV)</button>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
          {chips.map((d) => (
            <button key={d.dia} onClick={() => { setDniQ(""); setDia(d.dia); }}
              style={{ ...s.btn(!esDni && dia === d.dia ? "primary" : "secondary"), padding: "5px 10px", fontSize: 12 }}>
              {d.dia === hoy ? "Hoy" : d.dia.slice(5)} · {d.total}
            </button>
          ))}
        </div>
        <div style={{ ...s.muted, marginTop: 8 }}>
          {loading ? "Cargando…" : `${filas.length} registro(s) · ${esDni ? `DNI ${dniQ}` : dia === hoy ? "hoy" : dia}`}. Solo se lee un día a la vez (ahorra datos).
        </div>
      </div>
      <div style={{ ...s.card, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead><tr style={{ color: "#777", textAlign: "left" }}>
            {["Fecha", "Hora", "DNI", "Nombres", "Apodo", "Comentario", "Registró", ""].map((h) => <th key={h} style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{h}</th>)}
          </tr></thead>
          <tbody>
            {filas.map((e) => {
              const t = limaStamp(e.tsMs);
              return (
                <tr key={e.id} style={{ borderTop: "1px solid #2a2a2a", verticalAlign: "top" }}>
                  <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{t.slice(0, 10)}</td>
                  <td style={{ padding: "6px 8px", whiteSpace: "nowrap" }}>{t.slice(11)}</td>
                  <td style={{ padding: "6px 8px" }}>{e.dni || "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{e.nombres} {e.n > 1 && <span style={s.tag("#4a3b00", Y)}>Repetido · n.º {e.n} del día</span>}</td>
                  <td style={{ padding: "6px 8px" }}>{e.apodo || "—"}</td>
                  <td style={{ padding: "6px 8px" }}>{e.comentario}</td>
                  <td style={{ padding: "6px 8px" }}>{e.usuario || "—"}</td>
                  <td style={{ padding: "6px 8px" }}><button style={{ ...s.btn("secondary"), padding: "4px 8px" }} onClick={() => setEdit(e)}>Comentar</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filas.length && !loading && <div style={s.muted}>Sin registros.</div>}
      </div>
      {edit && <PromptModal s={s} title={`Comentario · ${edit.nombres}`} initial={edit.comentario} onSave={guardarComentario} onClose={() => setEdit(null)} />}
    </div>
  );
}
