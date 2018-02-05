/**
 * Create a sealed object with a onchange property listener
 */
function createState(values) {
  values.onchange = undefined;

  return new Proxy(Object.seal(values), {
    set(target, prop, value) {
      if (target[prop] === value) return true;

      target[prop] = value;
      if (target.onchange) target.onchange();

      return true;
    }
  });
}

export default createState({
  connected: false,
  duration: 0,
  currentTime: 0,
  volume: 1,
  media: undefined,
  subtitles: undefined,
  playing: false,
  thumbnail: undefined
});
