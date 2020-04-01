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
    this.wsSendPlayerList();
  }

  playerLeft(player) {
    if (this.players.includes(player)) {
      this.players.splice(this.players.indexOf(player), 1);
    } else {
      console.error("Player " + player.id + " was not in Room " + this.id);
    }
    this.wsSendPlayerList();
  }

  // ------------------------------------------------------
  // WEB SOCKETS
  // ------------------------------------------------------

  // Connection management

  openSocket(socketClient) {
    this.socketClients.push(socketClient);
    this.wsSendPlayerList();
  }

  closeSocket(socketClient) {
    this.socketClients.splice(this.socketClients.indexOf(socketClient), 1);
  }

  onSocketMessage(socketClient, message) {
    var data = JSON.parse(message.data);
    console.log(data);
  }

  sendToAllSocketClients(message) {
    this.socketClients.forEach(function(socketClient) {
      socketClient.sendMessage(message);
    });
  }

  // Communication API

  wsSendPlayerList() {
    var players = [];
    this.players.forEach(function(player) {
      players.push({ 'id': player.id, 'nickname': player.nickname });
    });
    this.sendToAllSocketClients({ 'players': players });
  }

}

module.exports = Room
