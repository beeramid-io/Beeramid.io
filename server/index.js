const express = require('express');
const path = require('path');
const bodyParser = require('cookie-parser');
const cookieParser = require('body-parser');
const fs = require('fs');
const https = require('https');
const http = require('http');

const app = express();
app.use(bodyParser());
app.use(cookieParser());

require('log-timestamp');
const Utilities = require('./libs/utilities.js')

const User = require('./entities/user.js')
const Server = require('./entities/server.js')
const Room = require('./entities/room.js')
const SocketClient = require('./entities/socketClient.js')

const userTimeout_ms = 2700000; //45 min = 2700000 ms


// ------------------------------------------------------
// LAUNCH
// ------------------------------------------------------

var args = process.argv.slice(2);
var isHttp = args.includes('http');
var isHttps = args.includes('https');

var server;

if (isHttp) {
  server = http.createServer(app).listen(80);
  console.log('[HTTP] Running at Port 80');
} else if (isHttps) {
  server = https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/beeramid.io/privkey.pem'),
    cert: fs.readFileSync('/etc/letsencrypt/live/beeramid.io/fullchain.pem')
  }, app).listen(443);
  http.createServer(function (req, res) {
    res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
    res.end();
  }).listen(80);
  console.log('[RELEASE] Running at Port 443 with SSL certificate');
} else {
  server = http.createServer(app).listen(3000);
  console.log('[DEBUG] Running at Port 3000');
}

const ws = require('express-ws')(app, server);


// ------------------------------------------------------
// UTILITIES
// ------------------------------------------------------

function sendViewWithStatus(res, viewname, status, data = {}) {
  if (isHttps) {
    data['isHttps'] = true;
  }
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

function updateUserCookieExpirationDate(req, res) {
  res.cookie('userId', req.cookies.userId, {maxAge: 86400000}); // 1 day = 86400000 ms
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
  sendView(res, 'game', { 'roomId': room.id, 'ownedBy': room.ownedByUser.nickname, 'isOwner': room.ownedByUser == user });
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
  } else {
    updateUserCookieExpirationDate(req, res);
    if (room != null) {
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
        console.log("firstConnection" + " " + user.id + " " + req.connection.remoteAddress + " " + req.body.nickname);
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
    var room = user.leaveCurrentRoom();
    if(room != null && room.isEmpty()) server.deleteRoom(room);
  res.redirect('/');
});

// leave current room
router.get('/logout', function (req, res) {
  var user = server.getUser(req.cookies.userId);
  if (user != null) {
    server.deleteUser(user);
  }
  res.clearCookie("userId");
  res.redirect('/');
});

// remove old players
router.get('/clean', function (req, res) {
  var n = server.clean(userTimeout_ms);
  res.status(200).send("ok, " + n + " users deleted\n");
});

// basic info on the server
router.get('/serverStatistics', function (req, res) {
  var now_ms = Date.now();
  var userInfos = server.users.map(user => ({'nickname': user.nickname, 'activeTime_s': Math.round((now_ms - user.firstActivity)/1000), 'inactiveTime_s': Math.round((now_ms - user.lastActivity)/1000) }));
  sendView(res, 'serverStatistics', {'roomNb': server.rooms.length, 'userTimeout_s': Math.floor(userTimeout_ms/1000), 'userInfos': userInfos });
});

router.get(['/css/*.css', '/html/*.html', '/image/*.png', '/image/*.jpg', '/image/*.svg', '/image/*.webp', '/deck/*.png'], function (req, res) {
  var filename = req.path.substr(1);
  var filepath = path.join(__dirname, '..', 'files', filename);
  if (fs.existsSync(filepath)) {
    res.sendFile(filepath);
  } else if(filename.substr(0,4) == 'deck') {
    res.sendFile(path.join(__dirname, '..', 'files', 'deck', "notFound.png"));
  } else {
    sendViewWithStatus(res, 'error404', 404);
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


app.use('/', router);

