import { Server as SocketIOServer } from "socket.io";
import { Server as HTTPServer } from "http";

export class SocketService {
  private static io: SocketIOServer;
  private static userSockets: Map<string, string> = new Map(); // userId -> socketId

  static init(server: HTTPServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: [
          process.env.FRONTEND_URL || "http://localhost:3000",
          "https://kindercloud-frontend.vercel.app"
        ],
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.io.on("connection", (socket) => {
      console.log(`[Socket] User connected: ${socket.id}`);

      socket.on("authenticate", (userId: string) => {
        if (userId) {
          this.userSockets.set(userId, socket.id);
          console.log(`[Socket] User ${userId} authenticated with socket ${socket.id}`);
        }
      });

      socket.on("disconnect", () => {
        // Find and remove the user mapping
        for (const [userId, socketId] of this.userSockets.entries()) {
          if (socketId === socket.id) {
            this.userSockets.delete(userId);
            console.log(`[Socket] User ${userId} disconnected`);
            break;
          }
        }
      });
    });

    return this.io;
  }

  static emitToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId && this.io) {
      this.io.to(socketId).emit(event, data);
      return true;
    }
    return false;
  }

  static getIO() {
    return this.io;
  }
}
