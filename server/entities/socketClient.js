// ------------------------------------------------------
// SOCKET CLIENT
// ------------------------------------------------------

class SocketClient {
  constructor(user, socket, room) {
    this.user = user;
    this.socket = socket;
    var self = this;
    this.socket.addEventListener('message', function(message) {
      self.user.updateActivity();
      this.onSocketMessage(self, message);
    }.bind(room));
    this.socket.addEventListener('close', function() {
      this.closeSocket(self);
    }.bind(room));
  }

  sendMessage(message) {
    try {
      this.socket.send(JSON.stringify(message));
    } catch(e) {
      console.error('SOCKET SEND ERROR (ticket  #27)');
      console.error(e);
    }
  }
}

module.exports = SocketClient
