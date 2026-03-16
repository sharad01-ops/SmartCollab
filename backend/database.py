import os
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from utilities.colour_print import Print
import sys

load_dotenv()
# DATABASE_URL = f'postgresql://{os.environ.get("DB_USER")}:{os.environ.get("DB_PASSWORD")}@{os.environ.get("DB_HOST")}:{os.environ.get("DB_PORT")}/{os.environ.get("DB_NAME")}'

DATABASE_URL=os.getenv("DATABASE_URL")

# Print.green("DatabaseURl: ", DATABASE_URL)

# postgresql+psycopg2://username:password@ep-cool-name-12345.us-east-2.aws.neon.tech/dbname?sslmode=require
engine=create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        Print.green("Postgres is connected!")
except OperationalError as e:
    Print.red("Failed to connect:", e)

session = sessionmaker(autocommit=False, autoflush=False, bind=engine)