"use client";

import { identity } from "@/lib/identity";

export function UnitOfficialSeal({ size = 110, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={`unit-official-seal ${className}`}
      aria-label={`${identity.organisation} - ${identity.unit} Official Seal`}
      role="img"
    >
      <defs>
        <path
          id="seal-top-curve"
          d="M 28 100 A 72 72 0 1 1 172 100"
          fill="none"
        />
        <path
          id="seal-bottom-curve"
          d="M 172 100 A 72 72 0 1 1 28 100"
          fill="none"
        />
      </defs>
      {/* Outer double rule */}
      <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
      {/* Inner ring */}
      <circle cx="100" cy="100" r="54" fill="none" stroke="currentColor" strokeWidth="1.5" />
      
      {/* Top curved text */}
      <text fill="currentColor" fontSize="11.5" fontWeight="700" letterSpacing="2.2" fontFamily="var(--mono)">
        <textPath href="#seal-top-curve" startOffset="50%" textAnchor="middle">
          ★ BREAKTHROUGH SCIENCE SOCIETY ★
        </textPath>
      </text>

      {/* Bottom curved text */}
      <text fill="currentColor" fontSize="11" fontWeight="700" letterSpacing="2.5" fontFamily="var(--mono)">
        <textPath href="#seal-bottom-curve" startOffset="50%" textAnchor="middle">
          ★ JALPAIGURI UNIT · ESTD 1995 ★
        </textPath>
      </text>

      {/* Center core: Bengali mark and starburst */}
      <g transform="translate(100, 100)">
        <circle cx="0" cy="0" r="28" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
        <text
          x="0"
          y="4"
          textAnchor="middle"
          dominantBaseline="central"
          fill="currentColor"
          fontSize="18"
          fontWeight="700"
          fontFamily="var(--bengali)"
        >
          {identity.bengali}
        </text>
        <text
          x="0"
          y="18"
          textAnchor="middle"
          fill="currentColor"
          fontSize="6.5"
          fontWeight="700"
          letterSpacing="0.8"
          fontFamily="var(--mono)"
        >
          LIGHT OF SCIENCE
        </text>
      </g>
    </svg>
  );
}

export function TreasurerSignatureBlock({
  officerName = "Arunabha Ghosh",
  roleTitle = "Unit Executive / Treasurer",
  date,
}: {
  officerName?: string;
  roleTitle?: string;
  date?: string;
}) {
  return (
    <div className="treasurer-sign-block">
      <div className="sign-pen-stroke" aria-hidden="true">
        <svg width="130" height="34" viewBox="0 0 130 34" fill="none">
          <path
            d="M 12 24 C 28 8, 42 28, 58 12 C 72 2, 78 30, 94 14 C 104 4, 118 18, 126 10 M 34 26 L 112 24"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        </svg>
      </div>
      <div className="sign-details">
        <strong>{officerName}</strong>
        <span>{roleTitle}</span>
        <small>{identity.fullName}</small>
        {date && <time className="sign-date">Dated: {date}</time>}
      </div>
    </div>
  );
}
