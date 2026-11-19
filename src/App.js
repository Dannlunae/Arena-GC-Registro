import { useState, useRef, Component } from "react";
import { Y, useIsMobile, makeStyles } from "./theme";
import { useCyberData } from "./hooks/useCyberData";
import { ROLE_INFO } from "./constants";
import LoginScreen from "./features/login/LoginScreen";
import IngresarPanel from "./features/ingresar/IngresarPanel";
import ClientesManager, { PhotoViewer } from "./features/clientes/ClientesManager";
import CategoriasManager from "./features/categorias/CategoriasManager";
import RegistrosPanel from "./features/registros/RegistrosPanel";
import StaffManager from "./features/staff/StaffManager";

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error("App crash:", error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ background: "#111", color: "#fff", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ textAlign: "center", maxWidth: 500 }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ color: Y, fontWeight: 900, fontSize: 20, marginBottom: 12 }}>Error en la aplicación</div>
            <div style={{ background: "#1a1a1a", padding: 16, borderRadius: 8, fontSize: 12, color: "#e74c3c", textAlign: "left", marginBottom: 16, whiteSpace: "pre-wrap" }}>{this.state.error?.message || "Error desconocido"}</div>
            <button onClick={() => this.setState({ hasError: false, error: null })} style={{ background: Y, color: "#111", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 900, cursor: "pointer" }}>Reintentar</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const loadUser = () => { try { return JSON.parse(sessionStorage.getItem("cyber_user") || "null"); } catch { return null; } };

function Main() {
  const isMobile = useIsMobile();
  const s = makeStyles(isMobile);
  const [user, setUser] = useState(loadUser);
  const [tab, setTab] = useState("ingresar");
  const [open, setOpen] = useState(!isMobile);
  const [toast, setToast] = useState(null);
  const [nuevoPre, setNuevoPre] = useState(null);
  const [ver, setVer] = useState(null);
  const timer = useRef(null);
  const data = useCyberData(user);

  const showToast = (msg, bad) => {
    setToast({ msg, bad }); clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), bad ? 6000 : 2500);
  };
  const login = (u) => { sessionStorage.setItem("cyber_user", JSON.stringify(u)); setUser(u); setTab("ingresar"); };
  const salir = () => { sessionStorage.removeItem("cyber_user"); setUser(null); };

  if (!user) return <LoginScreen onLogin={login} s={s} Y={Y} isMobile={isMobile} />;

  const nav = [["ingresar", "Ingresar", "➕"], ["clientes", "Clientes", "👥"], ["registros", "Registros", "📋"], ["categorias", "Categorías", "🏷️"], ...(user.isAdmin ? [["personal", "Personal", "🔑"]] : [])];
  const props = { data, user, s, Y, isMobile, showToast, onVer: setVer };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setOpen(!open)} style={{ background: "transparent", border: "none", fontSize: 22, cursor: "pointer", color: "#111" }}>☰</button>
          <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 24, letterSpacing: 1 }}>REGISTRO DE INGRESOS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 800, fontSize: 13 }}>
          {!isMobile && <span>{user.name} · {(ROLE_INFO[user.role] || {}).label}</span>}
          <button onClick={salir} style={{ background: "#111", color: Y, border: "none", borderRadius: 8, padding: "7px 12px", fontWeight: 900, cursor: "pointer" }}>Salir</button>
        </div>
      </div>
      <div style={s.sidebar(open)}>
        {nav.map(([id, label, icon]) => (
          <button key={id} style={s.navBtn(tab === id, open)} onClick={() => { setTab(id); if (isMobile) setOpen(false); }}>
            <span style={{ fontSize: 18 }}>{icon}</span>{open && label}
          </button>
        ))}
      </div>
      <div style={s.content}>
        {data.loadError && <div style={{ ...s.card, borderColor: "#c0392b", color: "#e74c3c" }}>No se pudieron leer los datos ({data.loadError.code || data.loadError.message}). Revisa tu conexión y las reglas de Firebase.</div>}
        {tab === "ingresar" && <IngresarPanel {...props} onNuevo={(q) => { setNuevoPre(q); setTab("clientes"); }} />}
        {tab === "clientes" && <ClientesManager {...props} nuevoPre={nuevoPre} onNuevoConsumido={() => setNuevoPre(null)} />}
        {tab === "registros" && <RegistrosPanel {...props} />}
        {tab === "categorias" && <CategoriasManager {...props} />}
        {tab === "personal" && user.isAdmin && <StaffManager {...props} />}
      </div>
      {ver && <PhotoViewer s={s} localId={data.localId} c={ver} onClose={() => setVer(null)} />}
      {toast && (
        <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 20, zIndex: 3000, background: toast.bad ? "#3a2f10" : "#12301d", color: toast.bad ? "#fcd34d" : "#86efac", border: `1px solid ${toast.bad ? "#fcd34d55" : "#86efac55"}`, padding: "12px 18px", borderRadius: 12, fontWeight: 800, maxWidth: "92%", textAlign: "center" }}>{toast.msg}</div>
      )}
    </div>
  );
}

export default function App() { return <ErrorBoundary><Main /></ErrorBoundary>; }
