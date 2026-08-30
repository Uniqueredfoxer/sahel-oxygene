/**
 * Génère un lien d'itinéraire "Google Maps" entre la position de l'utilisateur
 * et un coin vendeur, sans nécessiter de clé API (ouvre l'app Maps installée).
 * C'est ce lien qui constitue "l'itinéraire intégré automatiquement" dès que
 * l'administrateur enregistre les coordonnées GPS d'un coin — aucune saisie
 * manuelle de trajet n'est nécessaire.
 */
function lienItineraire(latOrigine, lngOrigine, latDestination, lngDestination) {
  const origin = `${latOrigine},${lngOrigine}`;
  const destination = `${latDestination},${lngDestination}`;
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;
}

export { lienItineraire };
