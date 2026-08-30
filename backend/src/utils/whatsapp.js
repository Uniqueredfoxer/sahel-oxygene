/**
 * SahelOxygene Livraison n'a pas d'accès à l'API WhatsApp Business (nécessite
 * un compte Meta approuvé + jeton). En attendant cette intégration, on génère
 * des liens "wa.me" pré-remplis : cliquer dessus ouvre WhatsApp avec le
 * message déjà rédigé, prêt à envoyer en un clic. C'est la même logique que
 * décrite au §3.1 et §3.5 du cahier des charges, sans l'automatisation
 * serveur qui nécessiterait une clé API.
 */
import { formaterDate } from './format.js';

function lienWhatsApp(numero, message) {
  const chiffres = String(numero || '').replace(/\D/g, '');
  const texte = encodeURIComponent(message || '');
  return `https://wa.me/${chiffres}?text=${texte}`;
}

function messageNouvelleCommande(livraison, urlVerification, appName = 'Gaz') {
  return (
    `🆕 Nouvelle commande ${appName}\n` +
    `N° ${livraison.numero}\n` +
    `Client : ${livraison.clientNom || 'Non renseigné'} (${livraison.clientTelephone})\n` +
    `Départ : ${livraison.adresseDepart}\n` +
    `Destination : ${livraison.adresseDestination}\n` +
    `Distance : ${livraison.distanceKm ?? '-'} km\n` +
    `Montant : ${livraison.montant} FCFA\n` +
    `Vérification : ${urlVerification}`
  );
}

function messageRecu(livraison, urlVerification, appName = 'Gaz') {
  return (
    `🧾 Reçu ${appName}\n` +
    `N° ${livraison.numero}\n` +
    `Date : ${formaterDate(livraison.deliveredAt || livraison.createdAt)}\n` +
    `Client : ${livraison.clientNom || ''} (${livraison.clientTelephone})\n` +
    `Trajet : ${livraison.adresseDepart} → ${livraison.adresseDestination}\n` +
    `Montant : ${livraison.montant} FCFA\n` +
    `Livreur : ${livraison.livreur ? livraison.livreur.name : ''}\n` +
    `Vérifier ce reçu : ${urlVerification}`
  );
}

export { lienWhatsApp, messageNouvelleCommande, messageRecu };
