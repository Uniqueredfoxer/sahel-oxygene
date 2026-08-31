/**
 * Utilitaire de géolocalisation haute précision et parseur d'adresses/liens Google Maps.
 */

export function extraireCoordonnees(texte) {
  if (!texte || typeof texte !== 'string') return null;

  const t = texte.trim();

  // 1. Format direct "11.1772, -4.2979" ou "11.1772 -4.2979" ou "11.1772;-4.2979"
  const regexSimple = /^(-?\d{1,2}(?:\.\d+)?)[,\s;]+(-?\d{1,3}(?:\.\d+)?)$/;
  const matchSimple = t.match(regexSimple);
  if (matchSimple) {
    const lat = parseFloat(matchSimple[1]);
    const lng = parseFloat(matchSimple[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 2. Format Google Maps URL: /@11.1772,-4.2979 ou ?q=11.1772,-4.2979 ou ll=11.1772,-4.2979 ou daddr=11.1772,-4.2979
  const regexMaps = /(?:@|\?q=|&q=|ll=|daddr=|loc:)(-?\d{1,2}\.\d+)[,\s]+(-?\d{1,3}\.\d+)/;
  const matchMaps = t.match(regexMaps);
  if (matchMaps) {
    const lat = parseFloat(matchMaps[1]);
    const lng = parseFloat(matchMaps[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 3. Format geo:11.1772,-4.2979
  const regexGeo = /geo:(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/i;
  const matchGeo = t.match(regexGeo);
  if (matchGeo) {
    const lat = parseFloat(matchGeo[1]);
    const lng = parseFloat(matchGeo[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Tente d'obtenir la position GPS réelle et précise de l'appareil.
 * @returns {Promise<{ lat: number, lng: number, precisionMetres: number, source: string }>}
 */
export async function obtenirPositionGPS() {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('La géolocalisation n’est pas supportée par votre navigateur ou appareil.');
  }

  if (
    window.isSecureContext === false &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    throw new Error(
      'La géolocalisation requiert une connexion HTTPS sécurisée ou localhost. Votre navigateur a bloqué l’accès.'
    );
  }

  const capturePosition = (options) =>
    new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            precisionMetres: Math.round(pos.coords.accuracy || 10),
          }),
        (err) => reject(err),
        options
      );
    });

  // 1. Essai prioritaire : Haute précision GPS (satellite mobile)
  try {
    const pos = await capturePosition({
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
    return { ...pos, source: 'gps_satellite' };
  } catch (err1) {
    if (err1.code === 1) {
      throw new Error(
        'Accès à la position refusé. Veuillez autoriser la localisation dans les réglages de votre navigateur.'
      );
    }

    // 2. Essai secondaire : Mode réseau cellulaire / Wi-Fi
    try {
      const pos = await capturePosition({
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 30000,
      });
      return { ...pos, source: 'gps_reseau' };
    } catch (err2) {
      if (err2.code === 1) {
        throw new Error(
          'Accès à la position refusé. Veuillez autoriser la localisation dans les réglages du navigateur.'
        );
      }

      let message = 'Signal GPS introuvable. Touchez directement votre quartier sur la carte ou collez un repère Google Maps.';
      if (err2.code === 3) {
        message = 'Délai d’attente GPS dépassé. Veuillez toucher la carte pour indiquer votre position.';
      } else if (err2.code === 2) {
        message = 'Position indisponible sur cet appareil : sélectionnez votre emplacement sur la carte.';
      }

      throw new Error(message);
    }
  }
}
