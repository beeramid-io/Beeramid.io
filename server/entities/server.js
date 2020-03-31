const Player = require('./player.js')


// ------------------------------------------------------
// SERVER
// ------------------------------------------------------

class Server {
  constructor() {
    this.players = [];
  }

  getPlayer(id) {
    var foundPlayer = null;
    this.players.forEach(function(player) {
      if (id == player.id) {
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
}

module.exports = Server
