/*
DorpChat Client
(C) 2017 Carver Harrison
http://dorpchat.aclevo.xyz
*/

window.setInterval(function() {
  var elem = document.querySelector('.messages');
  elem.scrollTop = elem.scrollHeight;
}, 100);

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
  self.channel = ko.observable('general');
  self.users = ko.observableArray();
  self.messageContent = ko.observable('');

  self.loginBodyData = {
      username: self.username
  };

  self.loginBodyTemplate = ko.observable('loginBodyData');

  self.messagewriterKeypress = function(data, event) {
    var keyCode = (event.which ? event.which : event.keyCode);
    if (keyCode == 13) {
      this.sendMessage();
      return false;
    }
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
      var notification = new Notification(title, {body: body});
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

  self.setUsername = function() {
    socket.emit('set username', self.username())
  }

  self.sendMessage = function() {
    if (self.messageContent().length > 0) {
      if (self.messageContent()[0] == '/') {
        socket.emit('run command', {command: self.messageContent().split('/')[1].split(' ')[0], args: self.messageContent().split(' ').splice(1)})
      } else {
        socket.emit('send message', {content: self.messageContent(), channel: self.channel()});
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
  })

  socket.on('login', function(data) {
    self.usernameDialogOpen(false);
  })

  socket.on('update userlist', function(users) {
    self.users(users);
  })
}

ko.applyBindings(new MainViewModel())
