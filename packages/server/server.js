import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { WebSocketServer } from "ws";

const HOST = "localhost";
const PORT = 3000;
const WS_PORT = 3001;

const MIME_TYPES = {
  default: "application/octet-stream",
  html: "text/html; charset=UTF-8",
  js: "application/javascript",
  css: "text/css",
  png: "image/png",
  jpg: "image/jpg",
  gif: "image/gif",
  ico: "image/x-icon",
  svg: "image/svg+xml",
};

const STATIC_PATH = path.join(process.cwd(), "../client");

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  console.log(url);
  const paths = [STATIC_PATH, url];
  if (url.endsWith("/")) paths.push("/index.html");
  const filePath = path.join(...paths);
  const pathTraversal = !filePath.startsWith(STATIC_PATH);
  const exists = await fs.promises.access(filePath).then(...toBool);
  const found = !pathTraversal && exists;
  const streamPath = found ? filePath : STATIC_PATH + "/404.html";
  const ext = path.extname(streamPath).substring(1).toLowerCase();
  const stream = fs.createReadStream(streamPath);
  return { found, ext, stream };
};

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
  ws.send("Welcome to the WebSocket server!");
  console.log("new connection!");
});

wss.on("message", (message) => {
  console.log("new message!");
});

http
  .createServer(async (req, res) => {
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { "Content-Type": mimeType });
    file.stream.pipe(res);
    console.log(`${req.method} ${req.url} ${statusCode}`);
  })
  .listen(PORT);
