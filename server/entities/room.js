const User = require('./user.js')
const Utilities = require('../libs/utilities.js')

const Card = require('./pyramid/card.js')
const Deck = require('./pyramid/deck.js')
const Player = require('./pyramid/player.js')
const PyramidGame = require('./pyramid/pyramidGame.js')

// ------------------------------------------------------
// ROOM
// ------------------------------------------------------

class Room {
  constructor(ownedByUser) {
    this.id = Utilities.generateUniqueId();
    this.ownedByUser = ownedByUser;
    this.users = [];
    this.socketClients = [];

    this.game = null;

    this.numberOfRows = 5;
    this.numberOfDecks = 1;
    this.numberOfCardsPerPlayer = 4;
    this.players = null;
  }

  userJoined(user) {
    if (this.hasUser(user)) {
      console.error("User " + user.id + " is already in Room " + this.id);
      return;
    }
    if (this.game != null) {
      var player = new Player();
      if (this.game.addPlayer(player)) {
        this.users.push(user);
        this.players.set(user, player);
        this.wsSendDecks();
      } else {
        console.error("Game is full");
      }
    } else {
      this.users.push(user);
    }
    this.wsSendUserList();
  }

  userLeft(user) {
    if (!this.hasUser(user)) {
      console.error("User " + user.id + " is not in Room " + this.id);
      return;
    }
    if (this.game != null) {
      this.game.removePlayer(this.players.get(user))
      this.players.delete(user);
      this.wsSendDecks();
    }
    this.users.splice(this.users.indexOf(user), 1);
    this.changeOwnership(user);
    this.wsSendUserList();
  }

  changeOwnership(user) {
    if (user != this.ownedByUser)
      return;
    
    var nextOwner = this.users.length == 0 ? null : this.users[0];
    this.ownedByUser = nextOwner;
    this.wsSendRefresh();
  }

  hasUser(user) {
    return this.users.includes(user);
  }

  // ------------------------------------------------------
  // WEB SOCKETS
  // ------------------------------------------------------

  // Connection management

  openSocket(socketClient) {
    if (!this.socketClients.includes(socketClient)) {
      this.socketClients.push(socketClient);
    }
    this.wsSendUserList();
    if (this.game != null) {
      this.wsSendGameBoard();
    }
    else {
      this.wsSendGameParams();
    }
  }

  closeSocket(socketClient) {
    if (this.socketClients.includes(socketClient)) {
      this.socketClients.splice(this.socketClients.indexOf(socketClient), 1);
    }
  }

  sendToAllSocketClients(message) {
    this.socketClients.forEach(function(socketClient) {
      socketClient.sendMessage(message);
    });
  }

  onSocketMessage(socketClient, message) {
    var data = JSON.parse(message.data);
    
    if (typeof data['message'] !== 'undefined') {
      switch (data['message']) {
        case 'amIOwner':
          this.wsReceiveAmIOwner(socketClient);
          break;
        case 'needWholeGame':
          this.wsReceiveNeedWholeGame(socketClient);
          break;
        case 'needDecks':
          this.wsReceiveNeedDecks(socketClient);
          break;
        case 'needGameBoard':
          this.wsReceiveNeedGameBoard(socketClient);
          break;
        case 'returnNextCard':
          this.wsReceiveReturnNextCard(socketClient);
          break;
        case 'returnCardDeck':
          this.wsReceiveReturnCardDeck(socketClient, data);
          break;
        case 'runGame':
          this.wsReceiveRunGame(socketClient);
          break;
        default:
          console.error("Unknown message " + data['message']);
      }
    }

    if (typeof data['addToGameParameter'] !== 'undefined') {
      this.wsReceiveAddToGameParameter(socketClient, data['addToGameParameter']);
    }
  }

  // Communication API

  // Server => Client

  wsSendUserList() {
    var users = [];
    this.users.forEach(function(user) {
      users.push({ 'id': user.id, 'nickname': user.nickname });
    });
    this.sendToAllSocketClients({ 'users': users });
  }

  wsSendGameParams() {
    var gameParams = {
      'decksInGame': this.numberOfDecks,
      'cardsPerPlayer': this.numberOfCardsPerPlayer,
      'rowsInThePyramid': this.numberOfRows
    };
    this.sendToAllSocketClients({ 'gameParams': gameParams });
  }

  wsSendRefresh() {
    this.sendToAllSocketClients({ 'message': 'refresh' });
  }

  wsSendGameBoard() {
    this.sendToAllSocketClients({ 'gameBoard': this.game.getGameBoard() })
  }

