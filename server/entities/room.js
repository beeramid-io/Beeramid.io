const Player = require('./player.js')
const Utilities = require('../libs/utilities.js')

// ------------------------------------------------------
// ROOM
// ------------------------------------------------------

class Room {
  constructor(ownedByPlayer) {
    this.id = Utilities.generateUniqueId();
    this.ownedByPlayer = ownedByPlayer;
    this.players = [];
    this.socketClients = [];
  }

  playerJoined(player) {
    if (!this.players.includes(player)) {
      this.players.push(player);
    } else {
      console.error("Player " + player.id + " was already in Room " + this.id);
    }
  }

  playerLeft(player) {
    if (this.players.includes(player)) {
      this.players.splice(this.players.indexOf(player));
    } else {
      console.error("Player " + player.id + " was not in Room " + this.id);
    }
  }

  // SOCKETS

  openSocket(socketClient) {
    console.log("Opened socket");
    console.log(socketClient);
    this.socketClients.push(socketClient);
  }

  closeSocket(socketClient) {
    console.log("Closed socket");
    console.log(socketClient);
    this.socketClients.splice(this.socketClients.indexOf(socketClient));
  }

  onSocketMessage(socketClient, message) {
    console.log(socketClient);
    var data = JSON.parse(message.data);
    console.log(data);
  }

}

module.exports = Room
