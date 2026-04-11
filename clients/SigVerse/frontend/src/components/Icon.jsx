const ICONS = {
  brand: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 4.5 16.8 9 12 19.5 7.2 9Z" />
    </>
  ),
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="11" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="17.5" width="7" height="3" rx="1.5" />
    </>
  ),
  courses: (
    <>
      <path d="M4.5 6.5 12 3l7.5 3.5V17L12 20l-7.5-3Z" />
      <path d="M12 3v17" />
    </>
  ),
  enrollments: (
    <>
      <circle cx="8" cy="8" r="3.5" />
      <path d="M2.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="m15 11 2 2 4-4" />
    </>
  ),
  performance: (
    <>
      <path d="M4 18V8" />
      <path d="M10 18V5" />
      <path d="M16 18v-7" />
      <path d="M3 18h18" />
    </>
  ),
  instructor: (
    <>
      <path d="M4 8.5 12 4l8 4.5-8 4.5Z" />
      <path d="M7 10.5V15c0 1.5 2.2 2.5 5 2.5s5-1 5-2.5v-4.5" />
    </>
  ),
  admin: (
    <>
      <path d="m12 3 2.2 2.1 3-.4.9 2.8 2.7 1.3-1 2.9 1 2.9-2.7 1.3-.9 2.8-3-.4L12 21l-2.2-2.1-3 .4-.9-2.8-2.7-1.3 1-2.9-1-2.9 2.7-1.3.9-2.8 3 .4Z" />
      <circle cx="12" cy="12" r="3.2" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 19 6v5c0 4.4-2.7 8.1-7 10-4.3-1.9-7-5.6-7-10V6Z" />
      <path d="m9.2 12.3 1.9 1.9 3.9-4.2" />
    </>
  ),
  book: (
    <>
      <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5Z" />
      <path d="M5 5.5v15" />
    </>
  ),
  spark: (
    <>
      <path d="m12 3 1.8 4.7L18.5 9l-4.7 1.3L12 15l-1.8-4.7L5.5 9l4.7-1.3Z" />
      <path d="m19 2 .7 1.8L21.5 4.5l-1.8.7L19 7l-.7-1.8-1.8-.7 1.8-.7Z" />
    </>
  ),
  back: (
    <>
      <path d="m10 6-6 6 6 6" />
      <path d="M4 12h16" />
    </>
  ),
  warning: (
    <>
      <path d="M12 4 3.5 19h17Z" />
      <path d="M12 9v4.5" />
      <circle cx="12" cy="17" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  arrowRight: (
    <>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  document: (
    <>
      <path d="M7 3.5h7l4 4V20.5H7Z" />
      <path d="M14 3.5v4h4" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v3" />
      <path d="M12 18.5v3" />
      <path d="m4.9 4.9 2.1 2.1" />
      <path d="m17 17 2.1 2.1" />
      <path d="M2.5 12h3" />
      <path d="M18.5 12h3" />
      <path d="m4.9 19.1 2.1-2.1" />
      <path d="M17 7l2.1-2.1" />
    </>
  ),
  moon: (
    <>
      <path d="M18.5 13.2A7.5 7.5 0 1 1 10.8 5.5a6 6 0 0 0 7.7 7.7Z" />
    </>
  ),
  certificate: (
    <>
      <rect x="4" y="5" width="16" height="11" rx="2" />
      <path d="M8 9h8" />
      <path d="M8 12h5" />
      <path d="m10 16 2 5 2-5" />
    </>
  ),
  video: (
    <>
      <rect x="4" y="6" width="16" height="12" rx="2" />
      <path d="m11 10 4 2-4 2Z" />
    </>
  ),
  download: (
    <>
      <path d="M12 4v11" />
      <path d="m7.5 11.5 4.5 4.5 4.5-4.5" />
      <path d="M4 20h16" />
    </>
  )
};

export default function Icon({ name, size = 18, className = '', filled = false }) {
  const content = ICONS[name] || ICONS.spark;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
