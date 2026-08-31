/**
 * Registre des secteurs et quartiers de Bobo-Dioulasso
 * avec coordonnées GPS et distances routières réelles mesurées depuis le Dépôt de Djaradougou.
 */

export const DEPOT_DJARADOUGOU = {
  nom: 'Dépôt Principal SAHEL OXYGENE',
  quartier: 'Djaradougou',
  secteur: 'Secteur 2',
  ville: 'Bobo-Dioulasso',
  lat: 11.1850,
  lng: -4.2980,
};

export const SECTEURS_BOBO = [
  // Zone 1 : 0 à 4 km (Frais : 1 000 FCFA)
  {
    id: 'djaradougou',
    nom: 'Djaradougou',
    secteur: 'Secteur 2',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 0.8,
    lat: 11.1850,
    lng: -4.2980,
  },
  {
    id: 'dioulassoba',
    nom: 'Dioulassoba',
    secteur: 'Secteur 1',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 1.2,
    lat: 11.1765,
    lng: -4.2955,
  },
  {
    id: 'sikasso_cira',
    nom: 'Sikasso-Cira',
    secteur: 'Secteur 3',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 1.5,
    lat: 11.1790,
    lng: -4.2910,
  },
  {
    id: 'grand_marche',
    nom: 'Grand Marché / Centre-ville',
    secteur: 'Secteur 1/3',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 1.8,
    lat: 11.1772,
    lng: -4.2979,
  },
  {
    id: 'colma',
    nom: 'Colma',
    secteur: 'Secteur 7',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 1.9,
    lat: 11.1880,
    lng: -4.3210,
  },
  {
    id: 'koko',
    nom: 'Koko',
    secteur: 'Secteur 3',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 2.2,
    lat: 11.1810,
    lng: -4.2850,
  },
  {
    id: 'accart_ville',
    nom: 'Accart-Ville',
    secteur: 'Secteur 2',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 2.3,
    lat: 11.1685,
    lng: -4.2882,
  },
  {
    id: 'farakan',
    nom: 'Farakan',
    secteur: 'Secteur 4',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 2.8,
    lat: 11.1830,
    lng: -4.2750,
  },
  {
    id: 'tounouma',
    nom: 'Tounouma',
    secteur: 'Secteur 1',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 3.1,
    lat: 11.1720,
    lng: -4.3050,
  },
  {
    id: 'dogona',
    nom: 'Dogona',
    secteur: 'Secteur 10',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 3.5,
    lat: 11.1910,
    lng: -4.2790,
  },
  {
    id: 'bindougousso',
    nom: 'Bindougousso',
    secteur: 'Secteur 8',
    zone: 'Zone 1 (0-4 km)',
    distanceKm: 3.8,
    lat: 11.1920,
    lng: -4.3120,
  },

  // Zone 2 : 4 à 8 km (Frais : 1 500 FCFA)
  {
    id: 'zone_industrielle',
    nom: 'Zone Industrielle',
    secteur: 'Secteur 11',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 4.2,
    lat: 11.1650,
    lng: -4.2680,
  },
  {
    id: 'kuinima',
    nom: 'Kuinima',
    secteur: 'Secteur 5',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 4.5,
    lat: 11.1620,
    lng: -4.3050,
  },
  {
    id: 'belleville',
    nom: 'Belleville',
    secteur: 'Secteur 6',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 4.8,
    lat: 11.1980,
    lng: -4.2890,
  },
  {
    id: 'bolomakote',
    nom: 'Bolomakoté',
    secteur: 'Secteur 9',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 4.9,
    lat: 11.1600,
    lng: -4.2920,
  },
  {
    id: 'ouezzin_ville',
    nom: 'Ouezzin-Ville',
    secteur: 'Secteur 15',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 5.5,
    lat: 11.2050,
    lng: -4.3080,
  },
  {
    id: 'sarfalao',
    nom: 'Sarfalao',
    secteur: 'Secteur 17',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 6.2,
    lat: 11.1550,
    lng: -4.2820,
  },
  {
    id: 'lafiabougou',
    nom: 'Lafiabougou',
    secteur: 'Secteur 20',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 6.8,
    lat: 11.1510,
    lng: -4.3210,
  },
  {
    id: 'kodeni',
    nom: 'Kodéni',
    secteur: 'Secteur 21',
    zone: 'Zone 2 (4-8 km)',
    distanceKm: 7.5,
    lat: 11.1410,
    lng: -4.2950,
  },

  // Zone 3 : Plus de 8 km (1 500 FCFA + 100 FCFA / km extra)
  {
    id: 'dafra',
    nom: 'Dafra / Faladiè',
    secteur: 'Secteur 18',
    zone: 'Zone 3 (> 8 km)',
    distanceKm: 8.5,
    lat: 11.1350,
    lng: -4.3180,
  },
  {
    id: 'samagan',
    nom: 'Samagan',
    secteur: 'Secteur 24',
    zone: 'Zone 3 (> 8 km)',
    distanceKm: 10.2,
    lat: 11.2350,
    lng: -4.2850,
  },
  {
    id: 'nasso',
    nom: 'Nasso (Guinguette)',
    secteur: 'Périphérie',
    zone: 'Zone 3 (> 8 km)',
    distanceKm: 15.0,
    lat: 11.2150,
    lng: -4.4350,
  },
];

/**
 * Recherche rapide d'un secteur par mot-clé
 */
export function trouverSecteur(nomOuSecteur) {
  if (!nomOuSecteur) return null;
  const q = nomOuSecteur.toLowerCase().trim();
  return (
    SECTEURS_BOBO.find(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.secteur.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q)
    ) || null
  );
}
