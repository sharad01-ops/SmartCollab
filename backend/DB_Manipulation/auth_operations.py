from sqlalchemy.orm import Session
from sqlalchemy import insert, select, update, delete
from datetime import datetime, timezone, timedelta
from utilities.colour_print import Print
from models import Access_Token
from database_models import Access_Tokens

ACCESS_TOKEN_TTL = timedelta(minutes=15)
def set_access_token(userId:int, userName:str, session: Session):

    access_token_exists=get_access_token(userId=userId, session=session)
    val=f'{userId}_{userName}'
    access_token=Access_Token( user_id=userId, value=val, expires_at=datetime.now(timezone.utc)+ACCESS_TOKEN_TTL )
    
    if access_token_exists is None:
        query=insert(Access_Tokens).values(**access_token.model_dump())
        session.execute(query)
        Print.green(f"new Access Token Created for user {userName}")
    else:
        update_AccessToken(
            session=session, 
            uid=userId, 
            new_access_token=access_token, 
            new_expiry_time=datetime.now(timezone.utc)+ACCESS_TOKEN_TTL
        )

def update_AccessToken(session: Session, uid: int, new_access_token: Access_Token, new_expiry_time: datetime):
    query=update(Access_Tokens).where(Access_Tokens.user_id==uid).values(value=new_access_token.value, expires_at=new_expiry_time)
    session.execute(query)


def get_access_token(userId:int, session: Session)->list[Access_Token]|None:
    query=select(Access_Tokens).where(Access_Tokens.user_id==userId)
    result:list[Access_Tokens]=session.execute(query).scalars().all()
    if len(result)==0:
        return None
    return result

def delete_access_token(userId:int, session: Session):
    query=delete(Access_Tokens).where(Access_Tokens.user_id==userId)
    session.execute(query)