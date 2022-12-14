const View = millicast.View
//millicast.View = new millicast.View({events:["active, inactive", "vad", "layers"]});//
const Director = millicast.Director
const Logger = millicast.Logger
window.Logger = Logger
Logger.setLevel(Logger.DEBUG);


// Multiplexing Viewer
//Create viewer

//IF ADDED MUTE BUTTON ADDED
function toggleMute(){
  video.muted = !video.muted;
  if (!video.muted){
  audioBtn.style.visibility = 'hidden';

  }
}

//Get our url
const href = new URL(window.location.href);
//Get or set Defaults
const url = !!href.searchParams.get("url")
let params = new URLSearchParams(document.location.search.substring(1));
let id = params.get('streamId');
let split = id.split('/');
let streamAccountId = split[0];
let streamName = split[1];
let subToken = params.get('token');// SubscribingToken - placed here for ease of testing, should come from secure location. (php/nodejs)
//let subToken ="91c023159feb950e07c1fde7ab6ba5df95d1b3441d4a4e88d";//EXAMPLE


let changeStream=streamName;
let sourceId = "1";
const pinnedSourceId = "1";
//const streamId = streamName+"&sourceId=" + sourceId;
const streamId = streamName;
console.log (streamName, streamAccountId, streamId, sourceId);
const options ={
  sourceId: sourceId,
  disableVideo: false,
  disableAudio: false,
  bandwidth: 0,
  dtx: true,

}

/*
if(connection.effectiveType >= '4g') {

 changeStream = changeStream + "_high";
}
if(connection.effectiveType === 'slow-2g') {

 changeStream = changeStream +"_low";
}
console.log(connection.effectiveType);
*/
/*
switch(connection.type) {
        case connection.CELL_3G:
        connectionBand = 'Medium Bandwidth';
        changeStream = changeStream;

            
        break;
        case connection.CELL_2G:
            connectionBand = 'Low Bandwidth';
             changeStream = changeStream+"mobile";
             break;
        default:
            connectionBand = 'High Bandwidth';
              changeStream = changeStream + "_HD";           
    }

console.log(changeStream);
*/
const disableVideo = href.searchParams.get("disableVideo") === "true";
const disableAudio = href.searchParams.get("disableAudio") === "true";
const muted =
  href.searchParams.get("muted") === "true" ||
  href.searchParams.get("muted") === null;
const autoplay =
  href.searchParams.get("autoplay") === "true" ||
  href.searchParams.get("autoplay") === null;
const autoReconnect =
  href.searchParams.get("autoReconnect") === "true" ||
  href.searchParams.get("autoReconnect") === null;

//console.log(disableVideo, disableAudio, muted, autoplay, autoReconnect);
const disableControls =
  href.searchParams.get("disableControls") === "true" &&
  href.searchParams.get("disableControls") !== null;
const disableVolume =
  (href.searchParams.get("disableVolume") === "true" &&
    href.searchParams.get("disableVolume") !== null) ||
  disableControls;
const disablePlay =
  (href.searchParams.get("disablePlay") === "true" &&
    href.searchParams.get("disablePlay") !== null) ||
  disableControls;
const disableFull =
  (href.searchParams.get("disableFull") === "true" &&
    href.searchParams.get("disableFull") !== null) ||
  disableControls;

//console.log(disableVolume, disablePlay, disableFull);
let playing = false;
let fullBtn = document.querySelector("#fullBtn");
let video = document.querySelector("video");

video.addEventListener('loadedmetadata', (event) => {
  Logger.log("loadedmetadata",event);
});
// MillicastView object
let millicastView = null

const newViewer = () => {
  const tokenGenerator = () => Director.getSubscriber(streamName, streamAccountId)
  const millicastView = new View(streamName, tokenGenerator, null, autoReconnect)
  
  millicastView.on("broadcastEvent", (event) => {
    if (!autoReconnect) return;
  
    let layers = event.data["layers"] !== null ? event.data["layers"] : {};
    if (event.name === "layers" && Object.keys(layers).length <= 0) {
    }
const { name, data } = event;

    switch (name)
    {
        case "active":
            // A source has been started on the steam
            break;
        case "inactive":
            // A source has been stopped on the steam
            break;
        case "vad":
            // A new source was multiplexed over the vad tracks
            break;
        case "layers":
            // Updated layer information for each simulcast/svc video track
            break;
    }



  });
  millicastView.on("track", (event) => {
    addStream(event.streams[0]);
  });

  return millicastView
}


const togglePlay = () => {
  if (video.paused) {
    video.play()
  } else {
    video.pause();
  }
};

const toggleFullscreen = () => {
  let fullIcon = fullBtn.children[0];
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    fullIcon.classList.remove("fa-compress");
    fullIcon.classList.add("fa-expand");
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();

      fullIcon.classList.remove("fa-expand");
      fullIcon.classList.add("fa-compress");
    }
  }
};

