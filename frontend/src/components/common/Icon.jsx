/* eslint-disable react-refresh/only-export-components --
   Icons are built via the make() factory below; every export IS a component,
   so fast refresh works, but the rule cannot see through the factory call.
   Rewriting ~50 icons by hand just to satisfy the heuristic would be noise. */

/**
 * Central icon set so every screen draws the same glyphs at the same weight.
 * All icons accept a `className` for sizing (default 16px).
 */
const make = (children, strokeWidth = 1.8) => {
  const IconComponent = ({ className = "w-4 h-4", ...rest }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...rest}
    >
      {children}
    </svg>
  );
  return IconComponent;
};

const p = (d) => <path d={d} />;

/* ---------- actions ---------- */
export const PlusIcon = make(p("M12 5v14M5 12h14"), 2);
export const SearchIcon = make(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="M20 20l-3.5-3.5" />
  </>,
  2,
);
export const PencilIcon = make(
  p(
    "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z",
  ),
);
export const TrashIcon = make(
  p(
    "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
  ),
);
export const EyeIcon = make(
  <>
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.75" />
  </>,
);
export const EyeOffIcon = make(
  <>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </>,
);
export const LockIcon = make(
  <>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </>,
);
export const ShieldCheckIcon = make(
  <>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </>,
);
export const DownloadIcon = make(p("M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"));
export const UploadIcon = make(p("M12 17V5m0 0L8 9m4-4l4 4M4 20h16"));
export const XIcon = make(p("M6 18L18 6M6 6l12 12"), 2);
export const CheckIcon = make(p("M4.5 12.5l5 5 10-11"), 2.2);
export const RefreshIcon = make(
  p(
    "M20 11A8 8 0 006.3 6.3L4 8.5M4 4v4.5h4.5M4 13a8 8 0 0013.7 4.7L20 15.5M20 20v-4.5h-4.5",
  ),
);
export const FilterIcon = make(p("M3 5h18M6 12h12M10 19h4"), 2);
export const LogoutIcon = make(
  p(
    "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
  ),
);
export const MenuIcon = make(p("M4 6h16M4 12h16M4 18h16"), 2);
export const CopyIcon = make(
  <>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 5.5A2.5 2.5 0 0012.5 3H6a2.5 2.5 0 00-2.5 2.5V13" />
  </>,
);

/* ---------- chevrons / arrows ---------- */
export const ChevronDownIcon = make(p("M6 9l6 6 6-6"), 2.2);
export const ChevronLeftIcon = make(p("M15 6l-6 6 6 6"), 2.2);
export const ChevronRightIcon = make(p("M9 6l6 6-6 6"), 2.2);
export const ChevronsLeftIcon = make(p("M17 6l-6 6 6 6M11 6l-6 6 6 6"), 2.2);
export const SortIcon = make(p("M8 9l4-4 4 4M8 15l4 4 4-4"), 2);
export const ArrowUpIcon = make(p("M12 19V5m0 0l-6 6m6-6l6 6"), 2);
export const ArrowDownIcon = make(p("M12 5v14m0 0l6-6m-6 6l-6-6"), 2);
export const TrendUpIcon = make(p("M3 17l6-6 4 4 8-8m0 0h-5m5 0v5"), 2);
export const TrendDownIcon = make(p("M3 7l6 6 4-4 8 8m0 0h-5m5 0v-5"), 2);

