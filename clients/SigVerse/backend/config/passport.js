const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const pool = require('./db.mysql');

passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL,
    scope: ['user:email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : `${profile.username}@github.com`;
      const name = profile.displayName || profile.username;
      const avatar_url = profile.photos && profile.photos[0] ? profile.photos[0].value : null;
      const github_id = String(profile.id);

      // Check if user exists
      const [rows] = await pool.query('SELECT * FROM users WHERE github_id = ?', [github_id]);

      let user;
      if (rows.length > 0) {
        user = rows[0];
        // Update avatar
        await pool.query('UPDATE users SET avatar_url = ?, updated_at = NOW() WHERE id = ?', [avatar_url, user.id]);
      } else {
        // Create new user
        const [result] = await pool.query(
          'INSERT INTO users (name, email, role, github_id, avatar_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
          [name, email, 'learner', github_id, avatar_url]
        );
        const [newUser] = await pool.query('SELECT * FROM users WHERE id = ?', [result.insertId]);
        user = newUser[0];
      }

      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

module.exports = passport;
