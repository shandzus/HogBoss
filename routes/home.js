//jshint esversion:6

const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");

router.get("/", function(req, res){
  res.render("home");
});

// Get Authenticated with Google, accessType set to offline is what made the "Refresh Token" work
// router.get("/auth/google",
//   passport.authenticate('google', { accessType: 'offline', prompt: 'consent', scope: ["profile", "email", "https://www.googleapis.com/auth/calendar", 'https://www.googleapis.com/auth/calendar.events',
//     'https://www.googleapis.com/auth/calendar.readonly'] })
// );
router.get("/auth/google",
  passport.authenticate('google', { accessType: 'offline', scope: ["profile", "email", "https://www.googleapis.com/auth/calendar", 'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/calendar.readonly'] })
);

// Redirct from Google after User was Authenticated
router.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    // delete prev local account if signing in with Google
    User.findOne({ username: req.user.email }, function(err, user) {
      if (user) { user.delete() };
    })
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

module.exports = router;
