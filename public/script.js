/*
 * Copyright (C) 2022 Kraft, Royapally, Sarthi, Ramaswamy, Maduru, Harde, Gomes, Bellam, Reddy, Craine, Gupta - All Rights Reserved
 * You may use, distribute and modify this code under the
 * terms of the MIT license that can be found in the LICENSE file or
 * at https://opensource.org/licenses/MIT.
 * You should have received a copy of the MIT license with
 * this file. If not, please write to: develop.nak@gmail.com, or visit https://github.com/SiddarthR56/spark/blob/main/README.md.
 */

/**
 * Logic for setting and starting up the client-side of Spark, which includes room controls
 * for both broadcasting and the individual, as well as hand gesture handling
 *
 * Dependencies are provided by room.ejs through CDN links and direct links.
 *
 * @requires mediapipe (camera_utils, control_utils, drawing_utils, hands)
 * @requires peer
 * @requires socket.io
 * @requires hand_gesture (Spark's hand_gesture.js file)
 * @requires server (Spark's server.js file)
 */

/**
 * The client-side socket object that will connect to the server
 *
 * @type {Object}
 * @param {string} [path] Endpoint to connect to the associated server where io.connect is
 * @const
 * @method
 *
 * @event io#connect
 * @listens socket#on
 * @fires socket#emit
 */
const socket = io.connect('/');
/**
 * The grid of local and remote video objects representing the video of all peers.
 *
 * @const
 */

const videoGrid = document.getElementById('video-grid');

/**
 * Instance of the client-side peer with which to communicate with other peers.
 *
 * @type {Object}
 * @constructor
 * @param {string} [id] Other peers can connect to this peer using the provided ID. If no ID is given, one will be generated by the brokering server.
 * @param {Object} [options] Options for setting up the peer connection; required
 * @listens myPeer#on
 */
var myPeer = null;

/**
 * Reference to the local video stream for the client.
 *
 * @type {Object}
 */

let myVideoStream;

/**
 * Reference to the created (local) video object
 *
 * @const
 */
const myVideo = document.createElement('video');

// Mute video by default
myVideo.muted = true;
var isBreakout = false;
var connectedUsers = [];

/**
 * Container for all connected peers in the room.
 *
 * @const
 */
const peers = {};
/**
 * Reference to the most recently connected peer.
 *
 * @type {Object}
 */
var currentPeer = null;

/**
 * Boolean for toggling whether or not gestures are enabled. Default disabled.
 *
 * @type {boolean}
 */
var gesturesEnabled = false;

