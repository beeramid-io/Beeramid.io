const express = require('express');
const path = require('path');
const bodyParser = require('cookie-parser');
const cookieParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser());
app.use(cookieParser());

const Utilities = require('./libs/utilities.js')

const Player = require('./entities/player.js')
const Server = require('./entities/server.js')

// ------------------------------------------------------
// UTILITIES
// ------------------------------------------------------

function sendViewWithStatus(res, viewname, status, data = {}) {
  var JSONdata = JSON.stringify(data);
  var contents = fs.readFileSync(path.join(__dirname+'/../client/' + viewname + '.html'), 'utf8');
  var html = '<script type="text/javascript">data = ' + JSONdata + ";</script>" + contents;
  res.status(status).send(html);;
}

function sendView(res, viewname, data = {}) {
  sendViewWithStatus(res, viewname, 200, data);
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
  if (server.getPlayer(req.cookies.playerId) == null) {
    res.redirect('/firstConnection');
  } else {
    sendView(res, 'index', {'nickname': server.getPlayer(req.cookies.playerId).nickname});
  }
});

// first connection nickname set
router.get('/firstConnection', function(req, res) {
  if (server.getPlayer(req.cookies.playerId) != null) {
    res.redirect('/');
  } else {
    sendView(res, 'firstConnection');
  }
});
router.post('/firstConnection', function(req, res) {
  if (server.getPlayer(req.cookies.playerId) != null) {
    res.redirect('/');
  } else if (!('nickname' in req.body)) {
    sendViewWithStatus(res, 'error400', 400);
  } else {
    if (!Utilities.checkNickname(req.body.nickname)) {
      sendView(res, 'firstConnection', {'errorMessage': 'Invalid nickname.'});
    } else {
      var player = server.addPlayer(req.body.nickname);
      res.cookie('playerId', player.id).redirect('/');
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

