import * as fs from "node:fs";
import * as http from "node:http";
import * as path from "node:path";
import { WebSocket, WebSocketServer } from "ws";
import {
  CONNECTION_EVENT,
  MESSAGE_EVENT,
  INFO_EVENT,
  CHANGE_EVENT,
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

// Path for all of the client-side files
const STATIC_PATH = path.join(process.cwd(), "./client");

// State for connected websocket clients alongside usernames.
/**
 * Users will be state for holding connected websocket clients
 *  @type {Map<string, string>}
 */
const users = new Map();

/**
 * Rooms will be state for holding chatrooms, the first parameter being
 * the actual string representation of id of the room, and the second
 * parameter being the name of the chatroom.
 * @type {Map<string, string>}
 */
const rooms = new Map();

const toBool = [() => true, () => false];

const prepareFile = async (rawUrl) => {
  let [url, params] = rawUrl.split("?");

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
  let found = !pathTraversal && exists;

  if (params) {
    const paramParts = params.split("=");
    const id = paramParts[1].split("&")[0];
    found = rooms.get(id);
  }

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

  ws.on("close", (data, reason) => {
    wss.clients.forEach(function each(client) {
      // When we close a connection, notify all other clients that this connection is closed.
      if (
        client !== ws &&
        client.readyState === WebSocket.OPEN &&
        client.roomId === ws.roomId
      ) {
        client.send(
          JSON.stringify({
            username: ws.username,
            connect: false,
            id: ws.id,
            type: CONNECTION_EVENT,
          })
        );
      }
    });
  });

  ws.on("message", (data, isBinary) => {
    const message = data.toString();
    const messageJson = JSON.parse(message);
    // If this is a connection type event, and they are connecting, lets append some data like the ws id.
    if (messageJson.type === CONNECTION_EVENT && messageJson.connect) {
      ws.username = messageJson.username;
      ws.roomId = messageJson.roomId;
      const jsonData = JSON.parse(data);
      jsonData["id"] = ws.id;

      // Send information about other clients to currnet client
      // When we open the websocket client, we should send all connected users.
      const clientsInCurrentRoom = Array.from(wss.clients).filter(
        (client) => client.roomId === ws.roomId
      );
      ws.send(
        JSON.stringify({
          allUsers: clientsInCurrentRoom.map((connectedWS) => ({
            id: connectedWS.id,
            username: connectedWS.username,
          })),
          type: INFO_EVENT,
        })
      );

      wss.clients.forEach(function each(client) {
        if (
          client !== ws &&
          client.readyState === WebSocket.OPEN &&
          client.roomId === ws.roomId
        ) {
          client.send(JSON.stringify(jsonData), { isBinary });
        }
      });

      // Otherwise, lets just broadcast this msg out to the other websocket clients.
    } else {
      wss.clients.forEach(function each(client) {
        if (
          client !== ws &&
          client.readyState === WebSocket.OPEN &&
          client.roomId === ws.roomId
        ) {
          client.send(data.toString(), { isBinary });
        }
      });
    }
  });
});

const server = http.createServer(async (req, res) => {
  // Only for page reqs, not actual API reqs
  if (!req.url.includes("/api")) {
    const file = await prepareFile(req.url);
    const statusCode = file.found ? 200 : 404;
    const mimeType = MIME_TYPES[file.ext] || MIME_TYPES.default;
    res.writeHead(statusCode, { "Content-Type": mimeType });
    file.stream.pipe(res);
    console.log(`${req.method} ${req.url} ${statusCode}`);
  }
});

server.on("request", (req, res) => {
  let statusCode;
  if (req.url === "/api/room" && req.method === "GET") {
    statusCode = 200;
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify(
        Array.from(rooms.entries(), (entry) => ({
          id: entry[0],
          name: entry[1],
        }))
      )
    );
  } else if (req.url === "/api/room" && req.method === "POST") {
    statusCode = 200;
    let jsonString = "";
    req.on("data", (data) => {
      jsonString += data;
    });
    req.on("end", () => {
      try {
        const { id, name } = JSON.parse(jsonString);
        rooms.set(id, name);
      } catch (e) {
        statusCode = 404;
      }
    });

    res.writeHead(statusCode);
    res.end();
  } else {
    statusCode = 404;
  }

  console.log(`${req.method} ${req.url} ${statusCode}`);
});

server.listen(PORT);
