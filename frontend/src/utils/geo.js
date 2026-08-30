/**
 * Utilitaire de géolocalisation robuste avec stratégie de repli (High accuracy -> Low accuracy -> Diagnostic).
 */

export function extraireCoordonnees(texte) {
  if (!texte || typeof texte !== 'string') return null;

  const t = texte.trim();

  // Format "12.3714, -1.5197" ou "12.3714 -1.5197"
  const regexSimple = /^(-?\d+(\.\d+)?)[,\s]+(-?\d+(\.\d+)?)$/;
  const matchSimple = t.match(regexSimple);
  if (matchSimple) {
    const lat = parseFloat(matchSimple[1]);
    const lng = parseFloat(matchSimple[3]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // Format Google Maps URL: /@12.3714,-1.5197 ou ?q=12.3714,-1.5197 ou ll=12.3714,-1.5197
  const regexMaps = /[@?&](?:q|ll|loc:)?(-?\d+\.\d+),(-?\d+\.\d+)/;
  const matchMaps = t.match(regexMaps);
  if (matchMaps) {
    const lat = parseFloat(matchMaps[1]);
    const lng = parseFloat(matchMaps[2]);
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

/**
 * Tente d'obtenir la position GPS de l'utilisateur avec gestion de timeout et repli progressif.
 * @returns {Promise<{ lat: number, lng: number, source: string }>}
 */
export async function obtenirPositionGPS() {
  if (typeof window === 'undefined' || !navigator.geolocation) {
    throw new Error('La géolocalisation n’est pas supportée par votre navigateur ou appareil.');
  }

  // Vérification contexte sécurisé (HTTPS ou localhost obligatoire pour l'API Geolocation)
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
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        options
      );
    });

  // Étape 1 : Essai haute précision (GPS mobile / satellite) avec timeout de 5 secondes
  try {
    const pos = await capturePosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 10000,
    });
    return { ...pos, source: 'gps_haute_precision' };
  } catch (err1) {
    // Si l'utilisateur a explicitement refusé (code 1 = PERMISSION_DENIED), on s'arrête
    if (err1.code === 1) {
      throw new Error(
        'Accès à la position refusé. Veuillez autoriser la localisation dans les paramètres de votre navigateur.'
      );
    }

    // Étape 2 : Repli vers basse précision (Wi-Fi / réseaux mobiles / cache)
    try {
      const pos = await capturePosition({
        enableHighAccuracy: false,
        timeout: 7000,
        maximumAge: 60000,
      });
      return { ...pos, source: 'reseau_basse_precision' };
    } catch (err2) {
      if (err2.code === 1) {
        throw new Error(
          'Accès à la position refusé. Veuillez autoriser la localisation dans les paramètres du navigateur.'
        );
      }

      // Étape 3 : Tentative de secours par géolocalisation IP (si disponible et connecté)
      try {
        const res = await fetch('https://ipapi.co/json/', { timeout: 4000 });
        if (res.ok) {
          const data = await res.json();
          if (data.latitude && data.longitude) {
            return {
              lat: Number(data.latitude),
              lng: Number(data.longitude),
              source: 'ip_approximative',
            };
          }
        }
      } catch {
        /* ignore */
      }

      let message = 'Signal GPS introuvable ou indisponible sur cet appareil.';
      if (err2.code === 3) {
        message = 'Délai d’attente du signal GPS dépassé. Veuillez réessayer ou entrer les coordonnées manuellement.';
      } else if (err2.code === 2) {
        message = 'Position indisponible : activez le GPS de votre appareil ou saisissez les coordonnées.';
      }

      throw new Error(message);
    }
  }
}
