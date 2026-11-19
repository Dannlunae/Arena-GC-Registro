# Registro de ingresos · Cyber

Proyecto hecho con las mismas convenciones de tu ERP (Mr Papachos): React (Create React App) + Firebase + Vercel, tema oscuro con dorado, login por usuario y PIN, motor `FS(localId)`, resumen por día y modales propios.

## Cómo se corresponde con tu ERP
| ERP | Este proyecto |
|---|---|
| `mrpapachos_{localId}` con docs `staff`, `config`… | `cyber_{localId}` con docs `staff`, `clientes`, `categorias` |
| `historial` + `historial_dias` (resumen por día) | `cyber_{localId}_ingresos` + `cyber_{localId}_ingresos_dias` |
| `FS(localId)` en `App.js` | `src/services/cyberFS.js` |
| `useAppData` | `src/hooks/useCyberData.js` |
| Login local → rol → usuario → PIN (SHA-256) | `LoginScreen`: usuario → PIN de 4 a 6 números (con sal por usuario) |
| Sesión anónima de Firebase | igual (`src/firebase.js`) |
| Estilos `s` (#0f0f0f, #1c1c1c, #FFD700) | `src/theme.js` |

Este proyecto es **independiente del ERP**: tiene su propio repositorio, sus propias variables y no apunta a nada del ERP. Lo recomendable es darle su **propio proyecto de Firebase** (así sus reglas, datos y usuarios quedan separados). Si prefirieras usar el mismo proyecto del ERP, las colecciones `cyber_*` no chocan con `mrpapachos_*`, pero tendrías que copiar solo el bloque `match /{col}/{docId}` de `firestore.rules` dentro de tus reglas actuales, sin reemplazarlas.

## Puesta en marcha (proyecto de Firebase y repositorio propios)
**1. Proyecto de Firebase nuevo** (console.firebase.google.com)
1. *Agregar proyecto* (ej. `registro-cyber`) y pásalo a **Blaze** con tu cuenta de facturación (es necesario para Storage; esto se activa por proyecto). En Google Cloud → Facturación → *Presupuestos y alertas* crea una alerta (ej. US$ 5).
2. **Authentication → Método de acceso → activa «Anónimo».** Es obligatorio: sin esto la página no puede leer ni guardar nada. (En tu ERP ya lo tienes activado, pero en un proyecto nuevo hay que activarlo.)
3. **Firestore Database → Crear base de datos** (modo producción; región `southamerica-east1`, que no se puede cambiar después). Luego en *Reglas* pega el contenido de `firestore.rules` y publica.
4. **Storage → Comenzar** (misma región). Luego en *Reglas* pega `storage.rules` y publica.
5. **Configuración del proyecto → Tus apps → Web (`</>`)** → copia los 6 valores de `firebaseConfig`.

**2. Repositorio de GitHub nuevo**
1. Crea un repositorio y sube el **contenido** de esta carpeta (que `package.json` quede en la raíz del repositorio). El `.gitignore` ya excluye `.env`.
2. En vercel.com → *Add New → Project* → importa ese repositorio (detecta Create React App solo).
3. En *Settings → Environment Variables* carga los 6 valores como `REACT_APP_FIREBASE_API_KEY`, `REACT_APP_FIREBASE_AUTH_DOMAIN`, `REACT_APP_FIREBASE_PROJECT_ID`, `REACT_APP_FIREBASE_STORAGE_BUCKET`, `REACT_APP_FIREBASE_MESSAGING_SENDER_ID` y `REACT_APP_FIREBASE_APP_ID`. Haz *Redeploy*.

**3. Probar en tu PC (opcional)**: `npm install`, copia `.env.example` como `.env` con los mismos 6 valores y `npm start`.

**4. Primer arranque**: la primera vez la página crea el personal por defecto (Administrador y Recepción 1, 2 y 3; cámbialos en `src/constants.js` o luego en la pestaña *Personal*). **Entra primero como Administrador:** el primer PIN lo define quien entre primero a cada usuario.

## Qué hace
- **Clientes:** nombres, apellidos, DNI (opcional, 8 números), apodo (opcional), categoría (opcional) y foto JPG o PDF (opcional, máx. 8 MB). Se pueden editar y eliminar (eliminar: solo admin).
- **Ingresos:** varios por día. Marca «Repetido · n.º 2 del día». Cada ingreso guarda **solo DNI, nombres y apodo** + hora del servidor, comentario y quién lo registró. Los ingresos no se borran; solo se edita el comentario.
- **Apodos únicos:** no se repiten DNI, nombres completos ni apodos (sin importar mayúsculas, tildes o espacios); un apodo tampoco puede ser el nombre de otro cliente. Se comprueba dentro de una transacción, así que dos personas guardando a la vez no se pisan.
- **Categorías:** las añade y elimina el admin.
- **Ahorro de datos:** los clientes viven en un documento (1 lectura por cambio); la foto se baja solo al tocar el círculo; *Registros* escucha solo el día de hoy y lee otro día o un DNI solo cuando lo pides. Con 5000 clientes aprox. se llena el documento de clientes (límite de Firestore, 1 MB); hay un tope en el código.
- **Hora:** el servidor de Firebase; se muestra en hora de Lima.

## App Android (Android Studio)
New Project → Empty Views Activity → pega `android/MainActivity.kt` (conservando tu línea `package`), pon tu dirección de Vercel en `serverUrl` y añade el permiso `INTERNET` al manifest. La app abre la misma página. Los cuadros de confirmar/comentar son propios porque los del navegador no funcionan en la app. El botón CSV funciona en la PC.

## Seguridad: tres cosas importantes
1. **Acceso con sesión anónima.** Las reglas solo pueden pedir `request.auth != null`, y cualquiera que abra la página obtiene esa sesión. Quien conozca el proyecto de Firebase podría leer los datos de `cyber_*` (incluidos DNI y fotos), y los hash de PIN están en `cyber_*/staff`: un PIN de 6 números se adivina con facilidad. Es la misma limitación del ERP. Como aquí hay DNI y fotos de clientes, lo recomendable es que el login lo verifique una Cloud Function que entregue un token con permiso, y que las reglas exijan ese permiso. Puedo prepararlo.
2. **`functions/index.js` del ERP tiene un token de Nubefact escrito en el código.** Si ese código está en un repositorio o lo compartiste, cámbialo (rótalo en Nubefact) y guárdalo como secreto de Firebase (`firebase functions:secrets:set`).
3. **`src/App.js` del ERP tiene una clave de desarrollador en el código del navegador** (la ve cualquiera desde las herramientas del navegador). Conviene quitarla.

## Datos personales
DNI y fotos son datos personales: avisa a los clientes y pide su consentimiento (en Perú rige la Ley 29733; no es asesoría legal).
