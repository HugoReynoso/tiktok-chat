import express from "express";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { register } from "./socket/register.js";
import type { ClientEvents, ServerEvents } from "../../shared/types.js";
const app = express();
app.disable("x-powered-by");
app.get("/api/health", (_req, res) => res.json({ ok: true }));
const server = createServer(app);
const origins = (process.env.FRONTEND_ORIGIN ?? "http://localhost:5173").split(
  ",",
);
const io = new Server<ClientEvents, ServerEvents>(server, {
  cors: { origin: origins },
  maxHttpBufferSize: 8192,
  allowRequest: (req, callback) =>
    callback(null, !req.headers.origin || origins.includes(req.headers.origin)),
});
register(io);
server.listen(
  Number(process.env.PORT ?? 3001),
  process.env.HOST ?? "127.0.0.1",
  () => console.log("TikTok Chat API ready"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    io.close();
    server.close();
  });
