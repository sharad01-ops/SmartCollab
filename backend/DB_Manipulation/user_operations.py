from RequestModels import user_credentials
from sqlalchemy.orm import Session
from database_operations import get_table_by_name
from sqlalchemy import inspect, select, text, insert, update, exists
from models import User, Access_Token, Community_Member, Community
from database_models import Users, Access_Tokens, Community_Members, Communities
from datetime import datetime, timedelta, timezone
from utilities.colour_print import Print
from DB_Manipulation.auth_operations import set_access_token
#returns None if user doesnt exist in db, otherwise returns the user row corresponding to credentials
def get_user_with_email(session: Session, email: str)->User | None:
    #bascially -
    # SELECT * FROM "USERS" 
    # WHERE 
    # user_email=:credentials.email;
    users: list[User]=session.execute(
                                select(Users).where(
                                        Users.user_email==email,
                                        )
                            ).scalars().all()
    
    if len(users)==0:
        return None

    return users[0]


#same as get_user_with_credentials, but uses the user_id to retrieve user info
def get_user_with_uid(session: Session, uid: int)->Users | None:

    user: list[Users]=session.execute(
                                select(Users).where(
                                        Users.user_id==uid
                                        )
                            ).scalars().all()

    if len(user)==0:
        return None

    return user[0]


#returns a list of [user_name, access_token, expiresa_at] columns of the Users table for a particular userid, 
# if userid doesnt exist, returns None
def get_user_auth_info(session:Session, userid: int):

    user_auth_info: list[Access_Token]=session.execute(

                        select(
                            Access_Tokens.value, 
                            Access_Tokens.expires_at
                        ).where( Access_Tokens.user_id==userid )

                    ).mappings().all()
    
    if len(user_auth_info)==0:
        return None

    return user_auth_info[0]





#updates the values of access_token and expires_at columns in the Users table
#if userid doesnt exist
def update_user_auth_info(session: Session, uid: int, new_access_token: str, new_expiry_time: datetime):

    query = session.query().filter(Users.user_id == uid)
    user_exists = session.query(query.exists()).scalar()

    if(user_exists):
        session.execute(
            update(Access_Tokens).where(Access_Tokens.user_id==uid).values(value=new_access_token, expires_at=new_expiry_time)
        )
    else:
        raise Exception(f'user_id {uid} doesnt exist in database/wrong uid provided')
    





#adds a new entry to "Users" table in DB
def add_as_new_user(session: Session, credentials: user_credentials)->User:

    last_user: list[dict]=session.execute( 
                    select(Users).order_by(Users.user_id.desc())

                    ).scalars().all()[0]
    new_uid=last_user['user_id']+1
    new_user=User(
        user_id=new_uid,
        user_name=credentials.username,
        user_email=credentials.email,
        user_password=credentials.password,
        created_at=datetime.now(timezone.utc)
    )


    session.execute(
        insert(Users).values(**new_user.model_dump())
    )

    set_access_token(userId=new_uid, userName=credentials.username, session=session)

    return new_user



def get_user_communities(session: Session, uid:int)->list[Community] | None:
    
    query=select(Communities).where(
        exists().where(Community_Members.community_id==Communities.community_id)
        .where(Community_Members.user_id==uid)
    )
    #SELECT * FROM "Communities" 
    # WHERE EXISTS(
    #               SELECT * FROM "Community_Members" 
    #               WHERE 
    #               "Community_Members".community_id="Communities".community_id 
    #               AND 
    #               "Community_Members".user_id=uid
    #             )

    user_comms: list[Community]=session.execute(query).scalars().all()

    if(len(user_comms)==0):
        return None

    return user_comms


def update_language_preference(new_language:str, uid:int, session:Session):
    query=update(Users).where(Users.user_id==uid).values(preferred_language=new_language)
    session.execute(query)

