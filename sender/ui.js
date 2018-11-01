import {
  load,
  setVolumeLevel,
  seek,
  playOrPause,
  toggleSubtitles
} from './sender.js';
import STATE from './state.js';
import {
  getVideoInfo,
  formatTime,
  blobToText,
  isMedia,
  isSubtitles,
  toVtt,
  loadDataTransferItems
} from './utils.js';

const fileInput = document.querySelector('.file-input');
const fileSelect = document.querySelector('.file-select');
const playButton = document.querySelector('.play-button');
const timeLabel = document.querySelector('.time-label');
const progressRange = document.querySelector('.progress-range');
const volumeRange = document.querySelector('.volume-range');
const volumeButton = document.querySelector('.volume-button');
const subtitlesButton = document.querySelector('.subtitles-button');
const castButton = document.querySelector('.cast-button');

function render() {
  playButton.classList.toggle('play-button--playing', !!STATE.playing);
  playButton.disabled = !STATE.connected || !STATE.media;

  timeLabel.textContent =
    `${formatTime(STATE.currentTime)} / ${formatTime(STATE.duration)}`;

  progressRange.value = STATE.currentTime;
  progressRange.max = STATE.duration;
  progressRange.disabled = !STATE.connected || !STATE.media;

  volumeRange.value = STATE.volume;
  volumeRange.disabled = !STATE.connected;

  volumeButton.classList.toggle('volume-button--muted', !STATE.volume);
  volumeButton.disabled = !STATE.connected;

  subtitlesButton.classList.toggle(
    'subtitles-button--disabled',
    !STATE.subtitles || !STATE.subtitles.enabled
  );
  subtitlesButton.hidden = !STATE.subtitles;

  fileSelect.style.backgroundImage =
    STATE.thumbnail && `url(${STATE.thumbnail}`;
  fileSelect.classList.toggle('file-select--selected', !!STATE.media);
}

async function loadFiles([torrentFile]) {
  const client = new WebTorrent();

  client.add(torrentFile, torrent => {
    const media = torrent.files.find(file => isMedia(file.name));

    STATE.media = media;
    STATE.media.type = 'video/mp4';
    STATE.media.size = media.length;
    load();
  });




  return;
  const media = files.find(file => isMedia(file.name));
  const subtitles = files.find(file => isSubtitles(file.name));

  if (media) {
    STATE.media = media;

    // Open cast prompt if not connected
    if (!STATE.connected) {
      castButton.click();
    }
  }

  if (subtitles) {
    STATE.subtitles = {
      value: `data:text/vtt,${
        toVtt(await blobToText(subtitles), subtitles.name)
      }`,
      enabled: true
    };
  }

  load();

  if (media) {
    const { thumbnail, duration } = await getVideoInfo(media);
    STATE.thumbnail = thumbnail && URL.createObjectURL(thumbnail);
    STATE.duration = duration;
  }
}

/**
 * EVENT LISTENERS
 */

STATE.onchange = render;

playButton.addEventListener('click', () => {
  STATE.playing = !STATE.playing;
  playOrPause();
});

progressRange.addEventListener('input', () => {
  STATE.currentTime = parseFloat(progressRange.value);
  seek(STATE.currentTime);
});

volumeButton.addEventListener('click', () => {
  STATE.volume = STATE.volume ? 0 : 1;
  setVolumeLevel(STATE.volume);
});

volumeRange.addEventListener('input', () => {
  STATE.volume = parseFloat(volumeRange.value);
  setVolumeLevel(STATE.volume);
});

subtitlesButton.addEventListener('click', () => {
  STATE.subtitles.enabled = !STATE.subtitles.enabled;
  toggleSubtitles();
});

fileInput.addEventListener('change', event => {
  loadFiles(Array.from(event.currentTarget.files));
  event.currentTarget.value = '';
});

fileSelect.addEventListener('click', () => {
  fileInput.click();
});

fileSelect.addEventListener('dragover', event => {
  event.preventDefault();
});

fileSelect.addEventListener('drop', async event => {
  event.preventDefault();

  if (event.dataTransfer.items) {
    loadFiles(await loadDataTransferItems(event.dataTransfer.items));
  } else {
    loadFiles(Array.from(event.dataTransfer.files));
  }
});
