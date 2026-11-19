// Funciones puras (sin Firebase ni React): se pueden probar solas.
export const REQUIRE_DNI = false; // true = DNI obligatorio al registrar un cliente
export const TZ = "America/Lima";

export const asArray = (v) => (Array.isArray(v) ? v : []);
export const clean = (s) => String(s || "").normalize("NFC").replace(/\s+/g, " ").trim();
export const norm = (s) => clean(s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); // «Ñandú» → «nandu»
export const keyOf = (s) => norm(s).replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-+|-+$/g, "");
export const nom = (c) => clean(`${c.nombres || ""} ${c.apellidos || ""}`);
export const porNombre = (a, b) => `${a.apellidos} ${a.nombres}`.localeCompare(`${b.apellidos} ${b.nombres}`, "es");

export const limaStamp = (d) => new Date(d).toLocaleString("sv-SE", { timeZone: TZ }); // 2026-11-17 15:23:30
export const dayKeyOf = (d) => limaStamp(d).slice(0, 10); // 2026-11-17

export async function sha256(str) {
  if (!str) return "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
export const hashPin = (userId, pin) => sha256(`cyber:${userId}:${pin}`);

export function normalizarCliente(f) {
  return {
    nombres: clean(f.nombres).slice(0, 80),
    apellidos: clean(f.apellidos).slice(0, 80),
    dni: String(f.dni || "").replace(/\s/g, ""),
    apodo: clean(f.apodo).slice(0, 40),
    categoriaId: String(f.categoriaId || ""),
  };
}

export function validarCliente(c) {
  if (!c.nombres || !c.apellidos) throw new Error("Escribe nombres y apellidos");
  if (c.dni ? !/^\d{8}$/.test(c.dni) : REQUIRE_DNI) throw new Error("El DNI debe tener 8 números");
  if (c.apodo && !keyOf(c.apodo)) throw new Error("Apodo no válido");
  if (c.apodo && keyOf(c.apodo) === keyOf(nom(c))) throw new Error("El apodo no puede ser igual al nombre");
}

// Devuelve el mensaje de conflicto (o null). No se repiten DNI, nombres completos ni apodos
// (sin importar mayúsculas, tildes o espacios); un apodo tampoco puede ser el nombre de otro cliente.
export function conflictoCliente(lista, c, selfId) {
  const kNom = keyOf(nom(c));
  const kApo = c.apodo ? keyOf(c.apodo) : "";
  for (const o of asArray(lista)) {
    if (o.id === selfId) continue;
    const oNom = keyOf(nom(o));
    const oApo = o.apodo ? keyOf(o.apodo) : "";
    if (c.dni && o.dni === c.dni) return `Ese DNI ya está registrado a nombre de ${nom(o)}`;
    if (kNom === oNom) return `Ese cliente ya existe (${nom(o)})`;
    if (kNom && kNom === oApo) return `Ese nombre ya es el apodo de ${nom(o)}`;
    if (kApo && kApo === oApo) return `El apodo «${c.apodo}» ya lo usa ${nom(o)}`;
    if (kApo && kApo === oNom) return `«${c.apodo}» es el nombre de otro cliente (${nom(o)}); elige otro apodo`;
  }
  return null;
}

export const normalizeCliente = (r) => ({
  id: String(r.id), nombres: r.nombres || "", apellidos: r.apellidos || "", dni: r.dni || "",
  apodo: r.apodo || "", categoriaId: r.categoriaId || "", foto: r.foto || "",
});
export const normalizeIngreso = (r) => ({
  ...r, dni: r.dni || "", apodo: r.apodo || "", comentario: r.comentario || "",
  n: Number(r.n) || 1, tsMs: r.ts && r.ts.toMillis ? r.ts.toMillis() : Date.now(),
});
// El ingreso guarda SOLO estos datos del cliente (ahorro de datos): no arrastra foto ni el resto.
export const copiaParaIngreso = (c) => ({ clienteId: c.id, dni: c.dni || "", nombres: c.nombres, apodo: c.apodo || "" });
