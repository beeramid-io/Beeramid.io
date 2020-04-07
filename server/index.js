const express = require('express');
const path = require('path');
const bodyParser = require('cookie-parser');
const cookieParser = require('body-parser');
const fs = require('fs');
const https = require('https');

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
  var contents = fs.readFileSync(path.join(__dirname, '..', 'client', 'header.html'), 'utf8') +
    '<script type="text/javascript">data = ' + JSONdata + ';</script>' +
    fs.readFileSync(path.join(__dirname, '..', 'client', viewname + '.html'), 'utf8') +
    fs.readFileSync(path.join(__dirname, '..', 'client', 'footer.html'), 'utf8');
  res.status(status).send(contents);
}

function sendView(res, viewname, data = {}) {
  sendViewWithStatus(res, viewname, 200, data);
}


// ------------------------------------------------------
// PAGES
// ------------------------------------------------------

function firstConnectionPage(req, res) {
  sendView(res, 'firstConnection', { 'roomId': req.query.room });
}

function waitingRoomPage(req, res) {
  var user = server.getUser(req.cookies.userId);
  var room = server.getRoom(req.query.room);

  if (user.currentRoom != room) {
    user.leaveCurrentRoom();
    user.joinRoom(room);
  }
  if (!room.hasUser(user)) {
    res.redirect('/');
    return;
  }
  sendView(res, 'waitingRoom', { 'roomId': room.id, 'ownedBy': room.ownedByUser.nickname });
}

function gamePage(req, res) {
  var user = server.getUser(req.cookies.userId);
  var room = server.getRoom(req.query.room);

  if (user.currentRoom != room) {
    user.leaveCurrentRoom();
    user.joinRoom(room);
  }
  if (!room.hasUser(user)) {
    res.redirect('/');
    return;
  }
  sendView(res, 'game', { 'roomId': room.id, 'ownedBy': room.ownedByUser.nickname });
}

function homePage(req, res) {
  sendView(res, 'index', { 'nickname': server.getUser(req.cookies.userId).nickname });
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
router.get('/', function (req, res) {
  var user = server.getUser(req.cookies.userId);
  var room = server.getRoom(req.query.room);

  if (user == null) {
    firstConnectionPage(req, res);
  } else if (room != null) {
    if (room.game == null) {
      waitingRoomPage(req, res);
    } else {
      gamePage(req, res);
    }
  } else if (user.currentRoom != null) {
    res.redirect('/?room=' + user.currentRoom.id);
  } else {
    homePage(req, res);
  }
});


router.post('/setNickname', function (req, res) {
  if (!('nickname' in req.body)) {
    sendViewWithStatus(res, 'error400', 400);
  } else {
    var redirectParam = '';
    if ('roomId' in req.body) {
      redirectParam = '?room=' + req.body.roomId;
    }

    if (!Utilities.checkNickname(req.body.nickname)) {
      sendView(res, 'firstConnection', { 'errorMessage': 'Invalid nickname.' });
    } else {
      var user = server.getUser(req.cookies.userId);
      if (user == null) {
        user = server.addUser(req.body.nickname);
        res.cookie('userId', user.id).redirect('/' + redirectParam);
      } else {
        user.nickname = req.body.nickname;
        res.redirect('/' + redirectParam);
      }
    }
  }
});

// create a room
router.get('/createRoom', function (req, res) {
  var user = server.getUser(req.cookies.userId);
  if (user != null) {
    var room = server.addRoom(user);
    user.leaveCurrentRoom();
    user.joinRoom(room);
    res.redirect('/?room=' + room.id);
  } else {
    //The user need to register first
    if (req.query.room != null) {
      res.redirect('/?room=' + req.query.room);
    } else {
      res.redirect('/');
    }
  }
});

// leave current room
router.get('/leaveRoom', function (req, res) {
  var user = server.getUser(req.cookies.userId);
  if (user != null)
    user.leaveCurrentRoom();
  res.redirect('/');
});

// create a room
router.get('/deck/*.png', function (req, res) {
  var filename = req.path.substr(1);
  var filepath = path.join(__dirname, '..', 'files', filename);
  if (!fs.existsSync(filepath)) {
    filepath = path.join(__dirname, '..', 'files', 'deck', "notFound.png");
  }
  res.sendFile(filepath);
});

router.get('/css/*.css', function (req, res) {
  var filename = req.path.substr(1);
  var filepath = path.join(__dirname, '..', 'files', filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  }
});


// Web sockets
router.ws('/', function (socket, req) {
  var user = server.getUser(req.cookies.userId);
  if (user != null && user.currentRoom != null) {
    var room = user.currentRoom;
    if (server.getRoom(room.id) != null) {
      room.openSocket(new SocketClient(user, socket, room));
    }
  }
});


// Certificate acme challenge
/*
router.get('/.well-known/acme-challenge/key', function (req, res) {
  res.send('value');
});
*/

// 404 error
router.all('*', function (req, res) {
  sendViewWithStatus(res, 'error404', 404);
});


// ------------------------------------------------------
// LAUNCH
// ------------------------------------------------------

app.use('/', router);

var args = process.argv.slice(2);

if (args.includes('http')) {
  app.listen(80);
  console.log('[HTTP] Running at Port 80');
} else if (args.includes('https')) {
  https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/beeramid.io/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/beeramid.io/fullchain.pem')
  }, app).listen(443);
  console.log('[RELEASE] Running at Port 443 with SSL certificate');
} else {
  app.listen(3000);
  console.log('[DEBUG] Running at Port 3000');
}

