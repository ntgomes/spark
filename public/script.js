
const socket = io.connect('/');


const videoGrid = document.getElementById('video-grid');


const myPeer = new Peer(undefined, {
  config: { iceServers: [{ url: 'stun:stun.l.google.com:19302' }] },
  path: '/peerjs', // Points to server.js /peerjs endpoint
  host: '/', // This means it points to localhost
  port: '3001', // Points to {host}:3001
});



let myVideoStream;


const myVideo = document.createElement('video');

// Mute video by default
myVideo.muted = true;


const peers = {};


var currentPeer = null;


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
      // When the connecting peer recieves the answer from other peers
      // tell them to add to their video element to the grid. Effectively
      // makes it work for >2 peers
      call.on('stream', (userVideoStream) => {
        addVideoStream(video, userVideoStream);
      });
    });

    /**
     * Handles what happens when 'user-connected' is recieved from server.
     *
     * @event socket#on
     */
    socket.on('user-connected', (userId) => {
      console.log('user Joined');
      connectToNewUser(userId, stream);
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
  });

/**
 * Handles what happens when 'user-disconnected' is recieved from server.
 * Just calls close on the right peers user ID.
 * @event socket#on
 */
socket.on('user-disconnected', (userId) => {
  if (peers[userId]) peers[userId].close();
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


document.getElementById('filetransfer').onchange = function(event) {
  var files = event.target.files
   var filename = files[0].name
   var extension = files[0].type

  const blob = new Blob(event.target.files);
  var file = {
    "filename":filename,
    "extension":extension,
    "blob":blob
  };
  socket.emit('filetransfer',file);
}

socket.on('downloadFile',(blob)=>{
  console.log(
   blob
  );

  var blobUrl = URL.createObjectURL(new Blob([new Uint8Array(blob.blob).buffer],{
    "type":blob.extension
  }));

  // Create a link element
  var link = document.createElement("a");
  var li=document.createElement("li");

  // Set link's href to point to the Blob URL
  link.href = blobUrl;
  link.download = blob.filename;
  li.append(link);
  $('ul').append(li);

      scrollToBottom();
      link.click();
  

});






function addVideoStream(video, stream) {
  console.log('Video adding');
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}


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

/**
 * Toggles the show and hide of the video stream, along with setting
 * the show and hide video buttons by calling their defined functions.
 *
 * @function
 */
const playStop = () => {
  console.log('object');
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
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

