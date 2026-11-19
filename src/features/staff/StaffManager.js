import { useEffect, useState } from "react";
import { PromptModal, ConfirmModal } from "../common/Common";
import { ROLE_INFO } from "../../constants";
import { clean } from "../../services/normalizers";

// Gestión del personal (solo admin): nombres, roles y restablecer PIN. El PIN nunca se muestra:
// al restablecerlo, el usuario define uno nuevo la próxima vez que entre.
export default function StaffManager({ data, user, s, Y, showToast }) {
  const { fs } = data;
  const [staff, setStaff] = useState(null);
  const [prompt, setPrompt] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const cargar = async () => { const u = await fs.getStaff(); setStaff(u || []); };
  useEffect(() => { cargar(); }, [fs]); // eslint-disable-line

  const mutar = async (fn, ok) => {
    try { const next = await fs.mutateStaff((cur) => fn(cur || [])); setStaff(next); showToast(ok); }
    catch (e) { showToast(e.message || "No se pudo guardar", true); }
  };
  const nuevoId = () => `u_${Date.now().toString(36)}`;
  const admins = (staff || []).filter((u) => u.roles.includes("admin")).length;

  if (!staff) return <div style={s.muted}>Cargando…</div>;
  return (
    <div>
      <div style={s.title}>PERSONAL</div>
      <div style={s.card}>
        <div style={s.row}>
          <span style={s.muted}>{staff.length} usuario(s). Cada uno entra con su PIN de 4 a 6 números.</span>
          <button style={s.btn()} onClick={() => setPrompt({ title: "Nombre del nuevo usuario", initial: "", save: (v) => { const n = clean(v).slice(0, 40); if (n) mutar((l) => [...l, { id: nuevoId(), name: n, roles: ["recepcion"], pinHash: null }], "Usuario añadido"); } })}>+ Añadir</button>
        </div>
      </div>
      {staff.map((u) => {
        const esAdmin = u.roles.includes("admin"), yo = u.id === user.userId;
        return (
          <div key={u.id} style={s.card}>
            <div style={s.row}>
              <div><b>{u.name}</b> {yo && <span style={s.muted}>(tú)</span>}
                <div>{u.roles.map((r) => <span key={r} style={s.tag(`${(ROLE_INFO[r] || {}).color || Y}33`, (ROLE_INFO[r] || {}).color || Y)}>{(ROLE_INFO[r] || {}).label || r}</span>)} <span style={s.muted}>{u.pinHash ? "PIN definido" : "sin PIN"}</span></div>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <button style={s.btn("secondary")} onClick={() => setPrompt({ title: "Nuevo nombre", initial: u.name, save: (v) => { const n = clean(v).slice(0, 40); if (n) mutar((l) => l.map((x) => (x.id === u.id ? { ...x, name: n } : x)), "Nombre guardado"); } })}>Renombrar</button>
                <button style={s.btn("secondary")} disabled={yo || (esAdmin && admins <= 1)}
                  onClick={() => mutar((l) => l.map((x) => (x.id === u.id ? { ...x, roles: esAdmin ? ["recepcion"] : ["admin"] } : x)), "Rol actualizado")}>{esAdmin ? "Quitar admin" : "Hacer admin"}</button>
                <button style={s.btn("secondary")} onClick={() => setConfirm({ msg: `¿Restablecer el PIN de ${u.name}? Definirá uno nuevo al entrar.`, yes: () => mutar((l) => l.map((x) => (x.id === u.id ? { ...x, pinHash: null } : x)), "PIN restablecido") })}>Restablecer PIN</button>
                <button style={s.btn("danger")} disabled={yo || (esAdmin && admins <= 1)} onClick={() => setConfirm({ msg: `¿Eliminar a ${u.name}? Sus ingresos ya registrados se conservan.`, yes: () => mutar((l) => l.filter((x) => x.id !== u.id), "Usuario eliminado") })}>Eliminar</button>
              </div>
            </div>
          </div>
        );
      })}
      {prompt && <PromptModal s={s} title={prompt.title} initial={prompt.initial} maxLength={40} onSave={prompt.save} onClose={() => setPrompt(null)} />}
      {confirm && <ConfirmModal s={s} msg={confirm.msg} onYes={confirm.yes} onClose={() => setConfirm(null)} />}
    </div>
  );
}
