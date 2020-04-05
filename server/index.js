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

const User = require('./entities/user.js')
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


// ------------------------------------------------------
// PAGES
// ------------------------------------------------------

function firstConnectionPage(req, res) {
  sendView(res, 'firstConnection');
}

function waitingRoomPage(req, res) {
  var user = server.getUser(req.cookies.userId);
  var room = server.getRoom(req.query.room);

  if (user.currentRoom != room) {
      user.leaveCurrentRoom();
      user.joinRoom(room);
    }
    sendView(res, 'waitingRoom', { 'roomId': room.id, 'ownedBy': room.ownedByUser.nickname });
}

function homePage(req, res) {
  sendView(res, 'index', {'nickname': server.getUser(req.cookies.userId).nickname});
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
  var user = server.getUser(req.cookies.userId);
  var room = server.getRoom(req.query.room);

  if(user == null) {
    firstConnectionPage(req, res);
  } else if (room != null) {
    waitingRoomPage(req, res);
  } else if(user.currentRoom != null) {
    res.redirect('/?room=' + user.currentRoom.id);
  } else {
    homePage(req, res);
  }
});


router.post('/setNickname', function(req, res) {
  if (!('nickname' in req.body)) {
    sendViewWithStatus(res, 'error400', 400);
  } else {
    if (!Utilities.checkNickname(req.body.nickname)) {
      sendView(res, 'firstConnection', {'errorMessage': 'Invalid nickname.'});
    } else {
      var user = server.getUser(req.cookies.userId);
      if(user == null) {
        user = server.addUser(req.body.nickname);
        res.cookie('userId', user.id).redirect('/');
      } else {
        user.nickname =  req.body.nickname;
      }
    }
  }
  res.redirect('/');
});

// create a room
router.get('/createRoom', function(req, res) {
  var user = server.getUser(req.cookies.userId);
  if (user != null) {
    var room = server.addRoom(user);
    user.leaveCurrentRoom();
    user.joinRoom(room);
    res.redirect('/?room=' + room.id);
  }
});

// leave current room
router.get('/leaveRoom', function(req, res) {
  var user = server.getUser(req.cookies.userId);
  if(user != null) {
    user.leaveCurrentRoom();
  }
  res.redirect('/');
});

// Web sockets
router.ws('/', function(socket, req) {
  var user = server.getUser(req.cookies.userId);
  if (user != null && user.currentRoom != null) {
    var room = user.currentRoom;
    if (server.getRoom(room.id) != null) {
      room.openSocket(new SocketClient(user, socket, room));
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

