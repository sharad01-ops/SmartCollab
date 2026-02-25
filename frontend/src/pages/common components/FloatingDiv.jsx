import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useClick,
  useDismiss,
  useRole,
  useInteractions,
  useTransitionStyles
} from "@floating-ui/react"

import { useState } from "react"

export default function FloatingDiv({children, ToggleButtonComponent, content_parent_classes, button_parent_styles}) {
  const [open, setOpen] = useState(false)

  const { refs, floatingStyles, context } = useFloating({
    open,
    onOpenChange: setOpen,
    middleware: [
      offset(8),   // gap between button and menu
      flip(),      // flip if no space
      shift()      // prevent overflow
    ],
    whileElementsMounted: autoUpdate
  })

  const click = useClick(context)
  const dismiss = useDismiss(context)
  const role = useRole(context)

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role
  ])


    const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
        duration: 150,
        initial: {
            opacity: 0,
        },
        open: {
            opacity: 1,
        },
        close: {
            opacity: 0,
        }
    })

  return (
    <>
      

      {ToggleButtonComponent?
            (

                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    className={button_parent_styles}
                >
                    <ToggleButtonComponent/>
                </button>
            ):(
                <button
                    ref={refs.setReference}
                    {...getReferenceProps()}
                    className=" bg-blue-500 text-white rounded"
                >
                    Open Menu
                </button>
            )
        }

      {isMounted && (
        <div
          ref={refs.setFloating}
          style={{
                ...floatingStyles,
                ...transitionStyles
            }}
          {...getFloatingProps()}
          className={`${content_parent_classes} z-50`}
        >
          {children}
        </div>
      )}
    </>
  )
}