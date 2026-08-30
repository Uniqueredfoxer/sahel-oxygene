import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import UserRole from './models/UserRole.js';
import AdminWhatsapp from './models/AdminWhatsapp.js';
import sequelize from './config/db.js';

dotenv.config();


async function seed() {
  await sequelize.sync();

  const superAdmins = (process.env.SUPER_ADMIN_EMAILS || '')
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean);

  if (superAdmins.length === 0) {
    console.log('⚠️  Aucun SUPER_ADMIN_EMAILS défini dans .env — rien à créer.');
  }

  for (const email of superAdmins) {
    const emailLower = email.toLowerCase();
    let user = await User.findOne({ where: { email: emailLower } });
    if (!user) {
      const passwordHash = await bcrypt.hash('ChangeMoi123!', 10);
      user = await User.create({
        name: `Administrateur (${emailLower.split('@')[0]})`,
        email: emailLower,
        passwordHash,
      });
      console.log(`✅ Compte créé : ${emailLower} (mot de passe temporaire : ChangeMoi123!)`);
    } else {
      console.log(`ℹ️  Compte déjà existant : ${emailLower}`);
    }

    await UserRole.findOrCreate({
      where: { userId: user.id, role: 'administrateur' },
      defaults: { userId: user.id, role: 'administrateur' },
    });
  }

  const numeroPrincipal = process.env.ADMIN_WHATSAPP_PRINCIPAL;
  if (numeroPrincipal) {
    const [entree] = await AdminWhatsapp.findOrCreate({
      where: { numero: numeroPrincipal },
      defaults: { numero: numeroPrincipal, principal: true, label: 'Principal' },
    });
    if (!entree.principal) {
      entree.principal = true;
      await entree.save();
    }
    console.log(`✅ Numéro WhatsApp principal : ${numeroPrincipal}`);
  }

  console.log('🌱 Seed terminé.');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Erreur de seed :', err);
  process.exit(1);
});
