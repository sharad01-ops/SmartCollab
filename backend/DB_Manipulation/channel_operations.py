from sqlalchemy.orm import Session
from sqlalchemy import select, exists, delete, insert, func
from models import MessageRead, Channel, User, Channel_Member
from database_models import Messages, Channel_Members, Channels, Communities, Users
from utilities.colour_print import Print
from datetime import datetime, timezone
import core



def create_Channel(channel_name:str, comm_id:int, session:Session):
    stmt = select(Channels).where(Channels.community_id==comm_id).order_by(Channels.channel_id.desc()).limit(1)
    result = session.execute(stmt).scalar_one_or_none()
    new_channel_id=None
    if(result==None):
        new_channel_id=1
    else:
        new_channel_id=result.channel_id+1

    new_Channel=Channel(
        channel_id=new_channel_id,
        community_id=comm_id,
        channel_name=channel_name,
        created_at=datetime.now(timezone.utc)
    )

    stmt=insert(Channels).values(**new_Channel.model_dump())
    session.execute(stmt)

    return new_Channel


def Add_Channel_Member(channel:Channel, user:User, role:str,session:Session)->Channel_Member:
    stmt=select(Communities.community_name).where(Communities.community_id==channel.community_id)
    comm_name=session.execute(stmt).scalar()

    new_channelMember=Channel_Member(
        user_id=user.user_id,
        community_id=channel.community_id,
        channel_id=channel.channel_id,
        user_name=user.user_name,
        community_name=comm_name,
        channel_name=channel.channel_name,
        joined_at=datetime.now(timezone.utc),
        roles=role
    )

    stmt=insert(Channel_Members).values(**new_channelMember.model_dump())
    session.execute(stmt)

    return new_channelMember



def get_channel_messages(uid:int, comm_id:int, channel_id:int, session:Session)->list[MessageRead]:
    query=select(Messages).where(
            Messages.community_id==comm_id,
            Messages.channel_id==channel_id
        )
    
    Print.magenta(f"getting messgaes for User{uid} from community {comm_id} & channel {channel_id}")

    channel_messages: list[MessageRead]=session.execute(query).scalars().all()
    
    user_map:dict[int,Users]={}

    for msg in channel_messages:
        user=user_map.get(msg.sender_id)
        if(user==None):
            query=select(Users).where(
                        Users.user_id==msg.sender_id
                    )
            result=session.execute(query).scalar()
            if(result is not None):
                user_map[result.user_id]=result
                user=result
        
        if(user is not None):
            msg.__dict__["sender_name"]=user.user_name
        else:
            msg.__dict__["sender_name"]="User"

        if msg.sender_id==uid:
            msg.__dict__.update({"sender_id":"user"})


    return channel_messages

def get_Channle_Members(community_id:int, channel_id:int, session:Session)->list[Channel_Member]:
    query=select(Channel_Members).where(Channel_Members.community_id==community_id, Channel_Members.channel_id==channel_id)
    result:list[Channel_Member]=session.execute(query).scalars().all()

    return result


def Remove_Channel(comm_id:int, channel_id:int, session: Session):
    query=delete(Channels).where(
        Channels.community_id==comm_id,
        Channels.channel_id==channel_id
    )

    session.execute(query)

    core.redis_api.delete_redis_list(f"chat_messages:{comm_id}:{channel_id}")

    return {"Success":True}


def Remove_All_CommunityChannels(comm_id:int, session: Session):

    query=select(Channels).where(Channels.community_id==comm_id)
    result=session.execute(query).scalars().all()

    query=delete(Channels).where(
        Channels.community_id==comm_id
    )

    session.execute(query)

    for channel in result:
        core.redis_api.delete_redis_list(f"chat_messages:{comm_id}:{channel.channel_id}")

    return {"Success":True}



def Remove_All_ChannelMessages(comm_id:int, channel_id:int, session: Session):
    query=delete(Messages).where(
        Messages.community_id==comm_id,
        Messages.channel_id==channel_id
    )

    session.execute(query)

    core.redis_api.delete_redis_list(f"chat_messages:{comm_id}:{channel_id}")

    return {"Success":True}



def Remove_Channel_Member(uid:int, comm_id:int, channel_id:int, session: Session):
    """
    Removes a user from a channel,
    if the channel is empty remove the messages from that channel 
    and the channel itself
    """

    query=delete(Channel_Members).where(
        Channel_Members.user_id==uid,
        Channel_Members.community_id==comm_id,
        Channel_Members.channel_id==channel_id
    )

    session.execute(query)

    query=delete(Messages).where(
        Messages.community_id==comm_id,
        Messages.channel_id==channel_id,
        ~exists(select(1).where(
            Channel_Members.community_id==Messages.community_id,
            Channel_Members.channel_id==Messages.channel_id
        ))
    )
    session.execute(query)

    query=delete(Channels).where(
        Channels.community_id==comm_id,
        Channels.channel_id==channel_id,
        ~exists(select(1).where(
            Channel_Members.community_id==Channels.community_id,
            Channel_Members.channel_id==Channels.channel_id
        ))
    )
    session.execute(query)

    core.redis_api.delete_redis_list(f"chat_messages:{comm_id}:{channel_id}")

    return {"Success":True}



def Remove_User_From_Every_Channel(uid:int, comm_id:int, session: Session):
    """
    Removes a user from all channels of a community,
    if the channel is empty remove the messages from that channel 
    and the channel itself.
    """
    singleember_Channelids=get_SingleMemberChannels(comm_id=comm_id, session=session)


    query=delete(Channel_Members).where(
                Channel_Members.user_id==uid,
                Channel_Members.community_id==comm_id
            )
    session.execute(query)

    query=delete(Messages).where(
        Messages.community_id==comm_id,
        ~exists(select(1).where(
            Channel_Members.community_id==Messages.community_id,
            Channel_Members.channel_id==Messages.channel_id
        ))
    )
    session.execute(query)

    query=delete(Channels).where(
        Channels.community_id==comm_id,
        ~exists(select(1).where(
            Channel_Members.community_id==Channels.community_id,
            Channel_Members.channel_id==Channels.channel_id
        ))
    )
    session.execute(query)

    remove_RedisLists(channel_list=singleember_Channelids, community_id=comm_id)

    return {"Success":True}



def get_SingleMemberChannels(comm_id:int, session: Session):
    """
    SHOULD BE CALLED BEFORE REMOVING 
    MEMBERS FROM A COMMUNITY
    """
    query=select(Channel_Members.channel_id).where(Channel_Members.community_id==comm_id).group_by(Channel_Members.channel_id).having(func.count()==1)
    result=session.execute(query).scalars().all()
    
    return result


def get_channel(comm_id:int, channel_id:int, session: Session)->Channel:
    query=select(Channels).where(Channels.community_id==comm_id, Channels.channel_id==channel_id)
    result=session.execute(query).scalar()
    channel=Channel(channel_id=result.channel_id, community_id=result.community_id, channel_name=result.channel_name, created_at=result.created_at)
    return channel


def remove_RedisLists(channel_list:list[int], community_id:int):
    try:
        for channel_id in channel_list:
            core.redis_api.delete_redis_list(f"chat_messages:{community_id}:{channel_id}")
    except Exception as e:
        Print.red(f"{e}")

