//jshint esversion:8

const express = require("express");
const router = express.Router();
const passport = require("passport");
const Farm = require("../models/farm.js");
const Role = require("../models/role.js");
const async = require("async");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const ensureAuthenticated = require("../middleware/ensureAuthenticated.js")

router.get("/", ensureAuthenticated, function(req, res, next){
  Role.find( { user: req.user._id } ).
        populate("farm").
        exec(function(err, foundRecords){
          if (err){
            console.log(err);
          } else {
            if (foundRecords) {
              res.render("farm/all", {usersFarms: foundRecords});
            }
          }
        });
});

router.post('/', ensureAuthenticated, async function(req, res){
  newFarm = new Farm({creater: req.user.email, farmName: req.body.farmName, customerNo: req.body.customerNo});
  await newFarm.save(function (err, newFarm){
    if (err) return console.error(err);
  });
  newRole = new Role({farm: newFarm._id, user: req.user._id, roleType: "Farm Manager"});
  newRole.save(function (err, newRole){
    if (err) return console.error(err);
    res.redirect("/farms/");
  });
});

router.get('/:farmId', ensureAuthenticated, async function(req, res){
  const id = req.params.farmId;
  var isManagerFlag = false;

  await Role.findOne( {farm: id, user: req.user._id, roleType: "Farm Manager" } ).
        exec(function(err, foundRecord){
          if (err){
            console.log(err);
            return res.redirect('/farms');
          } else {
            if (foundRecord) {
              isManagerFlag = true;
            }
          }
  });

  Farm.findById( { _id: id } ).
        exec(function(err, foundRecord){
          if (err){
            console.log(err);
            return res.redirect('/farms');
          } else {
            if (foundRecord) {
              res.render("farm/farm", {usersFarm: foundRecord, isManager: isManagerFlag });
            } else {
              return res.redirect('/farms');
            }
          }
  });
});

router.post('/upd/:farmId', ensureAuthenticated, function(req, res){
    const id = req.params.farmId;
    Farm.updateOne( { _id: id },{
      farmName: req.body.farmName,
      customerNo: req.body.customerNo,
      gestationDays: req.body.gestationDays,
      breedingWindow: req.body.breedingWindow,
      weaningDays: req.body.weaningDays
    } ).
          exec(function(err){
            if (err){
              return console.log(err);
            }
            res.redirect("/farms/");
          });
});

router.get('/delete/:farmId', ensureAuthenticated, function(req, res){
    const id = req.params.farmId;

    Role.deleteMany({farm: id}, function (err) {
      if (err) return console.error(err);
    });
    Farm.deleteOne({_id: id}, function (err) {
      if (err) return console.error(err);
    });

    res.redirect("/farms/");
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


module.exports = router;
