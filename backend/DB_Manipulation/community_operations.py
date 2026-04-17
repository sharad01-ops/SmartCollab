from sqlalchemy.orm import Session
from sqlalchemy import select, exists, insert, delete
from database_models import Channel_Members, Channels, Communities, Community_Members, Messages
from models import Channel, Community, User, Community_Member
from utilities.colour_print import Print
from datetime import datetime, timezone


def create_community(comm_name:str, session:Session)->Community:
    stmt = select(Communities).order_by(Communities.community_id.desc()).limit(1)
    result = session.execute(stmt).scalar_one_or_none()

    new_community_id=None
    if(result==None):
        new_community_id=1
    else:
        new_community_id=result.community_id+1
    

    new_Community=Community(
        community_id=new_community_id, 
        community_name=comm_name, 
        created_at=datetime.now(timezone.utc))

    stmt=insert(Communities).values(**new_Community.model_dump())
    session.execute(stmt)

    return new_Community


def Add_Community_Member(community:Community, user:User, role:str,session:Session)->Community_Member:
    new_communityMember=Community_Member(
        user_id=user.user_id, 
        community_id=community.community_id,
        user_name=user.user_name,
        community_name=community.community_name,
        joined_at=datetime.now(timezone.utc),
        roles=role
        )

    stmt=insert(Community_Members).values(**new_communityMember.model_dump())
    session.execute(stmt)

    return new_communityMember



def get_user_channels(uid:int, comm_id:int, session:Session)->list[Channel]:
    query=select(Channels).where(
        Channels.community_id==comm_id,
        exists().where(
            Channel_Members.channel_id==Channels.channel_id,
            Channel_Members.community_id==Channels.community_id,
            Channel_Members.user_id==uid
        )
    )
    Print.magenta(f"getting channels for User{uid} from community {comm_id}")

    user_comms: list[Channel]=session.execute(query).scalars().all()
    
    return user_comms


def getComunityMembers(community_id:int, session:Session)->list[Community_Member]:
    query=select(Community_Members).where(Community_Members.community_id==community_id)
    result:list[Community_Member]=session.execute(query).scalars().all()

    return result


def Remove_Community_Member(uid:int, comm_id:int, session:Session):
    query=delete(Community_Members).where(
        Community_Members.user_id==uid,
        Community_Members.community_id==comm_id
    )

    session.execute(query)

    return {"Success":True}


def Remove_All_CommunityMessages(comm_id:int, session:Session):
    query=delete(Messages).where(
        Messages.community_id==comm_id
    )

    session.execute(query)

    return {"Success":True}


def Remove_All_Community_Channels(comm_id:int, session:Session):
    query=delete(Channels).where(
        Channels.community_id==comm_id
    )

    session.execute(query)

    return {"Success":True}


def Delete_Community(comm_id:int, session:Session):
    query=delete(Communities).where(Communities.community_id==comm_id)
    session.execute(query)

    return {"Success":True}