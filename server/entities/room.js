const User = require('./user.js')
const Utilities = require('../libs/utilities.js')

// ------------------------------------------------------
// ROOM
// ------------------------------------------------------

class Room {
  constructor(ownedByUser) {
    this.id = Utilities.generateUniqueId();
    this.ownedByUser = ownedByUser;
    this.users = [];
    this.socketClients = [];
  }

  userJoined(user) {
    if (!this.users.includes(user)) {
      this.users.push(user);
    } else {
      console.error("User " + user.id + " was already in Room " + this.id);
    }
    this.wsSendUserList();
  }

  userLeft(user) {
    if (this.users.includes(user)) {
      this.users.splice(this.users.indexOf(user), 1);
    } else {
      console.error("User " + user.id + " was not in Room " + this.id);
    }
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

  onSocketMessage(socketClient, message) {
    var data = JSON.parse(message.data);
    console.log(data);
  }

  sendToAllSocketClients(message) {
    this.socketClients.forEach(function(socketClient) {
      socketClient.sendMessage(message);
    });
  }

  // Communication API

  wsSendUserList() {
    var users = [];
    this.users.forEach(function(user) {
      users.push({ 'id': user.id, 'nickname': user.nickname });
    });
    this.sendToAllSocketClients({ 'users': users });
  }

}

module.exports = Room
