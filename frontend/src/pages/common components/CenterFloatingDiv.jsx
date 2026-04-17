import { createPortal } from "react-dom"


const CenterFloatingDiv = ({children, setOpen, parent_classes, parent_parent_classes}) => {
  return createPortal(
    <div className={`absolute top-0 left-0 w-screen h-screen flex justify-center items-center z-[100] ${parent_parent_classes}`}
    onClick={(e)=>{
        if(e.target===e.currentTarget){
          setOpen(false)
        }
      }
    }
    >
      <div className={`bg-green-300 w-[200px] h-[200px] ${parent_classes}`}
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
