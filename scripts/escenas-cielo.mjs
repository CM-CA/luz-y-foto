// Los cuatro cielos de la cabecera, como dibujos SVG de 390 × 262. `generar-cielos.mjs` los convierte en las imágenes
// WebP de src/imagenes/ (780 × 524). Son la propuesta de diseño «La luz de ahora»: tarde despejada (semáforo verde o
// ámbar), tarde cubierta (rojo), noche y noche cubierta. La luna NO está en los cielos: se superpone en la cabecera
// con la fase real de esa noche (src/imagenes/luna-*.webp, dibujadas por lunaSvg).

const envolver = (contenido) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 262" width="390" height="262">${contenido}</svg>`;

export const ESCENAS = {
  tarde: envolver(`
      <defs>
        <linearGradient id="cielo1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2f4a8c"/><stop offset=".30" stop-color="#7a63ad"/><stop offset=".55" stop-color="#e5819f"/><stop offset=".78" stop-color="#f6a65a"/><stop offset="1" stop-color="#ffd884"/>
        </linearGradient>
        <radialGradient id="brillo1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo1)"/><g transform="translate(0,-30)">
      <ellipse cx="86" cy="205" rx="150" ry="95" fill="url(#brillo1)"/>
      <circle cx="86" cy="213" r="21" fill="#fff6d2"/>
      <path d="M200 98 C240 88 300 92 340 102 C300 108 250 108 200 98Z" fill="#ffd0c4" opacity=".55"/>
      <path d="M230 128 C270 120 330 124 380 134 C330 140 270 140 230 128Z" fill="#ffe0c0" opacity=".55"/>
      <path d="M20 90 C60 84 110 86 150 94 C110 100 60 100 20 90Z" fill="#f7b5c4" opacity=".5"/>
      <path d="M0 224 C28 210 52 200 92 206 C122 211 140 222 168 218 C198 214 214 196 250 192 C282 189 300 204 330 214 C356 222 376 218 390 212 L390 300 L0 300Z" fill="#94668f"/>
      <path d="M0 262 L0 238 C40 230 74 234 116 232 C160 230 188 240 232 238 C276 236 312 226 348 230 C368 232 380 236 390 234 L390 300 L0 300Z" fill="#2b2147"/>
      <path d="M262 232 L296 232 L289 238 L269 238Z" fill="#2b2147"/><path d="M279 231 L279 204 L294 228Z" fill="#2b2147"/><path d="M275 231 L275 213 L264 229Z" fill="#2b2147"/>
    </g>`),

  "tarde-cubierta": envolver(`
      <defs>
        <linearGradient id="cielo2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4b5271"/><stop offset=".45" stop-color="#7d7f9b"/><stop offset=".8" stop-color="#b3a3b4"/><stop offset="1" stop-color="#d4b9b3"/>
        </linearGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo2)"/><g transform="translate(0,-30)">
      <g fill="#3f4562" opacity=".5"><ellipse cx="70" cy="70" rx="120" ry="30"/><ellipse cx="250" cy="52" rx="140" ry="28"/><ellipse cx="350" cy="120" rx="110" ry="30"/><ellipse cx="120" cy="140" rx="130" ry="26"/></g>
      <g fill="#c7bccb" opacity=".45"><ellipse cx="190" cy="105" rx="150" ry="22"/><ellipse cx="40" cy="190" rx="110" ry="20"/><ellipse cx="300" cy="180" rx="120" ry="20"/></g>
      <path d="M0 226 C28 212 52 204 92 209 C122 213 140 224 168 220 C198 216 214 200 250 196 C282 193 300 207 330 216 C356 224 376 220 390 214 L390 300 L0 300Z" fill="#6c6483" opacity=".9"/>
      <path d="M0 262 L0 240 C40 232 74 236 116 234 C160 232 188 242 232 240 C276 238 312 228 348 232 C368 234 380 238 390 236 L390 300 L0 300Z" fill="#37324f"/>
    </g>`),

  noche: envolver(`
      <defs>
        <linearGradient id="cielo3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a1128"/><stop offset=".55" stop-color="#16244e"/><stop offset=".85" stop-color="#2c4079"/><stop offset="1" stop-color="#46598f"/>
        </linearGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo3)"/><g transform="translate(0,-30)">
      <g fill="#fff" opacity=".9"><circle cx="96" cy="118" r="1.1"/><circle cx="220" cy="92" r="1.1"/><circle cx="330" cy="86" r="1.1"/><circle cx="360" cy="150" r="1.3"/><circle cx="60" cy="168" r="1"/><circle cx="188" cy="150" r="1"/><circle cx="300" cy="170" r="1"/><circle cx="120" cy="86" r="1"/><circle cx="238" cy="132" r="1.2"/></g>
      <path d="M0 228 C28 214 52 206 92 211 C122 215 140 226 168 222 C198 218 214 202 250 198 C282 195 300 209 330 218 C356 226 376 222 390 216 L390 300 L0 300Z" fill="#101a3c"/>
      <path d="M0 262 L0 242 C40 234 74 238 116 236 C160 234 188 244 232 242 C276 240 312 230 348 234 C368 236 380 240 390 238 L390 300 L0 300Z" fill="#080e22"/>
      <path d="M262 236 L296 236 L289 242 L269 242Z" fill="#080e22"/><path d="M279 235 L279 210 L294 232Z" fill="#080e22"/>
    </g>`),

  "noche-cubierta": envolver(`
      <defs>
        <linearGradient id="cielo4" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0d1429"/><stop offset=".5" stop-color="#1b2547"/><stop offset=".85" stop-color="#2f3a63"/><stop offset="1" stop-color="#434d76"/>
        </linearGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo4)"/><g transform="translate(0,-30)">
      <g fill="#050a1a" opacity=".55"><ellipse cx="70" cy="80" rx="130" ry="32"/><ellipse cx="260" cy="58" rx="150" ry="30"/><ellipse cx="350" cy="130" rx="120" ry="32"/><ellipse cx="110" cy="150" rx="140" ry="28"/></g>
      <g fill="#59648d" opacity=".4"><ellipse cx="200" cy="112" rx="160" ry="22"/><ellipse cx="40" cy="195" rx="115" ry="20"/><ellipse cx="305" cy="182" rx="125" ry="20"/></g>
      <path d="M0 228 C28 214 52 206 92 211 C122 215 140 226 168 222 C198 218 214 202 250 198 C282 195 300 209 330 218 C356 226 376 222 390 216 L390 300 L0 300Z" fill="#141c3b"/>
      <path d="M0 262 L0 242 C40 234 74 238 116 236 C160 234 188 244 232 242 C276 240 312 230 348 234 C368 236 380 240 390 238 L390 300 L0 300Z" fill="#080e22"/>
      <path d="M262 236 L296 236 L289 242 L269 242Z" fill="#080e22"/><path d="M279 235 L279 210 L294 232Z" fill="#080e22"/>
    </g>`)
};

