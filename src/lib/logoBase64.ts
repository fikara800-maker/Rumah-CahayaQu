// Vector SVG Brand Logo for Bimbel Rumah CahayaQu
// Matching the official purple house outline, warm golden sun rays, and open book
export const RUMAH_CAHAYAQU_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#8A4C93" />
      <stop offset="100%" stop-color="#5E2768" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F3C644" />
      <stop offset="100%" stop-color="#D49A24" />
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="#8A4C93" flood-opacity="0.15" />
    </filter>
  </defs>
  
  <!-- Background circle (optional soft white) -->
  <rect width="400" height="400" rx="60" fill="#FFFFFF"/>
  
  <g transform="translate(40, 25)" filter="url(#softShadow)">
    <!-- House Outline (Purple) -->
    <!-- Roof + Walls -->
    <path d="M 160 30 L 295 130 L 295 240 C 295 245 290 250 285 250 L 255 250 L 255 170 L 160 95 L 65 170 L 65 250 L 35 250 C 30 250 25 245 25 240 L 25 130 Z" fill="url(#purpleGrad)" />
    
    <!-- Sun Rays & Sun Core (Gold) -->
    <g transform="translate(160, 140)">
      <!-- Sun Core -->
      <circle cx="0" cy="0" r="38" fill="url(#goldGrad)" />
      <!-- Rays -->
      <line x1="0" y1="-52" x2="0" y2="-62" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
      <line x1="-38" y1="-38" x2="-45" y2="-45" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
      <line x1="38" y1="-38" x2="45" y2="-45" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
      <line x1="-52" y1="-12" x2="-62" y2="-15" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
      <line x1="52" y1="-12" x2="62" y2="-15" stroke="url(#goldGrad)" stroke-width="6" stroke-linecap="round" />
    </g>

    <!-- Open Quran / Book with Stand (Gold/Warm Ochre) -->
    <!-- Left Top Leaf -->
    <path d="M 160 195 C 120 160 65 168 50 195 C 68 222 125 210 160 195 Z" fill="#FDFBF7" stroke="url(#goldGrad)" stroke-width="8" stroke-linejoin="round" />
    <!-- Right Top Leaf -->
    <path d="M 160 195 C 200 160 255 168 270 195 C 252 222 195 210 160 195 Z" fill="#FDFBF7" stroke="url(#goldGrad)" stroke-width="8" stroke-linejoin="round" />

    <!-- Left Bottom Leaf -->
    <path d="M 160 205 C 115 190 60 210 52 238 C 75 258 128 238 160 205 Z" fill="#FDFBF7" stroke="url(#goldGrad)" stroke-width="8" stroke-linejoin="round" />
    <!-- Right Bottom Leaf -->
    <path d="M 160 205 C 205 190 260 210 268 238 C 245 258 192 238 160 205 Z" fill="#FDFBF7" stroke="url(#goldGrad)" stroke-width="8" stroke-linejoin="round" />

    <!-- Rehal / Crossed Stand -->
    <path d="M 110 270 L 160 215 L 210 270 C 185 272 170 262 160 252 C 150 262 135 272 110 270 Z" fill="url(#goldGrad)" />
    <path d="M 160 215 L 140 282 C 150 280 156 275 160 268 C 164 275 170 280 180 282 Z" fill="url(#goldGrad)" />

    <!-- Lower Walls and Base Foundation (Gold) -->
    <path d="M 35 190 L 35 260 C 35 270 45 278 55 278 L 105 278 L 105 262 L 55 262 L 55 190 Z" fill="url(#goldGrad)" />
    <path d="M 285 190 L 285 260 C 285 270 275 278 265 278 L 215 278 L 215 262 L 265 262 L 265 190 Z" fill="url(#goldGrad)" />
  </g>

  <!-- Typography "RUMAH CahayaQu" -->
  <text x="200" y="325" font-family="'Plus Jakarta Sans', 'Playfair Display', Arial, sans-serif" font-size="34" font-weight="900" fill="#8A4C93" text-anchor="middle" letter-spacing="3">RUMAH</text>
  <text x="200" y="365" font-family="'Plus Jakarta Sans', 'Playfair Display', Arial, sans-serif" font-size="38" font-weight="900" fill="#5E2768" text-anchor="middle" letter-spacing="0">CahayaQu</text>
</svg>
`)}`;

export const LOGO_BASE64 = RUMAH_CAHAYAQU_LOGO_SVG;
