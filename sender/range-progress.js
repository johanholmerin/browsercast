/**
 * A simple way to style lower fill of input[type="range"]
 * using gradient background and custom properties.
 */

function setRangeProgress(el) {
  el.style.setProperty(
    '--range-ratio',
    parseFloat(el.value) / parseFloat(el.max) || 0
  );
}

// Update when setting value
const inputDesc = Object.getOwnPropertyDescriptor(
  HTMLInputElement.prototype,
  'value'
);
const { set } = inputDesc;
inputDesc.set = function (value) { // eslint-disable-line func-names
  set.call(this, value);
  setRangeProgress(this);
};

Array.from(document.querySelectorAll('input[type="range"]')).forEach(el => {
  Object.defineProperty(el, 'value', inputDesc);
  el.addEventListener('input', event => setRangeProgress(event.currentTarget));
  // Set initial
  setRangeProgress(el);
});
