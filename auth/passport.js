const passport = require("passport");
const googleTokens = require("../models/googleTokens");
const user = require("../models/user");

var googleStrategy = require("passport-google-oauth20").Strategy;
passport.use(
  new googleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_REDIRECT_URI,
    },
    async (accessToken, refreshToken, params, profile, cb) => {
      try {
        const grantedScopes = params.scope ? params.scope.split(" ") : [];
        const calendarScope = "https://www.googleapis.com/auth/calendar";

        if (!grantedScopes.includes(calendarScope)) {
          // This sends the user to failureRedirect in your callback route
          return cb(null, false, { message: "calendar_permission_denied" });
        }
        let checkUser = await googleTokens.findOne({ googleId: profile.id });

        // 🟢 EXISTING USER
        if (checkUser) {
          checkUser.accessToken = accessToken;
          checkUser.expiryDate = params.expires_in        
          ? Date.now() + params.expires_in * 1000
          : null;
          if (refreshToken) {
            checkUser.refreshToken = refreshToken;
          }
          await checkUser.save();

          let existingUser = await user.findOne({ gid: checkUser._id });

          return cb(null, { user: existingUser, isNewUser: false });
        }

        // 🔵 NEW USER
        let addToken = await googleTokens.create({
          googleId: profile.id,
          accessToken,
          refreshToken,
          expiryDate: params.expires_in                  
          ? Date.now() + params.expires_in * 1000
          : null,
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

module.exports = passport;
