import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import {
  CONNECTION_EVENT,
  MESSAGE_EVENT,
  INFO_EVENT,
} from "./utils/constants.js";

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

const STATIC_PATH = path.join(process.cwd(), "./client");
const users = new Map();

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  if (!url.includes(".") && !url.endsWith("/")) {
    url += ".html";
  }

  const paths = [STATIC_PATH, url];

  if (url.endsWith("/")) {
    paths.push("/index.html");
  }

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

// https://stackoverflow.com/questions/13364243/websocketserver-node-js-how-to-differentiate-clients
wss.getUniqueID = function () {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + "-" + s4();
};

wss.on("connection", (ws) => {
  ws.id = wss.getUniqueID();

  // When we open the websocket client, we should send all connected users.
  ws.send(
    JSON.stringify({
      allUsers: Array.from(users.entries(), (entry) => ({
        id: entry[0],
        username: entry[1],
      })),
      type: INFO_EVENT,
    })
  );

  ws.on("close", (data, reason) => {
    wss.clients.forEach(function each(client) {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(
          JSON.stringify({
            username: users.get(ws.id),
            connect: false,
            id: ws.id,
            type: CONNECTION_EVENT,
          })
        );
      }
    });

    users.delete(ws.id);
  });

  ws.on("message", (data, isBinary) => {
    const message = data.toString();
    const messageJson = JSON.parse(message);
    if (messageJson.type === CONNECTION_EVENT && messageJson.connect) {
      users.set(ws.id, messageJson.username);
      const jsonData = JSON.parse(data);
      jsonData["id"] = ws.id;
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(jsonData), { isBinary });
        }
      });
    } else {
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data.toString(), { isBinary });
        }
      });
    }
  });
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
