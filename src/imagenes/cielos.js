// Las imágenes del cielo de la cabecera. Es el único sitio que las importa: Vite las copia a dist/assets/ con su nombre
// base y un código en el nombre (cielo-tarde-AbC123xY.webp), y así el service worker las guarda para usar sin conexión.
// Se generan con `node scripts/generar-cielos.mjs`.
import tarde from "./cielo-tarde.webp";
import tardeCubierta from "./cielo-tarde-cubierta.webp";
import noche from "./cielo-noche.webp";
import nocheCubierta from "./cielo-noche-cubierta.webp";

export const CIELOS = { tarde, "tarde-cubierta": tardeCubierta, noche, "noche-cubierta": nocheCubierta };
