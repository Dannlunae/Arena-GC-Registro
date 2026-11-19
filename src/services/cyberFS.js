import {
  doc, collection, getDoc, getDocs, updateDoc, runTransaction, serverTimestamp, increment,
  query, where, orderBy, limit, onSnapshot,
} from "firebase/firestore";
import { db, authReady } from "../firebase";
import { asArray, conflictoCliente, dayKeyOf, copiaParaIngreso, normalizeCliente, normalizeIngreso } from "./normalizers";

const newId = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const MAX_CLIENTES = 5000; // la lista vive en un solo documento (límite de Firestore: 1 MB)

// Lee una lista guardada en un documento, la cambia y la guarda, todo dentro de una transacción
// (así dos personas que guardan a la vez no se pisan y las reglas de unicidad no se pueden saltar).
async function mutateList(ref, fn) {
  await authReady;
  return runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    const next = fn(snap.exists() ? asArray(snap.data().list) : []);
    tx.set(ref, { list: next, ts: new Date().toISOString() });
    return next;
  });
}

function listen(ref, onData, onError) {
  let un = () => {}, dead = false;
  authReady.then(() => { if (!dead) un = onSnapshot(ref, onData, onError); });
  return () => { dead = true; un(); };
}

// ─── MOTOR MULTI-LOCAL (mismo patrón que FS(localId) del ERP) ───
export const FS = (localId) => {
  const root = `cyber_${localId}`;
  const ref = (name) => doc(db, root, name);
  const ingresosCol = () => collection(db, `${root}_ingresos`);
  const diasCol = () => collection(db, `${root}_ingresos_dias`);
  const diaRef = (k) => doc(db, `${root}_ingresos_dias`, k);
  const toIng = (d) => normalizeIngreso({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) });
  const ordenar = (l) => l.sort((a, b) => b.tsMs - a.tsMs);

  return {
    _localId: localId,

    // null = el documento no existe (primera vez) · undefined = error de red/permisos
    async getStaff() {
      try { await authReady; const s = await getDoc(ref("staff")); return s.exists() ? asArray(s.data().users) : null; }
      catch (e) { console.error(e); return undefined; }
    },
    async mutateStaff(fn) {
      await authReady;
      return runTransaction(db, async (tx) => {
        const snap = await tx.get(ref("staff"));
        const next = fn(snap.exists() ? asArray(snap.data().users) : null);
        tx.set(ref("staff"), { users: next, ts: new Date().toISOString() });
        return next;
      });
    },
    seedStaff(defaults) { return this.mutateStaff((cur) => (cur && cur.length ? cur : defaults)); },

    watchClientes: (cb, err) => listen(ref("clientes"), (s) => cb(s.exists() ? asArray(s.data().list).map(normalizeCliente) : []), err),
    watchCategorias: (cb, err) => listen(ref("categorias"), (s) => cb(s.exists() ? asArray(s.data().list) : []), err),

    async crearCliente(c) {
      const id = newId("c");
      await mutateList(ref("clientes"), (list) => {
        const m = conflictoCliente(list, c, null);
        if (m) throw new Error(m);
        if (list.length >= MAX_CLIENTES) throw new Error("Se alcanzó el máximo de clientes");
        return [...list, { ...c, id, foto: "", creado: new Date().toISOString() }];
      });
      return id;
    },
    editarCliente: (id, c) => mutateList(ref("clientes"), (list) => {
      if (!list.some((x) => x.id === id)) throw new Error("El cliente ya no existe");
      const m = conflictoCliente(list, c, id);
      if (m) throw new Error(m);
      return list.map((x) => (x.id === id ? { ...x, ...c } : x));
    }),
    setFoto: (id, tipo) => mutateList(ref("clientes"), (list) => list.map((x) => (x.id === id ? { ...x, foto: tipo } : x))),
    eliminarCliente: (id) => mutateList(ref("clientes"), (list) => list.filter((x) => x.id !== id)), // sus ingresos pasados se conservan

    agregarCategoria: (nombre) => mutateList(ref("categorias"), (list) => {
      if (list.some((k) => k.nombre.toLowerCase() === nombre.toLowerCase())) throw new Error("Esa categoría ya existe");
      return [...list, { id: newId("k"), nombre }];
    }),
    eliminarCategoria: (id) => mutateList(ref("categorias"), (list) => list.filter((k) => k.id !== id)),

    // El ingreso guarda solo dni, nombres y apodo + hora del servidor. El contador del día
    // («n.º 2 del día») vive en el resumen del día, no en el cliente.
    async registrarIngreso(cliente, comentario, user) {
      await authReady;
      const dia = dayKeyOf(Date.now());
      const iref = doc(ingresosCol()), dref = diaRef(dia);
      return runTransaction(db, async (tx) => {
        const ds = await tx.get(dref);
        const n = ((ds.exists() && ds.data().porCliente && ds.data().porCliente[cliente.id]) || 0) + 1;
        tx.set(iref, { ...copiaParaIngreso(cliente), comentario: String(comentario || "").trim().slice(0, 500),
          ts: serverTimestamp(), dia, n, usuario: user.name, userId: user.userId });
        tx.set(dref, { dia, total: increment(1), porCliente: { [cliente.id]: increment(1) } }, { merge: true });
        return { n };
      });
    },
    async comentarIngreso(id, texto) {
      await authReady;
      await updateDoc(doc(db, `${root}_ingresos`, id), { comentario: String(texto || "").trim().slice(0, 500) });
    },

    watchDia: (dia, cb, err) => listen(query(ingresosCol(), where("dia", "==", dia)), (s) => cb(ordenar(s.docs.map(toIng))), err),
    watchDiaResumen: (dia, cb, err) => listen(diaRef(dia), (s) => cb(s.exists() ? s.data() : null), err),
    async getDia(dia) { await authReady; return ordenar((await getDocs(query(ingresosCol(), where("dia", "==", dia)))).docs.map(toIng)); },
    async getPorDni(dni) { await authReady; return ordenar((await getDocs(query(ingresosCol(), where("dni", "==", dni), limit(500)))).docs.map(toIng)); },
    async getDias() { await authReady; return (await getDocs(query(diasCol(), orderBy("dia", "desc"), limit(31)))).docs.map((d) => ({ dia: d.id, total: d.data().total || 0 })); },
  };
};
