import express from 'express';
import { Setting } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';

const router = express.Router();
const NOM_PAR_DEFAUT = 'SAHEL OXYGENE';

// GET /api/settings/public — utilisé par le frontend (branding), accessible sans compte
router.get('/public', async (req, res) => {
  const setting = await Setting.findByPk('app_name');
  const val = setting?.value;
  res.json({ appName: (val && val !== 'Gaz') ? val : NOM_PAR_DEFAUT });
});

// PATCH /api/settings — l'administrateur modifie le nom de la plateforme
router.patch('/', authentifier, exigerRole('administrateur'), async (req, res) => {
  const { appName } = req.body;
  if (!appName || !appName.trim()) {
    return res.status(400).json({ error: 'Le nom de la plateforme ne peut pas être vide' });
  }
  const [setting] = await Setting.findOrCreate({
    where: { key: 'app_name' },
    defaults: { key: 'app_name', value: appName.trim() },
  });
  setting.value = appName.trim();
  await setting.save();
  res.json({ appName: setting.value });
});

export default router;
