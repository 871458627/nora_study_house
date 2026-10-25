import type { ReactNode } from 'react';

export type IconName =
  | 'home'
  | 'book'
  | 'pet'
  | 'chart'
  | 'gear'
  | 'speaker'
  | 'check'
  | 'lock'
  | 'back'
  | 'chevron'
  | 'leaf'
  | 'food'
  | 'star'
  | 'flame'
  | 'clock'
  | 'sync'
  | 'play'
  | 'close'
  | 'plus'
  | 'refresh'
  | 'pen'
  | 'sparkle'
  | 'alert'
  | 'arrow'
  | 'medal'
  | 'heart'
  | 'calendar'
  | 'download'
  | 'upload'
  | 'wifi-off'
  | 'bow'
  | 'crown'
  | 'glasses'
  | 'scarf'
  | 'cape';

const ICONS: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 11.5 12 4l8 7.5" />
      <path d="M6.5 10v9.5h11V10" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10 5 7.5 4.5 4 5v13c3.5-.5 6 0 8 1.5 2-1.5 4.5-2 8-1.5V5c-3.5-.5-6 0-8 1.5Z" />
      <path d="M12 6.5v13" />
    </>
  ),
  pet: (
    <>
      <circle cx="12" cy="13.5" r="6.6" />
      <path d="M12 6.4c1.3-2.7 3.5-3.4 5.2-2.7-.4 2.3-2.3 3.7-5.2 2.7Z" />
      <circle cx="9.9" cy="13.2" r=".9" fill="currentColor" stroke="none" />
      <circle cx="14.1" cy="13.2" r=".9" fill="currentColor" stroke="none" />
    </>
  ),
  chart: <path d="M5 19v-7M12 19V5M19 19v-4" />,
  gear: (
    <>
      <circle cx="12" cy="12" r="3.1" />
      <path d="M12 4.4v2M12 17.6v2M4.4 12h2M17.6 12h2M6.6 6.6l1.4 1.4M16 16l1.4 1.4M17.4 6.6 16 8M8 16l-1.4 1.4" />
    </>
  ),
  speaker: (
    <>
      <path d="M5 10v4h3l4 3V7l-4 3H5Z" />
      <path d="M15.5 9.2a4 4 0 0 1 0 5.6M18 6.7a7.5 7.5 0 0 1 0 10.6" />
    </>
  ),
  check: <path d="m5 12 4.5 4.5L19 7" />,
  lock: (
    <>
      <rect x="5.5" y="10" width="13" height="9.5" rx="2.4" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" />
    </>
  ),
  back: <path d="M15 5l-7 7 7 7" />,
  chevron: <path d="M9 5l7 7-7 7" />,
  leaf: (
    <>
      <path d="M19 5c-8 0-13 4-13 10 0 2.2 1.8 4 4 4 6 0 9-7 9-14Z" />
      <path d="M5 19c2.5-5 6-8 10-10" />
    </>
  ),
  food: (
    <>
      <path d="M5 11h14l-1.6 7.2H6.6L5 11Z" />
      <path d="M8.2 11c0-2.2 1.3-3.8 3.8-3.8s3.8 1.6 3.8 3.8" />
    </>
  ),
  star: (
    <path d="m12 3.8 2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8L12 3.8Z" />
  ),
  flame: (
    <path d="M12 3.5c1.2 3.2-.8 4.6-.8 6.4 0 1.3 1 2.1 2 2.1 1.4 0 2.3-1.1 2.3-2.7 2 1.7 3.2 4 3.2 6.2 0 3.6-2.9 6-6.7 6s-6.7-2.4-6.7-6c0-3.9 3-6.8 6.7-12Z" />
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M12 7.5V12l3 2" />
    </>
  ),
  sync: (
    <>
      <path d="M4.8 9a7.5 7.5 0 0 1 12.7-2.6L20 9" />
      <path d="M20 4.5V9h-4.5" />
      <path d="M19.2 15a7.5 7.5 0 0 1-12.7 2.6L4 15" />
      <path d="M4 19.5V15h4.5" />
    </>
  ),
  play: <path d="M8.5 5.5 19 12 8.5 18.5v-13Z" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  plus: <path d="M12 5v14M5 12h14" />,
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19 12a7 7 0 1 1-2.1-5" />
    </>
  ),
  pen: (
    <>
      <path d="m5 19 1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L9 18l-4 1Z" />
      <path d="m14.5 6.5 3 3" />
    </>
  ),
  sparkle: (
    <>
      <path d="m12 3 1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" />
      <path d="m18.5 15.5.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7.7-2Z" />
    </>
  ),
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V13M12 16.4v.1" />
    </>
  ),
  arrow: <path d="M4 12h15M14 6.5 19.5 12 14 17.5" />,
  medal: (
    <>
      <circle cx="12" cy="9.5" r="5.4" />
      <path d="M9 14.5 7.5 21l4.5-2.4L16.5 21 15 14.5" />
      <path d="m12 6.6 1 2 2.2.3-1.6 1.6.4 2.2-2-1-2 1 .4-2.2-1.6-1.6 2.2-.3 1-2Z" fill="currentColor" stroke="none" />
    </>
  ),
  heart: (
    <path d="M12 20.2s-7.6-4.7-7.6-10C4.4 7.5 6.5 5.6 9 5.6c1.3 0 2.4.6 3 1.7.6-1.1 1.7-1.7 3-1.7 2.5 0 4.6 1.9 4.6 4.6 0 5.3-7.6 10-7.6 10Z" />
  ),
  calendar: (
    <>
      <rect x="4" y="5.5" width="16" height="14.5" rx="3" />
      <path d="M4 10.5h16M8.5 3.5v3M15.5 3.5v3" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11M7.5 10.5 12 15l4.5-4.5" />
      <path d="M5 19h14" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5M7.5 9.5 12 5l4.5 4.5" />
      <path d="M5 19h14" />
    </>
  ),
  'wifi-off': (
    <>
      <path d="M3 3l18 18" />
      <path d="M8.5 15.5a5 5 0 0 1 7 0M5 12a10 10 0 0 1 3.2-2.1M15.8 9.9A10 10 0 0 1 19 12M12 19h.01" />
    </>
  ),
  bow: (
    <>
      <path d="M12 10.5c-1.6-3.2-4.3-4.3-6.2-2.9-2 1.5-1.2 4.5 1.4 5.3 1.8.6 3.6-.2 4.8-2.4Z" />
      <path d="M12 10.5c1.6-3.2 4.3-4.3 6.2-2.9 2 1.5 1.2 4.5-1.4 5.3-1.8.6-3.6-.2-4.8-2.4Z" />
      <circle cx="12" cy="10.5" r="1.8" />
    </>
  ),
  crown: (
    <>
      <path d="M4 17h16l-1.3-8.4-4.2 3.7L12 4.8l-2.5 7.5-4.2-3.7L4 17Z" />
      <path d="M5 20h14" />
    </>
  ),
  glasses: (
    <>
      <circle cx="7" cy="13" r="3.4" />
      <circle cx="17" cy="13" r="3.4" />
      <path d="M10.4 13h3.2M3.6 12 2 10.5M20.4 12 22 10.5" />
    </>
  ),
  scarf: (
    <>
      <path d="M6 5h12v5.5H6z" />
      <path d="M9 10.5h6V20H9zM9 16h6" />
    </>
  ),
  cape: (
    <>
      <path d="M8 5c0 2.2 1.8 3.6 4 3.6S16 7.2 16 5" />
      <path d="M8 5 5 20c3-1.4 4.6-3.4 7-3.4s4 2 7 3.4L16 5" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.8,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  );
}
