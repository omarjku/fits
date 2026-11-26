import SnowflakeIcon from './SnowflakeIcon'

export function TinyFlake({ className = '' }: { className?: string }) {
  return <SnowflakeIcon className={className} color="#8DBFE3" strokeWidth={2.4} />
}

/** Four-point glint, used sparingly. */
export function Glint({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="#fff" stroke="#8DBFE3" strokeWidth="1">
      <path d="M12 1c.8 6 3.2 9.2 11 11-7.8 1.8-10.2 5-11 11-.8-6-3.2-9.2-11-11C8.8 10.2 11.2 7 12 1z" />
    </svg>
  )
}

/** Two flakes and a glint at the page edge. */
export default function Doodles() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 overflow-hidden">
      <TinyFlake className="absolute left-3 top-28 h-5 w-5 opacity-70" />
      <Glint className="absolute right-5 top-52 h-4 w-4" />
      <TinyFlake className="absolute bottom-24 right-4 h-6 w-6 opacity-60" />
    </div>
  )
}
