import {
  useFloating,
  useClick,
  useDismiss,
  useInteractions,
  FloatingFocusManager,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react'
import { useState } from 'react'

const FloatingDiv = ({
  children,
  ToggleButtonComponent,
  content_parent_classes = '',
  button_parent_styles = '',
}) => {
  const [open, setOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    strategy: 'fixed',
    middleware: [offset(8), flip(), shift()],
    whileElementsMounted: autoUpdate,
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([click, dismiss])

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} style={button_parent_styles ? { style: button_parent_styles } : {}}>
        {ToggleButtonComponent ? (
          <ToggleButtonComponent />
        ) : (
          <button
            className="bg-[var(--sc-accent)] hover:bg-[var(--sc-accent-hover)] text-white rounded-lg px-3 py-1.5 text-sm transition-colors"
          >
            Open
          </button>
        )}
      </div>

      {open && (
        <FloatingFocusManager context={context} modal={false}>
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className={`z-50 ${content_parent_classes}`}
          >
            {children}
          </div>
        </FloatingFocusManager>
      )}
    </>
  )
}

export default FloatingDiv