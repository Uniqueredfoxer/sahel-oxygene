import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Link as LinkIcon,
  HelpCircle,
  Check,
} from 'lucide-react';
import { obtenirPositionGPS, extraireCoordonnees } from '../utils/geo';
import {
  CENTRE_DEFAUT,
  calculerItineraireRoutier,
  rechercherAdresses,
  geocoderInverse,
} from '../utils/routing';
import api from '../api/client';

import { SECTEURS_BOBO, DEPOT_DJARADOUGOU } from '../utils/boboSecteurs';

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
        <text x="18" y="23" font-size="13" font-weight="bold" font-family="system-ui, sans-serif" fill="${couleur}" text-anchor="middle">${lettre}</text>
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
const iconeDestination = creerIconeMarker('📍', '#1E293B'); // Charbon foncé
const iconeDepot = creerIconeMarker('🏭', '#047857'); // Dépôt Vert

export default function SelecteurItineraireMap({
  mode = 'destination_seule', // 'destination_seule' (Gaz) | 'trajet_complet' (Course)
  initialDepart = '',
  initialDestination = '',
  initialDistance = '',
  onItineraireChange,
}) {
  const estModeGaz = mode === 'destination_seule';

  // Coordonnées et adresses
  const [pointDepart, setPointDepart] = useState(
    estModeGaz
      ? { lat: CENTRE_DEFAUT.lat, lng: CENTRE_DEFAUT.lng, label: 'Dépôt SAHEL OXYGENE (Djaradougou, Bobo-Dioulasso)' }
      : null
  );
  const [pointDest, setPointDest] = useState(null);
  const [texteDepart, setTexteDepart] = useState(
    estModeGaz ? 'Dépôt SAHEL OXYGENE (Djaradougou, Bobo-Dioulasso)' : initialDepart
  );
  const [texteDest, setTexteDest] = useState(initialDestination);

  // Suggestions d'autocomplétion
  const [suggestionsDepart, setSuggestionsDepart] = useState([]);
  const [suggestionsDest, setSuggestionsDest] = useState([]);
  const [chargementSuggA, setChargementSuggA] = useState(false);
  const [chargementSuggB, setChargementSuggB] = useState(false);

  // Google Maps modal / paste
  const [modalGmaps, setModalGmaps] = useState(false);
  const [inputGmaps, setInputGmaps] = useState('');
  const [erreurGmaps, setErreurGmaps] = useState('');
  const [succesGmaps, setSuccesGmaps] = useState(false);

  // Métriques de route
  const [distanceKm, setDistanceKm] = useState(initialDistance ? parseFloat(initialDistance) : null);
  const [dureeMinutes, setDureeMinutes] = useState(null);
  const [montantEstime, setMontantEstime] = useState(null);
  const [calculEnCours, setCalculEnCours] = useState(false);
  const [modeSelection, setModeSelection] = useState(estModeGaz ? 'destination' : 'depart');
  const [gpsEnCours, setGpsEnCours] = useState(false);
  const [messageGps, setMessageGps] = useState('');

  // Références Leaflet
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerDepartRef = useRef(null);
  const markerDestRef = useRef(null);
  const polylineRef = useRef(null);
  const debounceTimerA = useRef(null);
  const debounceTimerB = useRef(null);

  // 1. Initialisation de la carte Leaflet avec tuiles OpenStreetMap officielles (Sans Watermark)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [CENTRE_DEFAUT.lat, CENTRE_DEFAUT.lng],
      zoom: 13,
      zoomControl: true,
      attributionControl: true,
    });

    // Tuiles OpenStreetMap officielles propres et sans filigrane
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapInstanceRef.current = map;

    // Clic sur la carte pour poser un point
    map.on('click', async (e) => {
      const { lat, lng } = e.latlng;
      const adresseTrouvee = await geocoderInverse(lat, lng);

      if (estModeGaz || modeSelection === 'destination') {
        const nouvDest = { lat, lng, label: adresseTrouvee };
        setPointDest(nouvDest);
        setTexteDest(adresseTrouvee);
      } else {
        const nouvDepart = { lat, lng, label: adresseTrouvee };
        setPointDepart(nouvDepart);
        setTexteDepart(adresseTrouvee);
        setModeSelection('destination');
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [estModeGaz, modeSelection]);

  // Synchroniser le dépôt par défaut en mode Gaz
  useEffect(() => {
    if (estModeGaz && !pointDepart) {
      setPointDepart({
        lat: CENTRE_DEFAUT.lat,
        lng: CENTRE_DEFAUT.lng,
        label: 'Dépôt SAHEL OXYGENE (Bobo-Dioulasso)',
      });
      setTexteDepart('Dépôt SAHEL OXYGENE (Bobo-Dioulasso)');
    }
  }, [estModeGaz, pointDepart]);

  // 2. Gestion des marqueurs
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Marqueur Départ
    if (pointDepart) {
      if (!markerDepartRef.current) {
        markerDepartRef.current = L.marker([pointDepart.lat, pointDepart.lng], {
          icon: estModeGaz ? iconeDepot : iconeDepart,
          draggable: !estModeGaz,
        }).addTo(map);

        if (!estModeGaz) {
          markerDepartRef.current.on('dragend', async (e) => {
            const { lat, lng } = e.target.getLatLng();
            const addr = await geocoderInverse(lat, lng);
            setPointDepart({ lat, lng, label: addr });
            setTexteDepart(addr);
          });
        }
      } else {
        markerDepartRef.current.setLatLng([pointDepart.lat, pointDepart.lng]);
      }
    } else if (markerDepartRef.current) {
      markerDepartRef.current.remove();
      markerDepartRef.current = null;
    }

    // Marqueur Destination
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
  }, [pointDepart, pointDest, estModeGaz]);

  // 3. Calcul de l'itinéraire routier
  const recalculerItineraire = useCallback(async () => {
    const depart = pointDepart || (estModeGaz ? { lat: CENTRE_DEFAUT.lat, lng: CENTRE_DEFAUT.lng, label: 'Dépôt SAHEL OXYGENE' } : null);
    if (!depart || !pointDest) return;

    setCalculEnCours(true);
    try {
      const res = await calculerItineraireRoutier(depart, pointDest);
      setDistanceKm(res.distanceKm);
      setDureeMinutes(res.dureeMinutes);

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

        const bounds = L.latLngBounds([
          [depart.lat, depart.lng],
          [pointDest.lat, pointDest.lng],
        ]);
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }

      try {
        const { data } = await api.get('/public/estimation', {
          params: { distanceKm: res.distanceKm },
        });
        setMontantEstime(data.montant);

        onItineraireChange?.({
          adresseDepart: texteDepart || depart.label,
          departLat: depart.lat,
          departLng: depart.lng,
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
  }, [pointDepart, pointDest, texteDepart, texteDest, estModeGaz, onItineraireChange]);

  useEffect(() => {
    if (pointDest && (pointDepart || estModeGaz)) {
      recalculerItineraire();
    }
  }, [pointDepart, pointDest, recalculerItineraire, estModeGaz]);

  // Autocomplétion
  const gererRechercheDest = (texte) => {
    setTexteDest(texte);
    clearTimeout(debounceTimerB.current);

    // Détection immédiate d'un lien ou coordonnées Google Maps collés
    const coords = extraireCoordonnees(texte);
    if (coords) {
      appliquerCoordonneesDestination(coords.lat, coords.lng);
      return;
    }

    if (!texte || texte.length < 2) {
      setSuggestionsDest([]);
      return;
    }
    setChargementSuggB(true);
    debounceTimerB.current = setTimeout(async () => {
      const res = await rechercherAdresses(texte, pointDest || CENTRE_DEFAUT);
      setSuggestionsDest(res);
      setChargementSuggB(false);
    }, 280);
  };

  const gererRechercheDepart = (texte) => {
    setTexteDepart(texte);
    clearTimeout(debounceTimerA.current);
    const coords = extraireCoordonnees(texte);
    if (coords) {
      appliquerCoordonneesDepart(coords.lat, coords.lng);
      return;
    }
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

  const appliquerSecteurBobo = (secteur) => {
    const label = `${secteur.nom} (${secteur.secteur}), Bobo-Dioulasso`;
    setPointDest({ lat: secteur.lat, lng: secteur.lng, label });
    setTexteDest(label);
    setDistanceKm(secteur.distanceKm);
    setMontantEstime(secteur.tarifFCFA);
    setSuggestionsDest([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([secteur.lat, secteur.lng], 15);
    }
    onItineraireChange?.({
      adresseDepart: texteDepart || 'Dépôt SAHEL OXYGENE (Djaradougou, Bobo-Dioulasso)',
      departLat: pointDepart?.lat || 11.1850,
      departLng: pointDepart?.lng || -4.2980,
      adresseDestination: label,
      destinationLat: secteur.lat,
      destinationLng: secteur.lng,
      distanceKm: secteur.distanceKm,
      montantEstime: secteur.tarifFCFA,
    });
  };

  const appliquerCoordonneesDestination = async (lat, lng, labelPersonnalise) => {
    const addr = labelPersonnalise || (await geocoderInverse(lat, lng));
    setPointDest({ lat, lng, label: addr });
    setTexteDest(addr);
    setSuggestionsDest([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  };

  const appliquerCoordonneesDepart = async (lat, lng, labelPersonnalise) => {
    const addr = labelPersonnalise || (await geocoderInverse(lat, lng));
    setPointDepart({ lat, lng, label: addr });
    setTexteDepart(addr);
    setSuggestionsDepart([]);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }
  };

  // 4. GPS Haute Précision
  const utiliserPositionActuelle = async () => {
    setGpsEnCours(true);
    setMessageGps('');
    try {
      const pos = await obtenirPositionGPS();
      const addr = await geocoderInverse(pos.lat, pos.lng);
      await appliquerCoordonneesDestination(pos.lat, pos.lng, addr);
      setMessageGps(`Position fixée (Précision : ~${pos.precisionMetres || 10}m)`);
      setTimeout(() => setMessageGps(''), 4000);
    } catch (err) {
      setMessageGps(err.message);
    } finally {
      setGpsEnCours(false);
    }
  };

  // 5. Parseur de lien Google Maps
  const validerLienGmaps = async (e) => {
    e.preventDefault();
    setErreurGmaps('');
    setSuccesGmaps(false);

    const coords = extraireCoordonnees(inputGmaps);
    if (!coords) {
      setErreurGmaps(
        'Format non reconnu. Collez un lien complet (ex : https://maps.app.goo.gl/...) ou des coordonnées (ex : 11.1772, -4.2979).'
      );
      return;
    }

    await appliquerCoordonneesDestination(coords.lat, coords.lng);
    setSuccesGmaps(true);
    setTimeout(() => {
      setModalGmaps(false);
      setInputGmaps('');
      setSuccesGmaps(false);
    }, 1000);
  };

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
      {/* Location Input Box */}
      <div className="card p-4 shadow-card space-y-3 bg-white border-slate-200">
        {/* En mode Course uniquement : Point de départ */}
        {!estModeGaz && (
          <div className="relative">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center">
                  A
                </span>
                <span>Adresse d'enlèvement (Départ)</span>
              </label>
            </div>

            <div className="relative">
              <input
                type="text"
                className="input pl-9 pr-8 text-xs font-medium"
                placeholder="Ex : Sikasso-Cira, face à la pharmacie..."
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

            {suggestionsDepart.length > 0 && (
              <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto animate-slide-up">
                {suggestionsDepart.map((item, idx) => (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => {
                      setPointDepart({ lat: item.lat, lng: item.lng, label: item.label });
                      setTexteDepart(item.label);
                      setSuggestionsDepart([]);
                      if (mapInstanceRef.current) mapInstanceRef.current.setView([item.lat, item.lng], 14);
                    }}
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

            <div className="flex justify-center my-1.5">
              <button
                type="button"
                onClick={inverserPoints}
                className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center border border-slate-200 shadow-xs active:scale-95"
                title="Inverser départ et destination"
              >
                <ArrowUpDown className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Adresse de Livraison / Destination */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-sahel text-white font-bold text-[10px] flex items-center justify-center shadow-xs">
                📍
              </span>
              <span>{estModeGaz ? 'Votre adresse de livraison' : 'Adresse de destination (Arrivée)'}</span>
            </label>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setModalGmaps(true)}
                className="text-[11px] font-semibold text-slate-600 hover:text-sahel flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors border border-slate-200"
                title="Coller un lien Google Maps"
              >
                <LinkIcon className="w-3 h-3 text-emerald-600" />
                <span>Google Maps</span>
              </button>

              <button
                type="button"
                onClick={utiliserPositionActuelle}
                disabled={gpsEnCours}
                className="text-[11px] font-semibold text-sahel hover:text-sahel-dark flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg hover:bg-emerald-100 transition-colors border border-emerald-200"
              >
                {gpsEnCours ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Navigation className="w-3 h-3" />
                )}
                <span>{gpsEnCours ? 'Précision GPS…' : 'Ma position GPS'}</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              className="input pl-9 pr-8 text-xs font-medium"
              placeholder="Ex : Accart-Ville, face à l'école ou collez un lien Google Maps..."
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

          {messageGps && (
            <p className="text-[11px] mt-1 text-slate-500 flex items-center gap-1 font-medium">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-sahel"></span>
              {messageGps}
            </p>
          )}

          {/* Dropdown suggestions */}
          {suggestionsDest.length > 0 && (
            <div className="absolute z-30 left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden divide-y divide-slate-100 max-h-56 overflow-y-auto animate-slide-up">
              {suggestionsDest.map((item, idx) => (
                <button
                  type="button"
                  key={idx}
                  onClick={() => appliquerCoordonneesDestination(item.lat, item.lng, item.label)}
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

        {/* Secteurs et Quartiers de Bobo-Dioulasso avec distances mesurées */}
        <div className="pt-2.5 border-t border-slate-100 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Choisir votre quartier / secteur (Bobo) :
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Distances réelles
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
            {SECTEURS_BOBO.map((s, idx) => {
              const estSelectionne =
                pointDest &&
                Math.abs(pointDest.lat - s.lat) < 0.003 &&
                Math.abs(pointDest.lng - s.lng) < 0.003;

              return (
                <button
                  key={`${s.nom}-${s.secteur}-${idx}`}
                  type="button"
                  onClick={() => appliquerSecteurBobo(s)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-all flex items-center gap-1.5 ${
                    estSelectionne
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 hover:bg-emerald-50 hover:text-sahel-dark hover:border-emerald-200 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="font-semibold">{s.nom}</span>
                  <span
                    className={`text-[9px] font-mono px-1 py-0.2 rounded ${
                      estSelectionne ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {s.distanceKm} km
                  </span>
                  <span
                    className={`text-[9px] font-mono font-bold px-1 py-0.2 rounded ${
                      estSelectionne ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {s.tarifFCFA} F
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Map Box */}
      <div className="card overflow-hidden shadow-card border-slate-200 relative">
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-slate-600 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-sahel" />
            <span>Touchez la carte ou glissez le repère pour ajuster</span>
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase">
            {estModeGaz ? 'Livraison directe' : 'Trajet interactif'}
          </span>
        </div>

        <div
          ref={mapContainerRef}
          className="w-full h-64 sm:h-72 z-10 cursor-crosshair"
          style={{ minHeight: '260px' }}
        />
      </div>


      {/* Modal / Pop-in pour Coller un lien Google Maps */}
      {modalGmaps &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
            <div className="card max-w-md w-full p-6 shadow-2xl space-y-4 bg-white border border-slate-200 my-auto animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-sahel flex items-center justify-center">
                    <LinkIcon className="w-4 h-4" />
                  </div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Coller un repère Google Maps
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalGmaps(false)}
                  className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Sur Google Maps, appuyez longuement sur votre maison pour déposer un repère, cliquez sur <strong>Partager</strong> et collez le lien ici :
              </p>

              <form onSubmit={validerLienGmaps} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    className="input text-xs font-mono"
                    placeholder="https://maps.app.goo.gl/... ou 11.1772, -4.2979"
                    value={inputGmaps}
                    onChange={(e) => setInputGmaps(e.target.value)}
                    autoFocus
                  />
                </div>

                {erreurGmaps && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {erreurGmaps}
                  </p>
                )}

                {succesGmaps && (
                  <p className="text-xs text-emerald-600 flex items-center gap-1 font-semibold">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    Position appliquée avec succès !
                  </p>
                )}

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalGmaps(false)}
                    className="btn-ghost text-xs py-2 px-3"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="btn-primary text-xs py-2 px-4 shadow-sm"
                  >
                    Appliquer la position
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
