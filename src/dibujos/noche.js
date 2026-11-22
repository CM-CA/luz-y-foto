// El tiempo del modo noche: con luz basta un instante; con poca luz el móvil hace varias fotos seguidas durante unos segundos y las junta
// en una, así que hay que mantenerlo quieto. La barra larga va dividida en tantos tramos como fotos seguidas (el número es de dibujo, no de ningún móvil).
import { envolver, raya, texto, SUAVE, TINTA } from "./util.js";

export default {
  ancho: 358, alto: 232,
  claves: { conLuz: null, instante: null, modoNoche: null, lineas: 2 },
  pintar({ conLuz, instante, modoNoche, lineas }) {
    const tramos = 8, paso = 44, ancho = 40;
    return envolver(358, 232, [
      texto(4, 30, 800, 19, TINTA, conLuz),
      `<rect x="4" y="42" width="${ancho}" height="26" rx="7" fill="${TINTA}"/>`,
      texto(4 + ancho + 12, 62, 600, 17, SUAVE, instante),
      raya(4, 96, 354, 96),
      texto(4, 126, 800, 19, TINTA, modoNoche),
      ...Array.from({ length: tramos }, (_, i) => `<rect x="${4 + i * paso}" y="138" width="${ancho}" height="26" rx="7" fill="${TINTA}"/>`),
      texto(4, 192, 600, 17, SUAVE, lineas[0]),
      texto(4, 213, 600, 17, SUAVE, lineas[1])
    ].join("\n  "));
  }
};
