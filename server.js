/*
 * Copyright (C) 2022 Kraft, Royapally, Sarthi, Ramaswamy, Maduru, Harde, Gomes, Bellam, Reddy, Craine, Gupta - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license that can be found in the LICENSE file or
 * at https://opensource.org/licenses/MIT.
 * You should have received a copy of the MIT license with
 * this file. If not, please write to: develop.nak@gmail.com, or visit https://github.com/SiddarthR56/spark/blob/main/README.md.
 */

/**
 * Logic for setting and starting up the server, setting recognized routes, and
 * setting which server-side socket signals to respond to with server-side functionality.
 *
 * @requires express
 * @requires cors
 * @requires socket.io
 * @requires peer
 * @requires uuid
 * @requires express-rate-limit
 */

/**
 * Express module for starting route-based apps.
 *
 * @const
 */
const express = require('express');

/**
 * The app instance for serving webpage and routing data to any client.
 * Requires no params for instantiation in the context of the server
 * and its default settings.
 *
 * @type {Object}
 * @constructor
 * @fires app#use
 * @fires app#set
 * @fires app#get
 * @fires app#on
 */
const app = express();

/**
 * Module for cross-origin resource sharing; needed so that the protocol default CORS
 * policy can be overridden.
 *
 * @const
 */
const cors = require('cors');

/**
 * The HTTP server module used for starting Spark's server to serve webpage content.
 *
 * @type {Object}
 * @param {Object} [app] Reference to instantiated express app that server module can interface on
 * @const
 * @constructor
 *
 * @listen server#listen
 */
const server = require('http').Server(app);

/**
 * The socket module that allows for peer-to-peer connection support.
 *
 * @type {Object}
 * @const
 * @param {Object} [server] Reference to the HTTP server that will be used to listen for new connections
 * @param {Object} [config] Settings for the socket connection; used for setting CORS origin for connection
 * @constructor
 *
 * @fires io#on
 */
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
});

/**
 * Module for peer.js that allows for express app support for peer-to-peer connections.
 *
 * @const
 */
const ExpressPeerServer = require('peer').ExpressPeerServer;

/**
 * The app instance for managing new multi-peer connections from clients using rooms.
 * Requires no params for instantiation in the context of the server
 * and its default settings.
 *
 * @const
 * @type {Object}
 * @constructor
 * @fires peerApp#use
 */
const peerApp = express();

/**
 * The HTTP server module used for starting Spark's server to listen for new peers and their activity; uses createServer
 * to set up the peer.js functionality.
 *
 * @type {Object}
 * @param {Object} [peerApp] Reference to instantiated peer.js express app that server module can interface on
 * @const
 * @method
 *
 * @listens peerServer#listen
 */
const peerServer = require('http').createServer(peerApp);

/**
 * Module for generating UUIDs, using v4 specifically to generate securely.
 *
 * @const
 */
const { v4: uuidV4 } = require('uuid');

/**
 * Module for enforcing rate limit on an express app
 *
 * @const
 */
const RateLimit = require('express-rate-limit');

/**
 * Sets up the rate limit rules to be used for the express app
 *
 * @constructor
 * @param {Object} [configs] Settings used for the rate limiting rules
 */
const limiter = RateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
});

// variables to keep track of room hosts and participants
var roomHostsMap = {};
var roomParticipantsMap = {};

/**
 * Sets various configs for the express app; in the context of Spark, it's only used to set
 * the view engine from HTML to EJS files.
 *
 * @event app#set
 */
app.set('view engine', 'ejs');
/**
 * Applies CORS for all requests.
 *
 * @event app#use
 */
app.use(cors());
/**
 * Tells the express app to reference any static files to serve under the
 * project's public directory.
 *
 * @event app#use
 */
app.use(express.static('public'));
/**
 * Tells the express app to reference the instantiated rate limiter rules.
 *
 * @event app#use
 */
app.use(limiter);

/**
 * Sets up a route to listen to peer connections with debug options.
 *
 * @event peerApp#use
 */
peerApp.use(
  '/peerjs',
  /**
   * Server functionality that interfaces on the provided HTTP server to provide peer.js functionality.
   *
   * @constructor
   * @param {Object} [peerServer] Reference to the HTTP server that will be used to interface peer.js functionality
   * @param {Object} [configs] Object that represents settings for the server
   */
  ExpressPeerServer(peerServer, { debug: true })
);

