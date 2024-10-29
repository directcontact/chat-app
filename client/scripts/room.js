const connecting = false;
let ws = null;
let user = null;

const CONNECTION_EVENT = 1;
const MESSAGE_EVENT = 2;
const INFO_EVENT = 3;

// setup for page
(function () {
  const username = localStorage.getItem("username");

  if (username) {
    user = username;
    document.querySelector(".connect-modal").remove();
    document.querySelector(".background-filter").remove();
    ws = new WebSocket("ws://localhost:3001", "http");

    // First, lets add ourselves to the list of people in the chatroom:
    addUser(user);

    ws.addEventListener("message", (event) => {
      // Handle different types of events
      // Connection events
      const data = JSON.parse(event.data);
      console.log(data);
      if (data.type === CONNECTION_EVENT) {
        const { username: newUser, connect } = data;
        const userContainer = document.querySelector(".room__container-users");

        if (connect) {
          addUser(newUser);
        } else {
          const leavingUserDiv = document.getElementById(newUser);
          userContainer.removeChild(leavingUserDiv);
        }
      } else if (data.type === MESSAGE_EVENT) {
        const { username, text } = data;
        addMessage(username, text);
      } else if (data.type === INFO_EVENT) {
        const { usernames } = data;

        usernames.forEach((user) => {
          addUser(user);
        });
      }
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
          ws.send(
            JSON.stringify({
              username: user,
              text: e.target.value,
              type: MESSAGE_EVENT,
            })
          );
          addMessage(user, e.target.value);
        }
      });
    });
  }
})();

//** HELPER FUNCTIONS */
function addUser(username) {
  const userContainer = document.querySelector(".room__container-users");
  const newUserDiv = document.createElement("div");
  newUserDiv.classList.add("room__container-users--user");
  newUserDiv.setAttribute("id", username);
  newUserDiv.appendChild(document.createTextNode(username));
  userContainer.appendChild(newUserDiv);
}

function addMessage(username, message) {
  const messageContainer = document.querySelector(".room__container-chatarea");
  const newMessageDiv = document.createElement("div");
  newMessageDiv.classList.add("room__container-chat--message");
  newMessageDiv.appendChild(document.createTextNode(`${username}: ${message}`));
  messageContainer.appendChild(newMessageDiv);
}

//** DOM EVENT FUNCTIONS */

function handleSend() {
  if (ws.readyState) {
    ws.send(
      JSON.stringify({
        username: user,
        text: textarea.target.value,
        type: MESSAGE_EVENT,
      })
    );
  }
  const textarea = document.querySelector(".room__container-chat--input__area");
  addMessage(user, textarea.target.value);
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

    // TODO: When a user finishes setup, add their username and get all the current users
  } else {
    const error = document.querySelector(".connect-modal__error");
    error.classList.add("connect-modal__error-active");
    error.classList.remove("connect-modal__error-inactive");
  }
}
