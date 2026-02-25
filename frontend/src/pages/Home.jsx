import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/user_hooks"
import { useEffect, useContext } from "react"
import { Global_Context } from "../contexts/Global-context-provider"
import { ArrowRight } from "lucide-react"
import Button from "./common components/Button"


const Floating_Header=({navigate})=>{

  const HeaderOptions=[
    {text: "Solutions"},
    {text: "Pricing"},
    {text: "Resources"},
    {text: "Enterprise"}
  ]

  return(
    <div className='w-full top-0 sticky flex justify-center shadow-sm h-16 z-50 backdrop-blur-lg'>
      <div className='w-full max-w-[75rem]  flex flex-row justify-between px-2 py-2.5 h-full'>
        {/* Logo */}
        <div className='flex  flex-row justify-center items-center'>
          <Button type={"gradient"} className={"!max-h-10 !aspect-square !px-4 !select-none ml-3"}>
            <div className="font-bold text-xl">
              S
            </div>
          </Button>
          <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-[Inter]  ml-2">SmartCollab</span>
        </div>


        {/* Other Options*/}
        <div className=" flex flex-row items-center justify-between w-full max-w-[25rem]">
          {
            HeaderOptions.map((val, index)=>{
              return(
                <span key={index}
                  className="text-gray-600 hover:text-blue-600 hover:text-blue-400 transition-colors font-[Inter] cursor-pointer"
                >
                  {val.text}
                </span>
              )
            })
          }
        </div>


        {/* Sign In */}
        <Button type={"gradient"} className={"!max-h-full !select-none !cursor-pointer !mr-2"} onClickHandler={()=>{navigate("/login")}} hover_effects_apply={true}>
          <div>
            Sign In
          </div>
        </Button>

      </div>
    </div>
  )
}


const Motto_Section=()=>{

  const onClickHandler=()=>{
    console.log("Stat Metting Pressed")
  }


  return(
    <div className="bg-white h-[540px]  max-w-4xl mx-auto flex flex-col w-full items-center pt-20 px-3">
      <div className="text-5xl font-extrabold font-[Inter] leading-tight mb-6 flex flex-col items-center">
          <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent lg:text-7xl text-5xl">
            Collaborate Smarter.
          </span>
          <span className="text-gray-900 lg:text-7xl text-5xl">Connect Globally.</span>
      </div>
      <p className="text-xl text-gray-600 leading-relaxed text-center font-[Inter]">
        AI-powered meetings, multilingual chat, and seamless teamwork in one platform. Break down barriers and boost productivity with intelligent collaboration tools.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 justify-center py-10">
        <Button className={"cursor-pointer select-none"} type={"gradient"} onClickHandler={onClickHandler} hover_effects_apply={true}>
          <div className="flex">
            <span>Start Meeting</span>
            <div className="flex-1 flex flex-col justify-center ml-1 group-hover:translate-x-1.5 transition-all duration-300">
              <ArrowRight className="h-[20px] w-[20px]"/>
            </div>
          </div>
        </Button>
      </div>

    </div>

  )
}

const HowItWorks_Section=()=>{
  return(
    <div className=" 
    bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 
    overflow-hidden
  flex flex-col items-center
    h-[540px] w-full relative -z-[2]">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse blur-[300px] -z-[1]">
      
      </div>
      <div className="bg-transparent w-full z-[1] text-center mt-24">
        <h2 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4
        font-[Inter]
        ">

        How SmartCollab Works
        </h2>
        <p className="text-lg text-gray-300 max-w-2xl mx-auto font-[Inter]">
          AI-powered translation, real-time communication, and seamless collaboration
        </p>
      </div>
      
    </div>
  )
}

const Home = () => {

  const {toggle_darkMode}=useContext(Global_Context)
  const navigate=useNavigate()
  const {AutoLogin_user}=useAuth()


  useEffect(()=>{
    AutoLogin_user().then((user_profile)=>{
            navigate("/chats")
        }).catch((e)=>{
            console.log("Error getting user profile: ")
            console.error(e)
        })
  }, [])


  return (
    <div className='max-h-full w-full flex flex-col  items-center relative'>
      
      <Floating_Header navigate={navigate}/>
      <Motto_Section/>
      <HowItWorks_Section/>
      

    </div>
  )
}

export default Home
