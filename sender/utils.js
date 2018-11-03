import srt2vtt from './srt2vtt.js';

/**
 * Supported media https://developers.google.com/cast/docs/media
 */
const AUDIO_EXTENSIONS = ['mp3', 'aac', 'wav'];
const VIDEO_EXTENSIONS = ['mp4', 'webm'];
const VTT_EXTENSION = 'vtt';
const SUBTITLES_EXTENSIONS = [VTT_EXTENSION, 'srt'];

const TORRENT_EXTENSION = 'torrent';

/**
 * Get duration and thumbnail from media
 */
export function getVideoInfo(file) {
  return new Promise((res, rej) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    video.src = URL.createObjectURL(file);

    function onerror() {
      video.removeEventListener('durationchange', ondurationchange);
      video.removeEventListener('seeked', onseeked, { once: true });
      rej(video.error);
    }

    function ondurationchange() {
      // Duration can be Inifity at first event. Wait for next.
      if (!Number.isFinite(video.duration)) return;
      video.removeEventListener('durationchange', ondurationchange);
      video.currentTime = video.duration / 2;
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
    }

    function onseeked() {
      video.removeEventListener('error', onerror, { once: true });
      canvas.getContext('2d').drawImage(
        video, 0, 0, canvas.width, canvas.height
      );
      canvas.toBlob(thumbnail => {
        res({
          duration: video.duration,
          thumbnail
        });
      }, rej);
    }

    video.addEventListener('durationchange', ondurationchange);
    video.addEventListener('seeked', onseeked, { once: true });
    video.addEventListener('error', onerror, { once: true });
  });
}

/**
 * @param {Number} time - Time in seconds
 */
export function formatTime(time) {
  const d = new Date(parseFloat(time) * 1000);
  const seconds = d.getUTCSeconds() < 10 ?
    `0${d.getUTCSeconds()}` :
    d.getUTCSeconds();
  const hours = d.getUTCHours();
  const minutes = hours && d.getUTCMinutes() < 10 ?
    `0${d.getUTCMinutes()}` :
    d.getUTCMinutes();

  return `${hours ? `${hours}:` : ''}${minutes}:${seconds}`;
}

export function blobToArrayBuffer(blob) {
  const fileReader = new FileReader();

  return new Promise((res, rej) => {
    fileReader.onload = event => res(event.target.result);
    fileReader.onerror = rej;
    fileReader.readAsArrayBuffer(blob);
  });
}

export function blobToText(blob) {
  const fileReader = new FileReader();

  return new Promise((res, rej) => {
    fileReader.onload = event => res(event.target.result);
    fileReader.onerror = rej;
    fileReader.readAsText(blob);
  });
}

function hasExtension(string, ext) {
  return string.endsWith(`.${ext}`);
}

function hasExtensions(string, list) {
  return list.some(ext => hasExtension(string, ext));
}

export function isAudio(name) {
  return hasExtensions(name, AUDIO_EXTENSIONS);
}

export function isVideo(name) {
  return hasExtensions(name, VIDEO_EXTENSIONS);
}

export function isMedia(name) {
  return isAudio(name) || isVideo(name);
}

export function isSubtitles(name) {
  return hasExtensions(name, SUBTITLES_EXTENSIONS);
}

export function isTorrent(name) {
  return hasExtension(name, TORRENT_EXTENSION);
}

/**
 * Naive way of getting MIME type
 */
export function getMime(name) {
  const extension = name.split('.').pop();
  if (isVideo(name)) return `video/${extension}`;
  if (isAudio(name)) return `audio/${extension}`;
  return '';
}

/**
 * List files non-recursively
 * @param {DataTransferItem[]} items
 */
export async function loadDataTransferItems(items) {
  const files = Array.from(items).map(item => {
    const entry = item.webkitGetAsEntry();
    if (!entry.isDirectory) {
      return item.getAsFile();
    }

    return new Promise((res, rej) => {
      const directoryReader = entry.createReader();
      directoryReader.readEntries(subitems => {
        res(Promise.all(subitems.map(subitem => {
          return new Promise((subres, subrej) => {
            subitem.file(subres, subrej);
          });
        })));
      }, rej);
    });
  });

  return [].concat(...await Promise.all(files));
}

/**
 * Convert subtitles to VTT format if needed
 */
export function toVtt(string, name) {
  if (hasExtension(name, VTT_EXTENSION)) return string;
  return srt2vtt(string);
}

/**
 * Dynamically load WebTorrent when needed
 */
export function loadWebTorrent() {
  return import('https://unpkg.com/webtorrent@0.102.4/webtorrent.min.js');
}
