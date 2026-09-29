/**
 * Official University of Galway Brand Logo
 * Exact Positive (Light Theme) and Negative (Dark Theme) Logotypes
 * 
 * Composition:
 * - Crest: University of Galway Maroon (#840038) circular seal featuring the historic 1845
 *   Quadrangle building silhouette with central cupola and finial, flanked by "18" and "45",
 *   encircled by "GAILLIMH" and "GALWAY" in Gaelic serif typography.
 * - Wordmark: Bilingual stacked lockup using the official Spectral serif typeface:
 *   "OLLSCOIL NA GAILLIMHE"
 *   ───────────────────── (horizontal dividing rule)
 *   "UNIVERSITY OF GALWAY"
 * - Positive (Light Mode): Dark charcoal / black wordmark (#111827) and matching divider rule.
 * - Negative (Dark Mode): Pure crisp white wordmark (#ffffff) and white divider rule.
 */

import React from 'react';

export interface GalwayLogoProps {
  variant?: 'landscape' | 'portrait' | 'compact' | 'icon';
  theme?: 'dark' | 'light';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const GalwayLogo: React.FC<GalwayLogoProps> = ({
  variant = 'landscape',
  theme = 'dark',
  className = '',
  size = 'md',
}) => {
  const isLight = theme === 'light';
  const maroon = '#840038'; // Official University of Galway Maroon (PMS 208)

  // Exact brand colors according to theme:
  // Positive: Charcoal/Black (#111827) on light backgrounds
  // Negative: Crisp Pure White (#ffffff) on dark backgrounds
  const textPrimary = isLight ? '#111827' : '#ffffff';
  const ruleColor = isLight ? '#111827' : '#ffffff';

  // Dimension scaling
  const crestSize = {
    sm: 'w-8 h-8',
    md: 'w-9 h-9 md:w-10 md:h-10',
    lg: 'w-12 h-12 md:w-14 md:h-14',
  }[size];

  // Exact University of Galway Crest SVG
  const crestSvg = (
    <svg
      viewBox="0 0 160 160"
      className={`shrink-0 ${crestSize} select-none drop-shadow-xs`}
      aria-label="University of Galway Crest"
    >
      {/* Outer Galway Maroon Disc */}
      <circle cx="80" cy="80" r="78" fill={maroon} />

      {/* Concentric Outer Thin White Ring */}
      <circle cx="80" cy="80" r="72.5" fill="none" stroke="#ffffff" strokeWidth="1.6" />

      {/* Text Arc Definitions */}
      <defs>
        <path id="galway-seal-top-arc" d="M 27 80 A 53 53 0 0 1 133 80" fill="none" />
        <path id="galway-seal-bot-arc" d="M 133 80 A 53 53 0 0 1 27 80" fill="none" />
      </defs>

      {/* Top Arc: GAILLIMH with Gaelic serif elegance */}
      <text
        fill="#ffffff"
        fontSize="12.5"
        fontWeight="700"
        letterSpacing="4"
        fontFamily="'Spectral', Georgia, 'Times New Roman', serif"
      >
        <textPath href="#galway-seal-top-arc" startOffset="50%" textAnchor="middle">
          GAILLIMH
        </textPath>
      </text>

      {/* Equator Separator Dots */}
      <circle cx="26" cy="80" r="2.2" fill="#ffffff" />
      <circle cx="134" cy="80" r="2.2" fill="#ffffff" />

      {/* Bottom Arc: GALWAY */}
      <text
        fill="#ffffff"
        fontSize="12"
        fontWeight="700"
        letterSpacing="4.5"
        fontFamily="'Spectral', Georgia, 'Times New Roman', serif"
      >
        <textPath href="#galway-seal-bot-arc" startOffset="50%" textAnchor="middle">
          GALWAY
        </textPath>
      </text>

      {/* Concentric Inner White Ring */}
      <circle cx="80" cy="80" r="54.5" fill="none" stroke="#ffffff" strokeWidth="1.6" />

      {/* Galway Quadrangle Building Silhouette (1845) */}
      <g id="quadrangle-building">
        {/* Left Wing Facade */}
        <rect x="36" y="74" width="22" height="28" fill="#ffffff" />
        {/* Left Wing Windows */}
        <rect x="39" y="78" width="5" height="9" fill={maroon} rx="0.5" />
        <rect x="49" y="78" width="5" height="9" fill={maroon} rx="0.5" />
        <rect x="39" y="91" width="5" height="7" fill={maroon} rx="0.5" />
        <rect x="49" y="91" width="5" height="7" fill={maroon} rx="0.5" />
        {/* Left Wing Crenellations */}
        <rect x="36" y="71" width="4" height="4" fill="#ffffff" />
        <rect x="44" y="71" width="4" height="4" fill="#ffffff" />
        <rect x="52" y="71" width="4" height="4" fill="#ffffff" />

        {/* Right Wing Facade */}
        <rect x="102" y="74" width="22" height="28" fill="#ffffff" />
        {/* Right Wing Windows */}
        <rect x="106" y="78" width="5" height="9" fill={maroon} rx="0.5" />
        <rect x="116" y="78" width="5" height="9" fill={maroon} rx="0.5" />
        <rect x="106" y="91" width="5" height="7" fill={maroon} rx="0.5" />
        <rect x="116" y="91" width="5" height="7" fill={maroon} rx="0.5" />
        {/* Right Wing Crenellations */}
        <rect x="104" y="71" width="4" height="4" fill="#ffffff" />
        <rect x="112" y="71" width="4" height="4" fill="#ffffff" />
        <rect x="120" y="71" width="4" height="4" fill="#ffffff" />

        {/* Center Main Facade */}
        <rect x="56" y="66" width="48" height="38" fill="#ffffff" />

        {/* Left Flanking Turret */}
        <rect x="54" y="60" width="7" height="44" fill="#ffffff" />
        <rect x="54" y="57" width="2.5" height="3.5" fill="#ffffff" />
        <rect x="58.5" y="57" width="2.5" height="3.5" fill="#ffffff" />

        {/* Right Flanking Turret */}
        <rect x="99" y="60" width="7" height="44" fill="#ffffff" />
        <rect x="99" y="57" width="2.5" height="3.5" fill="#ffffff" />
        <rect x="103.5" y="57" width="2.5" height="3.5" fill="#ffffff" />

        {/* Center Gothic Arched Window */}
        <path d="M 76 74 Q 80 69 84 74 L 84 82 L 76 82 Z" fill={maroon} />

        {/* Main Center Entrance Portal & Doorway */}
        <path d="M 75 104 L 75 92 Q 80 88 85 92 L 85 104 Z" fill={maroon} />

        {/* Courtyard Pathway in Front of Portal */}
        <path d="M 74 104 L 67 132 L 93 132 L 86 104 Z" fill="#ffffff" />
        <line x1="80" y1="104" x2="80" y2="132" stroke={maroon} strokeWidth="1.2" />
        <line x1="71" y1="118" x2="89" y2="118" stroke={maroon} strokeWidth="1" />

        {/* Central Belfry / Clock Tower */}
        <rect x="67" y="44" width="26" height="23" fill="#ffffff" rx="1" />
        {/* 3 Belfry Vertical Louver Openings */}
        <rect x="71" y="48" width="4" height="13" fill={maroon} rx="1.5" />
        <rect x="78" y="46" width="4" height="15" fill={maroon} rx="1.5" />
        <rect x="85" y="48" width="4" height="13" fill={maroon} rx="1.5" />

        {/* Cupola Spire Dome */}
        <path d="M 67 44 Q 80 34 80 25 Q 80 34 93 44 Z" fill="#ffffff" />
        {/* Spire Top Finial */}
        <line x1="80" y1="25" x2="80" y2="18" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
        <circle cx="80" cy="18" r="1.6" fill="#ffffff" />

        {/* Foundation Year: 18 45 flanking central tower */}
        <text
          x="44"
          y="56"
          fill="#ffffff"
          fontSize="13.5"
          fontWeight="bold"
          fontFamily="'Spectral', Georgia, serif"
          textAnchor="middle"
        >
          18
        </text>
        <text
          x="116"
          y="56"
          fill="#ffffff"
          fontSize="13.5"
          fontWeight="bold"
          fontFamily="'Spectral', Georgia, serif"
          textAnchor="middle"
        >
          45
        </text>
      </g>
    </svg>
  );

  // Icon only
  if (variant === 'icon') {
    return <div className={`inline-flex items-center ${className}`}>{crestSvg}</div>;
  }

  // Portrait Mode
  if (variant === 'portrait') {
    return (
      <div className={`flex flex-col items-center text-center select-none ${className}`}>
        {crestSvg}
        <div className="mt-2.5 flex flex-col items-center">
          <span
            className="font-['Spectral',serif] font-semibold tracking-[0.14em] text-xs uppercase"
            style={{ color: textPrimary }}
          >
            Ollscoil na Gaillimhe
          </span>
          <div
            className="h-[1px] w-full max-w-[190px] my-1"
            style={{ backgroundColor: ruleColor }}
          />
          <span
            className="font-['Spectral',serif] font-bold tracking-[0.1em] text-xs uppercase"
            style={{ color: textPrimary }}
          >
            University of Galway
          </span>
        </div>
      </div>
    );
  }

  // Compact Mode
  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 select-none ${className}`}>
        {crestSvg}
        <div className="flex flex-col leading-tight">
          <span
            className="font-['Spectral',serif] font-semibold tracking-wider text-[10px] uppercase"
            style={{ color: textPrimary }}
          >
            Ollscoil na Gaillimhe
          </span>
          <div className="h-[1px] w-full my-[2px]" style={{ backgroundColor: ruleColor }} />
          <span
            className="font-['Spectral',serif] font-bold tracking-tight text-[11px] uppercase"
            style={{ color: textPrimary }}
          >
            University of Galway
          </span>
        </div>
      </div>
    );
  }

  // Landscape Mode (Default Official Lockup)
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      {/* Official Galway Crest */}
      {crestSvg}

      {/* Official Bilingual Wordmark Lockup */}
      <div className="flex flex-col justify-center leading-none">
        <span
          className="font-['Spectral',serif] font-semibold tracking-[0.14em] text-[10px] md:text-[11px] uppercase"
          style={{ color: textPrimary }}
        >
          Ollscoil na Gaillimhe
        </span>

        {/* Dividing Rule */}
        <div
          className="h-[1px] w-full my-[3px]"
          style={{ backgroundColor: ruleColor }}
        />

        <span
          className="font-['Spectral',serif] font-bold tracking-[0.1em] text-[11.5px] md:text-[12.5px] uppercase"
          style={{ color: textPrimary }}
        >
          University of Galway
        </span>
      </div>
    </div>
  );
};
