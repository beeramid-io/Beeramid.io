const Utilities = require('../libs/utilities.js')


// ------------------------------------------------------
// PLAYER
// ------------------------------------------------------

class Player {
  constructor(nickname) {
    this.id = Utilities.generateUniqueId();
    this.nickname = nickname;
    this.lastConnection = new Date();
  }
}

module.exports = Player