// Prompts the user for access to the video camera and audio. Once permitted,
// will fire off the rest of the startup event listeners for the client
navigator.mediaDevices
  .getUserMedia({
    video: true,
    audio: true,
  })
  .then((stream) => {
    myVideoStream = stream; // Saves the stream that was permitted to use to the local stream ref
    addVideoStream(myVideo, stream); // Adds the local video object to the video grid

    const hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      },
    });
    /**
     * Sets other explicit configs for how the hands will detect gestures.
     *
     * @method
     * @param {Object} [options] Options object to set
     * @event hands#setOptions
     */
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.8,
      minTrackingConfidence: 0.7,
    });
    /**
     * Sets up the onResults callback function.
     *
     * @method
     * @param {function} [callback] The callback function to pass gesture results to
     * @event hands#onResults
     */
    hands.onResults(onGestureAction);

    /**
     * Instantiates the mediapipe camera object to read off the local video HTML element.
     *
     * @const
     * @constructor
     * @param {Object} [videoObject] Video object to process frame-by-frame operations on
     * @param {Object} [options] Options for how the camera will interact with (or modify) the videoObject on start
     * @fires camera#start
     */
    const camera = new Camera(myVideo, {
      onFrame: async () => {
        if (gesturesEnabled) await hands.send({ image: myVideo });
      },
      width: myVideo.videoWidth,
      height: myVideo.videoHeight,
    });
    /**
     * Triggers the camera to start interacting with (or modifying) the video object based on provided options.
     *
     * @event camera#start
     */
    camera.start();

    myPeer = new Peer(undefined, {
      config: { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] },
      path: '/peerjs', // Points to server.js /peerjs endpoint
      host: '/', // This means it points to localhost
      port: '3001', // Points to {host}:3001
    });

    /**
     * Handles what happens when a new peer uses call().
     *
     * @event myPeer#on
     */
    myPeer.on('call', (call) => {
      // Answer the call with the stream object for process
      call.answer(stream);
      // Sets the newly connected peer to the currentPeer var
      currentPeer = call;
      // Create the new video HTML element for the peer
      const video = document.createElement('video');
      // When the newly connecting peer recieves the answer from other peers,
      // tell it to add to their video element to the grid. Effectively
      // makes it work for >2 peers
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
      // However, the above event listener won't work if there were other peers
      // that joined before it. So we need to include the remaining logic from
      // connectToNewUser() function to ensure the peers object is kept up
      // to date across everyone in the same room
      call.on('close', () => {
        videoGrid.removeChild(video);
        video.remove();
      });
      peers[call['peer']] = call;
    });

    /**
     * Handles what happens when 'user-connected' is recieved from server.
     *
     * @event socket#on
     */
    socket.on('user-connected', (userId) => {
      // if (!connectedUsers.includes(userId)) {
      console.log('user Joined');
      connectToNewUser(userId, stream);
      // connectedUsers.push(userId);
      // }
    });

    /**
     * Handles what happens when a new peer connects.
     *
     * @event myPeer#on
     */
    myPeer.on('open', (id) => {
      console.log('Opened');
      userId = id; // Sets the userId with the peer's unique internal ID
      socket.emit('join-room', ROOM_ID, id);
    });

    // input value fetched by jQuery
    let text = $('input');
    // When a key is pressed when sending a non-empty chat message
    $('html').keydown(function (e) {
      console.log(text.val());
      // Checks to see if the key is enter, and if it is, it emits the message to server
      if (e.which == 13 && text.val().length !== 0) {
        socket.emit('message', text.val());
        text.val('');
      }
    });

    /**
     * Handles what happens when it recieves 'createMessage' from the server.
     *
     * @event socket#on
     */
    socket.on('createMessage', (message) => {
      console.log(message);
      $('ul').append(`<li class="message"><b>user</b><br/>${message}</li>`);
      scrollToBottom();
    });

    /**
     * Handles what happens when it recieves 'muteAll' from the server.
     * Effectively just runs the mute code.
     *
     * @event socket#on
     */
    socket.on('muteAll', () => {
      myVideoStream.getAudioTracks()[0].enabled = false;
      setUnmuteButton();
    });

    socket.on('joinBreakOutRoom', (participantBreakOutRoomMap, roomHostsMap) => {
      for (let eachUserId in peers) {
        console.log('removing peers');
        peers[eachUserId].close();
      }
      if (roomHostsMap[ROOM_ID] != userId) {
        console.log('trying to join room:', participantBreakOutRoomMap[userId]);
        const toRoom = participantBreakOutRoomMap[userId];
        socket.emit('join-room', toRoom, userId);
      } else {
        for (let eachUserId in peers) {
          console.log('removing peers');
          peers[eachUserId].close();
        }
      }
    });

    socket.on('exitBreakRoom', (toRoom, roomMapings) => {
      console.log('mps:', roomMapings);
      [roomHostsMap, roomParticipantsMap] = roomMapings;
      for (let eachUserId in peers) {
        console.log('removing peers');
        peers[eachUserId].close();
      }
      console.log('');
      if (roomHostsMap[toRoom] != userId) {
        for (let i = 0; i < videoGrid.children.length; i++) {
          videoGrid.removeChild(videoGrid.childNodes[i]);
        }
        console.log('joining back room: ', toRoom);

        // socket.emit('join-room', toRoom, userId);
        connectToNewUser(roomHostsMap[toRoom], stream);
        console.log('mroomParticipantsMap:', roomParticipantsMap);
        toConnectPeers = roomParticipantsMap[toRoom];
        console.log('to connect peers', roomParticipantsMap[toRoom]);
        for (let eachUserId in toConnectPeers) {
          if (toConnectPeers[eachUserId] != userId) {
            console.log('cnt:', toConnectPeers[eachUserId]);
            connectToNewUser(toConnectPeers[eachUserId], stream);
          }
        }
        console.log('peers', peers);
      }
    });
  });