/**
 * GET / : redirects the user to a room with an ID generated by UUID v4
 *
 * @event app#get
 * @param {string} [path] The path for which the GET will act on
 * @param {function} [callback] The function with request and response pair that runs when the endpoint is hit
 */
app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
});

/**
 * GET /:room : Parametrized room route that serves back the view/room.ejs file with the given room ID
 *
 * @event app#get
 * @param {string} [path] The path for which the GET will act on, parametrized with :
 * @param {function} [callback] The function with request and response pair that runs when the endpoint is hit
 */
app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });

  // Initialize the creation of roomParticipantsMap and roomHostsMap
  if (!roomHostsMap[req.params.room]) {
    roomParticipantsMap[req.params.room] = [];
    roomHostsMap[req.params.room] = null;
  }
});

/**
 * GET /:room/close : Route that shuts down the server when hit
 *
 * @event app#get
 * @param {string} [path] The path for which the GET will act on, parametrized with :
 * @param {function} [callback] The function with request and response pair that runs when the endpoint is hit
 */
app.get('/:room/close', (req, res) => {
  server.close();
  peerServer.close();
  res.send('Http closed');
});

/**
 * Handles setting up initial server-side functions for new socket.io connections that it picks up.
 *
 * @method
 * @param {string} [label] Label of the signal that io picks up
 * @param {function} [callback] Function that acts on a connecting socket that is called when hit
 * @event io#on
 * @listens io#connect
 */
io.on('connection', (socket) => {
  /**
   * Handles when a client socket calls join-room.
   *
   * @param {string} [label] Label of the signal that io picks up
   * @param {function} [callback] Function that acts on a connecting socket that is called when hit
   * @listens socket#emit
   */
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);

    // Add anyone who joins the room to the roomParticipantsMap
    roomParticipantsMap[roomId].push(userId);

    // first person to join the room is assumed to be the host
    if (roomHostsMap[roomId] === null) {
      roomHostsMap[roomId] = userId;
    }
    // Broadcast to all existing clients in the room that a user has connected
    socket.to(roomId).emit('user-connected', userId);

    /**
     * Handles when a client socket sends a text message signal.
     *
     * @param {string} [label] Label of the signal that io picks up
     * @param {function} [callback] Function that acts on a connecting socket that is called when hit
     * @listens socket#emit
     */
    socket.on('message', (message) => {
      // Send message to the same room
      io.to(roomId).emit('createMessage', message);
    });

    /**
     * Handles when a client socket sends a mute-all signal.
     *
     * @param {string} [label] Label of the signal that io picks up
     * @param {function} [callback] Function that acts on a connecting socket that is called when hit
     * @listens socket#emit
     */
    socket.on('muteAllUsers', (userId, roomId) => {
      // check if
      if (roomHostsMap[roomId].includes(userId)) {
        io.to(roomId).emit('muteAll', userId);
      }
    });

    /**
     * Handles when a client socket sends a disconnect signal.
     *
     * @param {string} [label] Label of the signal that io picks up
     * @param {function} [callback] Function that acts on a connecting socket that is called when hit
     * @listens socket#emit
     */
    socket.on('disconnect', () => {
      socket.to(roomId).emit('user-disconnected', userId);

      // remove participant from the room's map
      const index = roomParticipantsMap[roomId].indexOf(userId);
      roomParticipantsMap[roomId].splice(index, 1);

      // if the user is host, then assign a random person in the participants as the host
      if (roomParticipantsMap[roomId].length > 0 && roomHostsMap[roomId].includes(userId)) {
        const randomElement =
          roomParticipantsMap[roomId][Math.floor(Math.random() * roomParticipantsMap[roomId].length)];
        roomHostsMap[roomId] = randomElement;
      }
    });
  });
});

/**
 * Makes the app server listen to requests to the given port
 *
 * @method
 * @param {number} [port] The port number to listen to requests from
 * @event server#listen
 */
server.listen(process.env.PORT || 3030);
/**
 * Makes the peer server listen to requests to the given port
 *
 * @method
 * @param {number} [port] The port number to listen to requests from
 * @event peerServer#listen
 */
peerServer.listen(process.env.PEER_PORT || 3001);

/* Needed for testing purposes */
module.exports = { app, io };
