import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { formaterMontant, formaterDate } from './format.js';

const VERT_SAHEL = '#1E8449';
const NOIR = '#111111';
const GRIS = '#555555';

/**
 * Génère le reçu PDF A4 (§3.5 du cahier des charges) :
 * en-tête vert SahelOxygene Livraison, tableau d'informations,
 * montant mis en évidence, signature du client, QR code de vérification.
 * Retourne un Buffer.
 */
async function genererRecuPDF(livraison = {}, urlVerification = '', appName = 'SAHEL OXYGENE') {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks = [];
      doc.on('data', (c) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width;
      const nomApp = appName || 'SAHEL OXYGENE';

      // --- En-tête vert ---
      doc.rect(0, 0, pageWidth, 110).fill(VERT_SAHEL);
      doc
        .fillColor('#FFFFFF')
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(nomApp, 50, 35);
      doc
        .fontSize(11)
        .font('Helvetica')
        .text('Reçu de livraison', 50, 65);
      doc
        .fontSize(11)
        .text(livraison.numero || '-', 50, 82);

      let y = 140;
      doc.fillColor(NOIR).font('Helvetica-Bold').fontSize(13).text('Informations de la course', 50, y);
      y += 25;

      const clientInfo = livraison.clientNom
        ? `${livraison.clientNom} (${livraison.clientTelephone || '-'})`
        : (livraison.clientTelephone || '-');

      const rows = [
        ['Date', formaterDate(livraison.deliveredAt || livraison.createdAt)],
        ['Client', clientInfo],
        ['Départ', livraison.adresseDepart || '-'],
        ['Destination', livraison.adresseDestination || '-'],
        ['Distance', livraison.distanceKm ? `${livraison.distanceKm} km` : '-'],
        ['Livreur', livraison.livreur ? (livraison.livreur.name || '-') : '-'],
        ['Statut', libelleStatut(livraison.statut)],
      ];

      doc.font('Helvetica').fontSize(11);
      rows.forEach(([label, value], i) => {
        const rowY = y + i * 24;
        if (i % 2 === 0) {
          doc.rect(50, rowY - 4, pageWidth - 100, 22).fill('#F2F6F3');
        }
        doc.fillColor(GRIS).text(label, 60, rowY, { width: 150 });
        doc.fillColor(NOIR).text(String(value ?? '-'), 220, rowY, { width: pageWidth - 280 });
      });

      y += rows.length * 24 + 20;

      // --- Montant mis en évidence ---
      doc.rect(50, y, pageWidth - 100, 60).fill(VERT_SAHEL);
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(14)
        .text('MONTANT À PAYER', 65, y + 12);
      doc
        .fontSize(24)
        .text(`${formaterMontant(livraison.montant)} FCFA`, 65, y + 30);

      y += 90;

      // --- Signature ---
      doc.fillColor(NOIR).font('Helvetica-Bold').fontSize(12).text('Signature du client', 50, y);
      y += 18;
      doc.rect(50, y, 220, 100).strokeColor('#CCCCCC').stroke();
      if (livraison.signatureDataUrl && typeof livraison.signatureDataUrl === 'string' && livraison.signatureDataUrl.includes('base64,')) {
        try {
          const base64 = livraison.signatureDataUrl.split('base64,').pop();
          if (base64) {
            const imgBuffer = Buffer.from(base64, 'base64');
            doc.image(imgBuffer, 55, y + 5, { fit: [210, 90] });
          }
        } catch (e) {
          // signature illisible : on laisse le cadre vide
        }
      }

      // --- QR code de vérification ---
      const urlAEncoder = urlVerification || `https://saheloxygene.com/verifier/${livraison.qrToken || livraison.numero || ''}`;
      try {
        const qrDataUrl = await QRCode.toDataURL(String(urlAEncoder), { margin: 1, width: 200 });
        const qrBase64 = qrDataUrl.split(',').pop();
        const qrBuffer = Buffer.from(qrBase64, 'base64');
        doc.image(qrBuffer, pageWidth - 190, y, { fit: [140, 140] });
        doc
          .fontSize(8)
          .fillColor(GRIS)
          .text('Scanner pour vérifier ce reçu', pageWidth - 190, y + 142, { width: 140, align: 'center' });
      } catch (e) {
        // En cas d'erreur QR, continuer la génération sans bloquer le PDF
      }

      // --- Pied de page ---
      doc
        .fontSize(9)
        .fillColor(GRIS)
        .text(
          `${nomApp} — Document généré automatiquement.`,
          50,
          doc.page.height - 50,
          { align: 'center', width: pageWidth - 100 }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function libelleStatut(statut) {
  return (
    {
      en_attente: 'En attente',
      en_cours: 'En cours',
      livree: 'Livrée',
      annulee: 'Annulée',
    }[statut] || statut
  );
}

export { genererRecuPDF, libelleStatut };
