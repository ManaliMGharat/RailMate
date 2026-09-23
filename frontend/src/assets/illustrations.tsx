import React from 'react';

export const RailMateLogo: React.FC<{ className?: string; size?: number }> = ({ className = '', size = 32 }) => (
  <div className={`flex items-center gap-2 select-none ${className}`}>
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="48" height="48" rx="14" fill="#1A56DB" />
      {/* Front locomotive contour */}
      <path d="M14 13C14 10.7909 15.7909 9 18 9H30C32.2091 9 34 10.7909 34 13V30C34 32.7614 31.7614 35 29 35H19C16.2386 35 14 32.7614 14 30V13Z" fill="white" />
      {/* Windshield */}
      <path d="M17 14C17 12.8954 17.8954 12 19 12H29C30.1046 12 31 12.8954 31 14V19H17V14Z" fill="#1E293B" />
      {/* Twin Headlights */}
      <circle cx="20" cy="29" r="2.2" fill="#F59E0B" />
      <circle cx="28" cy="29" r="2.2" fill="#F59E0B" />
      <path d="M22 24H26" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
      {/* Parallel tracks below */}
      <path d="M10 40L16 35M38 40L32 35" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M13 38H35" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
    <div className="flex flex-col">
      <span className="text-[22px] font-extrabold tracking-tight text-slate-800 leading-none">
        Rail<span className="text-blue-600">Mate</span>
      </span>
      <span className="text-[9px] font-semibold tracking-wider uppercase text-slate-400 mt-0.5">
        Journey Simplified
      </span>
    </div>
  </div>
);

// 1. Reserved Train Journey Card Illustration
export const ReservedIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Interior train coach wall */}
    <rect width="200" height="130" rx="16" fill="#F1F5F9" />
    
    {/* Large scenic window */}
    <rect x="20" y="12" width="160" height="74" rx="10" fill="#BAE6FD" />
    {/* Sky & sun */}
    <circle cx="150" cy="26" r="9" fill="#FEF08A" />
    {/* Mountain layers */}
    <path d="M20 70L55 35L90 70L125 42L160 74L180 70V86H20V70Z" fill="#38BDF8" opacity="0.6" />
    <path d="M35 78L75 48L115 78L145 55L180 86H20V80L35 78Z" fill="#0284C7" opacity="0.75" />
    {/* Lush green valley foreground */}
    <path d="M20 86C45 80 80 82 120 78C150 75 170 82 180 86H20Z" fill="#22C55E" />

    {/* Window Frame Inner Bevel */}
    <rect x="18" y="10" width="164" height="78" rx="12" stroke="#64748B" strokeWidth="3.5" fill="none" opacity="0.8" />

    {/* Table between passenger seats */}
    <path d="M85 75H115L118 105H82L85 75Z" fill="#E2E8F0" stroke="#CBD5E1" strokeWidth="1" />
    <ellipse cx="100" cy="76" rx="8" ry="2" fill="#94A3B8" />
    {/* Little chai cup */}
    <rect x="97" y="70" width="6" height="6" rx="1" fill="#FFFFFF" />

    {/* Left passenger sitting (kid/traveler in blue jacket) */}
    <circle cx="45" cy="58" r="8" fill="#FDBA74" /> {/* Head */}
    <path d="M38 54C40 50 50 50 52 54" stroke="#475569" strokeWidth="3" strokeLinecap="round" /> {/* Hair */}
    <rect x="36" y="68" width="18" height="24" rx="4" fill="#3B82F6" /> {/* Body */}
    <rect x="25" y="74" width="22" height="32" rx="4" fill="#1E3A8A" opacity="0.9" /> {/* Seat back */}

    {/* Right passenger sitting (traveler reading book/window view) */}
    <circle cx="155" cy="58" r="8" fill="#FDBA74" />
    <path d="M148 54C150 50 160 50 162 54" stroke="#92400E" strokeWidth="3" strokeLinecap="round" />
    <rect x="146" y="68" width="18" height="24" rx="4" fill="#EC4899" />
    <rect x="153" y="74" width="22" height="32" rx="4" fill="#1E3A8A" opacity="0.9" />

    {/* Bottom Coach Floor */}
    <rect y="112" width="200" height="18" fill="#475569" />
    <rect x="25" y="116" width="150" height="4" rx="2" fill="#64748B" />
  </svg>
);

