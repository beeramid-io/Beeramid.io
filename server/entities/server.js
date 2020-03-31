const Player = require('./player.js')
const Room = require('./room.js')


// ------------------------------------------------------
// SERVER
// ------------------------------------------------------

class Server {
  constructor() {
    this.players = [];
    this.rooms = [];
  }

  getPlayer(id) {
    var foundPlayer = null;
    this.players.forEach(function(player) {
      if (id == player.id) {
        player.updateActivity()
        foundPlayer = player;
      }
    });
    return foundPlayer;
  }

  addPlayer(nickname) {
    var player = new Player(nickname);
    this.players.push(player);
    return player;
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

  addRoom(ownedByPlayer) {
    var room = new Room(ownedByPlayer);
    this.rooms.push(room);
    return room;
  }
}

module.exports = Server
