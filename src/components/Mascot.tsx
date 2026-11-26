interface Props {
  size?: number
  mood?: 'happy' | 'shiver'
  className?: string
}

// Crayon-style thin-line snowflake with white sticker outline and blush cheeks
export default function Mascot({ size = 96, mood = 'happy', className = '' }: Props) {
  const arms = [0, 60, 120, 180, 240, 300]
  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={mood === 'shiver' ? 'Frosty the snowflake, shivering' : 'Frosty the snowflake, smiling'}
      className={`${mood === 'shiver' ? 'anim-shiver' : 'anim-bounce'} ${className}`}
    >
      <defs>
        <filter id="crayon" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="2.2" />
        </filter>
      </defs>
      {/* white sticker outline */}
      <g stroke="#fff" strokeWidth="22" strokeLinecap="round" fill="#fff">
        {arms.map((a) => (
          <line key={a} x1="60" y1="60" x2="60" y2="12" transform={`rotate(${a} 60 60)`} />
        ))}
        <circle cx="60" cy="60" r="30" />
      </g>
      <g filter="url(#crayon)">
        {[30, 150, 270].map((a) => (
          <circle key={a} cx="60" cy="5" r="2.6" fill="#7FB8E6" transform={`rotate(${a} 60 60)`} />
        ))}
        <g stroke="#7FB8E6" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none">
          {arms.map((a) => (
            <g key={a} transform={`rotate(${a} 60 60)`}>
              <line x1="60" y1="60" x2="60" y2="14" />
              <polyline points="51,20 60,28 69,20" />
              <polyline points="54,34 60,38 66,34" strokeWidth="5" />
            </g>
          ))}
        </g>
        <circle cx="60" cy="60" r="27" fill="#CFE8FA" stroke="#7FB8E6" strokeWidth="4" />
        {/* face */}
        <circle cx="50" cy="56" r="3.4" fill="#2B3470" />
        <circle cx="70" cy="56" r="3.4" fill="#2B3470" />
        <circle cx="48.8" cy="54.8" r="1.1" fill="#fff" />
        <circle cx="68.8" cy="54.8" r="1.1" fill="#fff" />
        <ellipse cx="43" cy="65" rx="5" ry="3.2" fill="#F7A3A3" opacity=".8" />
        <ellipse cx="77" cy="65" rx="5" ry="3.2" fill="#F7A3A3" opacity=".8" />
        {mood === 'shiver' ? (
          <path d="M52 69 q2 -3 4 0 t4 0 t4 0" stroke="#2B3470" strokeWidth="2.6" fill="none" strokeLinecap="round" />
        ) : (
          <path d="M52 66 q8 9 16 0" stroke="#2B3470" strokeWidth="2.8" fill="none" strokeLinecap="round" />
        )}
      </g>
    </svg>
  )
}
