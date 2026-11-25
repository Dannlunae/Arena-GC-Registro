import { useState, useEffect, useRef } from "react";
import { FS } from "../../services/cyberFS";
import { hashPin } from "../../services/normalizers";
import { LOCALES, ROLE_INFO, DEFAULT_STAFF, NEGOCIO } from "../../constants";

// Mismo flujo que el login del ERP: (local →) usuario → PIN. Si el usuario aún no tiene PIN,
// el primero que entre lo define (se pide dos veces).
export default function LoginScreen({ onLogin, s, isMobile }) {
  const [step, setStep] = useState(LOCALES.length > 1 ? "local" : "user");
  const [local, setLocal] = useState(LOCALES[0].id);
  const [staff, setStaff] = useState([]);
  const [user, setUser] = useState(null);
  const [pin, setPin] = useState("");
  const [first, setFirst] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const fails = useRef({ n: 0, until: 0 });

  const loadStaff = async (localId, retries = 2) => {
    setLoading(true); setError("");
    const fs = FS(localId);
    let users = await fs.getStaff();
    if (users === undefined) {
      if (retries > 0) { await new Promise((r) => setTimeout(r, 1200)); return loadStaff(localId, retries - 1); }
      setLoading(false); setError("No se pudo cargar el personal. Revisa tu conexión."); return;
    }
    if (users === null || users.length === 0) users = await fs.seedStaff(DEFAULT_STAFF); // solo la primera vez
    setStaff(users); setLoading(false);
  };
  useEffect(() => { if (LOCALES.length === 1) loadStaff(LOCALES[0].id); }, []); // eslint-disable-line

  const digit = (d) => setPin((p) => (p.length < 6 ? p + d : p));
  const del = () => setPin((p) => p.slice(0, -1));

  const finish = (u) => onLogin({
    userId: u.id, name: u.name, roles: u.roles, role: u.roles.includes("admin") ? "admin" : u.roles[0],
    isAdmin: u.roles.includes("admin"), localId: local, localName: (LOCALES.find((l) => l.id === local) || {}).nombre || local,
  });

  const submit = async () => {
    if (pin.length < 4 || busy) return;
    const wait = fails.current.until - Date.now();
    if (wait > 0) { setError(`Demasiados intentos. Espera ${Math.ceil(wait / 1000)} s`); setPin(""); return; }
    setError("");
    if (step === "newpin") { setFirst(pin); setPin(""); setStep("confirm"); return; }
    setBusy(true);
    try {
      const hash = await hashPin(user.id, pin);
      if (step === "confirm") {
        if (pin !== first) { setError("Los PIN no coinciden. Empieza de nuevo."); setFirst(""); setPin(""); setStep("newpin"); return; }
        const users = await FS(local).mutateStaff((cur) => (cur || []).map((u) => (u.id === user.id && !u.pinHash ? { ...u, pinHash: hash } : u)));
        const saved = users.find((u) => u.id === user.id);
        if (!saved || saved.pinHash !== hash) { setError("Otra persona ya definió el PIN de este usuario."); setPin(""); setStep("user"); loadStaff(local); return; }
        finish(saved);
      } else if (hash === user.pinHash) {
        fails.current = { n: 0, until: 0 }; finish(user);
      } else {
        fails.current.n += 1;
        if (fails.current.n >= 5) { fails.current = { n: 0, until: Date.now() + 30000 }; setError("PIN incorrecto. Espera 30 s."); }
        else setError("PIN incorrecto — inténtalo de nuevo");
        setPin("");
      }
    } catch (e) { console.error(e); setError("No se pudo verificar. Revisa tu conexión."); }
    finally { setBusy(false); }
  };

  useEffect(() => {
    if (!["pin", "newpin", "confirm"].includes(step)) return;
    const onKey = (e) => { if (/^\d$/.test(e.key)) digit(e.key); else if (e.key === "Backspace") del(); else if (e.key === "Enter") submit(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const cardBtn = { ...s.btn("secondary"), padding: "14px 20px", fontSize: 15, fontWeight: 900, textAlign: "left", display: "flex", alignItems: "center", gap: 12, width: "100%" };
  const titulo = { pin: "Ingresa tu PIN", newpin: "Crea tu PIN (4 a 6 números)", confirm: "Repite tu PIN" }[step];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "#f0f2f5" }}>
      <div style={{ width: "100%", maxWidth: 380 }}>
        <div style={{ textAlign: "center", marginBottom: 22 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: -0.5, lineHeight: 1 }}>Registro de ingresos</div>
          <div style={{ fontSize: 11, color: "#9ca3af", letterSpacing: 1.5, marginTop: 6 }}>{NEGOCIO.toUpperCase()}</div>
        </div>
        <div style={{ ...s.card, padding: 24, borderRadius: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.08)" }}>

        {step === "local" && LOCALES.map((l) => (
          <button key={l.id} style={{ ...cardBtn, marginBottom: 8 }} onClick={async () => { setLocal(l.id); await loadStaff(l.id); setStep("user"); }}>{l.nombre}</button>
        ))}

        {step === "user" && (
          <>
            <div style={{ ...s.muted, textAlign: "center", marginBottom: 12 }}>¿Quién eres?</div>
            {loading && <div style={{ ...s.muted, textAlign: "center" }}>Cargando…</div>}
            {staff.map((u) => (
              <button key={u.id} style={{ ...cardBtn, marginBottom: 8 }} onClick={() => { setUser(u); setPin(""); setFirst(""); setError(""); setStep(u.pinHash ? "pin" : "newpin"); }}>
                <span style={{ width: 34, height: 34, borderRadius: "50%", background: "#111827", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900 }}>{u.name[0]}</span>
                <span>{u.name}<br /><span style={s.muted}>{(ROLE_INFO[u.roles[0]] || {}).label}{u.pinHash ? "" : " · sin PIN"}</span></span>
              </button>
            ))}
            {LOCALES.length > 1 && <button style={{ ...s.btn("secondary"), width: "100%" }} onClick={() => setStep("local")}>← Cambiar local</button>}
          </>
        )}

        {["pin", "newpin", "confirm"].includes(step) && (
          <>
            <div style={{ textAlign: "center", fontWeight: 800 }}>{user.name}</div>
            <div style={{ ...s.muted, textAlign: "center", marginBottom: 12 }}>{titulo}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 14 }}>
              {[0, 1, 2, 3, 4, 5].map((i) => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? "#111827" : "#e5e7eb" }} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => <button key={d} style={{ ...s.btn("secondary"), fontSize: 20, padding: 14 }} onClick={() => digit(d)}>{d}</button>)}
              <button style={{ ...s.btn("secondary"), fontSize: 18, padding: 14 }} onClick={() => { setStep("user"); setPin(""); }}>←</button>
              <button style={{ ...s.btn("secondary"), fontSize: 20, padding: 14 }} onClick={() => digit("0")}>0</button>
              <button style={{ ...s.btn("secondary"), fontSize: 18, padding: 14 }} onClick={del}>⌫</button>
            </div>
            <button style={{ ...s.btn(), width: "100%", marginTop: 10, padding: 14, fontSize: 15, opacity: pin.length < 4 || busy ? 0.5 : 1 }} onClick={submit}>{step === "newpin" ? "Continuar" : "Entrar"}</button>
          </>
        )}
        {error && <div style={{ color: "#b91c1c", textAlign: "center", marginTop: 12, fontSize: 13, fontWeight: 700 }}>{error}</div>}
        </div>
      </div>
    </div>
  );
}
