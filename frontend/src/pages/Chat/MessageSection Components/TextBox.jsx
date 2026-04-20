import { useContext, useEffect, useState } from "react"
import { translate } from "../../../services/translation_service"
import { Loader2 } from "lucide-react"
import { Global_Context } from "../../../contexts/Global-context-provider"

const TextBox = ({ fromUser = null, message = null, sender_id = null,sender_name=null, sent_at = null, is_new_message=null }) => {

  const [rendered_message, setMessage]=useState(message)
  const [translation_loading, setTranslationLoading]=useState(false)
  const {UserData}=useContext(Global_Context)

  const formatTime = (ts) => {
    if (!ts) return ''
    try {
      return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  let sent_time=null
  if(sent_at && typeof(sent_at)=="string"){
    const dateObj = new Date(sent_at);
    const date = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    const time = dateObj.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });
    sent_time=time
    // console.log( date, time)
  }

  // translate(message, "hi").then((result)=>{
  //   setMessage(result.translated)
  // }).catch((e)=>{
  //   console.error(e)
  // })
  useEffect(()=>{

    if(is_new_message===true){
      setTranslationLoading(true)

      translate(message, UserData?.preferred_language || "en").then((result)=>{
        setMessage(result.translated)
      }).catch((e)=>{
        console.error(e)
      }).finally(()=>{
        setTranslationLoading(false)
      })

    }

  }, [is_new_message])
  


  return (
    message && (
      <div className="w-full flex px-4 py-0.5">
        {fromUser ? (
          <div className="flex justify-end w-full">
            <div className="bg-[#F4E6C8] text-[#2F5D50] px-4 py-2 rounded-2xl rounded-br-none max-w-[70%] shadow-sm">
              {
                translation_loading===true?(
                  <div className="flex flex-row items-center">
                  <Loader2 className=" animate-spin size-3 m-1"/>
                  {rendered_message}
                  </div>
                ):(
                <>
                  {rendered_message}
                </>
                )
              }
              <div className="font-[Inter] pt-1 text-[0.6rem] w-full flex justify-end">
                {sent_time}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-start w-full">
            <div className="bg-[#2F5D50] text-white px-4 py-2 rounded-2xl rounded-bl-none max-w-[70%] shadow-sm">
              <div className="text-[0.7rem] pb-1">
                {sender_name}
              </div>

              {
                translation_loading===true?(
                  <div className="flex flex-row items-center">
                  <Loader2 className=" animate-spin size-3 m-1"/>
                  {rendered_message}
                  </div>
                ):(
                <>
                  {rendered_message}
                </>
                )
              }
              <div className="font-[Inter] pt-2 text-[0.6rem] w-full flex justify-start">
                {sent_time}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  )
}

export default TextBox