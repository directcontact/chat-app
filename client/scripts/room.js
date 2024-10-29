import svg from "./icons/user.js";

let ws = null;
let self = null;

const CONNECTION_EVENT = 1;
const MESSAGE_EVENT = 2;
const INFO_EVENT = 3;

// setup for page
function setup() {
  const username = localStorage.getItem("username");

  if (username) {
    self = username;
    document.querySelector(".connect-modal").remove();
    document.querySelector(".background-filter").remove();
    ws = new WebSocket("ws://localhost:3001", "http");

    // First, lets add ourselves to the list of people in the chatroom:
    addUser(self);

    ws.addEventListener("message", (event) => {
      // Handle different types of events
      // Connection events
      const data = JSON.parse(event.data);
      if (data.type === CONNECTION_EVENT) {
        const { username: newUser, connect, id } = data;
        const userContainer = document.querySelector(
          ".room__container-users--row"
        );

        if (connect) {
          addUser(newUser, id);
        } else {
          const leavingUserDiv = document.getElementById(id);
          userContainer.removeChild(leavingUserDiv);
        }
      } else if (data.type === MESSAGE_EVENT) {
        const { username, text } = data;
        if (data.typing !== undefined) {
          const typingUserDiv = document.getElementById(username);
          if (data.typing) {
            typingUserDiv.classList.add("typing");
          } else {
            typingUserDiv.classList.remove("typing");
          }
        } else {
          addMessage(username, text);
        }
      } else if (data.type === INFO_EVENT) {
        const { allUsers } = data;
        allUsers.map((user) => {
          addUser(user.username, user.id);
        });
      }
      console.log("message from server: ", event.data);
    });

    ws.addEventListener("open", () => {
      // Send a message saying that we have connected.
      ws.send(
        JSON.stringify({
          username: self,
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
        // If they're trying to shift enter, allow this action.
        if (e.key === "Enter" && e.shiftKey) {
          // Otherwise,
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (e.target.value) {
            ws.send(
              JSON.stringify({
                username: self,
                text: e.target.value,
                type: MESSAGE_EVENT,
              })
            );
            addMessage(self, e.target.value);
            e.target.value = "";
          }
        }
      });

      textarea.addEventListener("keyup", (e) => {
        if (!e.target.value) {
          ws.send(
            JSON.stringify({
              username: self,
              text: "",
              type: MESSAGE_EVENT,
              typing: false,
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              username: self,
              text: "",
              type: MESSAGE_EVENT,
              typing: true,
            })
          );
        }
      });
    });
  }
}

//** HELPER FUNCTIONS */
function addUser(username, id) {
  const userContainer = document.querySelector(".room__container-users--row");
  const newUserDiv = document.createElement("div");
  // If self, use different class to differentiate.
  if (username === self) {
    newUserDiv.classList.add("room__container-users--row---entry----self");
  } else {
    newUserDiv.classList.add("room__container-users--row---entry");
  }
  newUserDiv.setAttribute("id", id);
  newUserDiv.innerHTML = svg;
  newUserDiv.appendChild(document.createTextNode(username));
  userContainer.appendChild(newUserDiv);
}

function addMessage(username, message) {
  const messageContainer = document.querySelector(".room__container-chatarea");
  const newMessageDiv = document.createElement("div");
  newMessageDiv.classList.add("room__container-chat--message");

  const newUsernameDiv = document.createElement("div");
  newUsernameDiv.classList.add("room__container-chat--message---username");
  const newTextDiv = document.createElement("div");
  newTextDiv.classList.add("room__container-chat--message---text");

  // If self, use different class to differentiate.
  if (username === self) {
    newTextDiv.classList.add("room__container-chat--message---text----self");
    newMessageDiv.classList.add("room__container-chat--message---self");
  }

  // If there are newlines, break by the newlines
  const splitMsgs = message.split("\n");
  const newBrokenMsgs = splitMsgs.join("<br />");

  // Use innerHTML to allow for the linebreaks to show.
  newTextDiv.innerHTML = `${newBrokenMsgs}`;

  newUsernameDiv.appendChild(document.createTextNode(username));

  newMessageDiv.appendChild(newUsernameDiv);
  newMessageDiv.appendChild(newTextDiv);

  messageContainer.appendChild(newMessageDiv);
}

//** DOM EVENT FUNCTIONS */

function handleConnect() {
  const username = document.querySelector(".connect-modal__name");
  if (username.value) {
    const error = document.querySelector(".connect-modal__error");
    error.classList.remove("connect-modal__error-active");
    error.classList.add("connect-modal__error-inactive");
    localStorage.setItem("username", username.value);

    setup();
  } else {
    const error = document.querySelector(".connect-modal__error");
    error.classList.add("connect-modal__error-active");
    error.classList.remove("connect-modal__error-inactive");
  }
}

setup();
