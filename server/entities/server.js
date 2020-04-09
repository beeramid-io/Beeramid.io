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

  clean(timeout_ms) {
    var now_ms = Date.now();
    var nbUserDeleted = 0;

    this.users = this.users.filter(function(user) {
      if(now_ms - user.lastActivity.valueOf() < timeout_ms) { 
        return true;
      }
      nbUserDeleted++;
      var room = user.leaveCurrentRoom();
      if(room != null && room.isEmpty()) {
        this.deleteRoom(room); 
      }
      return false;
    }.bind(this));

    return nbUserDeleted;
  }

}

module.exports = Server
