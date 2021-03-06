/*
DorpChat Client
(C) 2017 Carver Harrison
http://dorpchat.aclevo.xyz
*/

var typingStatus = {
  last: 999,
  typing: false
}

if (Notification.permission != "denied" && Notification.permission != "granted") {
  Notification.requestPermission(function(permission) {
    // If the user accepts, let's create a notification
    if (permission == "granted") {
      var notification = new Notification("You will now recive notifications from DorpChat");
    }
  });
}

function MainViewModel() {
  var self = this;
  var socket = io();

  self.messages = ko.observableArray();

  self.usernameDialogOpen = ko.observable(true);
  self.username = ko.observable();
  self.password = ko.observable();
  self.channel = ko.observable('general');
  self.users = ko.observableArray();
  self.messageContent = ko.observable('');
  self.clientDisconnected = ko.observable(false);

  self.loginBodyData = {
    username: self.username,
    password: self.password
  };

  self.loginBodyTemplate = ko.observable('loginBodyData');

  self.scrollToBottom = function() {
    var elem = document.querySelector('.messages');
    elem.scrollTop = elem.scrollHeight;
  }

  self.messagewriterKeypress = function(data, event) {
    var keyCode = (event.which ? event.which : event.keyCode);
    if (keyCode == 13) {
      self.sendMessage();
      return false;
    }

    typingStatus.last = Date.now();

    return true;
  }

  self.sendNotification = function(title, body) {
    // Let's check if the browser supports notifications
    if (!("Notification" in window)) {
      alert("This browser does not support desktop notification");
    }

    // Let's check whether notification permissions have already been granted
    else if (Notification.permission === "granted") {
      // If it's okay let's create a notification
      var notification = new Notification(title, {
        body: body
      });
    }

    // Otherwise, we need to ask the user for permission
    else if (Notification.permission !== "denied") {
      Notification.requestPermission(function(permission) {
        // If the user accepts, let's create a notification
        if (permission === "granted") {
          var notification = new Notification("You will now recive notifications from DorpChat");
        }
      });
    }
  }

  self.signup = function () {
    console.log(`signup as ${self.username()}`)
    socket.emit('authentication', {
      username: self.username(),
      password: self.password(),
      signingUp: true
    });

    socket.on('authenticated', function() {
      console.log('authenticated');
      self.usernameDialogOpen(false);
    });
  }

  self.login = function(signingUp) {
    console.log(`login as ${self.username()}`)
    socket.emit('authentication', {
      username: self.username(),
      password: self.password(),
      signingUp: false
    });

    socket.on('authenticated', function() {
      console.log('authenticated')
      self.usernameDialogOpen(false);
    });
  }

  self.sendMessage = function() {
    if (self.messageContent().length > 0) {
      if (self.messageContent()[0] == '/') {
        socket.emit('run command', {
          command: self.messageContent().split('/')[1].split(' ')[0],
          args: self.messageContent().split(' ').splice(1)
        })
      } else {
        socket.emit('send message', {
          content: self.messageContent(),
          channel: self.channel()
        });
      }
      self.messageContent('');
    }
  }

  socket.on('message', function(data) {
    if (document.hidden) {
      self.sendNotification(data.sender, data.content);
    }
    self.messages.push({
      content: emojify.replace(micromarkdown.parse(data.content)),
      channel: data.channel,
      sender: data.sender
    });
    self.scrollToBottom();
  })

  socket.on('login', function(data) {
    self.usernameDialogOpen(false);
  })

  socket.on('update userlist', function(users) {
    self.users(users);
  })

  socket.on('connect', function() {
  });

  socket.on('disconnect', function() {
    self.clientDisconnected(true);
  });
}

ko.applyBindings(new MainViewModel())
