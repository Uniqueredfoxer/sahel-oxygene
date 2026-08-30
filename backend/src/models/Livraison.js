import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Livraison = sequelize.define('Livraison', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  numero: {
    // Format : PDX-AAAAMMJJ-NNNN
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  clientNom: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  clientTelephone: {
    // Identifiant principal du client
    type: DataTypes.STRING,
    allowNull: false,
  },
  clientTelephoneNormalise: {
    // 8 derniers chiffres, utilisés pour la détection de doublons
    type: DataTypes.STRING,
    allowNull: false,
  },
  adresseDepart: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  adresseDestination: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  departLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  departLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  destinationLat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  destinationLng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
  distanceKm: {
    type: DataTypes.DECIMAL(6, 2),
    allowNull: true,
  },
  dureeMinutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  montant: {
    type: DataTypes.INTEGER, // FCFA, pas de décimales
    allowNull: false,
  },
  statut: {
    type: DataTypes.ENUM('en_attente', 'en_cours', 'livree', 'annulee'),
    defaultValue: 'en_attente',
  },
  livreurId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  creeParId: {
    // null si commande client public ; sinon gestionnaire/admin qui a saisi
    type: DataTypes.UUID,
    allowNull: true,
  },
  signatureDataUrl: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  qrToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  assignedAt: { type: DataTypes.DATE, allowNull: true },
  deliveredAt: { type: DataTypes.DATE, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
}, {
  tableName: 'livraisons',
  timestamps: true,
});

export default Livraison;
