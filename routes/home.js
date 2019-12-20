//jshint esversion:6

const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/user.js");


router.get("/", function(req, res){
  res.render("home");
});

router.get("/auth/google",
  passport.authenticate('google', { scope: ["profile", "email"] })
);

router.get("/auth/google/secrets",
  passport.authenticate('google', { failureRedirect: "/login" }),
  function(req, res) {
    User.findOne({ username: req.user.email }, function(err, user) {
      if (user) { user.delete() };
    })
    // Successful authentication, redirect to secrets.
    res.redirect("/secrets");
  });

module.exports = router;
