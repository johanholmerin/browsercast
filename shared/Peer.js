/**
 * Namespace for Cast SDK
 * @const
 */
export const CUSTOM_CHANNEL = 'urn:x-cast:browsercast';

/**
 * @const iceServers
 */
const iceServers = [{
  urls: 'stun:stun.l.google.com:19302'
}, {
  urls: 'stun:global.stun.twilio.com:3478?transport=udp'
}];

/**
 * WebRTC abstraction class
 */
export default class Peer extends EventTarget {

  constructor({ initiator = false } = {}) {
    super();

    this._pc = new RTCPeerConnection({ iceServers });
    this._pc.addEventListener('negotiationneeded', this);
    this._pc.addEventListener('icecandidate', this);
    this._pc.addEventListener('datachannel', this);

    if (initiator) {
      this._ondatachannel({
        channel: this._pc.createDataChannel(CUSTOM_CHANNEL)
      });
    }
  }

  handleEvent(event) {
    this[`_on${event.type}`](event);
  }

  async _onnegotiationneeded() {
    const offer = await this._pc.createOffer();
    this._pc.setLocalDescription(offer);
    this.emit('signal', JSON.stringify(offer));
  }

  _onicecandidate({ candidate }) {
    if (!candidate) return;
    this.emit('signal', JSON.stringify(candidate));
  }

  _ondatachannel({ channel }) {
    this._channel = channel;
    this._channel.binaryType = 'arraybuffer';
    this._channel.addEventListener('open', this);
    this._channel.addEventListener('close', this);
    this._channel.addEventListener('message', this);
    this._channel.addEventListener('error', this);
  }

  _onopen() {
    this.emit('connect');
  }

  _onclose() {
    this.emit('close');
  }

  _onmessage(event) {
    this.emit('data', event.data);
  }

  _onerror(event) {
    this.dispatchEvent(event);
  }

  on(...args) {
    this.addEventListener(...args);
  }

  off(...args) {
    this.removeEventListener(...args);
  }

  emit(name, data) {
    const event = new CustomEvent(name, { detail: data });
    this.dispatchEvent(event);
  }

  send(...args) {
    this._channel.send(...args);
  }

  async signal(msg) {
    const signal = typeof msg === 'string' ? JSON.parse(msg) : msg;

    if (signal.candidate) {
      this._pc.addIceCandidate(signal);
    } else {
      this._pc.setRemoteDescription(signal);
      if (signal.type === 'offer') {
        const answer = await this._pc.createAnswer();
        this._pc.setLocalDescription(answer);
        this.emit('signal', JSON.stringify(answer));
      }
    }
  }

  destroy() {
    this._pc.removeEventListener('negotiationneeded', this);
    this._pc.removeEventListener('icecandidate', this);
    this._pc.removeEventListener('datachannel', this);

    if (!this._channel) return;

    this._channel.removeEventListener('open', this);
    this._channel.removeEventListener('close', this);
    this._channel.removeEventListener('message', this);
    this._channel.removeEventListener('error', this);
  }

}
