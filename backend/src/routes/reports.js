import express from 'express';
import { Op } from 'sequelize';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import { sequelize, Livraison, User } from '../models/index.js';
import { authentifier, exigerRole } from '../middleware/auth.js';
import { formaterMontant, formaterDate } from '../utils/format.js';
import { obtenirNomPlateforme } from '../utils/branding.js';
import { parseValidDate } from '../validators.js';

const router = express.Router();
const STAFF = ['administrateur', 'gestionnaire'];

function bornesPeriode(req) {
  const { debut, fin } = req.query;
  const where = {};
  const dateDebut = parseValidDate(debut);
  const dateFin = parseValidDate(fin ? `${fin}T23:59:59.999Z` : null);

  if (dateDebut || dateFin) {
    where.createdAt = {};
    if (dateDebut) where.createdAt[Op.gte] = dateDebut;
    if (dateFin) where.createdAt[Op.lte] = dateFin;
  }
  return where;
}

// GET /api/reports/journalier?debut=...&fin=...
router.get('/journalier', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const where = bornesPeriode(req);
    const lignes = await Livraison.findAll({
      attributes: [
        [sequelize.fn('DATE', sequelize.col('created_at')), 'jour'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'nombre'],
        [
          sequelize.fn('SUM', sequelize.literal(`CASE WHEN statut = 'livree' THEN montant ELSE 0 END`)),
          'chiffreAffaires',
        ],
      ],
      where,
      group: [sequelize.fn('DATE', sequelize.col('created_at'))],
      order: [[sequelize.literal('jour'), 'DESC']],
    });
    res.json(lignes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération du rapport', details: err.message });
  }
});

// GET /api/reports/mensuel?debut=...&fin=...
router.get('/mensuel', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const where = bornesPeriode(req);
    const lignes = await Livraison.findAll({
      attributes: [
        [sequelize.fn('to_char', sequelize.col('created_at'), 'YYYY-MM'), 'mois'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'nombre'],
        [
          sequelize.fn('SUM', sequelize.literal(`CASE WHEN statut = 'livree' THEN montant ELSE 0 END`)),
          'chiffreAffaires',
        ],
      ],
      where,
      group: [sequelize.fn('to_char', sequelize.col('created_at'), 'YYYY-MM')],
      order: [[sequelize.literal('mois'), 'DESC']],
    });
    res.json(lignes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération du rapport', details: err.message });
  }
});

// GET /api/reports/par-livreur?debut=...&fin=...
router.get('/par-livreur', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const where = { ...bornesPeriode(req), livreurId: { [Op.ne]: null } };
    const lignes = await Livraison.findAll({
      attributes: [
        'livreurId',
        [sequelize.fn('COUNT', sequelize.col('Livraison.id')), 'nombre'],
        [
          sequelize.fn('SUM', sequelize.literal(`CASE WHEN statut = 'livree' THEN montant ELSE 0 END`)),
          'chiffreAffaires',
        ],
      ],
      where,
      include: [{ model: User, as: 'livreur', attributes: ['name', 'phone'] }],
      group: ['livreurId', 'livreur.id'],
      order: [[sequelize.literal('"chiffreAffaires"'), 'DESC']],
    });
    res.json(lignes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération du rapport', details: err.message });
  }
});

// GET /api/reports/par-client?debut=...&fin=...
router.get('/par-client', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const where = bornesPeriode(req);
    const lignes = await Livraison.findAll({
      attributes: [
        'clientTelephoneNormalise',
        [sequelize.fn('MAX', sequelize.col('client_nom')), 'clientNom'],
        [sequelize.fn('MAX', sequelize.col('client_telephone')), 'clientTelephone'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'nombre'],
        [
          sequelize.fn('SUM', sequelize.literal(`CASE WHEN statut = 'livree' THEN montant ELSE 0 END`)),
          'chiffreAffaires',
        ],
      ],
      where,
      group: ['clientTelephoneNormalise'],
      order: [[sequelize.literal('"chiffreAffaires"'), 'DESC']],
    });
    res.json(lignes);
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la génération du rapport', details: err.message });
  }
});

