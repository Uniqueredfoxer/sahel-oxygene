import { Setting } from '../models/index.js';

async function obtenirNomPlateforme() {
  const setting = await Setting.findByPk('app_name');
  return setting?.value || 'Gaz';
}

export { obtenirNomPlateforme };
