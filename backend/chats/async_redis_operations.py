from redis.asyncio import Redis
from utilities.colour_print import Print
import asyncio

async def get_redis_client(host, port, username, password):
    try:
        # Create a connection to the Redis server
        redis_client = Redis(
            host=host,
            port=port,
            password=password,
            decode_responses=True,  # Decode responses to UTF-8, if needed
            username=username
        )
        
        # Ping the server to check the connection
        response = await redis_client.ping()
        Print.green(f"Connected to Async Redis. Server responded with: {response}")
        return redis_client
    except Exception as e:
        Print.red(f"Error while creating redis client: {e}")
        return None


class async_RedisAPI():
    def __init__(self, host, port, username, password):
        self.redis_client:Redis|None=None
        self.host=host
        self.port=port
        self.password=password
        self.username=username
    
    async def connect(self):
        self.redis_client=await get_redis_client(host=self.host, port=self.port, username=self.username, password=self.password)

    # Publish a message to a stream
    async def publish_to_stream(self, stream_name, message):
        await self.redis_client.xadd(stream_name, {'message': message})
        Print.green("Message Added in Async Redis Stream")

    async def create_consumer_group(self, stream_name, consumer_group_name):
        # Create the consumer group
        try:
            await self.redis_client.xgroup_create(stream_name, consumer_group_name, id='0', mkstream=True)
            Print.green("Stream and Consumer Group Created")
        except Exception as e:
            if "BUSYGROUP" in str(e):
                Print.yellow(f"Stream {stream_name} and consumer group {consumer_group_name} already exist")
            else:
                raise

    async def consume_from_stream(self, consumer_group_name, consumer_name, stream_name, count, block_time):
        try:
            messages=await self.redis_client.xreadgroup(consumer_group_name, consumer_name, {stream_name: '>'}, count=count, block=block_time)
            return messages
        except asyncio.CancelledError:
            Print.red(f'reading from {stream_name} failed due to cancellation')
            return None

        except Exception as e:
            Print.red(e)
            return None
    
    async def close_connection(self):
        await self.redis_client.close()
        Print.yellow("Async Redis Connection Closed")

