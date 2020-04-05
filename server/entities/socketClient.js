// ------------------------------------------------------
// SOCKET CLIENT
// ------------------------------------------------------

class SocketClient {
  constructor(user, socket, room) {
    this.user = user;
    this.socket = socket;
    var self = this;
    this.socket.addEventListener('message', function(message) {
      this.onSocketMessage(self, message);
    }.bind(room));
    this.socket.addEventListener('close', function() {
      this.closeSocket(self);
    }.bind(room));
  }

  sendMessage(message) {
    this.socket.send(JSON.stringify(message));
  }
}

module.exports = SocketClient
