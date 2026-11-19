import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage, authReady } from "../firebase";

const MAX = 8 * 1024 * 1024;
const path = (localId, id) => `cyber/${localId}/clientes/${id}`;

async function shrink(f) { // fotos grandes del celular → máx. 1280 px (ahorra datos)
  try {
    const b = await createImageBitmap(f), k = Math.min(1, 1280 / Math.max(b.width, b.height));
    if (k === 1 && f.size < 1500000) return f;
    const c = document.createElement("canvas");
    c.width = Math.round(b.width * k); c.height = Math.round(b.height * k);
    c.getContext("2d").drawImage(b, 0, 0, c.width, c.height);
    return await new Promise((ok) => c.toBlob((x) => ok(x || f), "image/jpeg", 0.85));
  } catch (e) { return f; }
}

// Devuelve "jpg" o "pdf". Se revisa el contenido real del archivo, no la extensión.
export async function subirArchivo(localId, id, file) {
  const h = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  const jpg = h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff;
  const pdf = String.fromCharCode(...h) === "%PDF-";
  if (!jpg && !pdf) throw new Error("Solo se aceptan archivos JPG o PDF");
  const blob = jpg ? await shrink(file) : file;
  if (blob.size > MAX) throw new Error("El archivo debe pesar menos de 8 MB");
  await authReady;
  await uploadBytes(ref(storage, path(localId, id)), blob, { contentType: jpg ? "image/jpeg" : "application/pdf" });
  return jpg ? "jpg" : "pdf";
}
export const urlArchivo = async (localId, id) => { await authReady; return getDownloadURL(ref(storage, path(localId, id))); };
export const borrarArchivo = async (localId, id) => { await authReady; return deleteObject(ref(storage, path(localId, id))).catch(() => {}); };
