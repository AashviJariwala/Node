const passport = require("passport");
const googleTokens = require("../models/googleTokens");

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
    let checkUser = await googleTokens.findOne({ googleId: profile.id });


    if (checkUser) {
      checkUser.accessToken = accessToken;
      if (refreshToken) {
        checkUser.refreshToken = refreshToken;
      }

      await checkUser.save();
      return cb(null, checkUser);
    }
    let addToken = await googleTokens.create({
      googleId: profile.id,
      accessToken: accessToken,
      refreshToken: refreshToken, 
    });
    
    cb(null, addToken);
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
    let user1 = await googleTokens.findById(id);
    done(null, user1);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
 