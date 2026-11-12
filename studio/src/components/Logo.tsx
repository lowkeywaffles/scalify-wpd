export function Logo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      <rect width="48" height="48" rx="11" fill="#C6FF3D" />
      <path d="M32 15H20a5 5 0 0 0 0 10h8a5 5 0 0 1 0 10H16" fill="none" stroke="#0E0F12" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
