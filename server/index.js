const express = require('express');
const path = require('path');
const bodyParser = require('cookie-parser');
const cookieParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser());
app.use(cookieParser());

const ws = require('express-ws')(app);

const Utilities = require('./libs/utilities.js')

const Player = require('./entities/player.js')
const Server = require('./entities/server.js')
const Room = require('./entities/room.js')
const SocketClient = require('./entities/socketClient.js')

// ------------------------------------------------------
// UTILITIES
// ------------------------------------------------------

function sendViewWithStatus(res, viewname, status, data = {}) {
  var JSONdata = JSON.stringify(data);
  var contents = fs.readFileSync(path.join(__dirname+'/../client/' + viewname + '.html'), 'utf8');
  var html = '<script type="text/javascript">data = ' + JSONdata + ';</script>' + contents;
  res.status(status).send(html);;
}

function sendView(res, viewname, data = {}) {
  sendViewWithStatus(res, viewname, 200, data);
}

// redirect player to first connection if needed
function redirectToFirstConnectionIfNeeded(req, res) {
  if (server.getPlayer(req.cookies.playerId) == null) {
    res.redirect('/firstConnection');
    return true;
  }
  return false;
}

// redirect player to waiting room if needed
function redirectToWaitingRoomIfNeeded(req, res) {
  var player = server.getPlayer(req.cookies.playerId);
  if (player != null && player.currentRoom != null) {
    var room = player.currentRoom;
    if (server.getRoom(room.id) != null) {
      res.redirect('/waitingRoom?room=' + room.id);
      return true;
    }
    player.leaveCurrentRoom();
    // TODO: TRIGGER CLEANUP
  }

  return false;
}

// redirect player to index if needed
function redirectToIndexIfNeeded(req, res) {
  var player = server.getPlayer(req.cookies.playerId);
  if (player != null && player.currentRoom == null) {
    res.redirect('/');
    return true;
  }

  return false;
}

// ------------------------------------------------------
// SERVER
// ------------------------------------------------------

var server = new Server();


// ------------------------------------------------------
// ROUTER
// ------------------------------------------------------

const router = express.Router();

// index
router.get('/', function(req, res) {
  if (!redirectToFirstConnectionIfNeeded(req, res) && !redirectToWaitingRoomIfNeeded(req, res)) {
    sendView(res, 'index', {'nickname': server.getPlayer(req.cookies.playerId).nickname});
  }
});

// first connection nickname set
router.get('/firstConnection', function(req, res) {
  if (!redirectToIndexIfNeeded(req, res) && !redirectToWaitingRoomIfNeeded(req, res)) {
    sendView(res, 'firstConnection');
  }
});
router.post('/firstConnection', function(req, res) {
  if (!redirectToIndexIfNeeded(req, res) && !redirectToWaitingRoomIfNeeded(req, res)) {
    if (!('nickname' in req.body)) {
      sendViewWithStatus(res, 'error400', 400);
    } else {
      if (!Utilities.checkNickname(req.body.nickname)) {
        sendView(res, 'firstConnection', {'errorMessage': 'Invalid nickname.'});
      } else {
        var player = server.addPlayer(req.body.nickname);
        res.cookie('playerId', player.id).redirect('/');
      }
    }
  }
});

// create a room
router.get('/createRoom', function(req, res) {
  if (!redirectToFirstConnectionIfNeeded(req, res) && !redirectToWaitingRoomIfNeeded(req, res)) {
    var player = server.getPlayer(req.cookies.playerId);
    player.leaveCurrentRoom();
    var room = server.addRoom(player);
    player.joinRoom(room);
    res.redirect('/waitingRoom?room=' + room.id);
  }
});

// leave current room
router.get('/leaveRoom', function(req, res) {
  if (!redirectToFirstConnectionIfNeeded(req, res) && !redirectToIndexIfNeeded(req, res)) {
    var player = server.getPlayer(req.cookies.playerId);
    player.leaveCurrentRoom();
    res.redirect('/');
  }
});

// waiting room
router.get('/waitingRoom', function(req, res) {
  if (!redirectToFirstConnectionIfNeeded(req, res)) {
    var player = server.getPlayer(req.cookies.playerId);
    var room = server.getRoom(req.query.room);
    if (room == null) {
      res.redirect('/');
    }
    else {
      if (player.currentRoom != room) {
        player.leaveCurrentRoom();
        player.joinRoom(room);
      }
      sendView(res, 'waitingRoom', { 'roomId': room.id, 'ownedBy': room.ownedByPlayer.nickname });
    }
  }
});

// Web sockets
router.ws('/', function(socket, req) {
  var player = server.getPlayer(req.cookies.playerId);
  if (player != null && player.currentRoom != null) {
    var room = player.currentRoom;
    if (server.getRoom(room.id) != null) {
      room.openSocket(new SocketClient(player, socket, room.onSocketMessage, room.closeSocket));
    }
  }
});

// 404 error
router.all('*', function(req, res) {
  sendViewWithStatus(res, 'error404', 404);
});


// ------------------------------------------------------
// LAUNCH
// ------------------------------------------------------

app.use('/', router);
app.listen(process.env.port || 3000);
console.log('Running at Port 3000');

