const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Bring in User Model
let User = require('../models/user');

// Register Form
router.get('/register', (req, res) => {
  res.render('register');
});

// replacement code from ccrt1234
const { check, validationResult } = require('express-validator');

// Registration Process
router.post('/register',
[
  check('name', 'Name is required').isLength({min: 1}),
  check('email', 'Email is required').isLength({min: 1}),
  check('email', 'Email is not valid').isEmail(),
  check('username', 'Username is required').isLength({min: 1}),
  check('password', 'Password is required').isLength({min: 1}),
  check('password2', 'Please confirm password').custom((value, {req, loc, path}) => {
    if (value !== req.body.password) {
      throw new Error("Passwords don't match");
    } else { return value; }
  })
],
(req, res) => {
  // const name = req.body.name;
  // const email = req.body.email;
  // const username = req.body.username;
  // const password = req.body.password;
  // const password2 = req.body.password2;

  // req.checkBody('Name', 'Name is required').notEmpty();
  // req.checkBody('Email', 'Email is required').notEmpty();
  // req.checkBody('Email', 'Email is not valid').isEmail();
  // req.checkBody('username', 'Username is required').notEmpty();
  // req.checkBody('password', 'Password is required').notEmpty();
  // req.checkBody('password2', 'Passwords do not match').equals(req.body.password);
  
  // Add code to disallow registration of several users
  // with the same username, email and passwords

  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('users.js: 1');
    console.log(errors);
    console.log(errors.array());
    res.render('register', {
      errors: errors.array()
    });
    return;
  }

  let newUser = new User({
    name: req.body.name,
    email: req.body.email.toLowerCase(),
    username: req.body.username.toLowerCase(),
    password: req.body.password
  });

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) {
        console.log('users.js: 2');
        console.log(err);
        res.render('register', {
          err
        });
        return;
      }
      newUser.password = hash;
      newUser.save( err => {
        if (err) {
          console.log('users.js: 3');
          console.log(err);
          res.render('register', {
            err
          });
          return;
        }
        req.flash('success', 'You are now registered and can log in!');
        res.redirect('/users/login');
      });
    });
  });
});

// Login Form
router.get('/login', (req, res) => {
  res.render('login');
});

// Login Process
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/users/login',
    failureFlash: true
  })(req, res, next);
});

// Logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
