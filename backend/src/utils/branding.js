import { Setting } from '../models/index.js';

async function obtenirNomPlateforme() {
  const setting = await Setting.findByPk('app_name');
  const val = setting?.value;
  return (val && val !== 'Gaz') ? val : 'SAHEL OXYGENE';
}

export { obtenirNomPlateforme };
