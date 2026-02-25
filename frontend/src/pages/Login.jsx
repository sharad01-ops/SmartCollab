import { useNavigate } from "react-router-dom"
import { useAuth } from "../hooks/user_hooks"
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { get_all_user_credentials } from "../services/dev_services";
import chalk from "chalk";

const DEV_KEY=import.meta.env.VITE_DEV_MODE_KEY


const Show_Demo_Creds=({users_creds, username_input_ref, email_input_ref, password_input_ref})=>{
  if(!DEV_KEY || !users_creds) return null;

  const fill_form=(user_name, user_email, user_password)=>{
    if(!username_input_ref.current
      || !email_input_ref.current
      || !password_input_ref.current
    ) return

    username_input_ref.current.value=user_name
    email_input_ref.current.value=user_email
    password_input_ref.current.value=user_password
  }
  return(
    <div
      className={`
      grid grid-cols-3 max-h-[100px] 
      overflow-y-auto
      absolute top-0 backdrop-blur-sm border-2 m-2 rounded-lg`}
    >
      {
        users_creds.map((credentials, index)=>{
          return(
            <div
              key={index}
              className="bg-black hover:bg-gray-100 hover:text-black 
              my-3 text-white  select-none mx-1 w-fit flex flex-row  py-0.5 px-5 rounded-full"
              onClick={()=>{
                fill_form(credentials.user_name, credentials.user_email, credentials.user_password);
              }}
            >
              {credentials.user_name}
            </div>
          )
        })
      }
    </div>
  )
}






const Login = () => {
  
  const navigate=useNavigate()
  const {
        AutoLogin_user,
        handleLogin,
        login_loading,
    }=useAuth()

  const [isAuthenticated, setIsAuthenticated]=useState(false)
  const [users_list,set_users_list]=useState(null)

  const username_input_ref=useRef(null)
  const useremail_input_ref=useRef(null)
  const userpassword_input_ref=useRef(null)

  if(DEV_KEY){
    useEffect(()=>{
      get_all_user_credentials(DEV_KEY)
      .then((res)=>{
        const user_cred_list=res?.user_credentials 
        if(Array.isArray(user_cred_list)){
          set_users_list(user_cred_list)
        }

      }).catch((err)=>{
        console.error("Error in dev get:",err)
      })
    },[])
  }
  
  const handleFormSubmision= (formData)=>{
    const username=formData.get("username")
    const email=formData.get("email")
    const password=formData.get("password")
    console.log(`
        Username: ${username}
        Email: ${email}
        Password: ${password}
      `)  

      handleLogin({
        username: username, 
        email: email, 
        password: password
      }).then((login_result)=>{

        console.log( `Login Result:`,login_result )
        if(login_result.AccessToken){
          setIsAuthenticated(true)
        }

      }).catch((e)=>{

        setIsAuthenticated(false) 
        console.error(e)

      })

  }



  useEffect( ()=>{

    //redirect user if refresh token exists
    AutoLogin_user().then(
      ()=>{
        navigate("/chats")
      }
    ).catch((e)=>{
    })

    if(isAuthenticated){
      console.log("User Authenticate, navigating to chats")
      navigate("/chats")
    }else{
      console.log("user not authenticated")
    }

  },[isAuthenticated] )



  return (
    <div>
      { users_list &&
        <Show_Demo_Creds
          users_creds={users_list}
          username_input_ref={username_input_ref}
          email_input_ref={useremail_input_ref}
          password_input_ref={userpassword_input_ref}
        />
      }
      <div className='h-screen w-full bg-gray-700 flex flex-row justify-center items-center'>

          <form action={handleFormSubmision}
            className='bg-red-400 rounded-[10px] flex flex-col justify-center items-center p-6 max-h-[500px] h-full w-full m-5 max-w-[500px]'
          >

            <input name="username" ref={username_input_ref}
            className='bg-white rounded-[10px] p-3 my-2 w-full text-[0.9rem] leading-[0.9rem]'
            type="text" placeholder='Enter Username'/>
            
            <input name="email" ref={useremail_input_ref}
            className='bg-white rounded-[10px] p-3 my-2 w-full text-[0.9rem] leading-[0.9rem]'
            type="text" placeholder='Enter Email'/>

            <input name="password" ref={userpassword_input_ref}
            className='bg-white rounded-[10px] p-3 my-2 w-full text-[0.9rem] leading-[0.9rem]'
            type="text" placeholder='Enter Password'/>

            <button type="submit" className='bg-black my-3  w-fit flex flex-row  py-0.5 px-5 rounded-full'
                >
                  <Loader2 className={` text-white w-[0.9rem] h-[0.9rem] mr-2 my-auto animate-spin ${login_loading? "block":"hidden"}`}/>
                  <div className='text-white text-[0.9rem] leading-[1.5rem] mb-0.5'>
                    Login
                  </div>
            </button>

            {/* <button className='bg-black my-3  w-fit  py-0.5 px-5 rounded-full' type="button"
            onClick={()=>{Login_test()}}
                >
                  <div className='text-white text-[0.9rem] leading-[1.5rem] mb-0.5'>
                    Test
                  </div>
            </button> */}
          
          </form>


      </div>
    </div>
  )
}

export default Login
