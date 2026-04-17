import { useContext, useEffect, useState, Suspense } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom"
import {EmptyChatSection} from "./EmptyChatSection";

import GroupBar from "./ChatLayout Components/GroupBar";
import OptionsBar from "./ChatLayout Components/OptionsBar";
import SearchBar from "./ChatLayout Components/SearchBar";
import ChannelsPanel from "./ChatLayout Components/ChannelsPanel";

import { useAsyncError } from "../../hooks/ErrorHooks";

import { useUserInfo } from "../../hooks/user_hooks";
import { ChatLayout_Context } from "../../contexts/ChatLayout-context-provider";


const ChatLayout = () => {
    const {getUserProfile, getCommunities}=useUserInfo()

    const {user_id, setUserid, user_name, setUserName}=useContext(ChatLayout_Context)
    const throwError=useAsyncError()

    const {communityId, channelId}=useParams();

    const [UserProfile, setUserProfile]=useState(null)
    const [UserCommunities, setUserCommunities]=useState(null)
    
  
    useEffect(()=>{

        getUserProfile().then((user_profile)=>{
            const userInfo=user_profile.UserInfo
            console.log("user profile: ",userInfo.username)
            setUserProfile(user_profile.UserInfo)
            if(user_profile.UserInfo){
                setUserid(user_profile.UserInfo.user_id)
                setUserName(user_profile.UserInfo.username)
            }
        }).catch((e)=>{
            console.log("Error getting user profile: ")
            throwError(e)
        })


        getCommunities().then(
            (communities)=>{
                console.log("fetched communities: ",communities.UserCommunities)
                setUserCommunities(communities.UserCommunities)
            }
        ).catch((e)=>{
            console.log("Error getting communities: ")
            console.error(e)
        })


        if(!communityId || !channelId) return;


    }, [])

  if (!UserProfile || !UserCommunities ) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F3EF]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#2F5D50]/20 border-t-[#2F5D50] rounded-full animate-spin" />
          <span className="text-[#8A817C] text-sm">Loading workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-screen h-screen flex bg-[#F5F3EF] overflow-hidden">
      
      {/* GroupBar */}
      <GroupBar
        username={UserProfile.username}
        email={UserProfile.email}
        communities={UserCommunities}
      />
      
      {/* Channel Panel */}
      <div className="w-[280px] bg-[#FFFFFF] border-r border-[#E8E4DE] border-opacity-60 flex flex-col">
        <OptionsBar />
        <ChannelsPanel />
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 bg-[#F5F3EF] flex flex-col">
        {channelId ? <Outlet /> : <EmptyChatSection />}
      </div>
    </div>
  )
}

export { ChatLayout }