// 2인 P2P 방 (PeerJS / WebRTC). 페이지에서 peerjs 스크립트를 먼저 로드해야 한다.
// 호스트: 방 코드를 peer id로 등록한다. 새 접속자가 오면 이전 연결을 대체한다 (게스트 새로고침 대응).
// 게스트: 방 코드로 호스트에 접속한다.

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(len = 5) {
  let s = '';
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  return s;
}

export class Room {
  // gameId: 게임별 peer id 네임스페이스 (예: 'apple')
  // handlers: { onOpen(code), onConnect(), onMessage(msg), onClose(), onError(text) }
  constructor(gameId, handlers) {
    this.prefix = `jn-games-${gameId}-`;
    this.h = handlers;
    this.peer = null;
    this.conn = null;
    this.isHost = false;
    this.code = null;
  }

  host() {
    this.isHost = true;
    this.code = randomCode();
    this.peer = new window.Peer(this.prefix + this.code);
    this.peer.on('open', () => this.h.onOpen?.(this.code));
    this.peer.on('connection', (conn) => {
      const old = this.conn;
      this.#bind(conn);
      old?.close();
    });
    this.peer.on('error', (err) => {
      if (err.type === 'unavailable-id') { this.peer.destroy(); this.host(); return; }
      this.h.onError?.(describe(err));
    });
  }

  join(code) {
    this.isHost = false;
    this.code = code.trim().toUpperCase();
    this.peer = new window.Peer();
    this.peer.on('open', () => {
      this.#bind(this.peer.connect(this.prefix + this.code, { reliable: true }));
    });
    this.peer.on('error', (err) => this.h.onError?.(describe(err)));
  }

  send(msg) {
    if (this.conn?.open) this.conn.send(msg);
  }

  get connected() {
    return !!this.conn?.open;
  }

  close() {
    this.conn?.close();
    this.peer?.destroy();
    this.conn = null;
    this.peer = null;
  }

  #bind(conn) {
    this.conn = conn;
    conn.on('open', () => this.h.onConnect?.());
    conn.on('data', (msg) => { if (this.conn === conn) this.h.onMessage?.(msg); });
    conn.on('close', () => {
      if (this.conn !== conn) return;
      this.conn = null;
      this.h.onClose?.();
    });
    conn.on('error', (err) => this.h.onError?.(describe(err)));
  }
}

function describe(err) {
  switch (err.type) {
    case 'peer-unavailable': return '방을 찾을 수 없어요. 코드를 확인해 주세요.';
    case 'network':
    case 'server-error':
    case 'socket-error': return '연결 서버에 접속할 수 없어요. 네트워크를 확인해 주세요.';
    case 'browser-incompatible': return '이 브라우저는 P2P 연결을 지원하지 않아요.';
    default: return `연결 오류: ${err.type || err.message || err}`;
  }
}
