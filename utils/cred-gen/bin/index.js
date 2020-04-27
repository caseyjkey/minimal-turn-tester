#!/usr/bin/env node
// API for getting TURN creds
var crypto = require('crypto');
var express = require('express');
var app = express();

function getTURNCredentials(name, secret){    

    var unixTimeStamp = parseInt(Date.now()/1000) + 24*3600,   // this credential would be valid for the next 24 hours
        username = [unixTimeStamp, name].join(':'),
        password,
        hmac = crypto.createHmac('sha1', secret);
    hmac.setEncoding('base64');
    hmac.write(username);
    hmac.end();
    password = hmac.read();
    return {
        username: username,
        password: password
    };
}

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get("/giveMeCredentials", (req, res, next) => {
  res.json(getTURNCredentials("bongo", process.argv[2]));
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

