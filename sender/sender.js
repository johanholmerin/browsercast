import { peer, init as initRTC } from './sender_rtc.js';
import STATE from './state.js';
import './ui.js';
import getTrackStyle from './get-track-style.js';
import { blobToArrayBuffer } from './utils.js';

/**
 * Cast SDK App ID
 */
const APP_ID = '4511BCAC';

const MEDIA_FILE_NAME = 'MEDIA_FILE';

/**
 * Subtitle track ID
 */
const TRACK_ID = 1;

/**
 * @type cast.framework.RemotePlayer
 */
let player;

/**
 * Called when Cast SDK is ready
 */
export function initializeCastApi() {
  cast.framework.CastContext.getInstance().setOptions({
    receiverApplicationId: APP_ID,
    autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
  });

  player = new cast.framework.RemotePlayer();
  const playerController = new cast.framework.RemotePlayerController(player);

  playerController.addEventListener(
    cast.framework.RemotePlayerEventType.ANY_CHANGE,
    () => {
      STATE.volume = player.isMuted ? 0 : player.volumeLevel;
      STATE.currentTime = player.currentTime;
      STATE.duration = player.duration;
      STATE.playing =
        player.playerState === chrome.cast.media.PlayerState.PLAYING ||
        player.playerState === chrome.cast.media.PlayerState.BUFFERING;
    }
  );

  initRTC();
}

function getRange(start) {
  // Local file
  if (STATE.media instanceof Blob) {
    // Chrome doesn't support sending blobs over WebRTC
    // https://bugs.chromium.org/p/chromium/issues/detail?id=422734
    return blobToArrayBuffer(
      STATE.media.slice(start, start + peer.SEGMENT_SIZE)
    );
  }

  // Torrent
  return new Promise((res, rej) => {
    const stream = STATE.media.createReadStream({
      start,
      end: start + peer.SEGMENT_SIZE - 1
    });
    stream.once('data', data => {
      res(data.buffer.slice(0, peer.SEGMENT_SIZE));
    });
    stream.once('error', rej);
  });
}

/**
 * Slice file range and send
 */
async function sendRange({ msg: start, id }) {
  const range = await getRange(start);

  // ID and data are sent in separate messages directly
  // after each other. Relies on WebRTC being ordered.
  peer.send(JSON.stringify(id));
  peer.send(range);
}

/**
 * Start playback if media is loaded and receiver is connected
 */
export function load() {
  if (!STATE.media || !STATE.connected) return;
  // Set size of the file as a query parameter
  play(
    `${MEDIA_FILE_NAME}?size=${STATE.media.size}`,
    STATE.media.type
  );
}

function play(path, mime) {
  const tracks = [];

  if (STATE.subtitles) {
    const track = new chrome.cast.media.Track(
      TRACK_ID,
      chrome.cast.media.TrackType.TEXT
    );
    track.trackContentId = STATE.subtitles.value;
    track.trackContentType = 'text/vtt';
    track.subtype = chrome.cast.media.TextTrackType.SUBTITLES;
    tracks.push(track);
  }

  const castSession = cast
    .framework
    .CastContext
    .getInstance()
    .getCurrentSession();

  const metadata = new chrome.cast.media.GenericMediaMetadata();
  metadata.title = STATE.media.name;

  const mediaInfo = new chrome.cast.media.MediaInfo(path, mime);
  mediaInfo.textTrackStyle = getTrackStyle();
  mediaInfo.tracks = tracks;
  mediaInfo.metadata = metadata;

  const request = new chrome.cast.media.LoadRequest(mediaInfo);
  request.activeTrackIds =
    STATE.subtitles && STATE.subtitles.enabled ? [TRACK_ID] : [];

  // Continue playback if the media hasn't changed
  if (player.mediaInfo && player.mediaInfo.contentId === path) {
    request.currentTime = player.currentTime;
  }

  return castSession.loadMedia(request);
}

export function onPeerConnect() {
  peer.on('data', ({ detail: str }) => sendRange(JSON.parse(str)));
  load();
}

export function playOrPause() {
  player.controller.playOrPause();
}

export function stop() {
  player.controller.stop();
}

export function seek(time) {
  player.currentTime = time;
  player.controller.seek();
}

export function setVolumeLevel(level) {
  player.volumeLevel = level;
  player.controller.setVolumeLevel();
}

export function toggleSubtitles() {
  const media = cast
    .framework
    .CastContext
    .getInstance()
    .getCurrentSession()
    .getMediaSession();

  const activeTrackIds =
    STATE.subtitles && STATE.subtitles.enabled ? [TRACK_ID] : [];
  const tracksInfoRequest =
    new chrome.cast.media.EditTracksInfoRequest(activeTrackIds);
  media.editTracksInfo(tracksInfoRequest);
}
