const Utilities = require('../libs/utilities.js')

const Room = require('./room.js')


// ------------------------------------------------------
// USER
// ------------------------------------------------------

class User {
  constructor(nickname) {
    this.id = Utilities.generateUniqueId();
    this.nickname = nickname;
    this.firstActivity = Date.now();
    this.lastActivity = Date.now();
    this.currentRoom = null;
  }

  updateActivity() {
    this.lastActivity = Date.now();
  }

  joinRoom(room) {
    this.leaveCurrentRoom();
    room.userJoined(this);
    if (room.hasUser(this)) {      
      this.currentRoom = room;
    }
  }

  leaveRoom(room) {
    var currentRoom = this.currentRoom;
    if (this.currentRoom != null && this.currentRoom == room) {
      this.currentRoom.userLeft(this);
      this.currentRoom = null;
    }
    return currentRoom;
  }

  leaveCurrentRoom() {
    if (this.currentRoom != null) {
      return this.leaveRoom(this.currentRoom);
    }
    return null;
  }
}

module.exports = User
