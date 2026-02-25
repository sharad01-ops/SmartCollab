from fastapi import APIRouter, Depends, HTTPException, status
from auth.dependencies import token_verification
from sqlalchemy.orm import Session
from DB_Manipulation.dependencies import get_db
from utilities.db_utilities import parse_access_token
from communities.dependencies import isUserAuthorized
import core
from utilities.colour_print import Print
from DB_Manipulation.channel_operations import get_channel_messages
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
