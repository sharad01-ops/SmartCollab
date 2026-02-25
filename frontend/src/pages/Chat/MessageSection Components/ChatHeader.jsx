import { Video, EllipsisVertical } from "lucide-react"
import FloatingDiv from "../../common components/FloatingDiv"
import { useNavigate, useParams } from "react-router-dom"



const ChatHeader = () => {

  const navigate=useNavigate()
  const url_params=useParams()

  return (
    <div className='bg-gray-800 text-white w-full h-full max-h-[2.5rem] flex justify-end items-center'>
      <FloatingDiv
        ToggleButtonComponent={

          ()=>{
            return (
              <div
                className="hover:bg-gray-500 rounded-full p-0.5"
              >
                < EllipsisVertical/>
              </div>
            )
          }
        }
        
        content_parent_classes=""
        button_parent_styles="mr-[5px]"
      >
        <div
          className="bg-gray-800 p-1 rounded-xl transition-all duration-100 border-[1px] border-[#ffffff87] mx-1"
        >
          <div 
            className="flex flex-row items-center hover:bg-gray-700 select-none cursor-pointer justify-between p-2 gap-2 rounded-lg"

            onClick={()=>{
                      navigate(`/chats/${url_params.communityId}/${url_params.channelId}/videocall`)
                  }}
          >
            <Video className="aspect-12/14 w-[20px]"/>
            <span className="font-[Inter] text-sm">Video Call</span>
          </div>
        </div>
      </FloatingDiv>
    </div>
  )
}

export default ChatHeader
