import axios from 'axios';
import { extraireCoordonnees } from './geo';

// Dépôt de référence et centre par défaut : Djaradougou, Bobo-Dioulasso
export const CENTRE_DEFAUT = {
  lat: 11.1850,
  lng: -4.2980,
  ville: 'Bobo-Dioulasso',
  label: 'Dépôt SAHEL OXYGENE (Djaradougou, Bobo-Dioulasso)',
};
export const CENTRE_OUAGA = { lat: 12.3714, lng: -1.5197, ville: 'Ouagadougou' };

/**
 * Calcule la distance orthodromique (Haversine) en km
 */
export function distanceHaversine(lat1, lon1, lat2, lon2) {
  const R = 6371; // Rayon de la Terre en km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calcule l'itinéraire routier réel entre deux points GPS
 * @param {{ lat: number, lng: number }} depart
 * @param {{ lat: number, lng: number }} destination
 * @returns {Promise<{ distanceKm: number, dureeMinutes: number, polyline: Array<[number, number]> }>}
 */
export async function calculerItineraireRoutier(depart, destination) {
  if (!depart?.lat || !depart?.lng || !destination?.lat || !destination?.lng) {
    throw new Error('Coordonnées de départ et destination requises');
  }

  // 1. Essai avec le moteur de routage routier OSRM
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${depart.lng},${depart.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await axios.get(url, { timeout: 6000 });
    if (res.data?.routes?.[0]) {
      const route = res.data.routes[0];
      const distanceKm = Math.round((route.distance / 1000) * 10) / 10; // Arrondi à 1 décimale (ex: 5.4)
      const dureeMinutes = Math.max(1, Math.round(route.duration / 60));
      // GeoJSON renvoie [lng, lat], Leaflet utilise [lat, lng]
      const polyline = (route.geometry?.coordinates || []).map(([lng, lat]) => [lat, lng]);

      return {
        distanceKm: distanceKm < 0.1 ? 0.5 : distanceKm,
        dureeMinutes,
        polyline,
      };
    }
  } catch (err) {
    console.warn('[Routing] OSRM indisponible ou hors-ligne, bascule sur calcul géodésique avec coefficient urbain:', err.message);
  }

  // 2. Fallback sécurisé : Calcul Haversine avec coefficient de sinuosité routière urbaine (x1.28)
  const distVolOiseau = distanceHaversine(depart.lat, depart.lng, destination.lat, destination.lng);
  const distanceKm = Math.max(0.5, Math.round(distVolOiseau * 1.28 * 10) / 10);
  const dureeMinutes = Math.max(2, Math.round(distanceKm * 2.5)); // ~25 km/h en ville

  return {
    distanceKm,
    dureeMinutes,
    polyline: [
      [depart.lat, depart.lng],
      [destination.lat, destination.lng],
    ],
  };
}

/**
 * Recherche des adresses et points d'intérêt avec autocomplétion
 * @param {string} requete
 * @param {{ lat: number, lng: number }} [centreBias]
 * @returns {Promise<Array<{ label: string, nomCourt: string, lat: number, lng: number }>>}
 */
export async function rechercherAdresses(requete, centreBias = CENTRE_DEFAUT) {
  if (!requete || requete.trim().length < 2) return [];

  const texte = requete.trim();

  // Si l'utilisateur colle des coordonnées ou un lien Google Maps
  const coordsExtracted = extraireCoordonnees(texte);
  if (coordsExtracted) {
    const reverse = await geocoderInverse(coordsExtracted.lat, coordsExtracted.lng);
    return [
      {
        label: reverse || `Position (${coordsExtracted.lat.toFixed(5)}, ${coordsExtracted.lng.toFixed(5)})`,
        nomCourt: reverse ? reverse.split(',')[0] : 'Coordonnées GPS',
        lat: coordsExtracted.lat,
        lng: coordsExtracted.lng,
      },
    ];
  }

  try {
    // Recherche via OpenStreetMap Nominatim avec biais géographique Afrique de l'Ouest / Burkina Faso
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      texte
    )}&limit=6&addressdetails=1&viewbox=${centreBias.lng - 0.6},${centreBias.lat + 0.6},${centreBias.lng + 0.6},${centreBias.lat - 0.6}&bounded=0`;

    const res = await axios.get(url, {
      timeout: 5000,
      headers: { 'Accept-Language': 'fr' },
    });

    if (Array.isArray(res.data)) {
      return res.data.map((item) => {
        const address = item.address || {};
        const nomPrincipal =
          item.name ||
          address.road ||
          address.suburb ||
          address.neighbourhood ||
          address.commercial ||
          address.amenity ||
          item.display_name.split(',')[0];

        const quartierVille = [
          address.suburb || address.neighbourhood || address.residential,
          address.city || address.town || address.village || address.state,
        ]
          .filter(Boolean)
          .join(', ');

        const label = quartierVille ? `${nomPrincipal} (${quartierVille})` : item.display_name;

        return {
          label,
          nomCourt: nomPrincipal,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        };
      });
    }
  } catch (err) {
    console.warn('[Search] Erreur autocomplétion Nominatim:', err.message);
  }

  return [];
}

/**
 * Géocodage inverse : convertit des coordonnées GPS en nom de lieu
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string>}
 */
export async function geocoderInverse(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await axios.get(url, {
      timeout: 4000,
      headers: { 'Accept-Language': 'fr' },
    });

    if (res.data) {
      const addr = res.data.address || {};
      const repere =
        addr.amenity ||
        addr.building ||
        addr.road ||
        addr.pedestrian ||
        addr.suburb ||
        addr.neighbourhood ||
        res.data.name;

      const ville = addr.city || addr.town || addr.village || '';
      const quartier = addr.suburb || addr.neighbourhood || '';

      const parties = [repere, quartier, ville].filter(Boolean);
      return parties.length > 0 ? parties.join(', ') : res.data.display_name;
    }
  } catch {
    /* ignore */
  }
  return `Point (${lat.toFixed(4)}, ${lng.toFixed(4)})`;
}
