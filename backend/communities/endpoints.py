from fastapi import APIRouter, Depends, HTTPException, status
from auth.dependencies import token_verification
from sqlalchemy.orm import Session
from sqlalchemy import select
from utilities.db_utilities import parse_access_token
from DB_Manipulation.dependencies import get_db
from DB_Manipulation.community_operations import get_user_channels, create_community, Add_Community_Member, getComunityMembers, Delete_Community, Remove_Community_Member, Remove_All_CommunityMessages, Remove_All_Community_Channels
from DB_Manipulation.channel_operations import Remove_User_From_Every_Channel
from DB_Manipulation.user_operations import get_user_with_uid
from communities.dependencies import isUserAuthorized
from RequestModels import community_info_create, community_search
from database_models import Communities

from utilities.colour_print import Print

router = APIRouter()





@router.post("/search")
def get_matching_communities(search_values:community_search, session:Session=Depends(get_db)):
    query=select(Communities).where(Communities.community_name.ilike(f"%{search_values.sub_str}%")).limit(20)
    result=session.execute(query).scalars().all()

    return result



@router.get("/{communityId}/channels")
def get_User_Channels(communityId:int, access_token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=parse_access_token(access_token=access_token)
    isAuthorized=isUserAuthorized(uid=uid, community_id=communityId, session=db)
    if isAuthorized==False:
        Print.red("USER NOT AUTHORIZED TO ACCESS THIS COMMUNITY")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="user not authorized to access community"
        )
    stmt=select(Communities).where(Communities.community_id==communityId)
    community=db.execute(stmt).scalar()
    channels=get_user_channels(uid=uid, comm_id=communityId, session=db)

    return {"CommunityName":community.community_name, "CommunityId":community.community_id, "Channels":channels}



@router.post("/create")
def get_User_Channels(communityInfo:community_info_create, access_token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=parse_access_token(access_token=access_token)
    user=get_user_with_uid(session=db, uid=uid)
    newCommunity=None
    newCommunityMember=None
    try:
        newCommunity=create_community(comm_name=communityInfo.community_name, session=db)
        Print.green(f'Added Community {newCommunity.community_name}')
        newCommunityMember=Add_Community_Member(community=newCommunity, user=user, role="member", session=db)
        Print.green(f'Added {newCommunityMember.user_name} to Community {newCommunityMember.community_name}')
    except Exception as e:
        Print.red(f'Error while creating community: {e}')

    return {"Success":True if newCommunity is not None else False, "NewCommId":newCommunity.community_id, "NewCommName":newCommunity.community_name }




@router.delete("/{communityId}/leave")
def get_User_Channels(communityId:int, access_token: str=Depends(token_verification), db:Session=Depends(get_db)):
    
    uid=parse_access_token(access_token=access_token)
    community_members=getComunityMembers(community_id=communityId, session=db)
    
    if(len(community_members)==1):
        remove_status=Remove_All_CommunityMessages(comm_id=communityId, session=db)
        
        if(remove_status.get("Success")==True):
            remove_status=Remove_User_From_Every_Channel(uid=uid, comm_id=communityId, session=db)
            
            if(remove_status.get("Success")==True):
                Remove_All_Community_Channels(comm_id=communityId, session=db)
                Remove_Community_Member(uid=uid, comm_id=communityId, session=db)
                Delete_Community(comm_id=communityId, session=db)

                return {"Success":True}
            

    remove_status=Remove_User_From_Every_Channel(uid=uid, comm_id=communityId, session=db)
    try:
        if(remove_status.get("Success")==True):
            remove_status=Remove_Community_Member(uid=uid, comm_id=communityId, session=db)
            return remove_status
    except Exception as e:
        Print.red(f"{e}")
        return {"Success":False}


