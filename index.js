/*
DorpChat Server
(C) 2017 Carver Harrison
http://dorpchat.aclevo.xyz
*/

var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var xss = require('xss');
var os = require('os');
var log = require('color-logs')(true, true, __filename);
var mongoose = require('mongoose');
var bcrypt = require('bcrypt');

var User = require('./models');

mongoose.connect('mongodb://admin:kekistan55@mongodb.dorpchat.svc/app');

var users = []

require('socketio-auth')(io, {
  authenticate: function(socket, data, callback) {
    log.debug(`${data.username} trying to logon`);

    var username = data.username;
    var password = data.password;
    var signingUp = data.signingUp;

    if (signingUp) {
      log.debug(`User trying to sign up as ${data.username}`)
      User.find({
        username: username
      }, function(err, s) {
        if (s) {
          log.warning(`The user ${username} already exists`)
        } else {
          var newUser = User({
            username: data.username,
            password: data.password,
            admin: false,
            permissions: 1,
            banned: false
          });

          newUser.save(function(err) {
            if (err) throw err;
            log.info(`Created user ${username}`)
          });
        }
      });
    }

    User.find({
      username: username
    }, function(err, s) {
      var user = s[0];

      if (!user) {
        log.warning(`Unknown user: ${username}`)
        return callback(function() {})
      }

      if (err) {
        return callback(function() {
          log.error(`Error while trying to authenticate`, err)
        })
      }

      log.debug(`User ${username} passed authentication`);

      return callback(null, user.password == password);
    });
  },
  postAuthenticate: function(socket, data, callback) {
    var username = data.username;

    User.find({
      username: username
    }, function(err, s) {
      socket.client.user = s[0];
      console.dir(users);
      var usr = socket.client.user;
      users.push({username: usr.username})

      socket.emit('login', {
        users: users
      });

      io.sockets.emit('update userlist', users);

      io.sockets.emit('message', {
        content: `${socket.client.user.username} joined.`,
        channel: 'general',
        sender: 'dorpchat'
      });

      log.info(`${socket.client.user.username} joined (#${users.length})`)

      log.debug(`User ${username} passed post authentication`);
    });
  },
  disconnect: function() {},
  timeout: 10000000
});

var chatxss = new xss.FilterXSS({
  whiteList: [],
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
});

app.use(express.static('public'))

io.on('connection', function(socket) {
  log.info(`new connection from ${socket.request.connection.remoteAddress}`);

  socket.on('send message', function(data) {
    if (socket.auth) {
      log.info(`message sent from ${socket.client.user.username} in ${data.channel}: ${data.content}`);
      io.sockets.emit('message', {
        content: chatxss.process(data.content),
        channel: data.channel,
        sender: socket.client.user.username
      });
    }
  });

  socket.on('run command', function(data) {
    if (socket.auth) {
      log.info(`${socket.client.user.username} ran command ${data.command} with arguments ${data.args}`);

      switch (data.command) {
        case 'help':
          socket.emit('message', {
            sender: 'dorpchat',
            content: `
  ### Dorpchat Help
  help - Shows help<br>
  meminfo - Memory Info
          `,
            channel: 'general'
          })
          break;
        case 'meminfo':
          socket.emit('message', {
            sender: 'dorpchat',
            content: `${Math.floor(os.freemem()/1000000)}/${Math.floor(os.totalmem()/1000000)} MB Free`
          })
      }
    }
  })

  socket.on('disconnect', function() {
    if (socket.auth) {
      log.info(`${socket.client.user.username} disconnected`)
      var i = function() {
        users.forEach(function(j) {
          if (j.username == vsocket.client.user.username) {
            log.debug(`Found user to disconnect at position ${users.indexOf[j]}`)
            return users.indexOf[j];
          }
        })
        log.debug('returning -1')
        return -1;
      }

      if (i != -1) {
        users.splice(i, 1);
        log.debug('spliced list for disconnection')
      } else {
        log.warning('A user left with out being found in the user list.')
      }
      io.sockets.emit('update userlist', users);
      io.sockets.emit('message', {
        content: `${socket.client.user.username} left.`,
        channel: 'general',
        sender: 'dorpchat'
      });
    }
  });
});

http.listen(8080, function() {
  log.info('listening on *:8080');
});
