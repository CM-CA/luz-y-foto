// Las imágenes del cielo de la cabecera. Es el único sitio que las importa: Vite las copia a dist/assets/ con su nombre
// base y un código en el nombre (cielo-tarde-AbC123xY.webp), y así el service worker las guarda para usar sin conexión.
// Las lunas (luna-00.webp … luna-15.webp, una por fase) se importan igual. Se generan con `node scripts/generar-cielos.mjs`.
import tarde from "./cielo-tarde.webp";
import tardeCubierta from "./cielo-tarde-cubierta.webp";
import noche from "./cielo-noche.webp";
import nocheCubierta from "./cielo-noche-cubierta.webp";

export const CIELOS = { tarde, "tarde-cubierta": tardeCubierta, noche, "noche-cubierta": nocheCubierta };

// Las 16 fases de la luna, en orden: el índice es el que da indiceFaseLuna() (0 nueva, 4 cuarto creciente, 8 llena, 12 cuarto menguante)
const lunas = import.meta.glob("./luna-*.webp", { eager: true, import: "default" });
export const LUNAS = Object.keys(lunas).sort().map((archivo) => lunas[archivo]);
