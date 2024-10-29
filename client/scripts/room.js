const connecting = false;
let ws = null;
let user = null;

const CONNECTION_EVENT = 1;
const MESSAGE_EVENT = 2;

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
      const data = JSON.parse(event.data);
      if (data.type === CONNECTION_EVENT) {
        const { username: newUser, connect } = data;
        const userContainer = document.querySelector(".room__container-users");

        if (connect) {
          const newUserDiv = document.createElement("div");
          newUserDiv.classList.add("room__container-users--user");
          newUserDiv.innerText = newUser;
          userContainer.appendChild(newUserDiv);
        } else {
        }
      } else if (data.type === MESSAGE_EVENT) {
      }
      // message events
      // TODO: handle users sending messages
      console.log("message from server: ", event.data);
    });

    ws.addEventListener("open", () => {
      // Send a message saying that we have connected.
      ws.send(
        JSON.stringify({
          username: user,
          connect: true,
          type: CONNECTION_EVENT,
        })
      );

      // set up events for handling textarea events and allow for usage
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
    });

    ws.addEventListener("close", () => {
      // Send a message saying that we have left.
      ws.send(
        JSON.stringify({
          username: user,
          connect: false,
          type: CONNECTION_EVENT,
        })
      );
    });
  }
})();

function handleEnter() {
  const textarea = document.querySelector(".room__container-chat--input__area");

  if (ws.readyState) {
    ws.send(
      JSON.stringify({
        username: user,
        text: textarea.target.value,
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
