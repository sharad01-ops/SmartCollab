// const express = require('express');
// const http = require('http')

import express from 'express'
import http from 'http'
import {translate, languages} from "google-translate-api-x"
import dotenv from "dotenv"
import cors from "cors"

// require("dotenv").config()
dotenv.config()

const PORT=process.env.TRANSLATION_PORT
const FRONTEND=process.env.FRONTEND_URL

const app = express();
const corsOptions = {
  origin: FRONTEND, // Replace with your frontend URL
  optionsSuccessStatus: 200     // For legacy browser support
};
app.use(express.json())
app.use(cors(corsOptions));

const server = http.createServer(app);


app.post("/translate", async (req, res) => {
    const { text, target } = req.body;
    
    const result = await translate(text, { to: target });
    // dummy response for now
    res.json({
        translated: result.text
    });
});



server.listen(PORT, () => {
  console.log(`🚀 Translation server running on port ${PORT}`);
});

