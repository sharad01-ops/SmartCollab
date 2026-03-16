from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, ForeignKeyConstraint, BigInteger, MetaData
from sqlalchemy.ext.declarative import declarative_base
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_SCHEMA=os.getenv("POSTGRESDB_SCHEMA")

metadata = MetaData(schema=DATABASE_SCHEMA)
Base = declarative_base(metadata=metadata)


#contains all the users
class Users(Base):
    __tablename__ = 'Users'
    
    user_id = Column(Integer, primary_key=True, index=True)
    user_name= Column(String, nullable=False)
    user_email= Column(String, unique=True)
    user_password= Column(String, nullable=False)
    created_at=Column(DateTime(timezone=True))



#contains the list of all the communities a user is part of
class Access_Tokens(Base):
    __tablename__ = 'Access_Tokens'

    user_id=Column(Integer, ForeignKey("Users.user_id"), primary_key=True)
    value=Column(String, nullable=False)
    expires_at=Column(DateTime(timezone=True), nullable=False)



#contains all the communities
class Communities(Base):
    __tablename__ = 'Communities'

    community_id= Column(Integer, primary_key=True, index=True)
    community_name= Column(String, nullable=False)
    created_at=Column(DateTime(timezone=True))



#contains all the channels
class Channels(Base):
    __tablename__ = 'Channels'

    channel_id= Column(Integer, primary_key=True, index=True)
    community_id= Column(Integer, ForeignKey("Communities.community_id"), primary_key=True)#fk
    channel_name= Column(String, nullable=False)
    created_at=Column(DateTime(timezone=True))


#contains all the users of the community, pk
class Community_Members(Base):
    __tablename__ = 'Community_Members'

    user_id=Column(Integer, ForeignKey("Users.user_id"), primary_key=True)#fk
    community_id=Column(Integer, ForeignKey("Communities.community_id"), primary_key=True)#fk
    user_name= Column(String, nullable=False)
    community_name= Column(String, nullable=False)
    joined_at=Column(DateTime(timezone=True))
    roles=Column(String, nullable=False)


#contains all the users of a channel
class Channel_Members(Base):
    __tablename__ = 'Channel_Members'
    
    community_id=Column(Integer, primary_key=True)
    channel_id=Column(Integer, primary_key=True)
    
    user_name= Column(String, nullable=False)
    community_name=Column(String, nullable=False)
    channel_name=Column(String, nullable=False)
    joined_at=Column(DateTime(timezone=True))
    roles=Column(String, nullable=False)

    __table_args__=(
        ForeignKeyConstraint(
            ["community_id", "channel_id"],
            ["Channels.community_id", "Channels.channel_id"],
            ondelete="CASCADE",
        ),
    )

    user_id=Column(Integer, ForeignKey("Users.user_id"), primary_key=True)


#contains ALL the messages
class Messages(Base):
    __tablename__ = 'Messages'

    message_id= Column(BigInteger, primary_key=True, autoincrement=True)
    sender_id=Column(Integer, ForeignKey("Users.user_id"), nullable=False)
    community_id=Column(Integer, nullable=False)
    channel_id=Column(Integer, nullable=False)
    message=Column(String)
    sent_at=Column(DateTime(timezone=True))

    __table_args__=(
        ForeignKeyConstraint(
            ["community_id", "channel_id"],
            ["Channels.community_id", "Channels.channel_id"],
            ondelete="CASCADE",
        ),
    )