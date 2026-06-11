// src/matchmaking/RoomManager.js — owns all rooms, wires the transport bus, fills seats with bots.
import { customAlphabet, nanoid } from 'nanoid';
import config from '../config.js';
import Room from '../game/Room.js';
import { Batcher } from './Batcher.js';

const code4 = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4); // human-friendly, no ambiguous chars

export class RoomManager {
  constructor({ store, sendToConn }) {
    this.store = store;
    this.sendToConn = sendToConn;        // (connId, msg) => void  (the ws layer provides this)
    this.rooms = new Map();              // code -> Room
    this.playerConn = new Map();         // playerId -> connId
    this.bus = {
      send: (playerId, msg) => { const c = this.playerConn.get(playerId); if (c) this.sendToConn(c, msg); },
      broadcast: (code, msg) => { const r = this.rooms.get(code); if (!r) return; for (const p of r.players) if (!p.isBot) this.bus.send(p.id, msg); },
    };
    this.batcher = new Batcher({ onFormRoom: (members, opts) => this.formRoom(members, opts) });
  }

  bindConn(playerId, connId) { this.playerConn.set(playerId, connId); }

  // ---- private rooms by code (the simplest social door — ships first) ----
  createRoom({ isPrivate = true } = {}) {
    let code; do { code = code4(); } while (this.rooms.has(code));
    const room = new Room({ code, bus: this.bus, store: this.store, isPrivate });
    this.rooms.set(code, room);
    return room;
  }
  getRoom(code) { return this.rooms.get((code || '').toUpperCase()); }

  joinRoom(code, player, connId) {
    const room = this.getRoom(code);
    if (!room) return { error: 'no such room' };
    if (room.started) return { error: 'game already started' };
    this.bindConn(player.id, connId);
    room.addPlayer(player);
    return { room };
  }

  startRoom(code, callerId) {
    const room = this.getRoom(code);
    if (!room || room.started) return { error: 'cannot start' };
    // C2: client buttons are not authorization. Enforce it here.
    if (!room.players.find((p) => p.id === callerId && !p.isBot)) return { error: 'not in this room' };
    if (room.isPrivate && room.hostId && callerId !== room.hostId) return { error: 'only the host can start' };
    this.maybeBackfill(room);
    room.start().finally(() => this.rooms.delete(code));
    return { ok: true };
  }

  // ---- matchmade rooms (the storm + batcher form these) ----
  formRoom(members, { fallback }) {
    const room = this.createRoom({ isPrivate: false });
    for (const m of members) {
      this.bindConn(m.id, m.connId);
      room.addPlayer({ id: m.id, name: m.name, sub: m.sub, paid: m.paid });
      this.bus.send(m.id, { t: 'room.joined', code: room.code, matchmade: true });
    }
    if (fallback === 'bots' || fallback === 'solo' || config.botBackfill) this.maybeBackfill(room);
    room.start().finally(() => this.rooms.delete(room.code));
    return room.code;
  }

  // bot-backfill: the machine wears human masks so a short table (or a lone human) plays a full game.
  maybeBackfill(room) {
    if (!config.botBackfill) return;
    const humans = room.players.filter((p) => !p.isBot).length;
    const need = Math.max(0, config.table.min - room.players.length);
    // also lift a solo human to at least min seats
    const fill = Math.max(need, humans === 1 ? config.table.min - room.players.length : 0);
    for (let i = 0; i < fill; i++) {
      room.addPlayer({ id: 'bot_' + nanoid(6), name: botHandle(i), isBot: true });
    }
  }

  // ---- routing actions from the ws layer ----
  enqueue(player) { this.batcher.join(player); }
  dequeue(id) { this.batcher.leave(id); }

  onDisconnect(playerId) {
    this.dequeue(playerId);
    for (const room of this.rooms.values()) {
      if (room.players.find((p) => p.id === playerId)) room.removePlayer(playerId);
    }
    this.playerConn.delete(playerId);
  }

  findRoomByPlayer(playerId) {
    for (const r of this.rooms.values()) if (r.players.find((p) => p.id === playerId)) return r;
    return null;
  }
}

const BOT_HANDLES = ['Grayscale', 'No.7', 'Provenance', 'The Visitor', 'Anon', 'Margin', 'Static', 'Echo'];
function botHandle(i) { return BOT_HANDLES[i % BOT_HANDLES.length]; }

export default RoomManager;
