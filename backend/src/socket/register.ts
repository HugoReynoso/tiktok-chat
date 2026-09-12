import type { Server } from "socket.io";
import type { ClientEvents, ServerEvents } from "../../../shared/types.js";
import { TikTokLiveService } from "../services/TikTokLiveService.js";
export function register(io: Server<ClientEvents, ServerEvents>) {
  io.on("connection", (socket) => {
    const service = new TikTokLiveService(socket);
    let lastConnect = 0;
    socket.on("live:connect", (username) => {
      if (Date.now() - lastConnect < 3000) return;
      lastConnect = Date.now();
      void service.connect(username);
    });
    socket.on("live:disconnect", () => service.disconnect());
    socket.on("live:reset", () => service.reset());
    socket.on("disconnect", () => service.dispose());
  });
}
