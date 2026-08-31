/**
 * Grille tarifaire de livraison :
 * 0 à 4 km      -> 1000 FCFA
 * 4 à 8 km      -> 1500 FCFA
 * Au-delà de 8 km -> 1500 FCFA + 100 FCFA / km supplémentaire
 */
function calculerTarif(distanceKm) {
  const d = Number(distanceKm);
  if (!Number.isFinite(d) || d < 0) {
    throw new Error('Distance invalide');
  }
  if (d <= 4) return 1000;
  if (d <= 8) return 1500;
  const kmSup = Math.ceil(d - 8);
  return 1500 + kmSup * 100;
}

/**
 * Distance à vol d'oiseau (Haversine) en km entre deux points GPS.
 * Utilisée comme repli quand l'itinéraire routier (Google Maps) n'est pas disponible.
 */
function distanceHaversine(lat1, lng1, lat2, lng2) {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371; // rayon terrestre en km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export { calculerTarif, distanceHaversine };
