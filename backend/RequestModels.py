from pydantic import BaseModel


class user_credentials(BaseModel):
    username: str
    email: str
    password: str


class community_search(BaseModel):
    sub_str:str

class community_info_create(BaseModel):
    community_name: str

class community_info_join(BaseModel):
    community_id: int
    community_name: str

class community_info_leave(BaseModel):
    community_id: int
    community_name: str


class channel_search(BaseModel):
    sub_str:str

class channel_info_create(BaseModel):
    channel_name: str

class channel_info_join(BaseModel):
    channel_id: int
    channel_name: str

class channel_info_leave(BaseModel):
    channel_id: int
    channel_name: str

class user_search(BaseModel):
    user_name:str
