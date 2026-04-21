import { createPortal } from "react-dom"


const CenterFloatingDiv = ({children, setOpen, parent_classes, parent_parent_classes}) => {
  return createPortal(
    <div className={`fixed inset-0 w-screen h-screen flex justify-center items-center z-[100] bg-black/40 backdrop-blur-sm ${parent_parent_classes}`}
    onClick={(e)=>{
        if(e.target===e.currentTarget){
          setOpen(false)
        }
      }
    }
    >
      <div className={`bg-white/90 backdrop-blur-xl border border-white/50 shadow-2xl rounded-2xl ${parent_classes}`}
        onClick={(e)=>{
          const target=e.target
          if (target.closest(".close-centered-div")) {
            setOpen(false);
          }
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}

export default CenterFloatingDiv
