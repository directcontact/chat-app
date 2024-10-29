import svg from "./icons/user.js";

// Some global variables holding state
let ws = null;
let self = null;
let roomName = null;
let roomId = null;

// Connection enum map
const CONNECTION_EVENT = 1;
const MESSAGE_EVENT = 2;
const INFO_EVENT = 3;

// setup for page
function setup() {
  const username = localStorage.getItem("username");

  if (username) {
    // Set the local state for username
    self = username;
    // Remove the modals when username is already set.
    document.querySelector(".connect-modal").remove();
    document.querySelector(".background-filter").remove();
    ws = new WebSocket("ws://localhost:3001", "http");

    ws.addEventListener("message", (event) => {
      // Handle different types of events
      const data = JSON.parse(event.data);
      // Connection events
      if (data.type === CONNECTION_EVENT) {
        const { username: newUser, connect, id } = data;
        const userContainer = document.querySelector(
          ".room__container-users--row"
        );

        // If they are connecting, add the user
        if (connect) {
          addUser(newUser, id);
        } else {
          // Otherwise, remove the user.
          const leavingUserDiv = document.getElementById(id);
          userContainer.removeChild(leavingUserDiv);
        }
        // Message events
      } else if (data.type === MESSAGE_EVENT) {
        const { username, text } = data;
        // There are two types of messaging events, typing message event or just a message
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
        // Info events
      } else if (data.type === INFO_EVENT) {
        const { allUsers } = data;
        // add all the users that we are aware of.
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
          roomId,
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

      // Handle when a user is typing or not, if the textarea is empty, no longer typing, otherwise, typing
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

  const params = new URLSearchParams(window.location.search);

  for (const [key, value] of params) {
    if (key === "name") {
      roomName = value;
    } else if (key === "id") {
      roomId = value;
    }
  }

  const chatroomNameDiv = document.querySelector(".room__header-text");
  chatroomNameDiv.appendChild(document.createTextNode(roomName));
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

function handleBackBtn() {
  window.location = "/";
}

window.handleConnect = handleConnect;
window.handleBackBtn = handleBackBtn;
setup();
