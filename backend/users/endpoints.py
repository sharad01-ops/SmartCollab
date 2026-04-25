from fastapi import APIRouter, Response, Depends, HTTPException, status
from RequestModels import user_credentials, user_search
from auth.dependencies import token_verification
from DB_Manipulation.user_operations import get_user_communities, get_user_with_uid, update_language_preference
from DB_Manipulation.dependencies import get_db
from database_models import Users
from sqlalchemy.orm import Session
from sqlalchemy import select

router = APIRouter()

def get_uid(access_token: str):
    return access_token.split("_")[0]

@router.post("/test")
def cookie_test(credentials: user_credentials, response: Response, access_token: str=Depends(token_verification)):

    print(access_token)

    print(f'Credentials: {credentials.username}, {credentials.email}, {credentials.password}')

    return {"test":"test message"}


@router.get("/profile")
def get_user_profile(token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=get_uid(access_token=token)
    user_info=get_user_with_uid(session=db, uid=uid)
    
    # Print.red(f"UserInfo: {user_info}")

    return {"UserInfo":{
                        "user_id":uid, 
                        "username":user_info.user_name, 
                        "email":user_info.user_email,
                        "preferred_language":user_info.preferred_language,
                        }}




@router.get("/communities")
def user_communities(token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=get_uid(access_token=token)

    user_comms=get_user_communities(session=db, uid=uid)
    # print(f'================{user_comms}================')

    return {"UserCommunities":user_comms}

@router.post("/change_language/{new_language}")
def change_language_preference(new_language:str, token: str=Depends(token_verification), db:Session=Depends(get_db)):
    uid=get_uid(access_token=token)
    try:
        update_language_preference(new_language=new_language, uid=uid, session=db)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

    
    return {"Success":True}


@router.post("/search")
def get_matching_users(search_values:user_search, session:Session=Depends(get_db)):
    query=select(Users).where(Users.user_name.ilike(f"%{search_values.user_name}%")).limit(20)
    result=session.execute(query).scalars().all()

    return result