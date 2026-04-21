import { useContext, useEffect, useState, Suspense } from "react";
import { Outlet, useParams, useNavigate } from "react-router-dom"
import {EmptyChatSection} from "./EmptyChatSection";

import GroupBar from "./ChatLayout Components/GroupBar";
import ChannelsPanel from "./ChatLayout Components/ChannelsPanel";

import { useAsyncError } from "../../hooks/ErrorHooks";

import { useUserInfo } from "../../hooks/user_hooks";
import { ChatLayout_Context } from "../../contexts/ChatLayout-context-provider";
import { Global_Context } from "../../contexts/Global-context-provider";

const ChatLayout = () => {
    const {getUserProfile}=useUserInfo()

    const {user_id, setUserid, user_name, setUserName}=useContext(ChatLayout_Context)
    const {setUserData}=useContext(Global_Context)
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
                setUserData(user_profile.UserInfo)
                setUserid(user_profile.UserInfo.user_id)
                setUserName(user_profile.UserInfo.username)
            }
        }).catch((e)=>{
            console.log("Error getting user profile: ")
            throwError(e)
        })


        


        if(!communityId || !channelId) return;


    }, [])

  if (!UserProfile ) {
    return (
      <div className="h-screen w-full p-4 flex items-center bg-[#152e24]">
        {/* Sidebar Container */}
        <div 
          className="w-[68px] h-full flex flex-col flex-shrink-0 z-20 items-center py-4 rounded-[28px] border border-[rgba(255,255,255,0.1)]"
          style={{
            background: 'linear-gradient(180deg, #1F4D3A 0%, #153C2E 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 30px rgba(0,0,0,0.25)'
          }}
        >
          <GroupBar username={UserProfile?.username || ""} email={UserProfile?.email || ""} />
        </div>
        
        {/* Partition Space */}
        <div className="w-4 h-full flex-shrink-0 bg-transparent" />
        
        <div className="flex-1 h-full rounded-[32px] overflow-hidden bg-[#f8f8f8] shadow-[inset_0_4px_24px_rgba(0,0,0,0.02)] flex flex-row">
          <div className="w-[320px] h-full flex-shrink-0 bg-[#f5f6f5] border-r border-gray-100">
            <ChannelsPanel />
          </div>
          <div className="flex-1 h-full bg-[#F8F8F8] flex flex-col">
            {channelId ? <Outlet /> : <EmptyChatSection />}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full p-4 flex items-center bg-[#152e24]">
      {/* Sidebar Container */}
      <div 
        className="w-[68px] h-full flex flex-col flex-shrink-0 z-20 items-center py-4 rounded-[28px] border border-[rgba(255,255,255,0.1)] transition-all"
        style={{
          background: 'linear-gradient(180deg, #1F4D3A 0%, #153C2E 100%)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 30px rgba(0,0,0,0.25)'
        }}
      >
        <GroupBar
          username={UserProfile.username}
          email={UserProfile.email}
        />
      </div>
      
      {/* Partition Space */}
      <div className="w-4 h-full flex-shrink-0 bg-transparent" />
      
      {/* Main Workspace Card */}
      <div className="flex-1 h-full rounded-[32px] overflow-hidden bg-[#f8f8f8] shadow-[inset_0_4px_24px_rgba(0,0,0,0.02),0_10px_30px_rgba(0,0,0,0.2)] flex flex-row font-[Inter] text-[var(--sc-text-primary)]">
        
        {/* Channels Panel - Subdued light grey */}
        <div className="w-[300px] h-full flex-shrink-0 bg-[#f5f6f5] border-r border-gray-100">
          <ChannelsPanel />
        </div>
        
        {/* Chat Area - Focused light background */}
        <div className="flex-1 h-full bg-[#F8F8F8] flex flex-col relative">
          {channelId ? <Outlet /> : <EmptyChatSection />}
        </div>
      </div>
    </div>
  )
}

export { ChatLayout }