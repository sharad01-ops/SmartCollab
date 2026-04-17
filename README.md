# SmartCollab
SmartCollab : An AI -Powered Multilingual Platform for Real-Time Collaboration

# Installation, Setup and Running
Apple
## Postgres
- install postgres installer from <a>https://www.enterprisedb.com/downloads/postgres-postgresql-downloads</a>
- start the installer and go through the installation steps.
- one of the installation steps will ask you to set a password, this is the password for the superuser of postgres
- this password gives you access to creating user roles and database schemas, its important, if you are on windows and forget this password then you have to reinstall postgres, there's no forgot password for postgres on windows.
- once the installation setup is done, access postgres with psql terminal
    - `psql -U postgres` starts postgres sql editor as superuser, it asks for the password you set during installation
    - then create a new role- `CREATE ROLE *user_name* LOGIN PASSWORD *password*`;
    - the create a new schema- `CREATE SCHEMA *schema_name* AUTHORIZATION *user_name*`;
    - then grant schema access to the new role- `GRANT USAGE ON SCHEMA *schema_name* TO *user_name`;
    - then create a new database- `CREATE DATABASE *db_name*`
    - Ctrl+C out of psql editor
    - these steps are necessary because only superuser(which is postgres) has access to creating tables in a database in the default schema, so this just creates a new role, schema and database to avoid windows permission issues, or just stay with superuser idgaf.
- backend env has two variables which need this data to connect with the postgres server, they are:
    - `DATABASE_URL=postgresql+psycopg2://*user_name*:*password*@localhost:5432/*db_name*`
    - `POSTGRESDB_SCHEMA=*schema_name*`
- setup is done, you dont need to manually start postgres, it starts its server in the background on its own, listening on port 5432(on windows).
<br>

## Redis
- There is no windows native installation of redis, so you need a linux distro(like ubuntu) to install it.
- First check if Ubuntu is already installed with:
    - `wsl -l -v`, a list will appear, if you see Ubuntu in the list, then its already installed
    - if you dont see Ubuntu in the list then look for the steps to install it.
- after Ubuntu is installed:
    - open cmd, then do `wsl -d Ubuntu`, this will select "Ubuntu's cmd"
    - `sudo apt update`
    - `sudo apt install redis-server`
- in the same cmd:
    - to start redis server do:
        - `sudo service redis-server start`
    - to test if redis is active:
        - `redis-cli ping`=> this should print PONG in the cmd
    - to stop redis server:
        - `sudo service redis-server stop`
        - if not stopped after that, try: `redis-cli shutdown`
- alternative way of starting redis server:
    - open cmd then do:
        - `bash`
        - to start: `sudo service redis-server start`
        - to stop: `sudo service redis-server stop` or `redis-cli shutdown`
- the backend env also requires redis info:
    - `REDIS_HOST=localhost`(to check which host ip redis is using do: `redis-cli get bind`, for windows it might show as 127.0.0.1 but thats wsl network host ip which binds to localhost on windows internal network)
    -  `REDIS_PORT=637`(to get which port redis server is listening on do: `redis-cli get port`)
<br>

## Backend
- `cd backend`
- `python -m venv .venv` to create a virtual environment with main folder as .venv
- `.venv\Script\activate` to activate the virtual environment
- `pip install -r requirements.txt` to install the dependencies
- `uvicorn main:app --reload` to start the FastAPI server
- the fastapi server connects with redis and postgres on start so if they are not running then it'll crash, so do start redis and postgres before starting backend server.
- to fill postgres db with test data visit http:localhost:8000/populate_db while backend server is running.
<br>

## Frontend
- `cd frontend`
- `npm i` to install node modules
- `npm run dev` to start frontend
-start backend before starting the frontend or it crashes
<br>

## SFU
- `cd sfu-server`
- `npm i` to install node modules
- before running sfu server, you need SSL certificate to start the actual https server.
- to get the certificate install a package manager like chocolatey(for windows)
- then open cmd with "Run as administrator"
- install mkcert with: `choco install mkcert -y`
- then do: `mkcert -install`
- then open the vscode terminal, and do: `mkcert localhost 127.0.0.1 ::1`, this will create localhost-key.pem and localhost.pem files in sfu-server folder
- create a new directory to hold the key and certificate, and add their file paths in the env in:
    - SSL_DIR_PATH=>path of the directory holding the certificate and key
    - SSL_KEY_PATH=>path of key file in the directory
    - SSL_CERT_PATH=>path of certificate file in the directory
- then to run the sfu-server do: `npm run dev`
- start frontend and backend before starting sfu server
<br>

## PS
if testing sfu, run the project only on chrome, the sfu doesnt work with firefox because it has a diferent certificate requirement.