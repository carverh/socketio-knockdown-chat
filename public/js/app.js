if (Notification.permission !== "denied") {
  Notification.requestPermission(function(permission) {
    // If the user accepts, let's create a notification
    if (permission === "granted") {
      var notification = new Notification("You will now recive notifications from DorpChat");
    }
  });
}

function MainViewModel() {
  var self = this;
  var socket = io();

  this.messages = ko.observableArray();

  this.usernameDialogOpen = ko.observable(true);
  this.username = ko.observable();
  this.channel = ko.observable('general');
  this.users = ko.observableArray();
  this.messageContent = ko.observable('');

  this.messagewriterKeypress = function(data, event) {
    var keyCode = (event.which ? event.which : event.keyCode);
    if (keyCode == 13) {
      this.sendMessage();
      return false;
    }
    return true;
  }

  this.sendNotification = function(title, body) {
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

  this.setUsername = function() {
    socket.emit('set username', this.username())
  }

  this.sendMessage = function() {
    if (this.messageContent().length > 0) {
      socket.emit('send message', this.messageContent(), this.channel());
      this.messageContent("");
    }
  }

  socket.on('message', function(content, channel, sender) {
    if (document.hidden) {
      self.sendNotification(sender, content);
    }
    self.messages.push({
      content: micromarkdown.parse(content),
      channel: channel,
      sender: sender
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