  wsSendDecks() {
    this.socketClients.forEach(function(socketClient) {
      this.wsReceiveNeedDecks(socketClient);
    }.bind(this));
  }

  // Client => Server

  wsReceiveRunGame(socketClient) {
    if (socketClient.user != this.ownedByUser) {
      console.error("Forbidden");
      return;
    }
    if (this.game != null) {
      console.error("There is already a game running");
      return;
    }
    if (!PyramidGame.checkGame(this.numberOfRows, this.numberOfDecks, this.numberOfCardsPerPlayer, this.users.length)) {
      console.error("Wrong parameters");
      return;
    }
    this.runGame();
  }

  wsReceiveAddToGameParameter(socketClient, data) {
    if (socketClient.user != this.ownedByUser) {
      console.error("Forbidden");
      return;
    }
    if (this.game != null) {
      console.error("There is already a game running");
      return;
    }
    
    var value = data['value'];

    var newNumberOfDecks          = this.numberOfDecks;
    var newNumberOfCardsPerPlayer = this.numberOfCardsPerPlayer;
    var newNumberOfRows           = this.numberOfRows;

    switch(data['param']) {
      case 'decksInGame':
        newNumberOfDecks += data['value'];
        break;
      case 'cardsPerPlayer':
        newNumberOfCardsPerPlayer += data['value'];
        break;
      case 'rowsInThePyramid':
        newNumberOfRows += data['value'];
        break;
    }

    if (newNumberOfDecks < 1) {
      newNumberOfDecks = 1;
    }
    if (newNumberOfDecks > 6) {
      newNumberOfDecks = 6;
    }

    if (newNumberOfCardsPerPlayer < 1) {
      newNumberOfCardsPerPlayer = 1;
    }
    if (newNumberOfCardsPerPlayer > 10) {
      newNumberOfCardsPerPlayer = 10;
    }

    if (newNumberOfRows < 1) {
      newNumberOfRows = 1;
    }
    if (newNumberOfRows > 12) {
      newNumberOfRows = 12;
    }

    this.numberOfDecks = newNumberOfDecks;
    this.numberOfCardsPerPlayer = newNumberOfCardsPerPlayer;
    this.numberOfRows = newNumberOfRows;

    this.wsSendGameParams();
  }

  wsReceiveAmIOwner(socketClient) {
    var owning = false;
    if (socketClient.user == this.ownedByUser) {
      owning = true;
    }
    socketClient.sendMessage({ 'iAmOwner': owning });
  }

  wsReceiveNeedGameBoard(socketClient) {
    if (this.game == null) {
      console.error("There is no game");
      return;
    }
    socketClient.sendMessage({ 'gameBoard': this.game.getGameBoard() });
  }

  wsReceiveNeedWholeGame(socketClient) {
    if (this.game == null) {
      console.error("There is no game");
      return;
    }
    
    this.wsReceiveNeedGameBoard(socketClient);
    this.wsReceiveNeedDecks(socketClient);
  }

  wsReceiveNeedDecks(socketClient) {
    if (this.game == null) {
      console.error("There is no game");
      return;
    }

    var decks = [];
    this.players.forEach(function(player, user, map) {
      decks.push({'nickname': user.nickname, 'deck': player.deck.getCardInfos(), 'yourDeck': (socketClient.user == user)});
    });

    socketClient.sendMessage({ 'decks': decks });
  }

  wsReceiveReturnNextCard(socketClient) {
    if (socketClient.user != this.ownedByUser) {
      console.error("Forbidden");
      return;
    }
    if (this.game == null) {
      console.error("There is no game");
      return;
    }
    if (!this.game.isOver()) {
      this.game.returnNextCard();
      this.wsSendGameBoard();
    }
    else {
      this.stopGame();
    }
  }

  wsReceiveReturnCardDeck(socketClient, data) {
    if (this.game == null) {
      console.error("There is no game");
      return;
    }
    var userDeck = this.players.get(socketClient.user).deck;
    var card = userDeck.getCardById(data.cardId);
    if (card == null) {
      console.error("Forbidden");
      return;
    }
    card.toggle();
    this.wsSendDecks();
  }

  // Game management

  runGame() {
    this.players = new Map();
    this.users.forEach(function(user) {
      this.players.set(user, new Player());
    }.bind(this));
    this.game = new PyramidGame(this.numberOfRows, this.numberOfDecks, this.numberOfCardsPerPlayer, this.players);
    this.wsSendRefresh();
  }

  stopGame() {
    this.players = null;
    this.game = null;
    this.wsSendRefresh();
  }

}

module.exports = Room