/**
 * La luna en una de sus 16 fases (0 nueva, 4 cuarto creciente, 8 llena, 12 cuarto menguante), como un dibujo SVG de 132 × 132
 * con el disco de radio 52 en el centro. Es el hemisferio norte y sin inclinación: la parte iluminada queda a la derecha mientras
 * crece (fase < 0,5) y a la izquierda mientras mengua; el terminador es una elipse. La app voltea la imagen en el hemisferio sur.
 * Los tres cráteres están fijos en el disco y solo se ven donde hay luz.
 */
export function lunaSvg(i) {
  const fase = i / 16, r = 52, c = Math.cos(2 * Math.PI * fase), rx = (r * Math.abs(c)).toFixed(2);
  const luz = `M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${c > 0 ? 0 : 1} 0 ${-r} Z`;
  const voltear = fase >= 0.5 ? ' transform="scale(-1,1)"' : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-66 -66 132 132" width="132" height="132">
      <defs><clipPath id="luz"><path d="${luz}"${voltear}/></clipPath></defs>
      <circle r="${r}" fill="#2a3556"/>
      <path d="${luz}"${voltear} fill="#f4eed8"/>
      <g clip-path="url(#luz)"><circle cx="18" cy="-8" r="11" fill="#e0d9bd" opacity=".8"/><circle cx="26" cy="24" r="8" fill="#e0d9bd" opacity=".7"/><circle cx="12" cy="-28" r="6" fill="#e0d9bd" opacity=".7"/></g>
      <circle r="${r}" fill="none" stroke="#f4eed8" stroke-opacity=".25" stroke-width="3"/>
    </svg>`;
}
