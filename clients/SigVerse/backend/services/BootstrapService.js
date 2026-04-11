const bcrypt = require('bcryptjs');
const UserRepository = require('../repositories/UserRepository');
const LocalCredential = require('../models/mongo/LocalCredential');

const DEMO_PASSWORD = 'Sigverse123!';
const DEMO_ACCOUNTS = [
  {
    name: 'Sigverse Admin',
    email: 'sigverse.admin@gmail.com',
    legacyEmail: 'admin@sigverse.local',
    role: 'admin'
  },
  {
    name: 'Sigverse Instructor',
    email: 'sigverse.instructor@gmail.com',
    legacyEmail: 'instructor@sigverse.local',
    role: 'instructor'
  },
  {
    name: 'Sigverse Learner',
    email: 'sigverse.learner@gmail.com',
    legacyEmail: 'learner@sigverse.local',
    role: 'learner'
  }
];

class BootstrapService {
  static getDemoAccounts() {
    return DEMO_ACCOUNTS.map((account) => ({
      role: account.role,
      email: account.email,
      password: DEMO_PASSWORD
    }));
  }

  static async ensureDemoAccounts() {
    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    for (const account of DEMO_ACCOUNTS) {
      let user = await UserRepository.findByEmail(account.email);
      const legacyUser = account.legacyEmail
        ? await UserRepository.findByEmail(account.legacyEmail)
        : null;

      if (!user && legacyUser) {
        user = await UserRepository.patch(legacyUser.id, {
          name: account.name,
          email: account.email,
          role: account.role
        });
      }

      if (!user) {
        user = await UserRepository.create({
          name: account.name,
          email: account.email,
          role: account.role
        });
      }

      const credential = await LocalCredential.findOne({ email: account.email });
      const legacyCredential = account.legacyEmail
        ? await LocalCredential.findOne({ email: account.legacyEmail })
        : null;

      if (!credential && legacyCredential) {
        legacyCredential.user_id = user.id;
        legacyCredential.name = account.name;
        legacyCredential.email = account.email;
        legacyCredential.status = 'active';
        legacyCredential.requested_role = account.role;
        legacyCredential.demo_account = true;
        legacyCredential.password_hash = passwordHash;
        await legacyCredential.save();
        continue;
      }

      if (!credential) {
        await LocalCredential.create({
          user_id: user.id,
          name: account.name,
          email: account.email,
          password_hash: passwordHash,
          status: 'active',
          requested_role: account.role,
          demo_account: true
        });
      } else {
        credential.user_id = user.id;
        credential.name = account.name;
        credential.status = 'active';
        credential.requested_role = account.role;
        credential.demo_account = true;
        credential.password_hash = passwordHash;
        await credential.save();
      }
    }
  }
}

module.exports = BootstrapService;
