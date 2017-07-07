var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var xss = require('xss');

var chatxss = new xss.FilterXSS({
  whiteList: [],
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script']
});

var users = [];

app.use(express.static('public'))

app.get('/', function(req, res) {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', function(socket) {
  console.log(`new connection from ${socket.request.connection.remoteAddress}`);

  var addedUser = false;

  socket.on('send message', function(content, channel) {
    if (addedUser) {
      console.log(`message sent from ${socket.username} in ${channel}: ${content}`);
      io.sockets.emit('message', chatxss.process(content), channel, socket.username);
    }
  });

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

    io.sockets.emit('message', `${socket.username} joined.`, 'general', 'dorpchat');
  });

  socket.on('disconnect', function() {
    if (addedUser) {
      console.log('user disconnected')
      var i = users.indexOf(socket.username);
      if (i != -1) {
        users.splice(i, 1);
      }
      io.sockets.emit('update userlist', users);
      io.sockets.emit('message', `${socket.username} left.`, 'general', 'dorpchat');
    }
  });
});

http.listen(8080, function() {
  console.log('listening on *:8080');
});