const addStream = (stream) => {
  //Create new video element
  playing = true;
  const audio = document.querySelector("audio");

  if (disableVideo) {
    if (audio) audio.srcObject = stream;
    if (video) video.parentNode.removeChild(video);
    togglePlay();
  } else {
    //Set same id
    video.id = stream.id;
    //Set src stream
    //console.log('addStream');
    if (!muted) {
      video.removeAttribute("muted");
    }
    if (!autoplay) {
      video.autoplay = false;
      playing = false;
      video.removeAttribute("autoplay");
    }

    //If we already had a a stream
    if (video.srcObject) {
       //Create temporal video element and switch streams when we have valid data
       const tmp = video.cloneNode(true);
       //Override the muted attribute with current muted state
       tmp.muted = video.muted;
       //Set same volume
       tmp.volume = video.volume;
       //Set new stream
       tmp.srcObject = stream;
       //Replicate playback state
       if (video.playing) {
          try { tmp.play(); } catch (e) {}
        } else if (video.paused) {
          try{ tmp.paused(); } catch (e) {}
       }
       //Replace the video when media has started playing              
       tmp.addEventListener('loadedmetadata', (event) => {
         Logger.log("loadedmetadata tmp",event);
          video.parentNode.replaceChild(tmp, video);
          //Pause previous video to avoid duplicated audio until the old PC is closed
          try { video.pause(); } catch (e) {}
          //If it was in full screen
	  if (document.fullscreenElement == video) {
            try { document.exitFullscreen(); tmp.requestFullscreen(); } catch(e) {}
	  }
          //If it was in picture in picture mode
          if (document.pictureInPictureElement == video) {
            try { document.exitPictureInPicture(); tmp.requestPictureInPicture(); } catch(e) {}
          }
          //Replace js objects too
          video = tmp;
       });
    } else {
       video.srcObject = stream;
    }
    
    if (audio) audio.parentNode.removeChild(audio);
  }
};

let isSubscribed = false

const close = () => {
  video.srcObject = null;
  playing = false;
  millicastView?.millicastSignaling?.close();
  millicastView = null
  isSubscribed = false
  return Promise.resolve({});
};

const subscribe = async () => {
  if (millicastView?.isActive() || isSubscribed) {
    return
  }

  try {
    isSubscribed = true
    const options = {
      disableVideo: disableVideo,
      disableAudio: disableAudio,
      absCaptureTime: true,
    };
    window.millicastView = millicastView = newViewer()
    await millicastView.connect(options);
  } catch (error) {
    if (!autoReconnect) return;
    millicastView.reconnect()
  }
};

document.addEventListener("DOMContentLoaded", () => {
  let int;
  let lastclientX, lastclientY;

  const startInt = (evt) => {
    if (int) clearInterval(int);
    int = setInterval(() => {
      let clientX = evt.clientX;
      let clientY = evt.clientY;
      if (clientX === lastclientX && clientY === lastclientY) {
        clearInterval(int);
      } else {
        lastclientX = clientX;
        lastclientY = clientY;
      }
    }, 1000);
  };

  if (fullBtn) fullBtn.onclick = toggleFullscreen;

  video.onmousemove = (evt) => {
    startInt(evt);
  };
  video.addEventListener(
    "touchstart",
    (evt) => {
      startInt(evt);
    },
    false
  );

  int = setInterval(() => {
    clearInterval(int);
  }, 2000);
  subscribe();
});

const receiverApplicationId = 'B5B8307B'

window['__onGCastApiAvailable'] = function(isAvailable) {
  if (!isAvailable) {
    return false
  }
  
  const stateChanged = cast.framework.CastContextEventType.CAST_STATE_CHANGED
  const castContext = cast.framework.CastContext.getInstance()
  castContext.setOptions({
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    receiverApplicationId
  })

  castContext.addEventListener(stateChanged, ({castState}) => {
    if (castState === cast.framework.CastState.NOT_CONNECTED) {
      subscribe()
    }

    if (castState === cast.framework.CastState.CONNECTED) {
      const castSession = castContext.getCurrentSession()
      const mediaInfo = new chrome.cast.media.MediaInfo(streamName, '')
      mediaInfo.customData = { streamName, streamAccountId }
      mediaInfo.streamType = chrome.cast.media.StreamType.LIVE

      const loadRequest = new chrome.cast.media.LoadRequest(mediaInfo)
      castSession.loadMedia(loadRequest).then(close)
    }
  })
}
const tokenGenerator = () => Director.getSubscriber(streamName, streamAccountId, subToken)
const viewer = new View(streamId, tokenGenerator);
console.log(options);
viewer.connect({
    events: ["active", "inactive", "vad", "layers"],
    pinnedSourceId,
    multiplexedAudioTracks: 5,
    excludedSourceIds: [sourceId],
    disableVideo,
    dtx: true,
});
const data = viewer.Data
/*
const millicastView = new View(streamName, tokenGenerator, video)
millicastView.connect({
    events: ["active", "inactive", "vad", "layers"]
})

millicastView.on("broadcastEvent", (event) =>
{
    //Get event name and data
    const { name, data } = event;

    switch (name)
    {
        case "active":
            //A source has been started on the steam
            break;
        case "inactive":
            //A source has been stopped on the steam
            break;
        case "vad":
            //A new source was multiplexed over the vad tracks
            break;
        case "layers":
            //Updated layer information for each simulcast/svc video track
            break;
    }

});
viewer.project(data.sourceId,[
    {
        trackId: "audio0",
        mediaId: audioTransceiver.mid
    },
        {
        trackId: "video0",
        mediaId: videoTransceiver.mid
    }
]);
*/
console.log(data);
//sources.add(data.sourceId);
//viewer.project(data.sourceId,[{trackId:"video",mediaId.viewer.getRTCPeerConnection().getTransceivers()[0].mid}]);