/**
 * Handles what happens when 'user-disconnected' is recieved from server.
 * Just calls close on the right peers user ID.
 * @event socket#on
 */
socket.on('user-disconnected', (userId) => {
  console.log('disconnection of user: ' + userId);
  if (peers[userId]) peers[userId].close();
});

/**
 * Uses peer.js to add a new peer, along with setting up the
 * listeners for "this" client.
 *
 * @function
 * @param {string} userId User (socket) ID of the new user
 * @param {Object} stream Video stream to add to "this" client's video grid
 */
function connectToNewUser(userId, stream) {
  const call = myPeer.call(userId, stream);
  console.log(call);
  console.log(myPeer);
  const video = document.createElement('video');
  call.on('stream', (userVideoStream) => {
    addVideoStream(video, userVideoStream);
    console.log('user Joined and video added');
  });
  call.on('close', () => {
    videoGrid.removeChild(video);
    video.remove();
  });
  peers[userId] = call;
}

/**
 * Sends the 'filetransfer' signal to the server along with the byte data
 * of the file that was chosen to be submitted by the user.
 *
 * @function
 * @param {Object} event The event object that holds the file data to transfer
 */
document.getElementById('filetransfer').onchange = function (event) {
  var files = event.target.files;
  var filename = files[0].name;
  var extension = files[0].type;

  const blob = new Blob(event.target.files);
  var file = {
    filename: filename,
    extension: extension,
    blob: blob,
  };
  socket.emit('filetransfer', file);
};

/**
 * Handles what happens when 'downloadFile' is recieved from server.
 * Uses DOM manipulation that will trigger the browser to download
 * the recieved blob.
 *
 * @event socket#on
 */
socket.on('downloadFile', (blob) => {
  var blobUrl = URL.createObjectURL(
    new Blob([new Uint8Array(blob.blob).buffer], {
      type: blob.extension,
    })
  );

  // Create a link element
  var link = document.createElement('a');
  var li = document.createElement('li');

  // Set link's href to point to the Blob URL
  link.href = blobUrl;
  link.download = blob.filename;
  li.append(link);
  $('ul').append(li);

  scrollToBottom();
  link.click();
});

/**
 * Adds a new video to the client's video grid, and forcing the stream of the video to play.
 *
 * @function
 * @param {Object} video
 * @param {Object} stream
 */
