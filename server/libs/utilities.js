// ------------------------------------------------------
// UTILITIES
// ------------------------------------------------------

class Utilities {
  // Generate 9 characters unique ID
  static generateUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }

  static containsSpecialChar(input) {
    var regex = /^[A-Za-z0-9 ]+$/
    return !regex.test(input);
  }

  static checkNickname(nickname) {
    return nickname.length > 0 && nickname.length <= 20 &&
      !this.containsSpecialChar(nickname);
  }
}

module.exports = Utilities
