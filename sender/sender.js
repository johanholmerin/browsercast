import { peer, init as initRTC } from './sender_rtc.js';
import STATE from './state.js';
import './ui.js';
import { blobToArrayBuffer } from './utils.js';
import { MIME_CODEC } from '../shared/codec.js';

/**
 * Cast SDK App ID
 */
const APP_ID = '466F7494';

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

/**
 * Start playback if media is loaded and receiver is connected
 */
export function load() {
  if (!STATE.media || !STATE.connected) return;

  const video = document.querySelector('video');
  const stream = video.captureStream();
  const mediaRecorder = new MediaRecorder(stream, { mimeType: MIME_CODEC });
  mediaRecorder.addEventListener('dataavailable', async event => {
    const arrayBuffer = await blobToArrayBuffer(event.data);
    peer.send(arrayBuffer);
  });
  mediaRecorder.start(1);
  video.play();
}

export function onPeerConnect() {
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
