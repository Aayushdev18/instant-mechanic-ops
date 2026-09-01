import type { WebSocketServer } from "ws";
import type { Response } from "express";

let wss: WebSocketServer | null = null;
const sseClients = new Set<Response>();

export function setSocketServer(server: WebSocketServer) {
  wss = server;
}

export function addSseClient(res: Response) {
  sseClients.add(res);
  res.on("close", () => sseClients.delete(res));
}

export function broadcast(event: string, payload: unknown) {
  const message = JSON.stringify({ event, payload, at: new Date().toISOString() });
  if (wss) {
    for (const client of wss.clients) {
      if (client.readyState === 1) client.send(message);
    }
  }
  for (const res of sseClients) {
    res.write(`event: ${event}\n`);
    res.write(`data: ${message}\n\n`);
  }
}
