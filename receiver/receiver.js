import { peer, init as initRTC } from './receiver_rtc.js';
import { MIME_CODEC } from '../shared/codec.js';

const videoEl = document.querySelector('video');

initRTC();

const mediaSource = new MediaSource();
let sourceBuffer;
const callbackQueue = [];

mediaSource.addEventListener('sourceopen', () => {
  sourceBuffer = mediaSource.addSourceBuffer(MIME_CODEC);
  sourceBuffer.mode = 'segments';

  sourceBuffer.addEventListener('updateend', () => {
    if (callbackQueue.length > 0 && !sourceBuffer.updating) {
      sourceBuffer.appendBuffer(callbackQueue.shift());
    }
  });
});

peer.on('data', ({ detail: data }) => {
  if (mediaSource?.readyState === 'open') {
    if (!sourceBuffer.updating && callbackQueue.length === 0) {
      sourceBuffer.appendBuffer(data);
    } else {
      callbackQueue.push(data);
    }
  }
});

videoEl.src = URL.createObjectURL(mediaSource);

cast.framework.CastReceiverContext.getInstance().start();
