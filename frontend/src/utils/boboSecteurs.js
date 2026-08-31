/**
 * Registre des secteurs et quartiers de Bobo-Dioulasso
 * avec coordonnées GPS, distances réelles depuis le Dépôt de Djaradougou et tarifs de livraison.
 *
 * Grille tarifaire de base :
 * - 0 à 4 km : 1 000 FCFA
 * - 4 à 8 km : 1 500 FCFA
 * - Au-delà de 8 km : 1 500 FCFA + 100 FCFA / km supplémentaire
 *
 * NOTE : Vous pouvez modifier directement les distances (distanceKm) ou les tarifs (tarifFCFA) ci-dessous.
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
  // ==========================================
  // ZONE 1 : 0 à 4 km (Tarif : 1 000 FCFA)
  // ==========================================
  {
    id: 'secteur_2_djaradougou',
    nom: 'Djaradougou',
    secteur: 'Secteur 2',
    distanceKm: 0.8,
    tarifFCFA: 1000,
    lat: 11.1850,
    lng: -4.2980,
  },
  {
    id: 'secteur_1_dioulassoba',
    nom: 'Dioulassoba',
    secteur: 'Secteur 1',
    distanceKm: 1.2,
    tarifFCFA: 1000,
    lat: 11.1765,
    lng: -4.2955,
  },
  {
    id: 'secteur_3_sikasso_cira',
    nom: 'Sikasso-Cira',
    secteur: 'Secteur 3',
    distanceKm: 1.5,
    tarifFCFA: 1000,
    lat: 11.1790,
    lng: -4.2910,
  },
  {
    id: 'secteur_1_grand_marche',
    nom: 'Grand Marché / Centre-ville',
    secteur: 'Secteur 1/3',
    distanceKm: 1.8,
    tarifFCFA: 1000,
    lat: 11.1772,
    lng: -4.2979,
  },
  {
    id: 'secteur_7_colma',
    nom: 'Colma',
    secteur: 'Secteur 7',
    distanceKm: 1.9,
    tarifFCFA: 1000,
    lat: 11.1880,
    lng: -4.3210,
  },
  {
    id: 'secteur_3_koko',
    nom: 'Koko',
    secteur: 'Secteur 3',
    distanceKm: 2.2,
    tarifFCFA: 1000,
    lat: 11.1810,
    lng: -4.2850,
  },
  {
    id: 'secteur_2_accart_ville',
    nom: 'Accart-Ville',
    secteur: 'Secteur 2',
    distanceKm: 2.3,
    tarifFCFA: 1000,
    lat: 11.1685,
    lng: -4.2882,
  },
  {
    id: 'secteur_4_farakan',
    nom: 'Farakan',
    secteur: 'Secteur 4',
    distanceKm: 2.8,
    tarifFCFA: 1000,
    lat: 11.1830,
    lng: -4.2750,
  },
  {
    id: 'secteur_1_tounouma',
    nom: 'Tounouma',
    secteur: 'Secteur 1',
    distanceKm: 3.1,
    tarifFCFA: 1000,
    lat: 11.1720,
    lng: -4.3050,
  },
  {
    id: 'secteur_10_dogona',
    nom: 'Dogona',
    secteur: 'Secteur 10',
    distanceKm: 3.5,
    tarifFCFA: 1000,
    lat: 11.1910,
    lng: -4.2790,
  },
  {
    id: 'secteur_8_bindougousso',
    nom: 'Bindougousso',
    secteur: 'Secteur 8',
    distanceKm: 3.8,
    tarifFCFA: 1000,
    lat: 11.1920,
    lng: -4.3120,
  },

  // ==========================================
  // ZONE 2 : 4 à 8 km (Tarif : 1 500 FCFA)
  // ==========================================
  {
    id: 'secteur_11_zone_industrielle',
    nom: 'Zone Industrielle',
    secteur: 'Secteur 11',
    distanceKm: 4.2,
    tarifFCFA: 1500,
    lat: 11.1650,
    lng: -4.2680,
  },
  {
    id: 'secteur_5_kuinima',
    nom: 'Kuinima',
    secteur: 'Secteur 5',
    distanceKm: 4.5,
    tarifFCFA: 1500,
    lat: 11.1620,
    lng: -4.3050,
  },
  {
    id: 'secteur_6_belleville',
    nom: 'Belleville',
    secteur: 'Secteur 6',
    distanceKm: 4.8,
    tarifFCFA: 1500,
    lat: 11.1980,
    lng: -4.2890,
  },
  {
    id: 'secteur_9_bolomakote',
    nom: 'Bolomakoté',
    secteur: 'Secteur 9',
    distanceKm: 4.9,
    tarifFCFA: 1500,
    lat: 11.1600,
    lng: -4.2920,
  },
  {
    id: 'secteur_29_kuinima_ouest',
    nom: 'Kuinima Ouest',
    secteur: 'Secteur 29',
    distanceKm: 5.2,
    tarifFCFA: 1500,
    lat: 11.1580,
    lng: -4.3150,
  },
  {
    id: 'secteur_15_ouezzin_ville',
    nom: 'Ouezzin-Ville',
    secteur: 'Secteur 15',
    distanceKm: 5.5,
    tarifFCFA: 1500,
    lat: 11.2050,
    lng: -4.3080,
  },
  {
    id: 'secteur_22_yeguere',
    nom: 'Yéguéré / Bobo 2010',
    secteur: 'Secteur 22',
    distanceKm: 5.8,
    tarifFCFA: 1500,
    lat: 11.2120,
    lng: -4.2750,
  },
  {
    id: 'secteur_17_sarfalao',
    nom: 'Sarfalao',
    secteur: 'Secteur 17',
    distanceKm: 6.2,
    tarifFCFA: 1500,
    lat: 11.1550,
    lng: -4.2820,
  },
  {
    id: 'secteur_23_logofourousso',
    nom: 'Logofourousso / Belleville Nord',
    secteur: 'Secteur 23',
    distanceKm: 6.5,
    tarifFCFA: 1500,
    lat: 11.2200,
    lng: -4.2950,
  },
  {
    id: 'secteur_20_lafiabougou',
    nom: 'Lafiabougou',
    secteur: 'Secteur 20',
    distanceKm: 6.8,
    tarifFCFA: 1500,
    lat: 11.1510,
    lng: -4.3210,
  },
  {
    id: 'secteur_21_kodeni',
    nom: 'Kodéni',
    secteur: 'Secteur 21',
    distanceKm: 7.5,
    tarifFCFA: 1500,
    lat: 11.1410,
    lng: -4.2950,
  },
  {
    id: 'secteur_32_lafiabougou_sud',
    nom: 'Lafiabougou Sud',
    secteur: 'Secteur 32',
    distanceKm: 7.8,
    tarifFCFA: 1500,
    lat: 11.1450,
    lng: -4.3300,
  },

  // ==========================================
  // ZONE 3 : Plus de 8 km (1 500 FCFA + 100 F/km)
  // ==========================================
  {
    id: 'secteur_33_pala',
    nom: 'Pala / Ouezzin Nord',
    secteur: 'Secteur 33',
    distanceKm: 8.2,
    tarifFCFA: 1550,
    lat: 11.2250,
    lng: -4.3200,
  },
  {
    id: 'secteur_18_dafra',
    nom: 'Dafra / Faladiè',
    secteur: 'Secteur 18',
    distanceKm: 8.5,
    tarifFCFA: 1600,
    lat: 11.1350,
    lng: -4.3180,
  },
  {
    id: 'secteur_31_dafra_sud',
    nom: 'Dafra Extension',
    secteur: 'Secteur 31',
    distanceKm: 9.0,
    tarifFCFA: 1600,
    lat: 11.1280,
    lng: -4.3100,
  },
  {
    id: 'secteur_25_darsalamy',
    nom: 'Darsalamy / Route Banfora',
    secteur: 'Secteur 25',
    distanceKm: 9.5,
    tarifFCFA: 1650,
    lat: 11.1220,
    lng: -4.3400,
  },
  {
    id: 'secteur_24_samagan',
    nom: 'Samagan / Route Nasso',
    secteur: 'Secteur 24',
    distanceKm: 10.2,
    tarifFCFA: 1700,
    lat: 11.2350,
    lng: -4.2850,
  },
  {
    id: 'secteur_26_borodougou',
    nom: 'Borodougou',
    secteur: 'Secteur 26',
    distanceKm: 11.0,
    tarifFCFA: 1800,
    lat: 11.1150,
    lng: -4.2650,
  },
  {
    id: 'secteur_30_matourkou',
    nom: 'Matourkou',
    secteur: 'Secteur 30',
    distanceKm: 12.5,
    tarifFCFA: 1950,
    lat: 11.0950,
    lng: -4.3550,
  },
  {
    id: 'nasso_guinguette',
    nom: 'Nasso (Guinguette)',
    secteur: 'Périphérie',
    distanceKm: 15.0,
    tarifFCFA: 2200,
    lat: 11.2150,
    lng: -4.4350,
  },
];

/**
 * Calcule le tarif de livraison en fonction de la distance ou du tarif secteur fixe.
 */
export function calculerTarifBobo(distanceKm) {
  const d = Number(distanceKm);
  if (!Number.isFinite(d) || d <= 0) return 1000;
  if (d <= 4) return 1000;
  if (d <= 8) return 1500;
  return 1500 + Math.ceil(d - 8) * 100;
}

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
