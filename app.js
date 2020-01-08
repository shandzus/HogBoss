//jshint esversion:6
//
//from HyperTerminal node app.js   OR npm start
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
// const GooglePlusTokenStrategy = require("passport-google-plus-token");
const findOrCreate = require('mongoose-findorcreate');
const { google } = require("googleapis");
const googleCalenderService = require("./services/google-calendar.service");
const flash = require("connect-flash");

// HogBoss Routes
const home= require("./routes/home.js");
const users = require("./routes/users.js");
const farms = require("./routes/farms.js");
const User = require("./models/user.js");
const ensureAuthenticated = require("./middleware/ensureAuthenticated.js");

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true }));
app.use(flash());
app.use(session({ secret: "Our little secret.", resave: false, saveUninitialized: false }));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://shandzus:" + process.env.MONGO_ATLAS_PW + "@hogboss-0axwr.mongodb.net/HogBossDB", {useNewUrlParser: true, useUnifiedTopology: true});
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
   res.locals.currYr = new Date().getFullYear();
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
      email: profile.emails[0].value},
      function (err, user) {
        user.displayName = profile.displayName,
        user.givenName = profile.name.givenName,
        user.familyName = profile.name.familyName,
        user.accessToken = accessToken;
        if (refreshToken) {user.refreshToken = refreshToken;}
        user.save();
        return cb(err, user);
      });
  }
));

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  "http://localhost:3000/auth/google/secrets"
);
google.options({auth: oauth2Client});

// Establish Routes
app.use("/", home);
app.use("/users/", users);
app.use("/farms/", farms);

app.get("/secrets", ensureAuthenticated, function(req, res, next){

  // const tokenInfo = oauth2Client.getTokenInfo(req.user.accessToken);


  oauth2Client.setCredentials({
    access_token: req.user.accessToken,
    refresh_token: req.user.refreshToken,
    expiry_date: true
  });
  // oauth2Client.setCredentials({
  //   access_token: req.user.accessToken

  googleCalenderService.listEvents(oauth2Client, (events) => {
    console.log(events);
  });
  // googleCalenderService.insertEvent(oauth2Client, (event) => {
  //   console.log(event);
  // });
  // googleCalenderService.deleteEvent(oauth2Client, "h7a2ilu873t2rctvbc09s8gkeo");

  // googleCalenderService.updateEvent(oauth2Client, "d93tk47i5dc0khde3a6jda2sjs");

  // googleCalenderService.insertCalendar(oauth2Client);



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
