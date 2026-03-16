from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import session, engine
import database_models
from contextlib import asynccontextmanager
from sqlalchemy.orm import close_all_sessions
from Datapopulation import populate_db
from database_operations import drop_all_tables, is_database_empty
from utilities.colour_print import Print
from chats.async_redis_operations import async_RedisAPI
from chats.redis_operations import RedisAPI
import core
from dotenv import load_dotenv
import os
# tables_to_create_on_init=[ database_models.Communties.__table__, database_models.Users.__table__ ]

# database_models.Base.metadata.create_all(bind=engine, tables=tables_to_create_on_init)

load_dotenv()


@asynccontextmanager
async def lifespan(app: FastAPI):
    core.async_redis_api=async_RedisAPI(
        host=os.getenv("REDIS_HOST"),
        port=os.getenv("REDIS_PORT"),
        password=os.getenv("REDIS_PASSWORD"),
        username=os.getenv("REDIS_USERNAME")
    )

    core.redis_api=RedisAPI(
        host=os.getenv("REDIS_HOST"),
        port=os.getenv("REDIS_PORT"),
        password=os.getenv("REDIS_PASSWORD"),
        username=os.getenv("REDIS_USERNAME")
    )

    core.redis_api.connect()
    await core.async_redis_api.connect()
    await core.async_redis_api.create_consumer_group(
        stream_name="chat_broadcast", 
        consumer_group_name="broadcast_consumers")
    
    core.async_redis_api_online=True
    
    yield

    await core.async_redis_api.close_connection()
    core.async_redis_api=None
    core.async_redis_api_online=False
    core.redis_api.close_connection()


app = FastAPI(lifespan=lifespan)


origins = [
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from auth.endpoints import router as auth_router
from users.endpoints import router as users_router
from communities.endpoints import router as communities_router
from channels.endpoints import router as channels_router
from chats.websockets import router as chats_ws_router
from dev.endpoints import router as dev_router

app.include_router(auth_router, prefix="/auth")
app.include_router(users_router, prefix="/users")
app.include_router(communities_router, prefix="/communities")
app.include_router(channels_router, prefix="/channels")
app.include_router(chats_ws_router, prefix="/ws")
app.include_router(dev_router, prefix="/dev")

def init_db():
    close_all_sessions()
    drop_all_tables()
    db=session()
    populate_db(db)
    db.commit()
    db.close()
        


# def get_db():
#     db=session()
#     try:
#         yield db
#     finally:
#         db.close()



@app.get("/populate_db")
def initialize_db():
    if(is_database_empty(engine)):
        print("database is empty, filling with random data")
        init_db()
    return {"Hello": "Cruel World"}

@app.get("/cors_test")
def cors_test():
    return {"status": "ok"}


Print.blue("============================================")
