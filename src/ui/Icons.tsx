import type { JSX } from "solid-js";

const glyph = {
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "1.9",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "aria-hidden": "true",
} as const;

export const IconOrbit: JSX.Element = (
    <svg {...glyph}>
        <circle cx="12" cy="12" r="3.2" />
        <ellipse cx="12" cy="12" rx="9" ry="4.1" transform="rotate(-28 12 12)" />
        <circle cx="19.4" cy="7.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
);

export const IconPlace: JSX.Element = (
    <svg {...glyph}>
        <path d="M12 5.5v13M5.5 12h13" />
        <circle cx="12" cy="12" r="9" opacity="0.35" />
    </svg>
);

export const IconErase: JSX.Element = (
    <svg {...glyph}>
        <path d="M9.5 19.5H19" />
        <path d="M4.6 14.4 13 6a2 2 0 0 1 2.8 0l3.2 3.2a2 2 0 0 1 0 2.8L12.5 19.5H8.4l-3.8-3.8a1.4 1.4 0 0 1 0-1.3Z" />
        <path d="m10.5 9 4.5 4.5" />
    </svg>
);