/* ---------- entities ---------- */
export const HomeIcon = make(
  p("M3 11.5L12 4l9 7.5M5.5 10V20h13V10"),
);
export const BagIcon = make(p("M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"));
export const GridIcon = make(
  <>
    <rect x="4" y="4" width="7" height="7" rx="1.6" />
    <rect x="13" y="4" width="7" height="7" rx="1.6" />
    <rect x="4" y="13" width="7" height="7" rx="1.6" />
    <rect x="13" y="13" width="7" height="7" rx="1.6" />
  </>,
);
export const ListIcon = make(
  <>
    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
  </>,
  2,
);
export const ImageIcon = make(
  <>
    <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="M4 17l4.5-4.5a2 2 0 012.8 0L20 20" />
  </>,
);
export const ClipboardIcon = make(
  p(
    "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
  ),
);
export const TagIcon = make(
  p(
    "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  ),
);
export const StarIcon = make(
  p(
    "M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.52 4.67a1 1 0 00.95.69h4.92c.97 0 1.37 1.24.59 1.81l-3.98 2.89a1 1 0 00-.36 1.12l1.52 4.67c.3.92-.76 1.69-1.54 1.12l-3.98-2.89a1 1 0 00-1.18 0l-3.97 2.89c-.79.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 00-.37-1.12L2.98 9.06c-.78-.57-.38-1.81.59-1.81h4.91a1 1 0 00.95-.69l1.52-4.67z",
  ),
);
export const StarFilledIcon = ({ className = "w-4 h-4", ...rest }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...rest}>
    <path d="M11.05 2.93c.3-.92 1.6-.92 1.9 0l1.52 4.67a1 1 0 00.95.69h4.92c.97 0 1.37 1.24.59 1.81l-3.98 2.89a1 1 0 00-.36 1.12l1.52 4.67c.3.92-.76 1.69-1.54 1.12l-3.98-2.89a1 1 0 00-1.18 0l-3.97 2.89c-.79.57-1.84-.2-1.54-1.12l1.52-4.67a1 1 0 00-.37-1.12L2.98 9.06c-.78-.57-.38-1.81.59-1.81h4.91a1 1 0 00.95-.69l1.52-4.67z" />
  </svg>
);
export const HeartIcon = make(
  p(
    "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  ),
);
export const CartIcon = make(
  p(
    "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
  ),
);
export const UsersIcon = make(
  p(
    "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  ),
);
export const UserIcon = make(
  <>
    <circle cx="12" cy="8" r="3.75" />
    <path d="M4.5 20a7.5 7.5 0 0115 0" />
  </>,
);
export const PackageIcon = make(
  <>
    <path d="M20.5 7.5L12 3 3.5 7.5v9L12 21l8.5-4.5v-9z" />
    <path d="M3.5 7.5L12 12m0 0l8.5-4.5M12 12v9" />
  </>,
);
export const TruckIcon = make(
  <>
    <path d="M2.5 7.5h10v9h-10zM12.5 11h4l3 3v2.5h-7z" />
    <circle cx="6" cy="18.5" r="1.8" />
    <circle cx="16.5" cy="18.5" r="1.8" />
  </>,
);
export const RupeeIcon = make(p("M7 4h10M7 9h10M15.5 4c0 4-3 5-6.5 5l7 11"), 2);
export const MailIcon = make(
  <>
    <rect x="3" y="5.5" width="18" height="13" rx="2.5" />
    <path d="M3.8 7l8.2 5.5L20.2 7" />
  </>,
);
export const PhoneIcon = make(
  p(
    "M3 5.5A2.5 2.5 0 015.5 3h1.8a1 1 0 01.96.72l1 3.2a1 1 0 01-.44 1.13l-1.4.84a11.5 11.5 0 005.7 5.7l.84-1.4a1 1 0 011.13-.44l3.2 1a1 1 0 01.72.96v1.8A2.5 2.5 0 0116.5 21h-.3C9.44 20.6 3.4 14.56 3 7.8V5.5z",
  ),
);
export const CalendarIcon = make(
  <>
    <rect x="3.5" y="5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </>,
);
export const PercentIcon = make(
  <>
    <path d="M19 5L5 19" />
    <circle cx="7.5" cy="7.5" r="2.5" />
    <circle cx="16.5" cy="16.5" r="2.5" />
  </>,
);
export const LayersIcon = make(
  p("M12 3l8.5 4.5L12 12 3.5 7.5 12 3zM3.5 12.5L12 17l8.5-4.5M3.5 17L12 21.5l8.5-4.5"),
);
export const CommandIcon = make(
  p(
    "M9 6.5a2.5 2.5 0 10-2.5 2.5H9m0-2.5V9m0-2.5h6m0 0V9m0-2.5a2.5 2.5 0 112.5 2.5H15m0 0v6m0-6H9m0 0v6m0 0H6.5A2.5 2.5 0 109 17.5V15m6 0v2.5A2.5 2.5 0 1017.5 15H15",
  ),
);

/* ---------- status / feedback ---------- */
export const AlertIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v4.5M12 16h.01" />
  </>,
);
export const AlertTriangleIcon = make(
  p(
    "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
  ),
);
export const InfoIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </>,
);
export const CheckCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M8.5 12.5l2.5 2.5 4.5-5" />
  </>,
);
export const XCircleIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </>,
);
export const ClockIcon = make(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5V12l3 2" />
  </>,
);
export const InboxIcon = make(
  p(
    "M3.5 13h4l1.2 2.2h6.6L16.5 13h4M3.5 13l2.4-7.2A2 2 0 017.8 4.5h8.4a2 2 0 011.9 1.3L20.5 13v4.5a2 2 0 01-2 2h-13a2 2 0 01-2-2V13z",
  ),
);

export const SunIcon = make(
  <>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </>,
  2,
);

export const MoonIcon = make(
  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />,
  2,
);
