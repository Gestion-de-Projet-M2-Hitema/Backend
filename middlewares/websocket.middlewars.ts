import { Socket } from "socket.io";

export interface MySocket extends Socket {
  eventTriggered: string | undefined;
}

export default (socket: Socket) => {
  socket.use(async ([event, ...args], next) => {
    // We add the name of the triggering event in the socket request
    socket.data.eventTriggered = event;

    next();
  });
};
