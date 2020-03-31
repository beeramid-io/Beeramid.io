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
}

module.exports = Room
