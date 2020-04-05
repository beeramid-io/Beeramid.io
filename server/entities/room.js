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
    if (this.users.includes(user)) {
      console.error("User " + user.id + " is already in Room " + this.id);
      return;
    }
    if (this.game != null) {
      console.error("Room " + this.id + " has a game running");
      return;
    }
    this.users.push(user);
    this.wsSendUserList();
  }

  userLeft(user) {
    if (!this.users.includes(user)) {
      console.error("User " + user.id + " is not in Room " + this.id);
      return;
    }
    this.users.splice(this.users.indexOf(user), 1);
    this.wsSendUserList();
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
        case 'runGame':
          this.wsReceiveRunGame(socketClient);
        default: 
      }
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

  wsSendRefresh() {
    this.sendToAllSocketClients({ 'message': 'refresh' });
  }

  // Client => Server

  wsReceiveRunGame(socketClient) {
    if (socketClient.user == this.ownedByUser) {
      if (!PyramidGame.checkGame(this.numberOfRows, this.numberOfDecks, this.numberOfCardsPerPlayer, this.users.length)) {
        console.error("Wrong parameters");
        return;
      }
      this.runGame();
    }
  }

  wsReceiveAmIOwner(socketClient) {
    var owning = false;
    if (socketClient.user == this.ownedByUser) {
      owning = true;
    }
    socketClient.sendMessage({ 'iAmOwner': owning });
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

}

module.exports = Room
