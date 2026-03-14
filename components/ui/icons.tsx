import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function BaseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props} />
  );
}
export function IconMicroscope(props: IconProps) {
  return (
    <BaseIcon {...props}>
      {/* Base */}
      <line x1="4" y1="20" x2="20" y2="20" />

      {/* Stand */}
      <path d="M10 20V14" />

      {/* Arm */}
      <path d="M10 14c0-4 3-6 6-6" />

      {/* Body tube */}
      <line x1="13" y1="8" x2="17" y2="4" />

      {/* Eyepiece */}
      <circle cx="18.5" cy="3.5" r="1.5" />

      {/* Stage */}
      <rect x="7" y="11" width="6" height="2" />

      {/* Focus knob */}
      <circle cx="8" cy="15" r="1" />
    </BaseIcon>
  );
}
export function IconDashboard(props: IconProps) {
  return <BaseIcon {...props}><rect x="3" y="3" width="8" height="8" /><rect x="13" y="3" width="8" height="5" /><rect x="13" y="10" width="8" height="11" /><rect x="3" y="13" width="8" height="8" /></BaseIcon>;
}

export function IconUsers(props: IconProps) {
  return <BaseIcon {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></BaseIcon>;
}

export function IconFlask(props: IconProps) {
  return <BaseIcon {...props}><path d="M10 2v7.31" /><path d="M14 2v7.31" /><path d="M8.5 2h7" /><path d="M6 15.5 10 9.31h4L18 15.5a4 4 0 0 1-3.35 6H9.35A4 4 0 0 1 6 15.5Z" /></BaseIcon>;
}

export function IconClipboard(props: IconProps) {
  return <BaseIcon {...props}><rect x="9" y="2" width="6" height="4" rx="1" /><path d="M9 4H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" /><path d="M9 12h6" /><path d="M9 16h6" /></BaseIcon>;
}

export function IconTube(props: IconProps) {
  return <BaseIcon {...props}><path d="M14 2v7l6 6a4 4 0 0 1-5.66 5.66L8 14V2" /><path d="M8 2h6" /><path d="m14 9-6 6" /></BaseIcon>;
}

export function IconPulse(props: IconProps) {
  return <BaseIcon {...props}><path d="M22 12h-4l-3 7-4-14-3 7H2" /></BaseIcon>;
}

export function IconReport(props: IconProps) {
  return <BaseIcon {...props}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" /><path d="M14 2v6h6" /><path d="M16 13H8" /><path d="M16 17H8" /><path d="M10 9H8" /></BaseIcon>;
}

export function IconWallet(props: IconProps) {
  return <BaseIcon {...props}><path d="M20 7H4a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M16 13h.01" /><path d="M2 10h20" /><path d="M6 7V5a2 2 0 0 1 2-2h11" /></BaseIcon>;
}

export function IconSettings(props: IconProps) {
  return <BaseIcon {...props}><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.08a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.08a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.08a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></BaseIcon>;
}

export function IconSearch(props: IconProps) {
  return <BaseIcon {...props}><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></BaseIcon>;
}

export function IconBell(props: IconProps) {
  return <BaseIcon {...props}><path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" /><path d="M10 21a2 2 0 0 0 4 0" /></BaseIcon>;
}

export function IconPlus(props: IconProps) {
  return <BaseIcon {...props}><path d="M12 5v14" /><path d="M5 12h14" /></BaseIcon>;
}
