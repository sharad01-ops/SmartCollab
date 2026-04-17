from fastapi import APIRouter, Depends, HTTPException, status
from auth.dependencies import token_verification
from sqlalchemy.orm import Session
from sqlalchemy import select
from DB_Manipulation.dependencies import get_db
from utilities.db_utilities import parse_access_token
from communities.dependencies import isUserAuthorized
import core
from utilities.colour_print import Print
from DB_Manipulation.channel_operations import get_channel_messages, create_Channel, Add_Channel_Member, get_Channle_Members, Remove_Channel, Remove_All_ChannelMessages, Remove_Channel_Member
from DB_Manipulation.user_operations import get_user_with_uid
from RequestModels import channel_info_create, channel_search
from database_models import Channels
import json
router=APIRouter()



@router.get("/{communityId}/{channelId}")
def get_messages(communityId:int, channelId:int, access_token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=parse_access_token(access_token=access_token)

    isAuthorized=isUserAuthorized(uid=uid, community_id=communityId, session=db, channel_id=channelId)
    if isAuthorized==False:
        Print.red(f"USER {uid} IS NOT AUTHORIZED TO ACCESS CHANNEL {channelId} OF COMMUNITY {communityId}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="user not authorized to access channel of this community"
        )
    
    messages=get_channel_messages(uid=uid, comm_id=communityId, channel_id=channelId, session=db)

    list_data= core.redis_api.redis_client.lrange(
        f"chat_messages:{communityId}:{channelId}",
        0,-1
        )
    Print.yellow(f"reading list: chat_messages:{communityId}:{channelId}")
    new_messages=[]
    for msg in reversed(list_data):
        new_msg:dict=json.loads(msg)
        if(uid==new_msg["sender_id"]):
            new_msg.update({"sender_id":"user"})
        new_messages.append(new_msg)

    num_messages_in_redis=len(new_messages)
    if num_messages_in_redis>0:
        Print.blue(f"{num_messages_in_redis} messages retrieved from redis")
    
    messages=messages+new_messages


    return {"Messages":messages}


@router.post("/{communityId}/search")
def get_matching_communities(communityId:int, search_values:channel_search, session:Session=Depends(get_db)):
    query=select(Channels).where(Channels.community_id==communityId, Channels.channel_name.ilike(f"%{search_values.sub_str}%")).limit(20)
    result=session.execute(query).scalars().all()

    return result



@router.post("/{communityId}/create")
def create_channel(channel_info:channel_info_create, communityId:int, access_token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=parse_access_token(access_token=access_token)
    user=get_user_with_uid(session=db, uid=uid)
    new_Channel=None
    newChannelMember=None
    
    try:
        new_Channel=create_Channel(channel_name=channel_info.channel_name, comm_id=communityId, session=db)
        Print.green(f'Added Channel {new_Channel.channel_name}')
        newChannelMember=Add_Channel_Member(channel=new_Channel, user=user, role="member", session=db)
        Print.green(f'Added {user.user_name} to Channel {newChannelMember.channel_name}')
    except Exception as e:
        Print.red(f'Error while creating channel: {e}')

    if new_Channel is not None:
        return {"Success":True if new_Channel is not None else False, "NewChannelId":new_Channel.channel_id, "NewChannelName":new_Channel.channel_name }
    else:
        return {"Success":False}



@router.delete("/{communityId}/{channelId}/leave")
def leave_Channel(communityId:int, channelId:int, access_token: str=Depends(token_verification), db:Session=Depends(get_db)):
    
    uid=parse_access_token(access_token=access_token)
    channel_members=get_Channle_Members(community_id=communityId, channel_id=channelId, session=db)
    
    if(len(channel_members)==1):
        remove_status=Remove_All_ChannelMessages(comm_id=communityId, channel_id=channelId, session=db)
        
        if(remove_status.get("Success")==True):
            remove_status=Remove_Channel_Member(uid=uid, comm_id=communityId, channel_id=channelId, session=db)
            
            if(remove_status.get("Success")==True):
                Remove_Channel(comm_id=communityId, channel_id=channelId, session=db)

                return {"Success":True}


    try:
        remove_status=Remove_Channel_Member(uid=uid, comm_id=communityId, channel_id=channelId, session=db)
        if(remove_status.get("Success")==True):
            return remove_status
    except Exception as e:
        Print.red(f"{e}")
        return {"Success":False}
