import FloatingDiv from "../../../common components/FloatingDiv"
import { LogoutUser } from "../../../../services/user_services"
import { useNavigate } from "react-router-dom"

const UserProfile = ({ username, email }) => {
  const navigate=useNavigate()
  return (
    <div className="relative w-8 h-8">
      
      <FloatingDiv
        ToggleButtonComponent={() => (
          <div className="w-8 h-8 rounded-full bg-[var(--sc-accent)] flex items-center justify-center text-white text-xs font-semibold cursor-pointer select-none">
            {username?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}
        content_parent_classes=""
        button_parent_styles=""
      >
        {/* Dropdown panel */}
        <div className="mx-3 flex flex-col items-center bg-[var(--sc-bg-elevated)] border border-[var(--sc-border)] rounded-lg shadow-sm p-1 min-w-fit">
          
          {/* Video Call menu item — exact onClick preserved */}
          <div
            className="flex  text-[0.8rem] items-start justify-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--sc-text-primary)] hover:bg-[var(--sc-bg-tertiary)] cursor-pointer select-none transition-colors"
            onClick={()=>{
              LogoutUser().then((response)=>{
                if(response.Logout==="Success"){
                  navigate("/")
                }
              }).catch((e)=>{
                console.error(e)
              })
            }}
          >
            Logout
          </div>

        </div>
      </FloatingDiv>
      {/* Online indicator */}
      <div className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[var(--sc-success)] border-2 border-[var(--sc-bg-secondary)]" />
    </div>
  )
}

export default UserProfile