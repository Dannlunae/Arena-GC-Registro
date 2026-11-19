import { useState, useEffect, useMemo } from "react";
import { FS } from "../services/cyberFS";
import { dayKeyOf } from "../services/normalizers";

// Mismo papel que useAppData del ERP: carga y mantiene al día los datos del local.
export function useCyberData(currentUser) {
  const [clientes, setClientes] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [ingresosHoy, setIngresosHoy] = useState([]);
  const [resumenHoy, setResumenHoy] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [hoy, setHoy] = useState(() => dayKeyOf(Date.now()));

  const localId = currentUser?.localId;
  const fs = useMemo(() => (localId ? FS(localId) : null), [localId]);

  useEffect(() => { // cambia «hoy» a medianoche (hora de Lima)
    if (!fs) return;
    const id = setInterval(() => setHoy((h) => { const n = dayKeyOf(Date.now()); return n === h ? h : n; }), 30000);
    return () => clearInterval(id);
  }, [fs]);

  useEffect(() => {
    if (!fs) { setClientes([]); setCategorias([]); setLoaded(false); return; }
    setLoaded(false); setLoadError(null);
    const onErr = (e) => { console.error(e); setLoadError(e); };
    const un = [
      fs.watchClientes((l) => { setClientes(l); setLoaded(true); }, onErr),
      fs.watchCategorias(setCategorias, onErr),
    ];
    return () => un.forEach((f) => f());
  }, [fs]);

  useEffect(() => { // solo se escucha el día de hoy; otros días se leen cuando los pides
    if (!fs) { setIngresosHoy([]); setResumenHoy(null); return; }
    const onErr = (e) => { console.error(e); setLoadError(e); };
    const un = [fs.watchDia(hoy, setIngresosHoy, onErr), fs.watchDiaResumen(hoy, setResumenHoy, onErr)];
    return () => un.forEach((f) => f());
  }, [fs, hoy]);

  return { fs, localId, clientes, categorias, ingresosHoy, resumenHoy, hoy, loaded, loadError };
}
