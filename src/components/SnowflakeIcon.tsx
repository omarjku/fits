interface Props {
  className?: string
  size?: number | string
  color?: string
  strokeWidth?: number
  dots?: boolean
}

const ARMS = [0, 60, 120, 180, 240, 300]
const DOT_ANGLES = [30, 150, 270]

/** Thin-line, six-armed snowflake with side branches, rounded caps and a few tiny dots. */
export default function SnowflakeIcon({ className = '', size, color = 'currentColor', strokeWidth = 2.6, dots = true }: Props) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true"
      fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
      {ARMS.map((a) => (
        <g key={a} transform={`rotate(${a} 24 24)`}>
          <line x1="24" y1="24" x2="24" y2="6" />
          <polyline points="18.5,11 24,15.5 29.5,11" />
          <polyline points="20,19 24,22 28,19" strokeWidth={strokeWidth * 0.85} />
        </g>
      ))}
      {dots && DOT_ANGLES.map((a) => (
        <circle key={a} cx="24" cy="2.4" r="1.1" fill={color} stroke="none" transform={`rotate(${a} 24 24)`} />
      ))}
    </svg>
  )
}
