import { genUniqueId } from "./utils/idGen.js";

async function setup() {
  const request = await fetch("/api/room");
  const res = await request.json();
  if (res.length) {
    res.map((room) => {
      const { name, id } = room;
      addNewRoomElement(name, id);
    });
  }
}

function toggleNewRoomModal() {
  const backgroundFilter = document.querySelector(".background-filter");
  const newRoomModal = document.querySelector(".new-room-modal");

  if (
    backgroundFilter.classList.contains("disabled") &&
    newRoomModal.classList.contains("disabled")
  ) {
    backgroundFilter.classList.remove("disabled");
    newRoomModal.classList.remove("disabled");
  } else {
    backgroundFilter.classList.add("disabled");
    newRoomModal.classList.add("disabled");
  }
}

function handleCreateNewChatroom() {
  const roomname = document.querySelector(".new-room-modal__name");
  if (roomname.value) {
    const error = document.querySelector(".new-room-modal__error");
    error.classList.remove("new-room-modal__error-active");
    error.classList.add("new-room-modal__error-inactive");
    const id = genUniqueId();
    fetch("/api/room", {
      method: "POST",
      body: JSON.stringify({ id, name: roomname.value }),
    });
    addNewRoomElement(roomname.value, id);
    roomname.value = "";
    toggleNewRoomModal();
  } else {
    const error = document.querySelector(".new-room-modal__error");
    error.classList.add("new-room-modal__error-active");
    error.classList.remove("new-room-modal__error-inactive");
  }
}

function addNewRoomElement(name, id) {
  const roomContainerDiv = document.querySelector(".home__rooms");
  const newRoomDiv = document.createElement("div");
  newRoomDiv.classList.add("home__rooms-room");
  newRoomDiv.onclick = () => {
    window.location = `/room?id=${id}&name=${name}`;
  };
  newRoomDiv.appendChild(document.createTextNode(name));

  roomContainerDiv.appendChild(newRoomDiv);
}

// Since its a module type, make the functions available to the window.
window.toggleNewRoomModal = toggleNewRoomModal;
window.handleCreateNewChatroom = handleCreateNewChatroom;

setup();
