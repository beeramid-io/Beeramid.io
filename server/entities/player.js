const Utilities = require('../libs/utilities.js')

const Room = require('./room.js')


// ------------------------------------------------------
// PLAYER
// ------------------------------------------------------

class Player {
  constructor(nickname) {
    this.id = Utilities.generateUniqueId();
    this.nickname = nickname;
    this.lastActivity = new Date();
    this.currentRoom = null;
  }

  updateActivity() {
    this.lastActivity = new Date();
  }

  joinRoom(room) {
    this.leaveCurrentRoom();
    this.currentRoom = room;
    room.playerJoined(this);
  }

  leaveRoom(room) {
    if (this.currentRoom != null && this.currentRoom == room) {
      this.currentRoom.playerLeft(this);
      this.currentRoom = null;
    }
  }

  leaveCurrentRoom() {
    if (this.currentRoom != null) {
      this.leaveRoom(this.currentRoom);
    }
  }
}

module.exports = Player
