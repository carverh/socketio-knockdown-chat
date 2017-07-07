function MainViewModel() {
  var self = this;
  var socket = io();

  this.messages = ko.observableArray();

  this.usernameDialogOpen = ko.observable(true);
  this.username = ko.observable();
  this.channel = ko.observable('general');
  this.users = ko.observableArray();
  this.messageContent = ko.observable();

  this.setUsername = function() {
    socket.emit('set username', this.username())
  }

  this.sendMessage = function() {
    if (this.messageContent().length > 0) {
      socket.emit('send message', this.messageContent(), this.channel());
      this.messageContent("");
    }
  }

  socket.on('message', function(content, message, sender) {
    self.messages.push({content:content, message:message, sender:sender});
  })

  socket.on('login', function(data) {
    self.usernameDialogOpen(false);
  })

  socket.on('update userlist', function(users) {
    console.log('u')
    self.users(users);
  })
}

ko.applyBindings(new MainViewModel())
