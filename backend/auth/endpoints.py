from fastapi import APIRouter, Response, HTTPException, Cookie, status, Depends, Request

from database import session
from sqlalchemy.orm import Session
from DB_Manipulation.dependencies import get_db
from datetime import timedelta, datetime, timezone
from RequestModels import user_credentials

from DB_Manipulation.user_operations import get_user_with_email, add_as_new_user, update_user_auth_info
from auth.dependencies import token_verification

from utilities.colour_print import Print

router=APIRouter()


ACCESS_TOKEN_TTL = timedelta(minutes=15)
def create_access_token(user_id, user_name):
    token=f'{user_id}_{user_name}'
    expires_at = datetime.now(timezone.utc) + ACCESS_TOKEN_TTL

    return {"new_access_token": token, "new_expiry":expires_at }


def refresh_token_check(refresh_token: str=Cookie(None)):

    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing refresh token"
        )
    return refresh_token



@router.post("/login")
def user_login(credentials: user_credentials, response: Response, db:Session = Depends(get_db)):
    print("===================================================")
    print(f'recieved credentials: {credentials.username}, {credentials.email}, {credentials.password}')

    #check if user already in DB
    user = get_user_with_email(session=db, email=credentials.email)


    if user is None:
        print("user doesnt exist, regestering as new user")
        #user doesnt exist, add to DB as new user, and get the new User model instance
        user=add_as_new_user(session=db, credentials=credentials)

        print("refresh_token stored in cookie")


        print(f'user {credentials.username} added to db')
    else:
        if user.user_name!=credentials.username or user.user_password!=credentials.password:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="wrong username or password"
            )


    response.set_cookie(
            key="refresh_token",
            value=f'{user.user_id}_{user.user_name}_{user.user_email}_{user.user_password}',
            max_age=60*60*24*30 #30 days
    )

    return {"AccessToken":f'{user.user_id}_{user.user_name}'}



@router.post("/refresh")
def get_refresh_token(refresh_token: str=Depends(refresh_token_check), db:Session=Depends(get_db)):

    token_info=refresh_token.split("_")

    new_auth_info=create_access_token(user_id=token_info[0], user_name=token_info[1])
    try:
        update_user_auth_info(session=db,
                              uid=token_info[0],
                              new_access_token=new_auth_info["new_access_token"], 
                              new_expiry_time=new_auth_info["new_expiry"])

    except Exception as e:
        Print.red("ERROR WHILE UPDATING USER INFO: ")
        Print.yellow(f'   {e}')
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={f'Error while updating access token: {e}'}
        )
    
    print("from /auth/refresh new_AccessToken: ",new_auth_info["new_access_token"])

    return {"new_AccessToken":f'{new_auth_info["new_access_token"]}'}


@router.get("/cors_test")
def cors_test(access_token: str=Depends(token_verification)):
    return {"status": "ok"}

@router.post("/auto_login")
def auto_login_user(refresh_token: str=Depends(refresh_token_check)):
    if refresh_token:
        return {"status": "ok"}