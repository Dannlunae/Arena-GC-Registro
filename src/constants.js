// Un solo local. Si agregas más, aparece el paso «local» en el login (como en el ERP).
// Usa ids en minúsculas, sin guiones bajos ni espacios.
export const LOCALES = [{ id: "principal", nombre: "Cyber" }];

// Fotos y PDF de clientes. Déjalo en false hasta activar Storage (requiere plan Blaze y las reglas de storage.rules);
// luego cámbialo a true y vuelve a publicar.
export const FOTOS_ACTIVAS = true;

export const NEGOCIO = "Arena Gaming Center";

export const ROLE_INFO = {
  admin: { label: "Administrador" },
  recepcion: { label: "Recepción" },
};

// Personal por defecto (primer arranque). El primer PIN lo define quien entre primero a cada usuario.
export const DEFAULT_STAFF = [
  { id: "u_admin", name: "Administrador", roles: ["admin"], pinHash: null },
  { id: "u_recep1", name: "Recepción 1", roles: ["recepcion"], pinHash: null },
  { id: "u_recep2", name: "Recepción 2", roles: ["recepcion"], pinHash: null },
  { id: "u_recep3", name: "Recepción 3", roles: ["recepcion"], pinHash: null },
];
