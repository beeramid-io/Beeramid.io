// ------------------------------------------------------
// CARD
// ------------------------------------------------------

class Card {
  constructor(color, value, discovered) {
    this.color = color;
    this.value = value;
    this.discovered = discovered;
  }

  cover() {
    this.discovered = false;
  }

  discover() {
    this.discovered = true;
  }

  getName() {
    if (!this.discovered) {
      return 'covered';
    }

    var colorName = '';
    switch(this.color) {
      case 0:
        colorName = 'club';
        break;
      case 1:
        colorName = 'diamond';
        break;
      case 2:
        colorName = 'heart';
        break;
      default:
        colorName = 'spade';
    }

    var valueName = '';
    switch(this.value) {
      case 0:
        valueName = 'ace';
        break;
      case 1:
        valueName = 'king';
        break;
      case 2:
        valueName = 'queen';
        break;
      case 3:
        valueName = 'jack';
        break;
      default:
        valueName = (14 - this.value).toString();
    }

    return colorName + '-' + valueName;
  }
}

module.exports = Card
