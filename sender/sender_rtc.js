import Peer, { CUSTOM_CHANNEL } from '../shared/Peer.js';
import STATE from './state.js';
import { onPeerConnect } from './sender.js';

/**
 * WebRTC connection
 */
export let peer;

/**
 * Send message to sender with Cast SDK
 */
function sendMessage({ detail }) {
  cast
    .framework
    .CastContext
    .getInstance()
    .getCurrentSession()
    .sendMessage(CUSTOM_CHANNEL, detail);
}

function disconnect() {
  cast
    .framework
    .CastContext
    .getInstance()
    .getCurrentSession()
    .getSessionObj()
    .stop();
}

function onConnectionChanged(event) {
  const connectedStates = [
    cast.framework.SessionState.SESSION_STARTED,
    cast.framework.SessionState.SESSION_RESUMED
  ];

  const isConnected = connectedStates.includes(event.sessionState);
  if (!isConnected) {
    if (peer) {
      peer.destroy();
      peer = undefined;
    }

    STATE.connected = false;
    return;
  }

  peer = new Peer({ initiator: true });
  peer.on('signal', sendMessage);
  peer.on('error', ({ error }) => {
    console.error(error);
    disconnect();
  });
  peer.on('close', disconnect);
  peer.on('connect', () => {
    STATE.connected = true;
    onPeerConnect();
  });

  // Forward messages to WebRTC connection
  cast
    .framework
    .CastContext
    .getInstance()
    .getCurrentSession()
    .addMessageListener(CUSTOM_CHANNEL, (_, string) => {
      peer.signal(JSON.parse(string));
    });
}

export function init() {
  cast.framework.CastContext.getInstance().addEventListener(
    cast.framework.CastContextEventType.SESSION_STATE_CHANGED,
    onConnectionChanged
  );
}
