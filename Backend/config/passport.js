const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/api/auth/google/callback',
}, async (accessToken, refreshToken, profile, done) => {
  const user = await User.findOne({ email: profile.emails[0].value });
  if (user) return done(null, user);
  const newUser = new User({
    name: profile.displayName,
    email: profile.emails[0].value,
    password: 'oauth', // Dummy password for OAuth users
  });
  await newUser.save();
  done(null, newUser);
}));

passport.use(new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: '/api/auth/facebook/callback',
  profileFields: ['id', 'emails', 'name'],
}, async (accessToken, refreshToken, profile, done) => {
  const user = await User.findOne({ email: profile.emails[0].value });
  if (user) return done(null, user);
  const newUser = new User({
    name: `${profile.name.givenName} ${profile.name.familyName}`,
    email: profile.emails[0].value,
    password: 'oauth', // Dummy password for OAuth users
  });
  await newUser.save();
  done(null, newUser);
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => User.findById(id, (err, user) => done(err, user)));