const express = require('express');
const app = express();
require('dotenv').config(); //call .env file return process.env
//const http = require('http');
//const https = require('https')

//for CORS policy 
const cors = require('cors');
app.use(cors({
    origin: 'http://localhost:4200'
}));

app.use(express.static('public'))



//end CORS policy 
app.use(express.json({ limit: '50mb' })); // // Without `express.json()`, `req.body` is undefined.


//limit for post data size

const hostname = '127.0.0.1';
const port = 3000;

let options={};
//var server = https.createServer(options, app);
app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});


var apiRoute = require('./route/api');
app.use('/api/', (req, res, next) => {
    next();
}, apiRoute);
