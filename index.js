/*
DorpChat Server
(C) 2017 Carver Harrison
http://dorpchat.aclevo.xyz
*/

var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var xss = require('xss');
var os = require('os');
var log = require('color-logs')(true, true, __filename)

var chatxss = new xss.FilterXSS({
  whiteList: [],
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
});

var users = [];

app.use(express.static('public'))

io.on('connection', function(socket) {
  log.info(`new connection from ${socket.request.connection.remoteAddress}`);

  var addedUser = false;

  socket.on('send message', function(data) {
    if (addedUser) {
      log.info(`message sent from ${socket.username} in ${data.channel}: ${data.content}`);
      io.sockets.emit('message', {content: chatxss.process(data.content), channel: data.channel, sender: socket.username});
    }
  });

  socket.on('run command', function(data) {
    log.info(`${socket.username} ran command ${data.command} with arguments ${data.args}`);

    switch (data.command) {
      case 'help':
        socket.emit('message', {sender: 'dorpchat', content: `
### Dorpchat Help
help - Shows help<br>
meminfo - Memory Info
        `, channel: 'general'})
      break;
      case 'meminfo':
        socket.emit('message', {sender: 'dorpchat', content: `${Math.floor(os.freemem()/1000000)}/${Math.floor(os.totalmem()/1000000)} MB Free`})
    }
  })

  socket.on('set username', function(username) {
    if (addedUser) return;
    if (users.indexOf(username) > -1) return;

    socket.username = chatxss.process(username);
    addedUser = true;

    users.push(socket.username)

    socket.emit('login', {
      users: users
    });

    io.sockets.emit('update userlist', users);

    io.sockets.emit('message', {content: `${socket.username} joined.`, channel: 'general', sender: 'dorpchat'});

    log.info(`${socket.username} joined`)
  });

  socket.on('disconnect', function() {
    if (addedUser) {
      log.info(`${socket.username} disconnected`)
      var i = users.indexOf(socket.username);
      if (i != -1) {
        users.splice(i, 1);
      }
      io.sockets.emit('update userlist', users);
      io.sockets.emit('message', {content: `${socket.username} left.`, channel: 'general', sender: 'dorpchat'});
    }
  });
});

http.listen(8080, function() {
  log.info('listening on *:8080');
});
