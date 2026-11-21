// TEMPORAL (página #/prueba-cielo): los tres ambientes del cielo de la propuesta de diseño, como dibujo SVG.
// Los mismos dibujos, convertidos a imagen, están en cielo-*.webp. Se borra todo en cuanto se elija cómo dibujar el cielo.
export const ESCENAS = [
  { id: 'tarde', nombre: 'Atardecer dorado (semáforo verde)', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 262" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="cielo1" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#2f4a8c"/><stop offset=".30" stop-color="#7a63ad"/><stop offset=".55" stop-color="#e5819f"/><stop offset=".78" stop-color="#f6a65a"/><stop offset="1" stop-color="#ffd884"/>
        </linearGradient>
        <radialGradient id="brillo1" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#fff3c4" stop-opacity=".95"/><stop offset=".35" stop-color="#ffd27a" stop-opacity=".55"/><stop offset="1" stop-color="#ffb35a" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo1)"/><g transform="translate(0,-30)">
      <ellipse cx="86" cy="205" rx="150" ry="95" fill="url(#brillo1)"/>
      <circle cx="86" cy="213" r="21" fill="#fff6d2"/>
      <!-- nubes largas, rosadas -->
      <path d="M200 98 C240 88 300 92 340 102 C300 108 250 108 200 98Z" fill="#ffd0c4" opacity=".55"/>
      <path d="M230 128 C270 120 330 124 380 134 C330 140 270 140 230 128Z" fill="#ffe0c0" opacity=".55"/>
      <path d="M20 90 C60 84 110 86 150 94 C110 100 60 100 20 90Z" fill="#f7b5c4" opacity=".5"/>
      <!-- islas lejanas -->
      <path d="M0 224 C28 210 52 200 92 206 C122 211 140 222 168 218 C198 214 214 196 250 192 C282 189 300 204 330 214 C356 222 376 218 390 212 L390 300 L0 300Z" fill="#94668f"/>
      <!-- costa cercana y velero -->
      <path d="M0 262 L0 238 C40 230 74 234 116 232 C160 230 188 240 232 238 C276 236 312 226 348 230 C368 232 380 236 390 234 L390 300Z" fill="#2b2147"/>
      <path d="M262 232 L296 232 L289 238 L269 238Z" fill="#2b2147"/><path d="M279 231 L279 204 L294 228Z" fill="#2b2147"/><path d="M275 231 L275 213 L264 229Z" fill="#2b2147"/>
    </g></svg>` },
  { id: 'cubierto', nombre: 'Atardecer cubierto (semáforo rojo)', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 262" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="cielo2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#4b5271"/><stop offset=".45" stop-color="#7d7f9b"/><stop offset=".8" stop-color="#b3a3b4"/><stop offset="1" stop-color="#d4b9b3"/>
        </linearGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo2)"/><g transform="translate(0,-30)">
      <g fill="#3f4562" opacity=".5"><ellipse cx="70" cy="70" rx="120" ry="30"/><ellipse cx="250" cy="52" rx="140" ry="28"/><ellipse cx="350" cy="120" rx="110" ry="30"/><ellipse cx="120" cy="140" rx="130" ry="26"/></g>
      <g fill="#c7bccb" opacity=".45"><ellipse cx="190" cy="105" rx="150" ry="22"/><ellipse cx="40" cy="190" rx="110" ry="20"/><ellipse cx="300" cy="180" rx="120" ry="20"/></g>
      <path d="M0 226 C28 212 52 204 92 209 C122 213 140 224 168 220 C198 216 214 200 250 196 C282 193 300 207 330 216 C356 224 376 220 390 214 L390 300 L0 300Z" fill="#6c6483" opacity=".9"/>
      <path d="M0 262 L0 240 C40 232 74 236 116 234 C160 232 188 242 232 240 C276 238 312 228 348 232 C368 234 380 238 390 236 L390 300Z" fill="#37324f"/>
    </g></svg>` },
  { id: 'noche', nombre: 'Noche con luna (semáforo ámbar)', svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 262" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="cielo3" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#0a1128"/><stop offset=".55" stop-color="#16244e"/><stop offset=".85" stop-color="#2c4079"/><stop offset="1" stop-color="#46598f"/>
        </linearGradient>
        <radialGradient id="halo3" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#f6efd2" stop-opacity=".55"/><stop offset="1" stop-color="#f6efd2" stop-opacity="0"/></radialGradient>
      </defs>
      <rect width="390" height="300" fill="url(#cielo3)"/><g transform="translate(0,-30)">
      <g fill="#fff" opacity=".9"><circle cx="96" cy="118" r="1.1"/><circle cx="220" cy="92" r="1.1"/><circle cx="330" cy="86" r="1.1"/><circle cx="360" cy="150" r="1.3"/><circle cx="60" cy="168" r="1"/><circle cx="188" cy="150" r="1"/><circle cx="300" cy="170" r="1"/><circle cx="120" cy="86" r="1"/><circle cx="238" cy="132" r="1.2"/></g>
      <circle cx="292" cy="116" r="74" fill="url(#halo3)"/>
      <g transform="translate(292,116)"><circle r="26" fill="#2a3556"/><path d="M0 -26 A26 26 0 0 1 0 26 A17 26 0 0 1 0 -26Z" fill="#f4eed8"/><path d="M0 -26 A26 26 0 0 1 0 26 A13 26 0 0 0 0 -26Z" fill="#f4eed8"/>
        <circle cx="9" cy="-4" r="5.5" fill="#e0d9bd" opacity=".8"/><circle cx="13" cy="12" r="4" fill="#e0d9bd" opacity=".7"/><circle cx="6" cy="-14" r="3" fill="#e0d9bd" opacity=".7"/></g>
      <path d="M0 228 C28 214 52 206 92 211 C122 215 140 226 168 222 C198 218 214 202 250 198 C282 195 300 209 330 218 C356 226 376 222 390 216 L390 300 L0 300Z" fill="#101a3c"/>
      <path d="M0 262 L0 242 C40 234 74 238 116 236 C160 234 188 244 232 242 C276 240 312 230 348 234 C368 236 380 240 390 238 L390 300Z" fill="#080e22"/>
      <path d="M262 236 L296 236 L289 242 L269 242Z" fill="#080e22"/><path d="M279 235 L279 210 L294 232Z" fill="#080e22"/>
    </g></svg>` },
];
