# Socket.IO Repeater
### Connect Socket.io v1 clients to Socket.io v2 server


<p>Socket.IO team announced version 2.X that is not backward-compatible, due to:</p>
<ul><li>a breaking change related to utf-8 encoding in engine.io-parser (<a href="https://github.com/socketio/engine.io-parser/pull/81">socketio/engine.io-parser#81</a>)</li><li>an update to make the socket id on the client match the id on the server-side (<a href="https://github.com/socketio/socket.io-client/pull/1058">socketio/socket.io-client#1058</a>)</li></ul>

This github shows how OpenSooq managed to maintain various clients with various languages and versions.

### The Solution
An unmodified old client resolves the server domain leading to a socket.io v1.x service, but that service is just a “bridge” interfacing with old v1.x clients from one side passing those events to the real socket.io v2.x upstream

<p align="center"><img src="https://user-images.githubusercontent.com/4533327/59000872-26e8ea00-8815-11e9-9440-9346335df6f2.png"  /></p>

You can obtain socket.io-repeater from our github repo 
```
git clone ...
cd socketio_repeater
npm install
SERVER_BASEURL='http://io-v2.internal:3000' LISTEN_PORT=1300 node index.js
```

### Install Dependencies


```
npm install
cd io2_test_server && npm install && cd ..
cd io1_test_client && npm install && cd ..
```

### Run Test

Run test server

```
cd io2_test_server
LISTEN_PORT=3000 node index.js
```

Run the repeater

```
SERVER_BASEURL='https://localhost:3000' LISTEN_PORT=1300 node index.js
```

Run the test client

```
cd io1_test_client
IO1_BASEURL='https://localhost:1300' node test.js
```

### License

```
Copyright 2019 OpenSooq

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
