//jshint esversion:6
//
//from HyperTerminal node app.js
//localhost:3000
//node
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const flash = require("connect-flash");
const home= require("./routes/home.js");
const users = require("./routes/users.js");
const User = require("./models/user.js");

const app = express();

app.use(express.static("public"));
app.use(express.static("../public")); // needed because of routes folder
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(flash());
app.use(session({
  secret: "Our little secret.",
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://shandzus:Mildred!4@hogboss-0axwr.mongodb.net/HogBossDB", {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex", true);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
   res.locals.success = req.flash('success');
   res.locals.error = req.flash('error');
   next();
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },

  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({
      googleId: profile.id,
      email: profile.emails[0].value,
      displayName: profile.displayName,
      givenName: profile.name.givenName,
      familyName: profile.name.familyName},
      function (err, user) {
        return cb(err, user);
      });
  }
));
app.use("/", home);
app.use("/users/", users);

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/users/login");
};

app.get("/secrets", ensureAuthenticated, function(req, res, next){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if (err){
      console.log(err);
    } else {
      if (foundUsers) {
        res.render("secrets", {usersWithSecrets: foundUsers});
      }
    }
  });
});

app.get("/submit", ensureAuthenticated, function(req, res, next){
  res.render("submit");
});

app.post("/submit", function(req, res){
  const submittedSecret = req.body.secret;

//Once the user is authenticated and their session gets saved, their user details are saved to req.user.
  // console.log(req.user.id);

  User.findById(req.user.id, function(err, foundUser){
    if (err) {
      console.log(err);
    } else {
      if (foundUser) {
        foundUser.secret = submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});




app.listen(3000, function() {
  console.log("Server started on port 3000.");
});
