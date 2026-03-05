const passport = require("passport");
const googleTokens = require("../models/googleTokens");
const user = require("../models/user");

var googleStrategy = require("passport-google-oauth20").Strategy;
passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, profile, cb) => {
      try {

        let checkUser = await googleTokens.findOne({ googleId: profile.id });

        // 🟢 EXISTING USER
        if (checkUser) {
          checkUser.accessToken = accessToken;
          if (refreshToken) {
            checkUser.refreshToken = refreshToken;
          }
          await checkUser.save();

        let existingUser = await user.findOne({ gid: checkUser._id});

          return cb(null, { user: existingUser, isNewUser: false });
        }

        // 🔵 NEW USER
        let addToken = await googleTokens.create({
          googleId: profile.id,
          accessToken,
          refreshToken,
        });

        let addUser = await user.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          gid: addToken._id,
        });
        
        return cb(null, { user: addUser, isNewUser: true });

      } catch (err) {
        console.log(err);
        cb(err, false);
      }
    }
  )
);

passport.serializeUser((data, done) => {
  done(null, data);
});

passport.deserializeUser(async (data, done) => {
  try {
    let user1 = await user.findById(data.user._id);
    done(null, { user: user1, isNewUser: data.isNewUser });
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
 