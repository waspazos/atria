// Inline SVG icons from the Atria design. All use currentColor.

type P = { size?: number; className?: string; style?: React.CSSProperties };
const svg = (size: number, rest: P) => ({
  width: size,
  height: size,
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  className: rest.className,
  style: rest.style,
  "aria-hidden": true,
});

export const GridIcon = ({ size = 14, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.4"><rect x="2" y="2" width="5" height="5" rx="1" /><rect x="9" y="2" width="5" height="5" rx="1" /><rect x="2" y="9" width="5" height="5" rx="1" /><rect x="9" y="9" width="5" height="5" rx="1" /></svg>
);
export const ChevronRight = ({ size = 12, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><path d="M6 3l5 5-5 5" /></svg>
);
export const ChevronLeft = ({ size = 14, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.6"><path d="M10 3L5 8l5 5" /></svg>
);
export const ChevronDown = ({ size = 10, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="2"><path d="M4 6l4 4 4-4" /></svg>
);
export const PlusIcon = ({ size = 12, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.8"><path d="M8 3v10M3 8h10" /></svg>
);
export const CloseIcon = ({ size = 14, strokeWidth = 1.6, ...r }: P & { strokeWidth?: number }) => (
  <svg {...svg(size, r)} strokeWidth={strokeWidth}><path d="M4 4l8 8M12 4l-8 8" /></svg>
);
export const CalendarIcon = ({ size = 13, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><rect x="2" y="3" width="12" height="11" rx="2" /><path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" /></svg>
);
export const LockIcon = ({ size = 12, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><rect x="3" y="7" width="10" height="7" rx="1.5" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
);
export const ResetIcon = ({ size = 12, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><path d="M2.5 8a5.5 5.5 0 1 0 1.6-3.9M2.5 2.5v2.6h2.6" /></svg>
);
export const TimelineIcon = ({ size = 13, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><circle cx="4" cy="3.5" r="1.75" /><circle cx="4" cy="12.5" r="1.75" /><path d="M4 5.25v5.5M8 3.5h6M8 12.5h6" /></svg>
);
export const MailIcon = ({ size = 13, strokeWidth = 1.5, ...r }: P & { strokeWidth?: number }) => (
  <svg {...svg(size, r)} strokeWidth={strokeWidth} strokeLinejoin="round"><rect x="1.75" y="3.25" width="12.5" height="9.5" rx="1.5" /><path d="M2.5 4l5.5 4.5L13.5 4" /></svg>
);
export const PhoneIcon = ({ size = 13, strokeWidth = 1.5, ...r }: P & { strokeWidth?: number }) => (
  <svg {...svg(size, r)} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M3.2 2h2.6l1.3 3.2-1.7 1.1a7.5 7.5 0 0 0 4.3 4.3l1.1-1.7L14 10.2v2.6c0 .7-.5 1.2-1.2 1.2C7 14 2 9 2 3.2 2 2.5 2.5 2 3.2 2z" /></svg>
);
export const PageIcon = ({ size = 13, strokeWidth = 1.5, ...r }: P & { strokeWidth?: number }) => (
  <svg {...svg(size, r)} strokeWidth={strokeWidth} strokeLinejoin="round"><path d="M4 1.75h5.25L12.5 5v9.25H4z" /><path d="M9 1.75V5.25h3.5" /></svg>
);
export const FlagIcon = ({ size = 13, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5" strokeLinejoin="round"><path d="M3.5 14.5V2M3.5 2.5h8.5l-2 3 2 3H3.5" /></svg>
);
export const DocIcon = ({ size = 14, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.4" strokeLinejoin="round"><path d="M4 1.75h5.25L12.5 5v9.25H4z" /><path d="M9 1.75V5.25h3.5M6 8h4.5M6 10.5h4.5" /></svg>
);
export const SlidesIcon = ({ size = 14, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.4" strokeLinejoin="round"><rect x="1.75" y="3" width="12.5" height="8.5" rx="1.25" /><path d="M8 11.5V14M5.5 14h5" /></svg>
);
export const SheetIcon = ({ size = 14, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.4"><rect x="2" y="2" width="12" height="12" rx="1.5" /><path d="M2 6h12M2 10h12M6.5 6v8" /></svg>
);
export const ClockIcon = ({ size = 11, strokeWidth = 1.6, ...r }: P & { strokeWidth?: number }) => (
  <svg {...svg(size, r)} strokeWidth={strokeWidth}><circle cx="8" cy="8" r="6" /><path d="M8 5v3l2 1.5" /></svg>
);
export const PinIcon = ({ size = 14, ...r }: P) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" aria-hidden className={r.className}><path d="M10.2 1.3l4.5 4.5-1.6.6-2.4 2.4.4 3.4-1.3 1.3-2.8-2.8-3.8 3.8-.7-.7 3.8-3.8-2.8-2.8 1.3-1.3 3.4.4 2.4-2.4z" /></svg>
);
export const LayersIcon = ({ size = 12, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5" strokeLinejoin="round"><path d="M8 2l6 3-6 3-6-3z" /><path d="M2 8.5l6 3 6-3" /></svg>
);
export const DownloadIcon = ({ size = 15, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><path d="M8 2v8M4.5 6.5L8 10l3.5-3.5M3 13.5h10" /></svg>
);
export const ArrowUpRight = ({ size = 10, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.6"><path d="M5 11l6-6M6 5h5v5" /></svg>
);
export const SparkleIcon = ({ size = 12, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5" strokeLinejoin="round"><path d="M8 1.5l1.6 4.9 4.9 1.6-4.9 1.6L8 14.5l-1.6-4.9L1.5 8l4.9-1.6z" /></svg>
);
export const SendIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 14 14" fill="none" aria-hidden><path d="M7 11V3M3.5 6.5L7 3l3.5 3.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
);
export const ArrowRight = ({ size = 13, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.8"><path d="M3 8h10M9 4l4 4-4 4" /></svg>
);
export const CheckIcon = ({ size = 14, strokeWidth = 1.8, ...r }: P & { strokeWidth?: number }) => (
  <svg {...svg(size, r)} strokeWidth={strokeWidth} strokeLinecap="round"><path d="M3 8.5l3 3 7-7" /></svg>
);
export const EyeIcon = ({ size = 16, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8z" /><circle cx="8" cy="8" r="2" /></svg>
);
export const WatermarkIcon = ({ size = 16, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5"><rect x="2.5" y="1.75" width="11" height="12.5" rx="1.5" /><path d="M5 10l6-4" /></svg>
);
export const ReceiptIcon = ({ size = 16, ...r }: P) => (
  <svg {...svg(size, r)} strokeWidth="1.5" strokeLinecap="round"><path d="M2 8.5l3 3 5-6M8 11.5l1 0 5-6" /></svg>
);
export const AtriaMark = ({ size = 19 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden>
    <path d="M12 20.5V11.5M12 11.5L6.5 6M12 11.5L17.5 6M12 11.5V3.8M7.5 20.5h9" />
    <circle cx="12" cy="3.6" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="6" cy="5.6" r="1.7" fill="currentColor" stroke="none" />
    <circle cx="18" cy="5.6" r="1.7" fill="currentColor" stroke="none" />
  </svg>
);
