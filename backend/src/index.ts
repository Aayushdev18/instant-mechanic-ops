import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import swaggerUi from "swagger-ui-express";
import { prisma } from "./db.js";
import { dashboardRouter } from "./dashboard.js";
import { bookingsRouter } from "./bookings.js";
import { mechanicsRouter } from "./mechanics.js";
import { customersRouter } from "./customers.js";
import { setSocketServer, addSseClient } from "./broadcast.js";
import { startSimulator } from "./simulator.js";
import { openApiSpec } from "./openapi.js";

const app = express();
const port = Number(process.env.PORT || 43124);
const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin.split(",") }));
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "instant-mechanic-api", time: new Date().toISOString() });
});

app.get("/api/events", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();
  res.write(`event: hello\n`);
  res.write(
    `data: ${JSON.stringify({ event: "hello", payload: { message: "SSE connected" }, at: new Date().toISOString() })}\n\n`
  );
  addSseClient(res);
  const ping = setInterval(() => {
    res.write(`event: ping\ndata: {}\n\n`);
  }, 15000);
  req.on("close", () => clearInterval(ping));
});

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
app.get("/api/openapi.json", (_req, res) => res.json(openApiSpec));

app.use("/api", dashboardRouter);
app.use("/api", bookingsRouter);
app.use("/api", mechanicsRouter);
app.use("/api", customersRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });
setSocketServer(wss);

wss.on("connection", (socket) => {
  socket.send(
    JSON.stringify({
      event: "hello",
      payload: { message: "Connected to Instant Mechanic live ops" },
      at: new Date().toISOString(),
    })
  );
});

server.listen(port, "0.0.0.0", () => {
  console.log(`API listening on http://0.0.0.0:${port}`);
  console.log(`Swagger UI http://0.0.0.0:${port}/api/docs`);
  startSimulator();
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
