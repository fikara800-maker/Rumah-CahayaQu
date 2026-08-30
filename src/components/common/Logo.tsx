'use client';

import React, { useState, useEffect } from 'react';

interface LogoProps {
  className?: string;
  variant?: 'icon' | 'full' | 'badge';
  showBorder?: boolean;
  showText?: boolean;
  customSrc?: string | null;
}

export default function Logo({ 
  className = "w-10 h-10", 
  variant = 'icon', 
  showBorder = false,
  showText = false,
  customSrc
}: LogoProps) {
  const [activeLogoSrc, setActiveLogoSrc] = useState<string | null>(null);
  const [imgError, setImgError] = useState<boolean>(false);

  useEffect(() => {
    // If an explicit customSrc is passed, use it
    if (customSrc !== undefined) {
      setActiveLogoSrc(customSrc);
      setImgError(false);
      return;
    }

    // Otherwise, check localStorage for custom logo
    const checkCustomLogo = () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('bimbel_custom_logo');
        setActiveLogoSrc(stored || null);
        setImgError(false);
      }
    };

    checkCustomLogo();

    // Listen to custom logo change events across the app
    const handleLogoUpdate = () => {
      checkCustomLogo();
    };

    window.addEventListener('bimbel_logo_updated', handleLogoUpdate);
    window.addEventListener('storage', handleLogoUpdate);

    return () => {
      window.removeEventListener('bimbel_logo_updated', handleLogoUpdate);
      window.removeEventListener('storage', handleLogoUpdate);
    };
  }, [customSrc]);

  // If a custom logo image is provided and hasn't failed loading, render the image
  if (activeLogoSrc && !imgError) {
    return (
      <img
        src={activeLogoSrc}
        alt="Logo Rumah CahayaQu"
        onError={() => setImgError(true)}
        className={`${className} object-contain`}
      />
    );
  }

  const isFull = variant === 'full' || showText;

  // Default Vector SVG Logo
  return (
    <svg 
      viewBox={isFull ? "0 0 512 600" : "0 0 512 512"} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="Logo Rumah CahayaQu"
    >
      <defs>
        {/* Purple House Gradients */}
        <linearGradient id="rcqPurpleRoof" x1="256" y1="40" x2="256" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#9644B2" />
          <stop offset="50%" stopColor="#7E379B" />
          <stop offset="100%" stopColor="#632582" />
        </linearGradient>

        <linearGradient id="rcqPurpleDark" x1="120" y1="120" x2="392" y2="260" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#7A3396" />
          <stop offset="100%" stopColor="#511A6B" />
        </linearGradient>

        {/* Gold Frame & Book Gradients */}
        <linearGradient id="rcqGoldMain" x1="120" y1="180" x2="392" y2="400" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F0C55C" />
          <stop offset="35%" stopColor="#DBA439" />
          <stop offset="70%" stopColor="#C38E25" />
          <stop offset="100%" stopColor="#9E6E16" />
        </linearGradient>

        <linearGradient id="rcqGoldBright" x1="200" y1="100" x2="312" y2="350" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FDE18A" />
          <stop offset="50%" stopColor="#E6B443" />
          <stop offset="100%" stopColor="#C49129" />
        </linearGradient>

        <linearGradient id="rcqSunGlow" x1="256" y1="125" x2="256" y2="245" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFDE7A" />
          <stop offset="60%" stopColor="#EAB33B" />
          <stop offset="100%" stopColor="#D49926" />
        </linearGradient>

        {/* 3D Paper Cut Drop Shadow */}
        <filter id="rcqSoftShadow" x="-10%" y="-10%" width="125%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="4" stdDeviation="5" floodColor="#4B1B61" floodOpacity="0.18" />
        </filter>
        
        <filter id="rcqEmbossShadow" x="-15%" y="-15%" width="130%" height="130%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="3" stdDeviation="3.5" floodColor="#3A124C" floodOpacity="0.22" />
        </filter>
      </defs>

      {/* Optional Outer Badge Background */}
      {showBorder && (
        <circle 
          cx="256" 
          cy="256" 
          r="244" 
          fill="#FFFFFF" 
          stroke="#EBDCEF" 
          strokeWidth="6" 
          filter="url(#rcqSoftShadow)"
        />
      )}

      {/* ========================================================
          1. GOLDEN SUN & 5 RAYS (Inside House Arch)
          ======================================================== */}
      <g filter="url(#rcqSoftShadow)">
        {/* Sun Dome */}
        <circle cx="256" cy="188" r="46" fill="url(#rcqSunGlow)" />

        {/* 5 Radiant Sun Rays */}
        {/* Top Center Ray (Vertical) */}
        <rect 
          x="251" 
          y="108" 
          width="10" 
          height="28" 
          rx="5" 
          fill="url(#rcqGoldBright)" 
        />
        {/* Upper Left Ray (Diagonal ~35°) */}
        <rect 
          x="251" 
          y="108" 
          width="9" 
          height="25" 
          rx="4.5" 
          fill="url(#rcqGoldBright)" 
          transform="rotate(-36 256 188)" 
        />
        {/* Mid Left Ray (Diagonal ~68°) */}
        <rect 
          x="251" 
          y="108" 
          width="9" 
          height="25" 
          rx="4.5" 
          fill="url(#rcqGoldBright)" 
          transform="rotate(-68 256 188)" 
        />
        {/* Upper Right Ray (Diagonal +36°) */}
        <rect 
          x="251" 
          y="108" 
          width="9" 
          height="25" 
          rx="4.5" 
          fill="url(#rcqGoldBright)" 
          transform="rotate(36 256 188)" 
        />
        {/* Mid Right Ray (Diagonal +68°) */}
        <rect 
          x="251" 
          y="108" 
          width="9" 
          height="25" 
          rx="4.5" 
          fill="url(#rcqGoldBright)" 
          transform="rotate(68 256 188)" 
        />
      </g>

      {/* ========================================================
          2. PURPLE HOUSE ROOF & GABLE STRUCTURE
          ======================================================== */}
      <g filter="url(#rcqEmbossShadow)">
        {/* Purple House Silhouette Outline */}
        <path 
          d="M 256 46
             L 398 162
             C 406 168 406 178 398 184
             L 378 198
             L 378 226
             C 378 232 372 238 366 238
             L 348 238
             L 348 190
             L 256 114
             L 164 190
             L 164 238
             L 146 238
             C 140 238 134 232 134 226
             L 134 198
             L 114 184
             C 106 178 106 168 114 162
             Z"
          fill="url(#rcqPurpleRoof)"
        />

        {/* Left Roof Outer Wall Segment (Purple) */}
        <path 
          d="M 126 192 L 158 192 L 158 244 C 158 249 153 253 148 253 L 126 253 Z"
          fill="url(#rcqPurpleDark)"
        />
        {/* Right Roof Outer Wall Segment (Purple) */}
        <path 
          d="M 386 192 L 354 192 L 354 244 C 354 249 359 253 364 253 L 386 253 Z"
          fill="url(#rcqPurpleDark)"
        />
      </g>

      {/* ========================================================
          3. GOLDEN LOWER HOUSE WALL CORNERS (L-Shapes)
          ======================================================== */}
      <g filter="url(#rcqSoftShadow)">
        {/* Left Lower Wall Corner */}
        <path 
          d="M 126 248
             L 158 248
             L 158 334
             L 204 334
             C 210 334 214 340 214 346
             L 214 362
             C 214 368 208 372 202 372
             L 138 372
             C 131 372 126 367 126 360
             Z"
          fill="url(#rcqGoldMain)"
        />

        {/* Right Lower Wall Corner */}
        <path 
          d="M 386 248
             L 354 248
             L 354 334
             L 308 334
             C 302 334 298 340 298 346
             L 298 362
             C 298 368 304 372 310 372
             L 374 372
             C 381 372 386 367 386 360
             Z"
          fill="url(#rcqGoldMain)"
        />
      </g>

      {/* ========================================================
          4. OPEN QURAN / LEAF PETALS ON REHAL (GOLD)
          ======================================================== */}
      <g filter="url(#rcqEmbossShadow)">
        {/* Rehal Crossing Base / Stand (X-Stand below pages) */}
        {/* Left Stand Leg */}
        <path 
          d="M 256 296
             C 240 320 206 362 176 394
             C 172 398 166 396 166 390
             C 174 376 196 348 214 326
             L 242 292
             Z"
          fill="url(#rcqGoldMain)"
        />
        {/* Right Stand Leg */}
        <path 
          d="M 256 296
             C 272 320 306 362 336 394
             C 340 398 346 396 346 390
             C 338 376 316 348 298 326
             L 270 292
             Z"
          fill="url(#rcqGoldMain)"
        />

        {/* Bottom Arch Connecting Stand Legs */}
        <path 
          d="M 188 382
             C 222 344 290 344 324 382
             C 328 386 322 392 316 388
             C 286 358 226 358 196 388
             C 190 392 184 386 188 382
             Z"
          fill="url(#rcqGoldBright)"
        />

        {/* Lower Left Page Leaf (Curved Outline) */}
        <path 
          d="M 256 298
             C 214 290 162 278 152 238
             C 150 230 158 224 166 228
             C 188 238 232 262 256 288
             Z"
          fill="url(#rcqGoldMain)"
          stroke="#E6B443"
          strokeWidth="2"
        />

        {/* Lower Right Page Leaf (Curved Outline) */}
        <path 
          d="M 256 298
             C 298 290 350 278 360 238
             C 362 230 354 224 346 228
             C 324 238 280 262 256 288
             Z"
          fill="url(#rcqGoldMain)"
          stroke="#E6B443"
          strokeWidth="2"
        />

        {/* Upper Left Page Leaf (Curved Outline) */}
        <path 
          d="M 256 264
             C 220 220 166 200 148 206
             C 142 208 140 216 144 222
             C 158 248 208 282 256 292
             C 254 282 254 274 256 264
             Z"
          fill="url(#rcqGoldBright)"
          stroke="#9E6E16"
          strokeWidth="1.5"
        />

        {/* Upper Right Page Leaf (Curved Outline) */}
        <path 
          d="M 256 264
             C 292 220 346 200 364 206
             C 370 208 372 216 368 222
             C 354 248 304 282 256 292
             C 258 282 258 274 256 264
             Z"
          fill="url(#rcqGoldBright)"
          stroke="#9E6E16"
          strokeWidth="1.5"
        />

        {/* Central Quran Spine & Leaf Crease Accents */}
        <path 
          d="M 256 260 L 256 304" 
          stroke="#C38E25" 
          strokeWidth="5" 
          strokeLinecap="round" 
        />
        
        {/* Inner golden glow highlights on pages */}
        <path 
          d="M 246 270 C 210 240 178 226 160 222" 
          stroke="#FFF2B8" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeOpacity="0.85"
        />
        <path 
          d="M 266 270 C 302 240 334 226 352 222" 
          stroke="#FFF2B8" 
          strokeWidth="2.5" 
          strokeLinecap="round" 
          strokeOpacity="0.85"
        />
      </g>

      {/* ========================================================
          5. OPTIONAL TYPOGRAPHY ("RUMAH CahayaQu")
          ======================================================== */}
      {isFull && (
        <g id="rcqBrandTypography" className="font-serif">
          {/* Top Line: "RUMAH" */}
          <text
            x="256"
            y="475"
            textAnchor="middle"
            fill="#6E2C88"
            fontSize="54"
            fontWeight="800"
            fontFamily="Georgia, 'Times New Roman', serif"
            letterSpacing="6"
            filter="url(#rcqSoftShadow)"
          >
            RUMAH
          </text>

          {/* Bottom Line: "CahayaQu" */}
          <text
            x="256"
            y="545"
            textAnchor="middle"
            fill="#4F1A68"
            fontSize="62"
            fontWeight="700"
            fontFamily="Georgia, 'Playfair Display', serif"
            letterSpacing="1"
            filter="url(#rcqSoftShadow)"
          >
            CahayaQu
          </text>
        </g>
      )}
    </svg>
  );
}
