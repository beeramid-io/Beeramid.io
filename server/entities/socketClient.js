// ------------------------------------------------------
// SOCKET CLIENT
// ------------------------------------------------------

class SocketClient {
    constructor(player, socket, onMessage, onClose) {
        this.player = player;
        this.socket = socket;
        this.socket.addEventListener('message', function(message) {
            onMessage(this, message);
        });
        this.socket.addEventListener('close', function() {
            onClose(this);
        });
    }

    sendMessage(message) {
        this.socket.send(JSON.stringify(message));
    }
}

module.exports = SocketClient
