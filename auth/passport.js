const passport = require("passport");
const user = require("../models/user");

var googleStrategy = require("passport-google-oauth20").Strategy;
passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "http://localhost:3000/login/auth/google/callback",
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {
        let user1 = await user.findOne({ googleId: profile.id });
        if (user1) return cb(null, user1);
        user1 = await user.create({
          googleId: profile.id,
          googleAccessToken: accessToken,
          username: profile.displayName,
        });
        cb(null, user1);
      } catch (err) {
        console.log(err);
        cb(err, false);
      }
    }
  )
);

passport.serializeUser((user1, done) => {
  done(null, user1.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    let user1 = await user.findById(id);
    done(null, user1);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
 