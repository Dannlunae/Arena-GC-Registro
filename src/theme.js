import { useEffect, useState } from "react";

// Acento = negro casi puro. (Se llama Y por compatibilidad con el resto del código.)
export const Y = "#111827";

export function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const f = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [bp]);
  return m;
}

// Estilo minimalista: fondo gris muy claro, tarjetas blancas con borde fino, texto casi negro,
// menú lateral oscuro. Sin colores de acento: solo negro, blanco y grises.
const F = "'Inter',system-ui,-apple-system,'Segoe UI',sans-serif";
export function makeStyles(isMobile) {
  return {
    app: { fontFamily: F, background: "#f0f2f5", color: "#111827", minHeight: "100vh", display: "flex", flexDirection: "row", overflow: "hidden" },
    header: { background: "#ffffff", color: "#111827", padding: isMobile ? "0 12px" : "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 1px 0 #e5e7eb", position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 60, boxSizing: "border-box" },
    sidebar: (open) => ({ width: isMobile ? (open ? "100vw" : 0) : 220, minWidth: isMobile ? (open ? "100vw" : 0) : 220, background: "#111827", display: "flex", flexDirection: "column", transition: "width .22s cubic-bezier(.4,0,.2,1), min-width .22s cubic-bezier(.4,0,.2,1)", overflow: "hidden", flexShrink: 0, position: isMobile ? "fixed" : "relative", top: isMobile ? 60 : 0, left: 0, height: isMobile ? "calc(100vh - 60px)" : "100%", zIndex: isMobile ? 990 : 1, paddingTop: isMobile ? 12 : 72 }),
    navBtn: (active) => ({ display: "flex", alignItems: "center", padding: "10px 16px", background: active ? "rgba(255,255,255,0.10)" : "transparent", color: active ? "#ffffff" : "rgba(255,255,255,0.55)", border: "none", borderRadius: 8, margin: "1px 8px", width: "calc(100% - 16px)", cursor: "pointer", fontFamily: F, fontWeight: active ? 600 : 400, fontSize: 14, whiteSpace: "nowrap", transition: "all .15s", textAlign: "left" }),
    content: { flex: 1, padding: isMobile ? "10px 8px" : "20px 24px", maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box", overflow: "auto", marginTop: 60 },
    card: { background: "#ffffff", borderRadius: isMobile ? 10 : 12, padding: isMobile ? 12 : 16, marginBottom: 10, border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" },
    btn: (v = "primary") => ({
      padding: isMobile ? "8px 12px" : "9px 16px",
      background: v === "primary" ? "#111827" : v === "danger" ? "#fef2f2" : "#f3f4f6",
      color: v === "primary" ? "#ffffff" : v === "danger" ? "#b91c1c" : "#374151",
      border: v === "primary" ? "1px solid #111827" : v === "danger" ? "1px solid #fecaca" : "1px solid #e5e7eb",
      borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: F, transition: "all .15s", whiteSpace: "nowrap",
    }),
    input: { background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 8, padding: isMobile ? "10px 12px" : "10px 13px", color: "#111827", fontFamily: F, fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
    tag: (bg, col) => ({ display: "inline-block", padding: "2px 9px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: bg, color: col || "#374151" }),
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
    title: { color: "#111827", fontFamily: F, fontSize: isMobile ? 17 : 20, fontWeight: 700, marginBottom: isMobile ? 10 : 16, letterSpacing: -0.3 },
    muted: { color: "#6b7280", fontSize: 12 },
    line: "1px solid #e5e7eb",
    overlay: { position: "fixed", inset: 0, background: "rgba(17,24,39,0.5)", zIndex: 2000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16, backdropFilter: "blur(2px)" },
    modal: { background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: isMobile ? "16px 16px 0 0" : 14, padding: isMobile ? "18px 14px 24px" : 24, width: "100%", maxWidth: isMobile ? "100%" : 520, maxHeight: "90vh", overflowY: "auto", boxSizing: "border-box" },
  };
}
