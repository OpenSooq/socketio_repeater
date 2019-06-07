#! /usr/bin/env node
"use strict";
const fs = require("fs");

const IO = require("socket.io");
const IOClient = require("socket.io-client");
const express = require("express");
// const expressWinston = require("express-winston-2");

const listen_host = process.env['LISTEN_HOST'] || '0.0.0.0';
const listen_port = process.env['LISTEN_PORT'] || 1300;
const server_baseurl = process.env['SERVER_BASEURL'] || 'http://localhost:3000/';

let onExit;

const STDOUT = 1;
const STDERR = 2;
// run GC every minute
if (global.gc) {
    setInterval(function() {
        global.gc();
    }, 60000);
}

process.stdin.resume(); // so the program will not close instantly

function gracefulExit(options, err) {
    let msg=false, stack=false;
    // 1 is stdout and 2 is stderr
    fs.writeSync(STDOUT, "EXIT:"+JSON.stringify(options)+"\n");
    if (err) {
        if (err.message || err.name) {
            fs.writeSync(STDERR, "ERROR:"+( err.name || "")+":"+( err.message || "")+"\n");
            msg=true;
        }
        if (err.stack) {
            fs.writeSync(STDERR, "ERROR TRACE:"+err.stack+"\n");
            stack=true;
        }
        if (!msg && !stack) {
            fs.writeSync(STDERR, "ERROR OBJECT:"+JSON.stringify(err)+"\n");
        }
    }
    // avoid infinite loop
    if (!options.fromExit) {
        // cleanup here before exit
        if (onExit) onExit();
        setTimeout(function() {
            process.exit();
        }, 1000);
    }
}
// do something when app is closing
process.on("exit", gracefulExit.bind(null, {fromExit: true}));

// catches ctrl+c event
process.on("SIGINT", gracefulExit.bind(null, {src: "SIGINT"}));
process.on("SIGTERM", gracefulExit.bind(null, {src: "SIGTERM"}));

async function onConnection(socket) {
    console.log("got connection ", JSON.stringify(socket.handshake.headers));
    let ua = ((socket.handshake || {}).headers || {})['user-agent'] || '';
    let upstream = IOClient(server_baseurl, {
        transports: ["websocket"],
        transportOptions: {
            polling: {extraHeaders: {'user-agent': ua}},
            websocket: {extraHeaders: {'user-agent': ua}},
        }
    });
    upstream.on("connect", function(){console.log("upstream connected")});
    // await waitConnection(upstream);
    // make sure one closes the other
    let disconnected = false;
    socket.on("disconnect", function(data) {
        console.log("client disconnect");
        if (disconnected) return;
        console.log("sending disconnect to upstream server");
        disconnected = true;
        upstream.close()
    });
    upstream.on("disconnect", function(data) {
        console.log("server disconnect");
        if (disconnected) return;
        console.log("sending disconnect to client");
        disconnected = true;
        if (typeof(socket.close)=='function') socket.close();
    });
    let onevent = socket.onevent;
    socket.onevent = function(packet) {
        // eslint-disable-next-line prefer-rest-params
        onevent.apply(this, arguments); // original call
        if (packet && packet.data &&
            packet.data.length && packet.data.length > 0
        ) {
            let stringified=JSON.stringify(packet.data);
            let data_len = packet.data.length;
            let last_type = data_len?typeof(packet.data[data_len-1]):"";
            //  info has id, ip and referer
            console.log("SOCKET.IO packet event "+packet.data[0], {
                category: "socketio",
                socketio_info: socket.info,
                socketio_event: packet.data[0],
                socketio_length: data_len,
                socketio_last_type: last_type,
                socketio_size: stringified.length,
                socketio_data: stringified,
            });
            upstream.emit.apply(upstream, packet.data);
        } else {
            console.log("!! no packet");
        }
    };
    let upstream_onevent = upstream.onevent;
    upstream.onevent = function(packet) {
        // eslint-disable-next-line prefer-rest-params
        upstream_onevent.apply(this, arguments); // original call
        if (packet && packet.data &&
            packet.data.length && packet.data.length > 0
        ) {
            let stringified=JSON.stringify(packet.data);
            let data_len = packet.data.length;
            let last_type = data_len?typeof(packet.data[data_len-1]):"";
            //  info has id, ip and referer
            console.log("SERVER SOCKET.IO packet event "+packet.data[0], {
                category: "socketio",
                socketio_info: socket.info,
                socketio_event: packet.data[0],
                socketio_length: data_len,
                socketio_last_type: last_type,
                socketio_size: stringified.length,
                socketio_data: stringified,
            });
            socket.emit.apply(socket, packet.data);
        } else {
            console.log("!! no packet");
        }
    };

}

function start() {
    
    // Setup basic express server
    let app = express();
    // app.use(proj.logger.express_res_send_error);
    // app.use(expressWinston.logger({winstonInstance: proj.logger, getLogLevel: (status) => (status >= 400)?"error":"info",}));
    let server;
    server = require("http").createServer(app);
    let io = IO(server);
    io.on("connection", onConnection);
    onExit = function() {
        let s=io.sockets.sockets;
        s=typeof(s)=='object'?Object.values(s):s;
        console.info("disconnecting %d users", s.length);
        for (let item of s) item.disconnect();
    };
    app.use(express.static(__dirname + "/../../public"));
    // app.use(expressWinston.errorLogger({winstonInstance: proj.logger,}));
    server.listen(listen_port, listen_host, function() {
        console.info("Repeater is listening at port ", listen_port);
    });
}

start();