function addVideoStream(video, stream) {
  console.log('Video adding');
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

/**
 * Scrolls to the bottom of the chat container HTML element
 * to show the latest chat message.
 *
 * @function
 */
const scrollToBottom = () => {
  var d = $('.main__chat_window');
  d.scrollTop(d.prop('scrollHeight'));
};

/**
 * Utilizes DOM manipulation to toggle the chat section of the room.
 *
 * @function
 */
const toggleChat = () => {
  const hideChat = `
  <i class="fas fa-comment-slash"></i>
  <span>Chat</span>
  `;

  const ShowChat = `
  <i class="fas fa-comment"></i>
  <span>Chat</span>
  `;

  var x = document.getElementById('chat_container');
  if (x.style.display === 'none') {
    x.style.display = 'block';
    document.querySelector('.main__chat_button').innerHTML = ShowChat;
  } else {
    x.style.display = 'none';
    document.querySelector('.main__chat_button').innerHTML = hideChat;
  }
};

/**
 * Utilizes DOM manipulation to display the mute button
 * on the mute/unmute button container.
 *
 * @function
 */
const setMuteButton = () => {
  const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
};

/**
 * Utilizes DOM manipulation to display the unmute button
 * on the mute/unmute button container.
 *
 * @function
 */
const setUnmuteButton = () => {
  const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
  document.querySelector('.main__mute_button').innerHTML = html;
};

/**
 * Utilizes DOM manipulation to display the ExitBreakout button
 * on the breakoutRoom/exitBreakout button container.
 *
 * @function
 */
const setExitBreakoutRoom = () => {
  const html = `
  <i class="exitBreakoutRoom fa fa-window-close"></i>
  <span>Exit Breakout Rooms</span>
  `;
  document.querySelector('.main__breakoutrooms__button').innerHTML = html;
};

const setBreakoutRoom = () => {
  const html = `
  <i class="fa fa-arrows"></i>
  <span>Breakout Rooms</span>
  `;
  document.querySelector('.main__breakoutrooms__button').innerHTML = html;
};

/**
 * Utilizes DOM manipulation to display the stop video button
 * on the video show/stop button container.
 *
 * @function
 */
const setStopVideo = () => {
  const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
};

/**
 * Utilizes DOM manipulation to display the show video button
 * on the video show/stop button container.
 *
 * @function
 */
const setPlayVideo = () => {
  const html = `
  <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
  document.querySelector('.main__video_button').innerHTML = html;
};

/**
 * Utilizes DOM manipulation to display the enable gesture button
 * on the gesture enable/disable button container.
 *
 * @function
 */
const setEnableGestures = () => {
  const html = `
    <i class="far fa-hand-paper"></i>
    <span>Enable Gestures</span>
  `;
  document.querySelector('.main__gestures__button').innerHTML = html;
};

/**
 * Utilizes DOM manipulation to display the disable gesture button
 * on the gesture enable/disable button container.
 *
 * @function
 */
const setDisableGestures = () => {
  const html = `
    <i class="fas fa-hand-paper"></i>
    <span>Disable Gestures</span>
  `;
  document.querySelector('.main__gestures__button').innerHTML = html;
};

/**
 * Toggles the mute and unmute of the video stream, along with setting
 * the mute and unmute button by calling their defined functions.
 *
 * @function
 */
const muteUnmute = () => {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnmuteButton();
  } else {
    setMuteButton();
    myVideoStream.getAudioTracks()[0].enabled = true;
  }
};

const breakoutUnbreakout = (userId, ROOM_ID, numRooms) => {
  if (isBreakout) {
    console.log('trying to exit breakoutrooms');
    setBreakoutRoom();
    socket.emit('exitBreakoutRooms', userId, ROOM_ID);
    isBreakout = false;
  } else {
    console.log('creating breakout rooms');
    socket.emit('createBreakoutRooms', userId, ROOM_ID, numRooms);
    setExitBreakoutRoom();
    isBreakout = true;
  }
};

/**
 * Toggles the show and hide of the video stream, along with setting
 * the show and hide video buttons by calling their defined functions.
 * It does this by using the myVideo pause() and play() functions from
 * HTMLVideoElement to manipulate video state.
 *
 * @function
 */
const playStop = () => {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideo.pause();
    myVideo.currentTime = 0;
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myVideo.play();
    setStopVideo();
    myVideoStream.getVideoTracks()[0].enabled = true;
  }
};

/**
 * Toggles the detection of gestures in the video stream, along with setting
 * the enable and disable buttons by calling their defined functions.
 *
 * @function
 */
const toggleGesture = () => {
  if (gesturesEnabled) {
    setEnableGestures();
    gesturesEnabled = false;
  } else {
    setDisableGestures();
    gesturesEnabled = true;
  }
};

/**
 * Boolean for determining if a screen is being shared or not.
 *
 * @type {boolean}
 */
var screenSharing = false;

/**
 * Reference object of the screen sharing video stream.
 *
 * @type {Object}
 */
var screenStream;

/**
 * Changes your video to point to point to your screen sharing video that's prompted.
 * If permitted, it will change your video stream to the screen sharing stream you are
 * doing for all peers that are connected to you.
 * If stopping screen share, see stopScreenSharing function.
 *
 * @function
 */
function startScreenShare() {
  if (screenSharing) {
    stopScreenSharing();
  }
  navigator.mediaDevices.getDisplayMedia({ video: true }).then((stream) => {
    screenStream = stream;
    let videoTrack = screenStream.getVideoTracks()[0];
    videoTrack.onended = () => {
      stopScreenSharing();
    };
    if (myPeer) {
      /* TODO: Change this to not just be for the currentPeer var, but for all peers */
      let sender = currentPeer.peerConnection.getSenders().find(function (s) {
        return s.track.kind == videoTrack.kind;
      });
      sender.replaceTrack(videoTrack);
      screenSharing = true;
    }
    console.log(screenStream);
  });
}

/**
 * Replaces the video stream of the screen sharing to be video stream of the user
 * who stopped the screen sharing.
 *
 * @function
 */
function stopScreenSharing() {
  if (!screenSharing) return;
  let videoTrack = myVideoStream.getVideoTracks()[0];
  if (myPeer) {
    /* TODO: Change this to not just be for the currentPeer var, but for all peers */
    let sender = currentPeer.peerConnection.getSenders().find(function (s) {
      return s.track.kind == videoTrack.kind;
    });
    sender.replaceTrack(videoTrack);
  }
  screenStream.getTracks().forEach(function (track) {
    track.stop();
  });
  screenSharing = false;
}

/// Below are the setting of click event listeners on the corresponding HTML elements for various functionality ///

document.getElementById('mute').addEventListener('click', () => {
  muteUnmute();
});

document.getElementById('playStop').addEventListener('click', () => {
  playStop();
});

document.getElementById('chatButton').addEventListener('click', () => {
  toggleChat();
});

document.getElementById('muteAll').addEventListener('click', () => {
  socket.emit('muteAllUsers', userId, ROOM_ID);
});

document.getElementById('gestureButton').addEventListener('click', () => {
  console.log('gesture click');
  toggleGesture();
});

document.getElementById('breakoutrooms').addEventListener('click', () => {
  numRooms = document.getElementById('numRooms').value;
  console.log('Number of rooms:', numRooms);
  breakoutUnbreakout(userId, ROOM_ID, numRooms);
});

var screenShare = document.getElementById('share-screen');
screenShare.addEventListener('click', () => {
  if (screenSharing) {
    stopScreenSharing();
  } else {
    startScreenShare();
  }
});

/**
 * Callback for the Hands onResults event to see what gestures
 * came out of that and how to map those gestures to certain room controls.
 *
 * @param {Object} results The hand detection results
 */
function onGestureAction(results) {
  var gesture = onResults(results);
  switch (gesture) {
    case Gesture.RightSwipe:
      {
        // Right swipe means to start screen sharing
        console.log('start share');
        startScreenShare();
      }
      break;
    case Gesture.LeftSwipe:
      {
        // Left swipe means to stop screen sharing
        console.log('end share');
        stopScreenSharing();
      }
      break;
    case Gesture.All5Fingers:
      {
        // Does nothing... for now
      }
      break;
    case Gesture.ThumbsUp:
      {
        // Thumbs up unmutes audio
        console.log('unmute audio');
        muteUnmute();
      }
      break;
    case Gesture.ThumbsDown:
      {
        // Thumbs down mutes audio
        console.log('mute audio');
        muteUnmute();
      }
      break;
    default: {
      // Any other gesture does nothing... for now
    }
  }
}
