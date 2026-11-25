import { useState, useRef, Component } from "react";
import { useIsMobile, makeStyles } from "./theme";
import { useCyberData } from "./hooks/useCyberData";
import { ROLE_INFO, NEGOCIO } from "./constants";
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
        <div style={{ background: "#f0f2f5", color: "#111827", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Inter',system-ui,sans-serif" }}>
          <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, maxWidth: 480, textAlign: "center" }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12 }}>Ocurrió un error en la aplicación</div>
            <div style={{ background: "#fef2f2", padding: 12, borderRadius: 8, fontSize: 12, color: "#b91c1c", textAlign: "left", marginBottom: 16, whiteSpace: "pre-wrap" }}>{this.state.error?.message || "Error desconocido"}</div>
            <button onClick={() => this.setState({ hasError: false, error: null })} style={{ background: "#111827", color: "#fff", border: "none", borderRadius: 8, padding: "10px 24px", fontWeight: 600, cursor: "pointer" }}>Reintentar</button>
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
  const [open, setOpen] = useState(false); // menú lateral en celular
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
  const salir = () => { sessionStorage.removeItem("cyber_user"); setUser(null); setOpen(false); };

  if (!user) return <LoginScreen onLogin={login} s={s} isMobile={isMobile} />;

  const nav = [["ingresar", "Ingresar"], ["clientes", "Clientes"], ["registros", "Registros"], ["categorias", "Categorías"], ...(user.isAdmin ? [["personal", "Personal"]] : [])];
  const props = { data, user, s, isMobile, showToast, onVer: setVer };

  return (
    <div style={s.app}>
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {isMobile && (
            <button onClick={() => setOpen(!open)} aria-label="Menú" style={{ background: "transparent", border: "none", cursor: "pointer", padding: 6, display: "flex", flexDirection: "column", gap: 4.5 }}>
              <span style={{ display: "block", width: 20, height: 2, background: "#374151", borderRadius: 2 }} />
              <span style={{ display: "block", width: 14, height: 2, background: "#374151", borderRadius: 2 }} />
              <span style={{ display: "block", width: 20, height: 2, background: "#374151", borderRadius: 2 }} />
            </button>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: -0.3, lineHeight: 1.1 }}>Registro de ingresos</div>
            {!isMobile && <div style={{ fontSize: 10, color: "#9ca3af", fontWeight: 500, letterSpacing: 1, marginTop: 2 }}>{NEGOCIO.toUpperCase()}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!isMobile && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 20, padding: "5px 12px 5px 6px" }}>
              <span style={{ width: 26, height: 26, borderRadius: "50%", background: "#111827", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700 }}>{(user.name || "?").charAt(0).toUpperCase()}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</span>
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{(ROLE_INFO[user.role] || {}).label}</span>
            </div>
          )}
          <button onClick={salir} style={s.btn("secondary")}>Salir</button>
        </div>
      </div>
      <div style={s.sidebar(open)}>
        {nav.map(([id, label]) => (
          <button key={id} style={s.navBtn(tab === id)} onClick={() => { setTab(id); setOpen(false); }}>{label}</button>
        ))}
      </div>
      <div style={s.content}>
        {data.loadError && <div style={{ ...s.card, borderColor: "#fecaca", background: "#fef2f2", color: "#b91c1c" }}>No se pudieron leer los datos ({data.loadError.code || data.loadError.message}). Revisa tu conexión y las reglas de Firebase.</div>}
        {tab === "ingresar" && <IngresarPanel {...props} onNuevo={(q) => { setNuevoPre(q); setTab("clientes"); }} />}
        {tab === "clientes" && <ClientesManager {...props} nuevoPre={nuevoPre} onNuevoConsumido={() => setNuevoPre(null)} />}
        {tab === "registros" && <RegistrosPanel {...props} />}
        {tab === "categorias" && <CategoriasManager {...props} />}
        {tab === "personal" && user.isAdmin && <StaffManager {...props} />}
      </div>
      {ver && <PhotoViewer s={s} localId={data.localId} c={ver} onClose={() => setVer(null)} />}
      {toast && (
        <div style={{ position: "fixed", left: "50%", transform: "translateX(-50%)", bottom: 20, zIndex: 3000, background: toast.bad ? "#fef2f2" : "#111827", color: toast.bad ? "#b91c1c" : "#ffffff", border: `1px solid ${toast.bad ? "#fecaca" : "#111827"}`, padding: "12px 18px", borderRadius: 10, fontWeight: 600, fontSize: 14, maxWidth: "92%", textAlign: "center", boxShadow: "0 8px 24px rgba(0,0,0,.18)" }}>{toast.msg}</div>
      )}
    </div>
  );
}

export default function App() { return <ErrorBoundary><Main /></ErrorBoundary>; }
