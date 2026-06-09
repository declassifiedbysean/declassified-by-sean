// src/realtime/wsServer.js — the real-time pipe. Routes client messages to matchmaking & rooms.
import { WebSocketServer } from 'ws';
import { nanoid } from 'nanoid';
import { verify } from '../auth/session.js';
import { RoomManager } from '../matchmaking/RoomManager.js';
import moderation from '../moderation/filter.js';
import entitlement from '../auth/entitlement.js';

export function attachWebSocket(httpServer, store) {
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const conns = new Map(); // connId -> { ws, user, playerId }

  const sendToConn = (connId, msg) => {
    const c = conns.get(connId);
    if (c && c.ws.readyState === 1) c.ws.send(JSON.stringify(msg));
  };
  const rm = new RoomManager({ store, sendToConn });

  wss.on('connection', (ws) => {
    const connId = nanoid(10);
    conns.set(connId, { ws, user: null, playerId: null });

    ws.on('message', async (buf) => {
      let msg; try { msg = JSON.parse(buf.toString()); } catch { return; }
      const conn = conns.get(connId);
      if (!conn) return;
      if (!moderation.allow(connId)) return sendToConn(connId, { t: 'error', msg: 'slow down' });

      // must auth first (guest token is fine)
      if (msg.t === 'auth') {
        const claims = verify(msg.token);
        if (!claims) return sendToConn(connId, { t: 'error', msg: 'bad token' });
        conn.user = claims; conn.playerId = claims.id;
        rm.bindConn(claims.id, connId);
        const r = (!claims.guest && claims.sub) ? await store.getRating(claims.sub) : null;
        const paid = entitlement.isPaid(claims.sub);
        return sendToConn(connId, { t: 'auth.ok', user: {
          id: claims.id, handle: claims.handle, guest: !!claims.guest,
          paid, rating: r ? r.rating : null, games: r ? r.games : 0,
        } });
      }
      if (!conn.user) return sendToConn(connId, { t: 'error', msg: 'auth required' });
      const me = { id: conn.user.id, name: conn.user.handle, sub: conn.user.sub || null, paid: entitlement.isPaid(conn.user.sub), connId };

      switch (msg.t) {
        case 'queue.join':
          rm.enqueue({ ...me, notify: (m) => sendToConn(connId, m) });
          break;
        case 'queue.leave':
          rm.dequeue(me.id);
          break;
        case 'room.create': {
          const room = rm.createRoom({ isPrivate: true });
          rm.joinRoom(room.code, me, connId);
          sendToConn(connId, { t: 'room.joined', code: room.code, host: true });
          break;
        }
        case 'room.join': {
          const res = rm.joinRoom(msg.code, me, connId);
          if (res.error) sendToConn(connId, { t: 'error', msg: res.error });
          else sendToConn(connId, { t: 'room.joined', code: res.room.code });
          break;
        }
        case 'room.start': {
          const res = rm.startRoom(msg.code, me.id);
          if (res?.error) sendToConn(connId, { t: 'error', msg: res.error });
          break;
        }
        case 'name.submit': {
          const room = rm.findRoomByPlayer(me.id);
          if (room) room.submitName(me.id, msg.name);
          break;
        }
        case 'crown.vote': {
          const room = rm.findRoomByPlayer(me.id);
          if (room) { room.castVote(me.id, 'sublime', msg.sublime); room.castVote(me.id, 'troll', msg.troll); }
          break;
        }
        case 'flag.cast': {
          const room = rm.findRoomByPlayer(me.id);
          if (room) room.castVote(me.id, 'flag', msg.entryId);
          break;
        }
        case 'report':
          moderation.report({ by: me.id, code: msg.code, entryId: msg.entryId, reason: msg.reason });
          sendToConn(connId, { t: 'report.ok' });
          break;
        default:
          sendToConn(connId, { t: 'error', msg: `unknown: ${msg.t}` });
      }
    });

    ws.on('close', () => {
      const conn = conns.get(connId);
      if (conn?.playerId) rm.onDisconnect(conn.playerId);
      conns.delete(connId);
    });
  });

  return { wss, rm };
}

export default attachWebSocket;
