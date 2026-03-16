from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import asyncio
from utilities.colour_print import Print
import json
from chats.WSClient import WSClient
import core
import sys


router=APIRouter()





async def Broadcaster():
    """
    reads the "chat_broadcast" redis stream, and 
    adds the message from the stream into the send queue of each WSClient in a room.

    the sender task of WSClient runs a async while loop when the client connects 
    the sender task then just checks its send_queue and does await websocket.send_json(data)
    to send back the message and removes the first entry from its send_queue

    the room to which the message goes is decided by 
    the message dict from its communityId and channelId fields
    the message dict, coming from the frontend is structured like this:
    {'type': 'message', 'communityId': '1', 'channelId': '1', 'message': 'hi bitch'}
    fuck my life
    """
    Print.green("Broadcaster Started")
    while True:
        if core.async_redis_api_online==False:
            await asyncio.sleep(1)
        else:
            try:
                if await core.async_redis_api.redis_client.exists("chat_broadcast"):

                    messages = await core.async_redis_api.redis_client.xreadgroup(
                            groupname="broadcast_consumers",
                            consumername="broadcast_consumer_1",
                            streams={"chat_broadcast": ">"},
                            block=0,
                        )
                    if messages is not None:
                        for _, entries in messages:
                            for msg_id, data in entries:
                                rooms=manager.Rooms
                                community_id, channel_id=data["community_id"], data["channel_id"]
                                room_id=f"{community_id}{channel_id}"
                                if room_id in rooms:
                                    for uid in rooms[f"{community_id}{channel_id}"]:
                                        try:
                                            # Print.green(f"added message {data} to send_queue")
                                            manager.active_connections[uid].send_queue.put_nowait(data)
                                        except asyncio.QueueFull as e:
                                            Print.red("Sender Queue Full, cant broadcast message")
                                        except Exception as e:
                                            Print.red(f"Error: {e} \n cant broadcast message")
                    else:
                        Print.yellow("No messages in stream")
                        await asyncio.sleep(1)
                else:
                    #sleep for 1 sec if stream doesnt exist, just passing would consume cpu resources
                    Print.yellow("Broadcaster running,but stream does not exist")
                    await asyncio.sleep(1)
            except asyncio.CancelledError as e:
                Print.red("Broadcaster Stopped Due to Cancellation")
                break
            except Exception as e:
                Print.red(e)
                raise e




class ConnectionManager:
    def __init__(self):
        broadcaster_task=asyncio.create_task(Broadcaster())
        asyncio.gather(broadcaster_task)

        self.active_connections: dict[str, WSClient]={}
        self.Rooms: dict[str, list[str]]={}
        self.connection_Rooms: dict[str, list[str]]={}


    async def connect(self, websocket: WebSocket, wsClient: WSClient):
        await websocket.accept()
        self.active_connections[websocket.state.user_id]=wsClient


    async def store_in_room(self, websocket:WebSocket, community_id:str, channel_id:str):
        if self.Rooms.get(f"{community_id}{channel_id}") is None:
            self.Rooms[f"{community_id}{channel_id}"]=[]

        if websocket.state.user_id not in self.Rooms[f"{community_id}{channel_id}"]:
            self.Rooms[f"{community_id}{channel_id}"].append(websocket.state.user_id)

        if self.connection_Rooms.get(websocket.state.user_id) is None:
            self.connection_Rooms[websocket.state.user_id]=[]
        
        if f"{community_id}{channel_id}" not in self.connection_Rooms[websocket.state.user_id]:
            self.connection_Rooms[websocket.state.user_id]=f"{community_id}{channel_id}"


    def disconnect(self, websocket: WebSocket):
        if websocket.state.user_id in self.active_connections:
            self.active_connections.pop(websocket.state.user_id)
        if websocket.state.user_id not in self.connection_Rooms:
            return
        for room_id in self.connection_Rooms[websocket.state.user_id]:
            if self.Rooms.get(room_id) is not None:
                if websocket.state.user_id in self.Rooms[room_id]:
                    self.Rooms[room_id].remove(websocket.state.user_id)



manager=ConnectionManager()

def get_int_from_str(string:str)->int|None:
    try:
        int_=int(string)
        return int_
    except Exception as e:
        return None

def get_message_correct_format(data: dict, uid:str)->dict|None:
    uid_int=get_int_from_str(string=uid)
    commid_int=get_int_from_str(string=data["communityId"])
    chanlid_int=get_int_from_str(string=data["channelId"])
    if None in (uid_int, commid_int, chanlid_int):
        return None
    message_correct_format={
                        "type":"TempMessage",
                        "sender_id":uid_int,
                        "community_id":commid_int,
                        "channel_id":chanlid_int,
                        "message":data["message"],
                    }
    return message_correct_format



async def receiver(ws: WebSocket):
    while True:
        data:dict=await ws.receive_json(mode="text")
        if data.get("type") is None:
            pass
        else:
            message_type=data["type"]
            if message_type=="Room":
                Print.yellow(f"from UserId {ws.state.user_id}: {data}")
                await manager.store_in_room(websocket=ws, community_id=data["communityId"], channel_id=data["channelId"])
            
            if message_type=="message":
                new_message=get_message_correct_format(data=data, uid=ws.state.user_id)
                if new_message is not None:
                    Print.green(f"from UserId {ws.state.user_id}: {data}")
                    # redis_api.publish_to_stream("chat_messages", data["message"])
                    await core.async_redis_api.redis_client.xadd("chat_messages", new_message)
                    await core.async_redis_api.redis_client.xadd("chat_broadcast", new_message)
                    await core.async_redis_api.redis_client.lpush(f"chat_messages:{data['communityId']}:{data['channelId']}", json.dumps(new_message))
                else:
                    Print.red("message formating failed, not pushing message to stream")


@router.websocket("/socket_test")
async def websocket_test(websocket: WebSocket):

    Print.yellow("Cookie Verification")
    refresh_token=websocket.cookies.get("refresh_token")

    if not refresh_token:
        Print.red(f"Cookie Not Found, Closing Websocket...")
        await websocket.close(code=1008)
        return

    uid=refresh_token.partition("_")[0]
    Print.magenta(f"Cookie Found for UserId: {uid}")
    websocket.state.user_id=uid

    ws_client=WSClient(websocket=websocket)
    await manager.connect(websocket=websocket, wsClient=ws_client)
    Print.green(f"Socket Connected for USerId: {uid}")
    
    receiver_task = None
    sender_task=None

    try:
        receiver_task = asyncio.create_task(receiver(ws=websocket))
        sender_task=asyncio.create_task(ws_client.sender())
        await asyncio.gather(receiver_task)

    except WebSocketDisconnect:
        manager.disconnect(websocket=websocket)
        Print.red(f"Socket Disconnected for UserId: {uid}")

    finally:
        print("cleanup start")
        if sender_task:
            sender_task.cancel()
        if receiver_task:
            receiver_task.cancel()
        print("cleanup done")
