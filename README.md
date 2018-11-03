# Browsercast

Cast local files to Chromecast directly from the browser. No install needed.

## Supported media

Formats [supported natively by Chromecast](
https://developers.google.com/cast/docs/media) can be played:

* MP4
* WebM
* MP3
* AAC
* WAV

Subtitles in SRT and VTT format are supported aswell.

## How it works

Instead of fetching the video over HTTP, a WebRTC connection is established
between the sender and the receiver. The media is then sent over in segments as
needed.

To stream the segments to the media element at the receiver, Media Source
Extensions could be used, but that is complicated to implement and only supports
fragmented MP4. Instead a Service Worker is used, which intercepts the
[range requests](https://developer.mozilla.org/en-US/docs/Web/HTTP/Range_requests)
and forwards the request to the sender, and the response is then returned from
the Service Worker.

# Drawbacks

Initial load and seeking can be slower compared to using a server. This seems to
be caused by the size limit of packets. While watching this is not a problem.

## WebTorrent

It is now possible to stream torrents using WebTorrent by selecting a torrent
file.
