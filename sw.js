/* global clients */

const MEDIA_FILE_NAME = 'MEDIA_FILE';

/**
 * Call skipWaiting and claim to take control immediately.
 */
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  clients.claim();
});

/**
 * @function
 * @param {Client} client
 * @param {*} msg
 */
const getData = (() => {
  const promises = {};
  let n = 0;

  self.addEventListener('message', event => {
    const { id, msg } = event.data;
    promises[id](msg);
  });

  return (client, msg) => {
    return new Promise(res => {
      promises[n] = res;
      client.postMessage({ id: n, msg });
      n += 1;
    });
  };
})();

self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (!url.pathname.endsWith(`/${MEDIA_FILE_NAME}`)) return;

  event.respondWith((async () => {
    const client = await clients.get(event.clientId);

    // Size of the file is set as a query parameter
    const size = parseInt(new URLSearchParams(url.search).get('size'));
    const startByte = parseInt(
      event.request.headers.get('Range').match(/bytes=([0-9]*)-/)[1]
    );
    const buffer = await getData(client, startByte);
    const blob = new Blob([buffer], { type: 'octet/stream' });

    return new Response(blob, {
      status: 206,
      headers: new Headers({
        'Content-Range': `bytes ${startByte}-${size - 1}/${size}`,
        'Content-Length': size - startByte
      })
    });
  })());
});
