// La misma escena (un árbol, una persona y una montaña) con tres distancias focales desde el mismo sitio: 24 mm lo abarca todo (1), 50 mm se parece
// a lo que ve el ojo (2) y 200 mm acerca solo a la persona (3). Es un esquema, no una foto: el aumento de cada marco es el de 1x, 2x y 4x.
// La escena se agranda alrededor de la cabeza de la persona, que queda siempre en el mismo punto; lo que sale del marco se recorta aquí, en las
// formas, y no con un recorte de SVG, para que ningún elemento del dibujo asome por fuera del marco (ni de la página).
import { envolver, texto, FONDO, SUAVE, TINTA } from "./util.js";

// Recorta un polígono (lista de [x, y]) contra un rectángulo (Sutherland–Hodgman)
const recortar = (puntos, x0, y0, x1, y1) => {
  const bordes = [
    [(p) => p[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(p) => p[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(p) => p[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(p) => p[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]]
  ];
  return bordes.reduce((lista, [dentro, corte]) => {
    const salida = [];
    lista.forEach((p, i) => {
      const q = lista[(i + lista.length - 1) % lista.length];
      if (dentro(p)) { if (!dentro(q)) salida.push(corte(q, p)); salida.push(p); } else if (dentro(q)) salida.push(corte(q, p));
    });
    return salida;
  }, puntos);
};
const circulo = (cx, cy, r) => Array.from({ length: 32 }, (_, i) => [cx + r * Math.cos((i * 2 * Math.PI) / 32), cy + r * Math.sin((i * 2 * Math.PI) / 32)]);

export default {
  ancho: 358, alto: 208,
  claves: { rotulos: 3, lineas: 6 },
  pintar({ rotulos, lineas }) {
    const fy = 10, fw = 108, fh = 82;
    const marca = (cx, cy, n, r = 10) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${FONDO}" stroke="${TINTA}" stroke-width="2.5"/>${texto(cx, cy + r * 0.6, 800, r + 5, TINTA, n, "middle")}`;
    const f = (n) => +n.toFixed(1);
    // La escena, a tamaño de 24 mm y en las coordenadas del marco: [forma, relleno (opacidad)]
    const formas = [
      [circulo(90, 14, 5), 0.5],
      [[[64, 66], [80, 40], [92, 54], [100, 46], [130, 66]], 0.4],
      [[[-60, 66], [200, 66], [200, 266], [-60, 266]], 0.3],
      [[[20, 52], [24, 52], [24, 66], [20, 66]], 0.7],
      [circulo(22, 42, 10), 0.6],
      [[[46, 66], [46, 50], [48, 44], [54, 41], [60, 44], [62, 50], [62, 66]], 0.75],
      [circulo(54, 34, 5), 0.75]
    ];
    const escena = (fx, id, aumento) => {
      const dibujo = formas.map(([puntos, opacidad]) => {
        const lleno = recortar(puntos.map(([x, y]) => [fx + 54 + (x - 54) * aumento, fy + 38 + (y - 34) * aumento]), fx, fy, fx + fw, fy + fh);
        return lleno.length < 3 ? "" : `<polygon points="${lleno.map(([x, y]) => f(x) + "," + f(y)).join(" ")}" fill="${SUAVE}" opacity="${opacidad}" stroke="${TINTA}" stroke-width="2.5" stroke-linejoin="round"/>`;
      }).join("\n    ");
      return `<defs><clipPath id="dib-focales-${id}"><rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10"/></clipPath></defs>
  <g clip-path="url(#dib-focales-${id})">
    <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" fill="${SUAVE}" opacity=".14"/>
    ${dibujo}
  </g>
  <rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="10" fill="none" stroke="${TINTA}" stroke-width="2.5"/>`;
    };
    const columna = (fx, n, rotulo, l1, l2) => `${marca(fx + 12, 114, n, 10)}${texto(fx + 30, 120, 700, 16, TINTA, rotulo)}${texto(fx + 4, 148, 600, 15, SUAVE, l1)}${texto(fx + 4, 168, 600, 15, SUAVE, l2)}`;
    return envolver(358, 208, `${escena(8, "a", 1)}
  ${escena(125, "b", 2)}
  ${escena(242, "c", 4)}
  ${columna(8, 1, rotulos[0], lineas[0], lineas[1])}
  ${columna(125, 2, rotulos[1], lineas[2], lineas[3])}
  ${columna(242, 3, rotulos[2], lineas[4], lineas[5])}`);
  }
};
