const connecting = false;

(async function () {
  const ws = await connectToWss();
  ws.send("Test");

  ws.onerror = (e) => {
    console.log(e);
  };

  ws.onopen = () => {
    console.log("ws opened on browser");
  };

  ws.onmessage = (message) => {
    console.log(`message received`, message.data);
  };
});

async function connectToWss() {
  const ws = new WebSocket("ws://localhost:3001", "http");

  return new Promise((resolve, reject) => {
    connecting = true;
    const timer = setInterval(() => {
      if (ws.readyState === 1) {
        clearInterval(timer);
        resolve(ws);
        connecting = false;
      }
    }, 10);
  });
}
