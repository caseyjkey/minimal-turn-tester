/*
 *  Copyright (c) 2015 The WebRTC project authors. All Rights Reserved.
 *
 *  Use of this source code is governed by a BSD-style license
 *  that can be found in the LICENSE file in the root of the source
 *  tree.
 */

'use strict';

let begin;
let pc;
let candidates;
let jsonCreds;
let servers = [];
let server;
let result = [];

const allServersKey = 'servers';

/* Fetch TURN jsonCreds from API */

async function getServerCreds() {
  return new Promise(function (resolve, reject) {
    var request = new XMLHttpRequest();
    request.open('GET', 'http://lvh.me:3000/giveMeCredentials', true);
    request.onload = function() {
      var data = JSON.parse(this.response);
      if (request.status == 200) {
        resolve(data);
      } else {
        reject(request.status);
      }

    }
    request.send();
  });
}

let creds = async () => {
  try {
    return getServerCreds();
  } catch(error) {
    console.log("Error fetching creds: ", error);
  }


}

/* End of Fetching Credentials */

async function start(servers) {
  try {
    jsonCreds = await getServerCreds();
  } catch(error) {
    console.log("Error! Do you have the cred-gen API running? ", error);
  }

  for (let i = 0; i < servers.length; i++) {
    await testServer(servers[i]);
    candidates = [];
  }

  return await new Promise((resolve, reject) => {
    let id = setInterval(() => {
      if (result.length == servers.length) {
        resolve(result);
        clearInterval(id);
      }
    }, 1000);
  });
}



// Initiates a PeerConnection with the servers and returns an array of boolean connection results
// Each server expected to be of this format: "turn:54.188.208.196:443"
// @param servers [Array]
// @return [Array] 
async function testServer(protoIpPort) {
  server = protoIpPort;

  const iceServer = {
    urls: [server],
    username: jsonCreds.username,
    credential: jsonCreds.password,
  }


  let iceTransports = 'all';

  // Create a PeerConnection with no streams, but force a m=audio line.
  const config = {
    iceServers: [iceServer],
    iceTransportPolicy: iceTransports,
    iceCandidatePoolSize: 10
  };

  const offerOptions = {offerToReceiveAudio: 1};
  // Whether we gather IPv6 candidates.
  // Whether we only gather a single set of candidates for RTP and RTCP.

  console.log(`PeerConnection created with config=${JSON.stringify(config)}`);
  pc = new RTCPeerConnection(config);

  pc.onicecandidate = iceCallback;
  pc.onicegatheringstatechange = gatheringStateChange;
  pc.onicecandidateerror = iceCandidateError;
  pc.createOffer(
      offerOptions
  ).then(
      gotDescription,
      noDescription
  );

  return new Promise((resolve, reject) => {
    let id = setInterval(() => {
      if (pc === null) {
        resolve();
        clearInterval(id);
      }
    }, 1000);
  })
}

function iceCallback(event) {
  if (event.candidate) {
    if (event.candidate.candidate === '') {
      // End of candidate generation
      return;
    }
    const {candidate} = event;
    candidates.push(candidate);
  } else if (!('onicegatheringstatechange' in RTCPeerConnection.prototype)) {
    // this doesn't execute because we have icegatheringstatechange callback.
    let serverResponse = getFinalResult();
    result.push(serverResponse);
    pc.close();
    pc = null;
  }
}

// Try to determine authentication failures and unreachable TURN
// servers by using heuristics on the candidate types gathered.
function getFinalResult() {
  let connResult = 'Connection Complete';

  // get the candidates types (host, srflx, relay)
  const types = candidates.map(function(cand) {
    return cand.type;
  });

  // If the server is a TURN server we should have a relay candidate.
  // If we did not get a relay candidate but a srflx candidate
  // authentication might have failed.
  // If we did not get  a relay candidate or a srflx candidate
  // we could not reach the TURN server. Either it is not running at
  // the target address or the clients access to the port is blocked.
  //
  // This only works for TURN/UDP since we do not get
  // srflx candidates from TURN/TCP.
  if (server.indexOf('turn:') === 0 &&
    server.indexOf('?transport=tcp') === -1) {
    if (types.indexOf('relay') === -1) {
      if (types.indexOf('srflx') > -1) {
        // a binding response but no relay candidate suggests auth failure.
        connResult = 'Authentication failed?';
      } else {
        // either the TURN server is down or the clients access is blocked.
        connResult = 'Not reachable?';
      }
    }
  } else {
    // Check to see if srflx candidate was not found
    if (types.indexOf('srflx') === -1) {
      connResult = 'Connection failed.';
    }
  }

  connResult = server + ': ' + connResult;
  return connResult;
}

function gatheringStateChange() {
  if (pc.iceGatheringState !== 'complete') {
    return;
  }
  let serverResponse = getFinalResult();
  result.push(serverResponse);
  servers.shift();
  if (servers.length == 0) {
    pc.close();
    pc = null;
  }
}

function iceCandidateError(e) {
  // console.log("ice candidate error", server);
  // The interesting attributes of the error are
  // * the url (which allows looking up the server)
  // * the errorCode and errorText
  document.getElementById('error-note').style.display = 'block';
  document.getElementById('error').innerText += 'The server ' + e.url +
    ' returned an error with code=' + e.errorCode + ':\n' +
    e.errorText + '\n';
}

function gotDescription(desc) {
  begin = window.performance.now();
  candidates = [];
  pc.setLocalDescription(desc);
}

function noDescription(error) {
  console.log('Error creating offer: ', error);
}


// check if we have getUserMedia permissions.
navigator.mediaDevices
    .enumerateDevices()
    .then(function(devices) {
      devices.forEach(function(device) {
        if (device.label !== '') {
          document.getElementById('getUserMediaPermissions').style.display = 'block';
        }
      });
    });

( async () => console.log(await start(["turn:54.188.208.196:443", "stun:54.188.208.196:443"])))();