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

    const {user_id, setUserid}=useContext(ChatLayout_Context)
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
      <div className="h-screen w-full bg-[var(--sc-bg-primary)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--sc-border)] border-t-[var(--sc-accent)] rounded-full animate-spin" />
          <span className="text-[var(--sc-text-muted)] text-sm">Loading workspace...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-full bg-[var(--sc-bg-primary)] flex flex-row overflow-hidden font-[Inter] text-[var(--sc-text-primary)]">
      <div className="h-full flex flex-row flex-shrink-0">
        <GroupBar
          username={UserProfile.username}
          email={UserProfile.email}
          communities={UserCommunities}
        />
        <div className="flex flex-col w-[200px] h-full border-r border-[var(--sc-border)]">
          <OptionsBar />
          <SearchBar />
          <ChannelsPanel />
        </div>
      </div>
      <div className="flex-1 h-full overflow-hidden">
        {channelId ? <Outlet /> : <EmptyChatSection />}
      </div>
    </div>
  )
}

export { ChatLayout }