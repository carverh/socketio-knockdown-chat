var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var numUsers = 0;

app.use(express.static('public'))

app.get('/', function(req, res){
  res.send('<h1>Hello world</h1>');
});

io.on('connection', function(socket){
  console.log('new connection');

  var addedUser = false;

  socket.on('send message', function(content, channel){
    if (addedUser) {
      console.log(`message sent from ${socket.username} in ${channel}: ${content}`);
      io.sockets.emit('message', content, channel, socket.username);
    }
  });

  socket.on('set username', function(username) {
    if (addedUser) return;
    socket.username = username;
    ++numUsers;
    addedUser = true;

    socket.emit('login', {
      numUsers: numUsers
    });

    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });

    io.sockets.emit('message', `${username} joined.`, 'general', 'dorpchat');
  });

  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;

      // echo globally that this client has left
      socket.broadcast.emit('user left', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
