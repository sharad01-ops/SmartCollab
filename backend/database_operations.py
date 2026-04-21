from sqlalchemy import Table, MetaData
from database import engine
from sqlalchemy import inspect, text
from sqlalchemy.schema import DropTable
from sqlalchemy.orm import close_all_sessions, Session
from dotenv import load_dotenv
import os
load_dotenv()
#takes model from database_models.py
def create_table_from_model(model, table_name: str):
    metadata = MetaData()

    columns = [
        column.copy()
        for column in model.__table__.columns
    ]

    table = Table(
        table_name,
        metadata,
        *columns
    )

    metadata.create_all(engine)
    print(f'Created Table {table_name}')
    return table




def is_database_empty(db_engine):
    inspector=inspect(db_engine)
    sorted_tables = inspector.get_sorted_table_and_fkc_names()
    if(len(sorted_tables)>0):
        if(sorted_tables==[(None, [])]):
            return True
        return False
    else:
        return True


def get_table_by_name(table_name: str):
    try:
        metadata = MetaData()
        return Table(
            table_name,
            metadata,
            autoload_with=engine
        )
    except Exception as e:
        print(f"Failed to load table '{table_name}': {e}")
        return None



def add_data_into_table_by_reference(table_reference: Table, data):
    with engine.begin() as conn:
        conn.execute(
            table_reference.insert().values(**data.model_dump())
        )



def drop_all_tables():
    inspector=inspect(engine)
    sorted_tables = inspector.get_sorted_table_and_fkc_names()
    metadata = MetaData(schema=os.getenv("POSTGRESDB_SCHEMA"))
    print("dropping all tables")
    with engine.begin() as conn:
        for tname, fkcs in reversed(sorted_tables):
            if tname:
                print(f"Dropping table: {tname}", flush=True)
                # Use the connection to execute the DropTable DDL statement
                conn.execute(DropTable(Table(tname, metadata)))


def drop_all_tables_dockerExec():
    close_all_sessions()
    drop_all_tables()