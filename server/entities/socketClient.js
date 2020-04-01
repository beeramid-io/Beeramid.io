// ------------------------------------------------------
// SOCKET CLIENT
// ------------------------------------------------------

class SocketClient {
    constructor(player, socket, room) {
        this.player = player;
        this.socket = socket;
        this.socket.addEventListener('message', function(message) {
            room.onSocketMessage(this, message);
        });
        this.socket.addEventListener('close', function() {
            room.closeSocket(this);
        });
    }

    sendMessage(message) {
        this.socket.send(JSON.stringify(message));
    }
}

module.exports = SocketClient
