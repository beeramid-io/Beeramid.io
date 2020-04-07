const Card = require('./card.js')
const Deck = require('./deck.js')
const Player = require('./player.js')

// ------------------------------------------------------
// PYRAMIDGAME
// ------------------------------------------------------

class PyramidGame {
  constructor(numberOfRows, numberOfDecks, numberOfCardsPerPlayer, players) {
    this.deck = new Deck();
    for (var deckNumber = 0; deckNumber < numberOfDecks; deckNumber++) {
      this.deck.fillWithFullGame(13, false);
    }
    this.deck.shuffle();

    this.numberOfCardsPerPlayer = numberOfCardsPerPlayer;
    players.forEach(function(player) {
      for (var cardNumber = 0; cardNumber < numberOfCardsPerPlayer; cardNumber++) {
        var card = this.deck.drawCard();
        card.discover();
        player.deck.addCard(card);
      }
    }.bind(this));

    this.rows = [];
    var rowNumber = 0;
    while (rowNumber < numberOfRows) {
      var row = new Deck();
      for (var cardNumber = 0; cardNumber <= rowNumber; cardNumber++) {
        row.addCard(this.deck.drawCard());
      }
      this.rows.push(row);
      rowNumber++;
    }

    this.currentRowNumber = numberOfRows - 1;
    this.currentCardNumber = 0;
  }

  returnNextCard() {
    var cardReturned = this.rows[this.currentRowNumber].getCardByIndex(this.currentCardNumber);
    cardReturned.discover();
    this.currentCardNumber++;
    if (this.currentCardNumber > this.currentRowNumber) {
      this.currentCardNumber = 0;
      this.currentRowNumber--;
    }
    return cardReturned;
  }

  getGameBoard() {
    var gameBoard = [];
    this.rows.forEach(function(row) {
      gameBoard.push(row.getCardInfos());
    });
    return gameBoard;
  }

  isOver() {
    return this.currentRowNumber < 0;
  }

  addPlayer(player) {
    if (this.deck.getNumberOfCards() >= this.numberOfCardsPerPlayer) {
      for (var cardNumber = 0; cardNumber < this.numberOfCardsPerPlayer; cardNumber++) {
        var card = this.deck.drawCard();
        card.discover();
        player.deck.addCard(card);
      }
      return true;
    }
    return false;
  }

  removePlayer(player) {
    while(player.deck.getNumberOfCards() > 0) {
      var card = player.deck.drawCard();
      card.cover();
      this.deck.addCard(card);
    }
    this.deck.shuffle();
  }

  // Utilities

  static checkGame(numberOfRows, numberOfDecks, numberOfCardsPerPlayer, numberOfPlayers) {
    return (numberOfRows * (numberOfRows + 1) / 2) + (numberOfCardsPerPlayer * numberOfPlayers) <=
           (numberOfDecks * 52);
  }
}

module.exports = PyramidGame
