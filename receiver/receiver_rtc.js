import Peer, { CUSTOM_CHANNEL } from '../shared/Peer.js';

/**
 * WebRTC connection
 */
export let peer;

/**
 * Send message to sender with Cast SDK
 */
function sendMessage({ detail }) {
  return cast
    .framework
    .CastReceiverContext
    .getInstance()
    .sendCustomMessage(CUSTOM_CHANNEL, undefined, detail);
}

export function disconnect() {
  cast
    .framework
    .CastReceiverContext
    .getInstance()
    .stop();
}

/**
 * Setup WebRTC connection
 */
export function init() {
  peer = new Peer({ initiator: false });
  peer.on('signal', sendMessage);
  peer.on('error', disconnect);
  peer.on('close', disconnect);

  // Forward messages to WebRTC connection
  cast
    .framework
    .CastReceiverContext
    .getInstance()
    .addCustomMessageListener(CUSTOM_CHANNEL, event => peer.signal(event.data));

  // Stop receiver if sender is disconnected
  cast
    .framework
    .CastReceiverContext
    .getInstance()
    .addEventListener(
      cast.framework.system.EventType.SENDER_DISCONNECTED,
      disconnect
    );
}
