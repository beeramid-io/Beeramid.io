const Card = require('../libs/card.js')
const Deck = require('../libs/deck.js')

// ------------------------------------------------------
// PLAYER
// ------------------------------------------------------

class Player {
  constructor() {
    this.deck = new Deck();
  }
}