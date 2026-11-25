import { useState } from "react";

export function Avatar({ c, onClick }) {
  const ini = (Array.from(c.nombres || "?")[0] || "?").toUpperCase();
  return (
    <div onClick={c.foto ? onClick : undefined} title={c.foto ? "Ver foto/PDF" : ""}
      style={{ width: 44, height: 44, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "#e5e7eb", color: "#374151", fontWeight: 700, fontSize: 17, cursor: c.foto ? "pointer" : "default", outline: c.foto ? "2px solid #111827" : "none", outlineOffset: 2 }}>
      {ini}
    </div>
  );
}

export function Modal({ s, onClose, title, children }) {
  return (
    <div style={s.overlay} onClick={onClose}>
      <div style={s.modal} onClick={(e) => e.stopPropagation()}>
        {title && <div style={s.title}>{title}</div>}
        {children}
      </div>
    </div>
  );
}

// Los cuadros del navegador (confirm/prompt) no funcionan dentro de la app Android: se usan modales propios.
export function ConfirmModal({ s, msg, onYes, onClose }) {
  return (
    <Modal s={s} onClose={onClose}>
      <div style={{ marginBottom: 16 }}>{msg}</div>
      <div style={{ ...s.row, justifyContent: "flex-end" }}>
        <button style={s.btn("secondary")} onClick={onClose}>Cancelar</button>
        <button style={s.btn("danger")} onClick={() => { onYes(); onClose(); }}>Confirmar</button>
      </div>
    </Modal>
  );
}

export function PromptModal({ s, title, initial = "", maxLength = 500, onSave, onClose }) {
  const [v, setV] = useState(initial);
  return (
    <Modal s={s} onClose={onClose} title={title}>
      <input style={s.input} value={v} maxLength={maxLength} autoFocus onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") { onSave(v); onClose(); } }} />
      <div style={{ ...s.row, justifyContent: "flex-end", marginTop: 12 }}>
        <button style={s.btn("secondary")} onClick={onClose}>Cancelar</button>
        <button style={s.btn()} onClick={() => { onSave(v); onClose(); }}>Guardar</button>
      </div>
    </Modal>
  );
}
