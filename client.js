/* eslint-disable no-unused-vars */

var divSelectRoom = document.getElementById("selectRoom");
var divConsultingRoom = document.getElementById("consultingRoom");
var divConsultingRoomwSharing = document.getElementById("consultingRoomwSharing");
var divConsultingControls = document.getElementById("consultingControls");
var inputRoomNumber = document.getElementById("roomNumber");
var btnGoRoom = document.getElementById("goRoom");
var localVideo = document.getElementById("localVideo");
var remoteVideo = document.getElementById("remoteVideo");
var screenVideo = document.getElementById('screen-sharing');
var toggleButton = document.getElementById('toggle-cam');
var toggleMic = document.getElementById('toggle-mic');
var toggleGesture = document.getElementById('gestures');
var screenShare = document.getElementById('screen-share');

var roomNumber;
var localStream;
var remoteStream;
var screenStream;
var rtcPeerConnection;
var peerScreenConnection;
var iceServers = {
    'iceServers': [
        { 'urls': 'stun:stun.services.mozilla.com' },
        { 'urls': 'stun:stun.l.google.com:19302' }
    ]
}

var streamConstraints = { audio: true, video: true };
var isCaller;
var startedStream;
const senders = [];

var socket = io();

function onGestureAction(results) {
    var gesture = onResults(results)
    switch(gesture) {
        case Gesture.RightSwipe: {
            start_share();
        } break;
        case Gesture.LeftSwipe: {
            end_share();
        } break;
        case Gesture.All5Fingers: {
            //pass
        } break;
        case Gesture.ThumbsUp: {
            const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
            unmute(audioTrack);
        } break;
        case Gesture.ThumbsDown: {
            const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
            mute(audioTrack);
        } break;
        default:{
            //pass
        }
    }
}

btnGoRoom.onclick = function () {
    if (inputRoomNumber.value === '') {
        console.log("Please type a room number")
    } else {
        roomNumber = inputRoomNumber.value;
        console.log("Room number " + roomNumber + " gathered");
        console.log('connect socket id:' + `${socket.id}`);
        socket.emit("create or join", roomNumber);
        divConsultingRoom.style = "display: block;";
        divConsultingControls.style = "display: block;"

        //Hand Gesture
        const hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.8,
            minTrackingConfidence: 0.7
        });

        hands.onResults(onGestureAction);

        const camera = new Camera(localVideo, {
            onFrame: async () => {
                await hands.send({ image: localVideo });
            },
            width: 640,
            height: 320
        });
        camera.start();
    }
};

socket.on('connect', function () {
    console.log("Connection acheived.");
    console.log(socket.id);
});

socket.on('created', function (room) {
    console.log("You are the first one in the room. Room created.")
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        isCaller = true;
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

toggleButton.addEventListener('click', () => {
    const videoTrack = localStream.getTracks().find(track => track.kind === 'video');
    if (videoTrack.enabled) {
        videoTrack.enabled = false;
        toggleButton.innerHTML = "Show cam"
    } else {
        videoTrack.enabled = true;
        toggleButton.innerHTML = "Hide cam"
    }
});

toggleMic.addEventListener('click', () => {
    const audioTrack = localStream.getTracks().find(track => track.kind === 'audio');
    if (audioTrack.enabled) {
        mute(audioTrack);
    } else {
        unmute(audioTrack);
    }
});

toggleGesture.addEventListener('click', () => {
    if (gesturesEnabled == true) {
        disable_gestures();
    } else {
        enable_gestures();
    }
});

screenShare.addEventListener('click', () =>{

    if(document.getElementById('consultingRoomwSharing').style.cssText == "display: block;"){
        end_share();
    } else {
        start_share();
    }

});

function mute(audioTrack) {
    audioTrack.enabled = false;
    toggleMic.innerHTML = "Unmute microphone"
}

function unmute(audioTrack) {
    audioTrack.enabled = true;
    toggleMic.innerHTML = "Mute microphone"
}

function end_share() {
    console.log("Ending screen share.")
    screenShare.innerHTML = "Share Screen";
    divConsultingRoomwSharing.style = "display: none";
    remoteVideo.className = "video-large";
    senders.find(sender => sender.track.kind === 'video').replaceTrack(localStream.getTracks()[1])
    startedStream = false;
}

function start_share() {
    console.log("Beginning screen share.");
    screenShare.innerHTML = "Stop Sharing";
    console.log("screen sharing chain enabled");

    remoteVideo.className = "video-small";
    divConsultingRoomwSharing.style = "display: block;";

    navigator.mediaDevices.getDisplayMedia({video: {cursor: "always"}, audio: false })
    .then(function (stream) {
        const screenTrack = stream.getTracks()[0];
        screenVideo.srcObject = stream;
        startedStream = true;
        senders.find(sender => sender.track.kind === 'video').replaceTrack(screenTrack)

    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });

    console.log("screen sharing has begun");
}

function disable_gestures() {
    console.log("Disabling gestures.")
    gesturesEnabled = false; 
    toggleGesture.innerHTML = "Enable Gestures";
}

function enable_gestures() {
    console.log("Enabling gestures.")
    gesturesEnabled = true; 
    toggleGesture.innerHTML = "Disable Gestures";
}

socket.on('joined', function (room) {
    console.log("You are joining an existing room. Room joined.")
    navigator.mediaDevices.getUserMedia(streamConstraints).then(function (stream) {
        localStream = stream;
        localVideo.srcObject = stream;
        socket.emit('ready', roomNumber);
    }).catch(function (err) {
        console.log('An error ocurred when accessing media devices', err);
    });
});

socket.on('candidate', function (event) {
    var candidate = new RTCIceCandidate({
        sdpMLineIndex: event.label,
        candidate: event.candidate
    });
    rtcPeerConnection.addIceCandidate(candidate);
});

socket.on('ready', function () {
    if (isCaller) {
        console.log("Attempting to access video log of joined user.")
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        localStream.getTracks().forEach(track => senders.push(rtcPeerConnection.addTrack(track, localStream)));
        rtcPeerConnection.createOffer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('offer', {
                    type: 'offer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('offer', function (event) {
    if (!isCaller) {
        rtcPeerConnection = new RTCPeerConnection(iceServers);
        rtcPeerConnection.onicecandidate = onIceCandidate;
        rtcPeerConnection.ontrack = onAddStream;
        localStream.getTracks().forEach(track => senders.push(rtcPeerConnection.addTrack(track, localStream)));
        rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
        rtcPeerConnection.createAnswer()
            .then(sessionDescription => {
                rtcPeerConnection.setLocalDescription(sessionDescription);
                socket.emit('answer', {
                    type: 'answer',
                    sdp: sessionDescription,
                    room: roomNumber
                });
            })
            .catch(error => {
                console.log(error)
            })
    }
});

socket.on('answer', function (event) {
    rtcPeerConnection.setRemoteDescription(new RTCSessionDescription(event));
});

socket.on('disconnect', function () {
    console.log('disconnected to server');
});

socket.on('full', function () {
    console.log('Room is full. You can not enter this room right now.');
});

function onIceCandidate(event) {
    console.log(event)
    if (event.candidate) {
        console.log('sending ice candidate');
        socket.emit('candidate', {
            type: 'candidate',
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
            room: roomNumber
        })
    }
}

function onAddStream(event) {
    remoteVideo.srcObject = event.streams[0];
    remoteStream = event.stream;
}
