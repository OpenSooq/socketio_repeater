#! /usr/bin/env node
"use strict";

const IO = require("socket.io");
const express = require("express");

const listen_host = process.env['LISTEN_HOST'] || '0.0.0.0';
const listen_port = process.env['LISTEN_PORT'] || 3000;

function sleep(ms) {
    // eslint-disable-next-line promise/avoid-new
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function start() {
    let app = express();
    let server;
    server = require("http").createServer(app);
    let io = IO(server);
    io.on("connection", async function (socket){
        console.log("got connection ", JSON.stringify(socket.handshake.headers));
        socket.on("hi", function(x,y,cb){
            console.log("got hi with ", x, y);
            if (cb) cb("x", "y");
        })
        console.log("got connection");
        await sleep(1000);
        console.log("sending hello a b");
        socket.emit('hello', 'a', 'b', function() {
            console.log("inside hello callback with", arguments);
        });
        await sleep(1000);
        console.log("sending hello abc");
        socket.emit('hello', 'abc', '321', function() {
            console.log("inside hello callback with", arguments);
        });
    });
    server.listen(listen_port, listen_host, function() {
        console.info("test server is listening at port ", listen_port);
    });
}

start();
