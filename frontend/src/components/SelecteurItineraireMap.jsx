import { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Navigation,
  Search,
  ArrowUpDown,
  RefreshCw,
  Clock,
  Coins,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { obtenirPositionGPS } from '../utils/geo';
import {
  CENTRE_DEFAUT,
  calculerItineraireRoutier,
  rechercherAdresses,
  geocoderInverse,
} from '../utils/routing';
import api from '../api/client';

// Création d'icônes SVG Leaflet personnalisées
function creerIconeMarker(lettre, couleur = '#059669') {
  const svgHtml = `
    <div style="
      position: relative;
      width: 36px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));
    ">
      <svg viewBox="0 0 36 44" width="36" height="44" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.06 0 0 8.06 0 18C0 31.5 18 44 18 44C18 44 36 31.5 36 18C36 8.06 27.94 0 18 0Z" fill="${couleur}"/>
        <circle cx="18" cy="18" r="14" fill="white"/>
        <text x="18" y="23" font-size="14" font-weight="bold" font-family="system-ui, sans-serif" fill="${couleur}" text-anchor="middle">${lettre}</text>
      </svg>
    </div>
  `;
  return L.divIcon({
    html: svgHtml,
    className: 'custom-map-pin',
    iconSize: [36, 44],
    iconAnchor: [18, 44],
    popupAnchor: [0, -40],
  });
}

const iconeDepart = creerIconeMarker('A', '#059669'); // Vert Émeraude
const iconeDestination = creerIconeMarker('B', '#0F172A'); // Charbon foncé

export default function SelecteurItineraireMap({
  initialDepart = '',
  initialDestination = '',
  initialDistance = '',
  onItineraireChange,
}) {
  // Coordonnées et adresses
  const [pointDepart, setPointDepart] = useState(null); // { lat, lng, label }
  const [pointDest, setPointDest] = useState(null); // { lat, lng, label }
  const [texteDepart, setTexteDepart] = useState(initialDepart);
  const [texteDest, setTexteDest] = useState(initialDestination);

  // Suggestions d'autocomplétion
  const [suggestionsDepart, setSuggestionsDepart] = useState([]);
  const [suggestionsDest, setSuggestionsDest] = useState([]);
  const [chargementSuggA, setChargementSuggA] = useState(false);
  const [chargementSuggB, setChargementSuggB] = useState(false);

  // Métriques de route
  const [distanceKm, setDistanceKm] = useState(initialDistance ? parseFloat(initialDistance) : null);
  const [dureeMinutes, setDureeMinutes] = useState(null);
  const [montantEstime, setMontantEstime] = useState(null);
  const [calculEnCours, setCalculEnCours] = useState(false);
  const [modeSelection, setModeSelection] = useState('depart'); // 'depart' | 'destination'
  const [gpsEnCours, setGpsEnCours] = useState(false);

  // Références Leaflet
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerDepartRef = useRef(null);
  const markerDestRef = useRef(null);
  const polylineRef = useRef(null);
  const debounceTimerA = useRef(null);
  const debounceTimerB = useRef(null);

  // 1. Initialisation de la carte Leaflet
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [CENTRE_DEFAUT.lat, CENTRE_DEFAUT.lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: false,
    });

    // Tuiles CartoDB Voyager pour un rendu moderne et ultra lisible
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      {
        maxZoom: 19,
        subdomains: 'abcd',
      }
    ).addTo(map);

    mapInstanceRef.current = map;

    // Clic sur la carte pour poser ou ajuster un point
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      const adresseTrouvee = await geocoderInverse(lat, lng);

      if (modeSelection === 'depart') {
        const nouvDepart = { lat, lng, label: adresseTrouvee };
        setPointDepart(nouvDepart);
        setTexteDepart(adresseTrouvee);
        setModeSelection('destination'); // Passe automatiquement au choix de la destination
      } else {
        const nouvDest = { lat, lng, label: adresseTrouvee };
        setPointDest(nouvDest);
        setTexteDest(adresseTrouvee);
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [modeSelection]);

  // 2. Gestion et synchronisation des marqueurs sur la carte
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Marqueur Départ (A)
    if (pointDepart) {
      if (!markerDepartRef.current) {
        markerDepartRef.current = L.marker([pointDepart.lat, pointDepart.lng], {
          icon: iconeDepart,
          draggable: true,
        }).addTo(map);

        markerDepartRef.current.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          const addr = await geocoderInverse(lat, lng);
          setPointDepart({ lat, lng, label: addr });
          setTexteDepart(addr);
        });
      } else {
        markerDepartRef.current.setLatLng([pointDepart.lat, pointDepart.lng]);
      }
    } else if (markerDepartRef.current) {
      markerDepartRef.current.remove();
      markerDepartRef.current = null;
    }

    // Marqueur Destination (B)
    if (pointDest) {
      if (!markerDestRef.current) {
        markerDestRef.current = L.marker([pointDest.lat, pointDest.lng], {
          icon: iconeDestination,
          draggable: true,
        }).addTo(map);

        markerDestRef.current.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          const addr = await geocoderInverse(lat, lng);
          setPointDest({ lat, lng, label: addr });
          setTexteDest(addr);
        });
      } else {
        markerDestRef.current.setLatLng([pointDest.lat, pointDest.lng]);
      }
    } else if (markerDestRef.current) {
      markerDestRef.current.remove();
      markerDestRef.current = null;
    }
  }, [pointDepart, pointDest]);

  // 3. Calcul de l'itinéraire routier dès que A et B sont positionnés
  const recalculerItineraire = useCallback(async () => {
    if (!pointDepart || !pointDest) return;

    setCalculEnCours(true);
    try {
      const res = await calculerItineraireRoutier(pointDepart, pointDest);
      setDistanceKm(res.distanceKm);
      setDureeMinutes(res.dureeMinutes);

      // Tracé de la polyline sur la carte
      const map = mapInstanceRef.current;
      if (map) {
        if (polylineRef.current) {
          polylineRef.current.remove();
        }
        polylineRef.current = L.polyline(res.polyline, {
          color: '#059669',
          weight: 5,
          opacity: 0.85,
          lineJoin: 'round',
        }).addTo(map);

        // Ajuster la vue de la carte pour englober les deux points
        const bounds = L.latLngBounds([
          [pointDepart.lat, pointDepart.lng],
          [pointDest.lat, pointDest.lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      // Calcul du tarif estimé via l'API backend
      try {
        const { data } = await api.get('/public/estimation', {
          params: { distanceKm: res.distanceKm },
        });
        setMontantEstime(data.montant);

        // Notification vers le composant parent
        onItineraireChange?.({
          adresseDepart: texteDepart || pointDepart.label,
          departLat: pointDepart.lat,
          departLng: pointDepart.lng,
          adresseDestination: texteDest || pointDest.label,
          destinationLat: pointDest.lat,
          destinationLng: pointDest.lng,
          distanceKm: res.distanceKm,
          dureeMinutes: res.dureeMinutes,
          montantEstime: data.montant,
        });
      } catch {
        /* ignore */
      }
    } catch (err) {
      console.error('[Route] Erreur de calcul:', err);
    } finally {
      setCalculEnCours(false);
    }
  }, [pointDepart, pointDest, texteDepart, texteDest, onItineraireChange]);

  useEffect(() => {
    if (pointDepart && pointDest) {
      recalculerItineraire();
    }
  }, [pointDepart, pointDest, recalculerItineraire]);

  // 4. Recherche avec autocomplétion pour le Départ
  const gererRechercheDepart = (texte) => {
    setTexteDepart(texte);
    clearTimeout(debounceTimerA.current);
    if (!texte || texte.length < 2) {
      setSuggestionsDepart([]);
      return;
    }
    setChargementSuggA(true);
    debounceTimerA.current = setTimeout(async () => {
      const res = await rechercherAdresses(texte, pointDepart || CENTRE_DEFAUT);
      setSuggestionsDepart(res);
      setChargementSuggA(false);
    }, 280);
  };

  // 5. Recherche avec autocomplétion pour la Destination
  const gererRechercheDest = (texte) => {
    setTexteDest(texte);
    clearTimeout(debounceTimerB.current);
    if (!texte || texte.length < 2) {
      setSuggestionsDest([]);
      return;
    }
    setChargementSuggB(true);
    debounceTimerB.current = setTimeout(async () => {
      const res = await rechercherAdresses(texte, pointDest || pointDepart || CENTRE_DEFAUT);
      setSuggestionsDest(res);
      setChargementSuggB(false);
    }, 280);
  };

  // 6. Sélectionner une adresse suggérée
  const selectionnerDepart = (item) => {
    setPointDepart({ lat: item.lat, lng: item.lng, label: item.label });
    setTexteDepart(item.label);
    setSuggestionsDepart([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([item.lat, item.lng], 14);
    }
  };

  const selectionnerDest = (item) => {
    setPointDest({ lat: item.lat, lng: item.lng, label: item.label });
    setTexteDest(item.label);
    setSuggestionsDest([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([item.lat, item.lng], 14);
    }
  };

  // 7. Bouton "Utiliser ma position GPS"
  const utiliserPositionActuelle = async () => {
    setGpsEnCours(true);
    try {
      const pos = await obtenirPositionGPS();
      const addr = await geocoderInverse(pos.lat, pos.lng);
      setPointDepart({ lat: pos.lat, lng: pos.lng, label: addr });
      setTexteDepart(addr);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([pos.lat, pos.lng], 15);
      }
    } catch (err) {
      console.warn('[GPS] Erreur:', err.message);
    } finally {
      setGpsEnCours(false);
    }
  };

  // 8. Inverser Départ et Destination
  const inverserPoints = () => {
    const tempPoint = pointDepart;
    const tempTexte = texteDepart;
    setPointDepart(pointDest);
    setTexteDepart(texteDest);
    setPointDest(tempPoint);
    setTexteDest(tempTexte);
  };

  return (
    <div className="space-y-4">
      {/* Search and Autocomplete inputs */}
      <div className="card p-4 shadow-card space-y-3 bg-white border-slate-200">
        {/* Point de départ */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                A
              </span>
              <span>Adresse de départ</span>
            </label>
            <button
              type="button"
              onClick={utiliserPositionActuelle}
              disabled={gpsEnCours}
              className="text-[11px] font-semibold text-sahel hover:text-sahel-dark flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md hover:bg-emerald-100 transition-colors"
            >
              {gpsEnCours ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Navigation className="w-3 h-3" />
              )}
              <span>{gpsEnCours ? 'Localisation…' : 'Ma position GPS'}</span>
            </button>
          </div>

          <div className="relative">
            <input
              type="text"
              className="input pl-9 pr-8 text-xs font-medium"
              placeholder="Rechercher un lieu, quartier, pharmacie (ex: Ouaga 2000)…"
              value={texteDepart}
              onChange={(e) => gererRechercheDepart(e.target.value)}
              onFocus={() => setModeSelection('depart')}
              required
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {chargementSuggA && (
              <RefreshCw className="w-3.5 h-3.5 text-sahel animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Dropdown suggestions Départ */}
          {suggestionsDepart.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto animate-slide-up">
              {suggestionsDepart.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => selectionnerDepart(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-emerald-50 text-xs transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">{item.nomCourt}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="flex justify-center -my-1 relative z-10">
          <button
            type="button"
            onClick={inverserPoints}
            className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center shadow-sm border border-slate-200 transition-all active:scale-95"
            title="Inverser départ et destination"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Point de destination */}
        <div className="relative">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-bold text-[10px] flex items-center justify-center">
              B
            </span>
            <span>Adresse de destination</span>
          </label>

          <div className="relative">
            <input
              type="text"
              className="input pl-9 pr-8 text-xs font-medium"
              placeholder="Destination (ex: Koulouba, face au marché)…"
              value={texteDest}
              onChange={(e) => gererRechercheDest(e.target.value)}
              onFocus={() => setModeSelection('destination')}
              required
            />
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            {chargementSuggB && (
              <RefreshCw className="w-3.5 h-3.5 text-sahel animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
            )}
          </div>

          {/* Dropdown suggestions Destination */}
          {suggestionsDest.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto animate-slide-up">
              {suggestionsDest.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => selectionnerDest(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-slate-50 text-xs transition-colors flex items-start gap-2"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">{item.nomCourt}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{item.label}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Interactive Map Container */}
      <div className="card overflow-hidden shadow-card border-slate-200 relative">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sahel" />
            <span>Touchez la carte ou glissez les repères pour ajuster</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white text-slate-500 border border-slate-200 uppercase">
            Mode : {modeSelection === 'depart' ? 'Placer Départ (A)' : 'Placer Destination (B)'}
          </span>
        </div>

        {/* Map Box */}
        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-72 z-10 cursor-crosshair"
          style={{ minHeight: '260px' }}
        />
      </div>

      {/* Real-time KPI Card (Distance, Duration & Fare) */}
      {distanceKm !== null && (
        <div className="card p-4 shadow-card bg-gradient-to-br from-white to-emerald-50/40 border-emerald-200 animate-slide-up">
          <div className="grid grid-cols-3 gap-3 text-center divide-x divide-emerald-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                Distance
              </span>
              <p className="font-display font-bold text-lg text-slate-900 mt-0.5">
                {calculEnCours ? '…' : `${distanceKm} km`}
              </p>
            </div>

            <div className="pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center justify-center gap-1">
                <Clock className="w-3 h-3 text-emerald-600" />
                <span>Durée est.</span>
              </span>
              <p className="font-display font-bold text-lg text-slate-800 mt-0.5">
                {calculEnCours ? '…' : dureeMinutes ? `~${dureeMinutes} min` : '—'}
              </p>
            </div>

            <div className="pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block flex items-center justify-center gap-1">
                <Coins className="w-3 h-3 text-sahel" />
                <span>Tarif Course</span>
              </span>
              <p className="font-display font-bold text-lg text-sahel-dark font-mono mt-0.5">
                {calculEnCours
                  ? 'Calcul…'
                  : montantEstime
                  ? `${montantEstime.toLocaleString('fr-FR')} F`
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
