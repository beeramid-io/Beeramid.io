// ------------------------------------------------------
// UTILITIES
// ------------------------------------------------------

// Generate 9 characters unique ID
var generateUniqueId = function () {
  return Math.random().toString(36).substr(2, 9);
};


// ------------------------------------------------------
// PLAYER
// ------------------------------------------------------

class Player {
  constructor(nickname) {
    this.id = generateUniqueId();
    this.nickname = nickname;
    this.lastConnection = new Date();
  }
}

module.exports = Player
