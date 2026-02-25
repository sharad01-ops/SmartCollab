from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from DB_Manipulation.dependencies import get_db
from DB_Manipulation.dev_operations import get_all_users_credentials



router=APIRouter()




@router.get("/allUsers")
def user_communities( db:Session=Depends(get_db) ):

    user_creds=get_all_users_credentials(session=db)

    return {"user_credentials": user_creds}