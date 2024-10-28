const connecting = false;

// setup for page
(function () {
  const username = localStorage.getItem("username");

  if (username) {
    document.querySelector(".connect-modal").remove();
    document.querySelector(".background-filter").remove();
    const ws = new WebSocket("ws://localhost:3001", "http");
    ws.onopen = () => {
      console.log("ws opened on browser");
    };
    ws.onmessage = (message) => {
      console.log(`message received`, message.data);
    };
  }
})(async function () {
  // const ws = await connectToWss();
  // ws.send("Test");
  // ws.onerror = (e) => {
  //   console.log(e);
  // };
  // ws.onopen = () => {
  //   console.log("ws opened on browser");
  // };
  // ws.onmessage = (message) => {
  //   console.log(`message received`, message.data);
  // };
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

function handleConnect() {
  const username = document.querySelector(".connect-modal__name");
  if (username.value) {
    const error = document.querySelector(".connect-modal__error");
    error.classList.remove("connect-modal__error-active");
    error.classList.add("connect-modal__error-inactive");
    localStorage.setItem("username", username.value);
    document.querySelector(".connect-modal").remove();
    document.querySelector(".background-filter").remove();
  } else {
    const error = document.querySelector(".connect-modal__error");
    error.classList.add("connect-modal__error-active");
    error.classList.remove("connect-modal__error-inactive");
  }
}
