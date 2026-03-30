import os
from dotenv import load_dotenv
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from utilities.colour_print import Print

load_dotenv()

DATABASE_URL=os.getenv("DATABASE_URL")

# Print.green("DatabaseURl: ", DATABASE_URL)

engine=create_engine(DATABASE_URL)

try:
    with engine.connect() as conn:
        Print.green("Postgres is connected!")
except OperationalError as e:
    Print.red("Failed to connect:", e)

session = sessionmaker(autocommit=False, autoflush=False, bind=engine)