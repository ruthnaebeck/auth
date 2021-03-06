'use strict';

var app = require('express')();
var path = require('path');
var session = require('express-session');

// "Enhancing" middleware (does not send response, server-side effects only)

app.use(require('./logging.middleware'));

app.use(require('./body-parsing.middleware'));

var User = require('../api/users/user.model');


// "Responding" middleware (may send a response back to client)

app.use(session({
  // this mandatory configuration ensures that session IDs are not predictable
  secret: 'tongiscool', // or whatever you like
  // these options are recommended and reduce session concurrency issues
  resave: false,
  saveUninitialized: false
}));

// place right after the session setup middleware
// logs out the session object containing cookie!
app.use(function (req, res, next) {
  console.log('session', req.session);
  next();
});

app.use('/api', function (req, res, next) {
  if (!req.session.counter) req.session.counter = 0;
  console.log('counter', ++req.session.counter);
  next();
});


app.use('/api', require('../api/api.router'));

app.post('/login', function (req, res, next) {
  User.findOne({
    where: req.body
  }).then(function (user) {
    if (user) {
      req.session.userId = user.id;
      req.session.admin = user.isAdmin;
      res.status(200).send(user);
    } else {
      res.sendStatus(401);
    }
  }).catch(next);
});

app.post('/signup', function (req, res, next) {
  User.create(req.body).then(function (user) {
    if (user) {
      req.session.userId = user.id;
      res.sendStatus(200);
    } else {
      res.sendStatus(401);
    }
  }).catch(next);
});

app.get('/logout', function (req, res, next) {
  req.session.userId = null;
  res.status(200).send('You have logged out');
});

var validFrontendRoutes = ['/', '/stories', '/users', '/stories/:id', '/users/:id', '/signup', '/login'];
var indexPath = path.join(__dirname, '..', '..', 'browser', 'index.html');
validFrontendRoutes.forEach(function (stateRoute) {
  app.get(stateRoute, function (req, res) {
    res.sendFile(indexPath);
  });
});

app.use(require('./statics.middleware'));

app.use(require('./error.middleware'));

module.exports = app;
