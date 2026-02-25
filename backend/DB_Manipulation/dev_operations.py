from database_models import Users
from sqlalchemy.orm import Session
from sqlalchemy import select



def get_all_users_credentials(session: Session)->Users | None:

    user_creds=session.execute(
                                select(Users)
                            ).scalars().all()


    return user_creds