
const express=require("express")
const https=require("https")
const path=require("path")
const fs=require("fs")
const chalk=require("chalk")
const config=require("./config")
const socketio_server=require("./socketio_server")
const webrtc_functions=require("./webrtc_functions")

let app=null



require("dotenv").config()
const allowed_origins=process.env.ALLOWED_ORIGINS.split(",").map(origin => origin.trim());



let server=null



async function run(){
    await webrtc_functions.createWorkers()
    createExpressApp()
    start_HTTPS_Server()
    socketio_server.initialize_socketio_Server(allowed_origins, server)
}

run()


function createExpressApp(){
    app=express()

    app.use("/", (req,res, next)=>{
        res.send("Hello There!")
    })


}

function start_HTTPS_Server(){
    server=https.createServer(
        {
            key: fs.readFileSync(path.join(__dirname, process.env.SSL_DIR_PATH, process.env.SSL_KEY_PATH)),
            cert: fs.readFileSync(path.join(__dirname, process.env.SSL_DIR_PATH, process.env.SSL_CERT_PATH))
        },
        app
    )

    server.listen(8080, ()=>{
        console.log(chalk.blue("SFU listening on port 8080"))
    })
}