// GET /api/reports/export/excel?type=journalier|mensuel|par-livreur|par-client
router.get('/export/excel', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const type = req.query.type || 'journalier';
    const where = bornesPeriode(req);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rapport');

    const livraisons = await Livraison.findAll({
      where,
      include: [{ model: User, as: 'livreur', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
    });

    sheet.columns = [
      { header: 'Numéro', key: 'numero', width: 22 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Client', key: 'client', width: 20 },
      { header: 'Téléphone', key: 'telephone', width: 16 },
      { header: 'Départ', key: 'depart', width: 28 },
      { header: 'Destination', key: 'destination', width: 28 },
      { header: 'Distance (km)', key: 'distance', width: 14 },
      { header: 'Montant (FCFA)', key: 'montant', width: 16 },
      { header: 'Statut', key: 'statut', width: 14 },
      { header: 'Livreur', key: 'livreur', width: 20 },
    ];
    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF167942' } };

    livraisons.forEach((l) => {
      sheet.addRow({
        numero: l.numero,
        date: formaterDate(l.createdAt),
        client: l.clientNom || '',
        telephone: l.clientTelephone,
        depart: l.adresseDepart,
        destination: l.adresseDestination,
        distance: l.distanceKm,
        montant: l.montant,
        statut: l.statut,
        livreur: l.livreur ? l.livreur.name : '',
      });
    });

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="rapport-${type}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'export Excel", details: err.message });
  }
});

// GET /api/reports/export/pdf?type=journalier|mensuel|par-livreur|par-client
router.get('/export/pdf', authentifier, exigerRole(...STAFF), async (req, res) => {
  try {
    const type = req.query.type || 'journalier';
    const where = bornesPeriode(req);
    const livraisons = await Livraison.findAll({
      where,
      include: [{ model: User, as: 'livreur', attributes: ['name'] }],
      order: [['createdAt', 'DESC']],
      limit: 1000,
    });

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="rapport-${type}.pdf"`);
    doc.pipe(res);

    const appName = await obtenirNomPlateforme();
    doc.fillColor('#167942').fontSize(20).font('Helvetica-Bold').text(`${appName} — Rapport d'activité`);
    doc.fillColor('#666666').fontSize(10).font('Helvetica').text(`Généré le ${formaterDate(new Date())} — Type : ${type}`);
    doc.moveDown(1.5);

    let totalCA = 0;
    let totalLivrees = 0;
    livraisons.forEach((l) => {
      if (l.statut === 'livree') {
        totalCA += l.montant;
        totalLivrees += 1;
      }
    });

    // Summary box
    const startY = doc.y;
    doc.rect(40, startY, doc.page.width - 80, 45).fill('#F0FDF4');
    doc.fillColor('#167942').font('Helvetica-Bold').fontSize(11)
      .text(`Commandes totales : ${livraisons.length}  |  Livrées : ${totalLivrees}  |  CA Réalisé : ${formaterMontant(totalCA)} FCFA`, 55, startY + 16);
    doc.moveDown(2);

    doc.fillColor('#111111').font('Helvetica-Bold').fontSize(10);
    doc.text('Détail des dernières livraisons :', 40, doc.y);
    doc.moveDown(0.5);

    doc.font('Helvetica').fontSize(8.5);
    livraisons.forEach((l, index) => {
      // Auto page break with header margin
      if (doc.y > doc.page.height - 60) {
        doc.addPage();
      }

      const rowY = doc.y;
      if (index % 2 === 0) {
        doc.rect(40, rowY - 2, doc.page.width - 80, 18).fill('#F8FAFC');
      }

      doc.fillColor('#111111')
        .text(
          `${l.numero}  ·  ${formaterDate(l.createdAt)}  ·  ${l.clientTelephone}  ·  ${l.adresseDepart.slice(0, 20)} → ${l.adresseDestination.slice(0, 20)}  ·  ${formaterMontant(l.montant)} FCFA  ·  [${l.statut}]`,
          45,
          rowY + 2,
          { width: doc.page.width - 90, lineBreak: false }
        );
      doc.y = rowY + 18;
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de l'export PDF", details: err.message });
  }
});

export default router;
