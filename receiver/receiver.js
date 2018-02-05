import { peer, init as initRTC, disconnect } from './receiver_rtc.js';

/**
 * Get data over WebRTC
 */
function getData({ msg, id }) {
  return new Promise(res => {
    let nextIsData = false;
    peer.on('data', function ondata({ detail: data }) {
      // ID and data are sent in separate messages directly
      // after each other. Relies on WebRTC being ordered.
      if (typeof data === 'string' && JSON.parse(data) === id) {
        nextIsData = true;
        return;
      } else if (!nextIsData) {
        return;
      }

      peer.off('data', ondata);
      res(data);
    });
    peer.send(JSON.stringify({ msg, id }));
  });
}

/**
 * Send request from Service Worker to sender and post back result
 */
function onmessage(event) {
  const { id, msg } = event.data;
  getData({ msg, id }).then(buffer => {
    navigator.serviceWorker.controller.postMessage({
      msg: buffer,
      id
    }, [buffer]); // Transfer buffer
  });
}

/**
 * Connect to sender after Service Worker has been successfully registered
 */
navigator.serviceWorker.register('sw.js', {
  scope: './'
}).then(() => {
  initRTC();

  navigator.serviceWorker.addEventListener('message', onmessage);

  cast
    .framework
    .CastReceiverContext
    .getInstance()
    .start();
}, disconnect);
