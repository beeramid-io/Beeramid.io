const Card = require('./card.js')
const Deck = require('./deck.js')
const Player = require('./player.js')

// ------------------------------------------------------
// PYRAMIDGAME
// ------------------------------------------------------

class PyramidGame {
  constructor(numberOfRows, numberOfDecks, players) {
    this.deck = new Deck();
    for (var deckNumber = 0; deckNumber < numberOfDecks; deckNumber++) {
      this.deck.fillWithFullGame(13, false);
    }
    this.deck.shuffle();

    players.forEach(function(player) {
      var card = this.deck.drawCard();
      card.discover();
      player.deck.addCard(card);
    });

    this.rows = [];
    var rowNumber = 0;
    while (rowNumber < numberOfRows) {
      var row = [];
      for (cardNumber = 0; cardNumber <= rowNumber; cardNumber++) {
        row.push(this.deck.drawCard());
      }
      rowNumber++;
    }

    this.currentRowNumber = numberOfRows - 1;
    this.currentCardNumber = 0;
  }

  returnNextCard() {
    this.rows[this.currentRowNumber][this.currentCardNumber].discover();
    this.currentCardNumber++;
    if (this.currentCardNumber > this.currentRowNumber) {
      this.currentCardNumber = 0;
      this.currentRowNumber--;
    }
  }
}