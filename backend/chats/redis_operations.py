import redis
from utilities.colour_print import Print


def get_redis_client(host, port, username, password):
    try:
        # Create a connection to the Redis server
        redis_client = redis.Redis(
            host=host,
            port=port,
            password=password,
            decode_responses=True,  # Decode responses to UTF-8, if needed
            username=username
        )
        
        # Ping the server to check the connection
        response = redis_client.ping()
        Print.green(f"Connected to Redis. Server responded with: {response}")
        return redis_client
    except redis.ConnectionError as e:
        Print.red(f"Unable to connect to Redis: {e}")
        return None
    except Exception as e:
        Print.red(f"Error while creating redis client: {e}")
        return None


class RedisAPI():

    def __init__(self, host, port, username, password):
        self.redis_client:redis.Redis|None=None
        self.host=host
        self.port=port
        self.password=password
        self.username=username

    
    def connect(self):
        self.redis_client=get_redis_client(host=self.host, port=self.port, username=self.username, password=self.password)


    # Publish a message to a stream
    def publish_to_stream(self, stream_name, message):
        self.redis_client.xadd(stream_name, {'message': message})
        Print.green("Message Added in Redis Stream")

    def create_consumer_group(self, stream_name, consumer_group_name):
        # Check if the stream exists
        if self.redis_client.exists(stream_name):
            print(f"Stream '{stream_name}' already exist.")
            consumer_groups=self.redis_client.xinfo_groups(stream_name)
            if consumer_group_name in consumer_groups:
                Print.green("Stream and Consumer Group already exists")
                return
        

        # Create the consumer group
        try:
            self.redis_client.xgroup_create(stream_name, consumer_group_name, id='0', mkstream=True)
            Print.green("Stream and Consumer Group Created")
        except redis.exceptions.ResponseError as e:
            if "BUSYGROUP Consumer Group name already exists" not in str(e):
                raise

    def consume_from_stream(self, consumer_group_name, consumer_name, stream_name, count, block_time):
        try:
            messages=self.redis_client.xreadgroup(consumer_group_name, consumer_name, {stream_name: '>'}, count=count, block=block_time)
            return messages
        except Exception as e:
            Print.red(e)
            return None

    def close_connection(self):
        self.redis_client.close()
        Print.yellow("Redis Connection Closed")

