const Card = require('./card.js')

// ------------------------------------------------------
// DECK
// ------------------------------------------------------

class Deck {
  constructor() {
    this.cards = [];
  }

  // numberOfCards per color: 13 for 52 cards, 8 for 32 cards
  fillWithFullGame(numberOfCards, discovered) {
    for (var color = 0; color < 4; color++) {
      for (var value = 0; value < numberOfCards; value++) {
        this.cards.push(new Card(color, value, discovered));
      }
    }
  }

  shuffle() {
    var shuffledCards = [];
    while (this.cards.length) {
      var indexToPick = Math.floor(Math.random() * this.cards.length);
      shuffledCards.push(this.cards[indexToPick]);
      this.cards.splice(indexToPick, 1);
    }
    this.cards = shuffledCards;
  }

  drawCard() {
    var index = this.cards.length - 1;
    var card = this.cards[index];
    this.cards.splice(index, 1);
    return card;
  }

  addCard(card) {
    this.cards.push(card);
  }

  getCardByIndex(index) {
    return this.cards[index];
  }

  getCardById(cardId) {
    var card = null;
    this.cards.forEach(function(c) {
      if(cardId == c.id) {
        card = c;
      }
    });
    return card;
  }

  getCardInfos() {
    var cardInfos = [];
    this.cards.forEach(function(card) {
      cardInfos.push({'id': card.id, 'name': card.getName()});
    });
    return cardInfos;
  }
}

module.exports = Deck
