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
    var room = new Room(this, ownedByUser);
    this.rooms.push(room);
    return room;
  }

  deleteRoom(room) {
    var roomIndex = this.rooms.indexOf(room);
    if (roomIndex != -1) {
      this.rooms.splice(roomIndex, 1);
    }
  }

  deleteUser(user) {
    var room = user.leaveCurrentRoom();
    if(room != null && room.isEmpty()) {
      this.deleteRoom(room); 
    }
    this.users = this.users.filter(function(u) { return user != u });
  }

  clean(timeout_ms) {
    var now_ms = Date.now();
    var nbUserDeleted = 0;

    this.users = this.users.filter(function(user) {
      if(now_ms - user.lastActivity < timeout_ms) { 
        return true;
      }
      nbUserDeleted++;
      user.leaveCurrentRoom();
      return false;
    }.bind(this));

    return nbUserDeleted;
  }

}

module.exports = Server
