import { io, type Socket } from 'socket.io-client';
import type { ClientEvents, ServerEvents } from '../../../shared/types';

/** WebSocket first, with an actual polling fallback on restricted networks. */
export function createLiveSocket(apiUrl?: string): Socket<ServerEvents, ClientEvents> {
  return io(apiUrl?.trim() || undefined, {
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
    reconnectionDelayMax: 10000,
    timeout: 60000,
    transports: ['websocket', 'polling'],
    tryAllTransports: true,
  });
}
