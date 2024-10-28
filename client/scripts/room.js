const ws = new WebSocket("ws://localhost:3001", "http");

ws.onerror = (e) => {
  console.log(e);
};

ws.onopen = () => {
  console.log("ws opened on browser");
};

ws.onmessage = (message) => {
  console.log(`message received`, message.data);
};

