import { useEffect, useState } from "react";

export const Y = "#FFD700";

export function useIsMobile(bp = 768) {
  const [m, setM] = useState(() => window.innerWidth < bp);
  useEffect(() => {
    const f = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, [bp]);
  return m;
}

// Mismo lenguaje visual del ERP: fondo #0f0f0f, tarjetas #1c1c1c, dorado #FFD700, Nunito + Bebas Neue.
export function makeStyles(isMobile) {
  return {
    app: { fontFamily: "'Nunito',sans-serif", background: "#0f0f0f", color: "#eee", minHeight: "100vh", display: "flex", flexDirection: "row", overflow: "hidden" },
    header: { background: `linear-gradient(135deg,${Y} 0%,#e6b800 100%)`, color: "#111", padding: isMobile ? "0 12px" : "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", boxShadow: "0 2px 12px rgba(255,215,0,.3)", position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000, height: 60, boxSizing: "border-box" },
    sidebar: (open) => ({ width: open ? (isMobile ? "100vw" : 220) : (isMobile ? 0 : 64), minWidth: open ? (isMobile ? "100vw" : 220) : (isMobile ? 0 : 64), background: "#111", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", transition: "width .22s cubic-bezier(.4,0,.2,1), min-width .22s cubic-bezier(.4,0,.2,1)", overflow: "hidden", flexShrink: 0, position: isMobile ? "fixed" : "relative", top: isMobile ? 60 : 0, left: 0, height: isMobile ? "calc(100vh - 60px)" : "100%", zIndex: isMobile ? 990 : 1, paddingTop: isMobile ? 0 : 60 }),
    navBtn: (active, open) => ({ display: "flex", alignItems: "center", gap: 12, padding: open ? "11px 18px" : "11px 0", justifyContent: open ? "flex-start" : "center", background: active ? `${Y}18` : "transparent", color: active ? Y : "#777", border: "none", borderLeft: active ? `3px solid ${Y}` : "3px solid transparent", cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: active ? 800 : 600, fontSize: 13, whiteSpace: "nowrap", transition: "all .15s", width: "100%", letterSpacing: 0.3 }),
    content: { flex: 1, padding: isMobile ? "10px 8px" : 20, maxWidth: 1100, margin: "0 auto", width: "100%", boxSizing: "border-box", overflow: "auto", marginTop: 60 },
    card: { background: "#1c1c1c", borderRadius: isMobile ? 10 : 12, padding: isMobile ? 10 : 14, marginBottom: 10, border: "1px solid #2a2a2a" },
    btn: (v = "primary") => ({ padding: isMobile ? "8px 12px" : "9px 16px", background: v === "primary" ? Y : v === "danger" ? "#c0392b" : v === "success" ? "#27ae60" : v === "blue" ? "#2980b9" : "#2a2a2a", color: v === "primary" ? "#111" : "#eee", border: v === "secondary" ? "1px solid #383838" : "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Nunito',sans-serif", fontWeight: 800, fontSize: 13, whiteSpace: "nowrap" }),
    input: { background: "#222", border: "1px solid #383838", borderRadius: 8, padding: isMobile ? "10px" : "10px 12px", color: "#eee", fontFamily: "'Nunito',sans-serif", fontSize: 14, outline: "none", width: "100%", boxSizing: "border-box" },
    tag: (bg, col) => ({ display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 11, fontWeight: 700, background: bg, color: col || "#eee" }),
    row: { display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 },
    title: { color: Y, fontFamily: "'Bebas Neue',cursive", fontSize: isMobile ? 18 : 22, marginBottom: isMobile ? 10 : 14, letterSpacing: 1 },
    muted: { color: "#777", fontSize: 12 },
    overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.88)", zIndex: 2000, display: "flex", alignItems: isMobile ? "flex-end" : "center", justifyContent: "center", padding: isMobile ? 0 : 16 },
    modal: { background: "#1a1a1a", border: `1px solid ${Y}44`, borderRadius: isMobile ? "16px 16px 0 0" : 14, padding: isMobile ? "16px 12px 20px" : 20, width: "100%", maxWidth: isMobile ? "100%" : 520, maxHeight: "90vh", overflowY: "auto" },
  };
}
