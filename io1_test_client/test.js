#! /usr/bin/env node
"use strict";

const IOClient = require("socket.io-client");

const io1_baseurl = process.env['IO1_BASEURL'] || 'http://localhost:1300/';

function onConnection(socket) {
    console.log("connected", socket);
}

function sleep(ms) {
    // eslint-disable-next-line promise/avoid-new
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function waitConnection(socket) {
    console.log("waiting connection");
    return new Promise(function(resolve) {
        socket.on("connect", function(){
            console.log("connected")
            resolve();
        });
    });
}

async function start() {
    console.log("connecting to: "+io1_baseurl);
    let socket = IOClient(io1_baseurl, {transports: ["websocket"]} );
    await waitConnection(socket);
    await sleep(1000);
    socket.on("hello", function(a, b, cb){
        console.log("got hello with arguments", arguments);
        cb("foo", "foobar");
    });
    console.log("sending hi");
    socket.emit("hi", "x", "y", function cb(){
        console.log("hi callback called with ", arguments);
    })
    await sleep(1000);
    console.log("sending hi");
    socket.emit("hi", "xyz", "123", function cb(){
        console.log("hi callback called with ", arguments);
    })

}

start();
