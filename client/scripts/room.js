const connecting = false;
let ws = null;
let user = null;

const CONNECTION_EVENT = "CONNECTION_EVENT";
const MESSAGE_EVENT = "MESSAGE_EVENT";

// setup for page
(function () {
  const username = localStorage.getItem("username");

  if (username) {
    user = username;
    document.querySelector(".connect-modal").remove();
    document.querySelector(".background-filter").remove();
    ws = new WebSocket("ws://localhost:3001", "http");

    ws.addEventListener("message", (event) => {
      // Handle different types of events
      // Connection events
      // TODO: handle users connecting into the room
      // message events
      // TODO: handle users sending messages
      console.log("message from server: ", event.data);
    });

    new Promise((resolve) => {
      const interval = setInterval(() => {
        if (ws.readyState === 1) {
          resolve(ws);
        }
      }, 1000);
    }).then((ws) => {
      if (ws.readyState) {
        // set up events for handling elements on the page
        const textarea = document.querySelector(
          ".room__container-chat--input__area"
        );
        textarea.removeAttribute("disabled");
        textarea.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            // TODO: don't let users send empty messages
            ws.send(JSON.stringify({ username: user, text: e.target.value }));
          }
        });
      }
    });
  }
})();

function handleEnter() {
  if (ws.readyState) {
    ws.send(
      JSON.stringify({
        username: user,
        text: document.querySelector(".room__container-chat--input__area")
          .target.value,
      })
    );
  }
}

function handleSend() {}

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
