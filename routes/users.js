//jshint esversion:6

const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");

router.get("/login", function(req, res){
  res.render("user/login");
});

router.post('/login', function(req, res){
  req.body.username = req.body.username.toLowerCase();

  User.findOne({ email: req.body.username }, function(err, user) {
    if (user && user.googleId) {
      req.flash('error', 'Try logging in with Google.  This account was previously registered using Google login so Google login must always be used.');
      return res.redirect('/users/login');}
    });

  passport.authenticate('local', { successRedirect: "/secrets/",
                                   failureRedirect: "/users/login",
                                   failureFlash: true });
});

router.get("/register", function(req, res){
  res.render("user/register");
});

router.post("/register", function(req, res){
  const fullName = req.body.fName + " " + req.body.lName;

  req.body.username = req.body.username.toLowerCase();
  User.findOne({ email: req.body.username }, function(err, user) {
    if (user && user.googleId) {
      req.flash('error', 'Try logging in with Google.  This account was previously registered using Google login so Google login must always be used.');
      return res.redirect('/users/login');}
    else {
      User.register({username: req.body.username, email: req.body.username, displayName: fullName, givenName: req.body.fName, familyName: req.body.lName}, req.body.password, function(err, user){
        if (err) {
          req.flash('error', err.message);
          res.redirect("/users/register");
        } else {
          passport.authenticate("local")(req, res, function(){
            res.redirect("/secrets");
          });
        }
      });
    }
    });
});

router.get("/logout", function(req, res){
  req.logout();
  res.redirect("/");
});

// forgot password
router.get("/forgot", function(req, res){
  res.render("user/forgot");
});

router.post('/forgot', function(req, res, next) {
  async.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      req.body.email = req.body.email.toLowerCase();
      User.findOne({ username: req.body.email }, function(err, user) {
        if (!user) {
          req.flash('error', 'No local account with that email address exists. (try logging in with Google)');
          return res.redirect('/users/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAILACCT,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.GMAILACCT,
        subject: 'HogBoss Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) return next(err);
    res.redirect('/users/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/users/forgot');
    }
    res.render('user/reset', {token: req.params.token});
  });
});

router.post('/reset/:token', function(req, res) {
  async.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        } else {
            req.flash("error", "Passwords did not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
          user: process.env.GMAILACCT,
          pass: process.env.GMAILPW
        }
      });
      var mailOptions = {
        to: user.email,
        from: process.env.GMAILACCT,
        subject: 'Your password has been changed for HogBoss Site',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your HogBoss account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/users/login');
  });
});

// USER PROFILE
// router.get("/users/:id", function(req, res) {
//   User.findById(req.params.id, function(err, foundUser) {
//     if(err) {
//       req.flash("error", "Something went wrong.");
//       res.redirect("/");
//     }
//     Campground.find().where('author.id').equals(foundUser._id).exec(function(err, campgrounds) {
//       if(err) {
//         req.flash("error", "Something went wrong.");
//         res.redirect("/");
//       }
//       res.render("users/show", {user: foundUser, campgrounds: campgrounds});
//     })
//   });
// });


module.exports = router;
