import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

function Base({ children, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  )
}

export const HeartIcon = ({ filled, ...props }: IconProps & { filled?: boolean }) => (
  <Base {...props} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20.5s-7.5-4.6-9.3-9.2C1.5 8.2 3.3 5 6.6 5c2 0 3.6 1.1 5.4 3.2C13.800 6.100 15.400 5 17.400 5c3.300 0 5.100 3.200 3.900 6.300-1.800 4.600-9.300 9.200-9.300 9.200Z" />
  </Base>
)

export const CalendarIcon = (p: IconProps) => (
  <Base {...p}>
    <rect x="3.500" y="5" width="17" height="15.500" rx="2" />
    <path d="M3.500 10h17M8 3v4M16 3v4" />
  </Base>
)

export const GaugeIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M4 17a8 8 0 1 1 16 0" />
    <path d="M12 17l4-5" />
  </Base>
)

export const UserIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1-4 4-6 8-6s7 2 8 6" />
  </Base>
)

export const SearchIcon = (p: IconProps) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="6.500" />
    <path d="m20 20-4.200-4.200" />
  </Base>
)

export const CheckIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="m5 12.500 4.500 4.500L19 7.500" />
  </Base>
)

export const ShieldIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M12 3 5 6v6c0 4.500 3 7.500 7 9 4-1.500 7-4.500 7-9V6l-7-3Z" />
    <path d="m9 12 2 2 4-4" />
  </Base>
)

export const TagIcon = (p: IconProps) => (
  <Base {...p}>
    <path d="M3 12V4h8l10 10-8 8L3 12Z" />
    <circle cx="7.500" cy="8.500" r="1.200" />
  </Base>
)

export function LogoMark(props: IconProps) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" {...props}>
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <path
        d="M7 19.500v-2.200c0-.9.500-1.600 1.300-1.900l1.400-2.900c.400-.900 1.300-1.500 2.300-1.500h6c.900 0 1.700.4 2.200 1.100l2.100 3.300h.700c.800 0 1.400.6 1.400 1.400v2.700h-2.100a2.700 2.700 0 0 0-5.400 0h-4.200a2.700 2.700 0 0 0-5.400 0H7Z"
        fill="#fff"
      />
      <circle cx="10.700" cy="20.600" r="1.600" fill="#fff" />
      <circle cx="21.300" cy="20.600" r="1.600" fill="#fff" />
    </svg>
  )
}
