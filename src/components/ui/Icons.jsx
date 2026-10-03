const baseProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '2',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Svg({ children, className = 'h-4 w-4' }) {
  return (
    <svg {...baseProps} className={className} aria-hidden>
      {children}
    </svg>
  )
}

export function Eye({ className }) {
  return (
    <Svg className={className}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </Svg>
  )
}

export function EyeOff({ className }) {
  return (
    <Svg className={className}>
      <path d="M10.6 5.2A9.7 9.7 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.1" />
      <path d="M6.6 6.7A17.6 17.6 0 0 0 2 12s3.6 7 10 7c1.9 0 3.5-.6 4.9-1.4" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </Svg>
  )
}

export function ChevronUp({ className }) {
  return (
    <Svg className={className}>
      <path d="m6 15 6-6 6 6" />
    </Svg>
  )
}

export function ChevronDown({ className }) {
  return (
    <Svg className={className}>
      <path d="m6 9 6 6 6-6" />
    </Svg>
  )
}

export function ArrowUp({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </Svg>
  )
}

export function ArrowDown({ className }) {
  return (
    <Svg className={className}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </Svg>
  )
}

export function Trash({ className }) {
  return (
    <Svg className={className}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" />
      <path d="M10 11v6M14 11v6" />
    </Svg>
  )
}

export function GripVertical({ className }) {
  return (
    <Svg className={className}>
      <circle cx="9" cy="6" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="18" r="1" />
      <circle cx="15" cy="6" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="18" r="1" />
    </Svg>
  )
}
