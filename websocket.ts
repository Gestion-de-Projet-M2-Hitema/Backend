import { createServer } from "http";
import { Server } from "socket.io";
import app from "./app";
import { MySocket } from "./middlewares/websocket.middlewars";

// Initialize websocket server
export const httpServer = createServer(app);
export const io = new Server<MySocket>(httpServer, {
  cors: {
    origin: (origin: any, callback: Function) => {
      callback(null, true);
    },
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Import Middlewares
import socketMiddlewares from "./middlewares/websocket.middlewars";

// Import Controllers
import socketControllers from "./events";

// Websocket Manager
io.on("connection", (socket) => {
  console.log(`[CONNECTION] ${socket.id}`);

  socketMiddlewares(socket);
  socketControllers(io, socket);

  // Client disconnection
  socket.on("disconnect", () => console.log(`[DISCONNECTION] ${socket.id}`));
});
