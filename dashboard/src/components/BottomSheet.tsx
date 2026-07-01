import { useEffect, useRef, type ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
}

export default function BottomSheet({ open, onClose, children }: Props) {
  const openedAt = useRef(0)

  useEffect(() => {
    if (open) openedAt.current = Date.now()
  }, [open])

  function handleOverlay() {
    if (Date.now() - openedAt.current < 320) return
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 40,
        pointerEvents: open ? 'auto' : 'none',
      }}
    >
      {/* Overlay */}
      <div
        onClick={handleOverlay}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(50,35,20,0.42)',
          opacity: open ? 1 : 0,
          transition: 'opacity 280ms ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--surface-sheet)',
          borderTopLeftRadius: 'var(--radius-2xl)',
          borderTopRightRadius: 'var(--radius-2xl)',
          boxShadow: 'var(--shadow-sheet)',
          maxHeight: '90dvh',
          overflowY: 'auto',
          transform: open ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform var(--transition-sheet)',
        }}
      >
        {/* Pull handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <span style={{
            width: 38, height: 4, borderRadius: 'var(--radius-pill)',
            background: 'rgba(80,60,40,0.18)', display: 'block',
          }} />
        </div>
        {children}
      </div>
    </div>
  )
}