// 2. Unreserved Suburban / Commuter Train Illustration
export const UnreservedIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Suburban coach background */}
    <rect width="200" height="130" rx="16" fill="#FEE2E2" opacity="0.6" />
    
    {/* Coach window */}
    <rect x="24" y="16" width="152" height="66" rx="8" fill="#FEF3C7" />
    <path d="M24 65C60 55 120 58 176 68V82H24V65Z" fill="#86EFAC" />
    <circle cx="140" cy="34" r="8" fill="#FBBF24" />

    {/* Window bars / divider */}
    <line x1="100" y1="16" x2="100" y2="82" stroke="#94A3B8" strokeWidth="2" />
    <rect x="22" y="14" width="156" height="70" rx="10" stroke="#CBD5E1" strokeWidth="3" fill="none" />

    {/* Passengers sitting on red seats */}
    <rect x="28" y="76" width="60" height="28" rx="6" fill="#DC2626" />
    <rect x="112" y="76" width="60" height="28" rx="6" fill="#4338CA" />

    {/* Passenger 1 (Mother with child) */}
    <circle cx="48" cy="55" r="7" fill="#FCA5A5" />
    <rect x="42" y="64" width="14" height="22" rx="3" fill="#B91C1C" />
    <circle cx="68" cy="62" r="5" fill="#FCA5A5" />
    <rect x="64" y="69" width="10" height="15" rx="2" fill="#F59E0B" />

    {/* Passenger 2 (Daily commuter with phone/coffee) */}
    <circle cx="142" cy="55" r="7.5" fill="#FCA5A5" />
    <rect x="135" y="64" width="16" height="24" rx="3" fill="#312E81" />
    <rect x="127" y="70" width="5" height="10" rx="1" fill="#10B981" />

    {/* Floor and handrails */}
    <line x1="10" y1="110" x2="190" y2="110" stroke="#94A3B8" strokeWidth="2" strokeDasharray="6 4" />
    <rect y="114" width="200" height="16" fill="#334155" />
    <line x1="70" y1="0" x2="70" y2="30" stroke="#64748B" strokeWidth="3" />
    <circle cx="70" cy="33" r="4" stroke="#64748B" strokeWidth="2" fill="none" />
    <line x1="130" y1="0" x2="130" y2="30" stroke="#64748B" strokeWidth="3" />
    <circle cx="130" cy="33" r="4" stroke="#64748B" strokeWidth="2" fill="none" />
  </svg>
);

// 3. Platform Station Ticket Illustration
export const PlatformIllustration: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg viewBox="0 0 200 130" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Station canopy / architecture */}
    <rect width="200" height="130" rx="16" fill="#FEF3C7" opacity="0.5" />
    {/* Metal roof beams */}
    <path d="M0 25L100 8L200 25" stroke="#94A3B8" strokeWidth="3" />
    <line x1="40" y1="18" x2="40" y2="40" stroke="#CBD5E1" strokeWidth="2" />
    <line x1="100" y1="8" x2="100" y2="40" stroke="#CBD5E1" strokeWidth="2" />
    <line x1="160" y1="18" x2="160" y2="40" stroke="#CBD5E1" strokeWidth="2" />

    {/* Modern Vande Bharat / Tejas style express train stationed on left */}
    <path d="M0 45C30 45 75 48 100 58C112 63 120 72 122 84L125 108H0V45Z" fill="#EA580C" />
    {/* Train windshield & black band */}
    <path d="M70 54H98C106 58 112 65 114 74H70V54Z" fill="#0F172A" />
    <line x1="0" y1="78" x2="114" y2="78" stroke="#FFFFFF" strokeWidth="3" />
    <circle cx="108" cy="88" r="3" fill="#FACC15" />

    {/* Platform Ground */}
    <path d="M85 102L200 95V130H85V102Z" fill="#E2E8F0" />
    {/* Yellow safety tactile line */}
    <line x1="95" y1="106" x2="200" y2="101" stroke="#EAB308" strokeWidth="3" strokeDasharray="4 2" />

    {/* Commuters walking on platform */}
    <circle cx="145" cy="74" r="5" fill="#FCA5A5" />
    <rect x="141" y="80" width="8" height="18" rx="2" fill="#1E293B" />
    <line x1="143" y1="98" x2="140" y2="110" stroke="#1E293B" strokeWidth="2" />
    <line x1="147" y1="98" x2="150" y2="110" stroke="#1E293B" strokeWidth="2" />

    {/* Commuter 2 with suitcase */}
    <circle cx="172" cy="76" r="4.5" fill="#FCA5A5" />
    <rect x="169" y="81" width="7" height="16" rx="2" fill="#2563EB" />
    <rect x="180" y="88" width="7" height="10" rx="1.5" fill="#B45309" />
    <line x1="177" y1="84" x2="182" y2="88" stroke="#64748B" strokeWidth="1.5" />
  </svg>
);
