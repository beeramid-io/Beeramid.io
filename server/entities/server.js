const User = require('./user.js')
const Room = require('./room.js')


// ------------------------------------------------------
// SERVER
// ------------------------------------------------------

class Server {
  constructor() {
    this.users = [];
    this.rooms = [];
  }

  getUser(id) {
    var foundUser = null;
    this.users.forEach(function(user) {
      if (id == user.id) {
        user.updateActivity()
        foundUser = user;
      }
    });
    return foundUser;
  }

  addUser(nickname) {
    var user = new User(nickname);
    this.users.push(user);
    return user;
  }

  getRoom(id) {
    var foundRoom = null;
    this.rooms.forEach(function(room) {
      if (id == room.id) {
        foundRoom = room;
      }
    });
    return foundRoom;
  }

  addRoom(ownedByUser) {
    var room = new Room(ownedByUser);
    this.rooms.push(room);
    return room;
  }

  deleteRoom(room) {
    var roomIndex = this.rooms.indexOf(room);
    if (roomIndex != -1) {
      this.rooms.splice(roomIndex, 1);
    }
  }
}

module.exports = Server
