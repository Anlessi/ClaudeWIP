import type { ReactNode } from "react"

export type IconName =
  | "calendar"
  | "chevron-left"
  | "chevron-right"
  | "chevron-down"
  | "sliders"
  | "cloud"
  | "sun"
  | "moon"
  | "rain"
  | "snow"
  | "bolt"
  | "check"
  | "arrow-up"
  | "arrow-down"
  | "plus"
  | "x"
  | "trash"
  | "pin"
  | "search"
  | "aurora"

const SHAPES: Record<IconName, ReactNode> = {
  calendar: (
    <path d="M7 3v3M17 3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z" />
  ),
  "chevron-left": <path d="m15 18-6-6 6-6" />,
  "chevron-right": <path d="m9 18 6-6-6-6" />,
  "chevron-down": <path d="m6 9 6 6 6-6" />,
  // Three slider tracks with knobs, for the Filters button.
  sliders: (
    <>
      <path d="M4 6h3M11 6h9M4 12h9M17 12h3M4 18h1M9 18h11" />
      <circle cx="9" cy="6" r="2" />
      <circle cx="15" cy="12" r="2" />
      <circle cx="7" cy="18" r="2" />
    </>
  ),
  cloud: <path d="M7 17h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 8.5 4.5 4.5 0 0 0 7 17Z" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41" />
    </>
  ),
  moon: <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />,
  rain: (
    <>
      <path d="M7 16h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 6.2 7.5 4.5 4.5 0 0 0 7 16Z" />
      <path d="m8 19-1 2M13 19l-1 2M18 19l-1 2" />
    </>
  ),
  snow: <path d="M12 3v18M4.2 7.5l15.6 9M4.2 16.5l15.6-9" />,
  bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />,
  check: <path d="m5 12 4 4L19 6" />,
  "arrow-up": <path d="M12 19V5M6.5 10.5 12 5l5.5 5.5" />,
  "arrow-down": <path d="M12 5v14M17.5 13.5 12 19l-5.5-5.5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
  trash: <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />,
  pin: (
    <>
      <path d="M12 21s-6.5-5.4-6.5-11a6.5 6.5 0 1 1 13 0c0 5.6-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.3" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4.2-4.2" />
    </>
  ),
  // Curtains of light above the horizon.
  aurora: (
    <>
      <path d="M5 17c0-4 2-6 1-11M12 17c0-5 2-7 1-13M19 17c0-4-2-6-1-10" />
      <path d="M3 20h18" />
    </>
  ),
}

export default function Icon({
  name,
  size = 18,
}: {
  name: IconName
  size?: number
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {SHAPES[name]}
    </svg>
  )
}
