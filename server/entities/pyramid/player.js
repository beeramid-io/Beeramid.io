const Card = require('./card.js')
const Deck = require('./deck.js')

// ------------------------------------------------------
// PLAYER
// ------------------------------------------------------

class Player {
  constructor() {
    this.deck = new Deck();
  }
}

module.exports = Player
