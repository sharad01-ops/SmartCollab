from fastapi import WebSocket
import asyncio
from utilities.colour_print import Print


class WSClient:
    def __init__(self, websocket: WebSocket, ):
        self.ws=websocket
        #queue will contain messages which will be sent back to the ws connection through ws.send_json
        self.send_queue=asyncio.Queue(maxsize=100)

    async def sender(self):
        try:
            while True:
                # Remove and return an item from the queue.
                # If queue is empty, wait until an item is available.
                data=await self.send_queue.get()
                # Print.magenta(f"sending data: {data}")
                await self.ws.send_json(data=data, mode="text")
        except Exception as e:
            Print.red("Error while sending to websocket :",e)