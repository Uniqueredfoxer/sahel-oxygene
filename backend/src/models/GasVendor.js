import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Un "coin" = un point de vente de gaz, géré par l'administrateur (§ demande du client),
// éventuellement rattaché à un compte utilisateur (rôle 'vendeur_gaz') qui peut
// lui-même activer/désactiver la disponibilité depuis son espace.
const GasVendor = sequelize.define('GasVendor', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  nom: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  telephone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  lat: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
  },
  lng: {
    type: DataTypes.DECIMAL(10, 7),
    allowNull: false,
  },
  disponible: {
    // Bouton activé par le vendeur : "j'ai du gaz en stock"
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  actif: {
    // Contrôlé par l'administrateur : le coin existe/est autorisé sur la plateforme
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  userId: {
    // Compte du vendeur (optionnel), pour qu'il puisse basculer sa propre disponibilité
    type: DataTypes.UUID,
    allowNull: true,
  },
}, {
  tableName: 'gas_vendors',
  timestamps: true,
});

export default GasVendor;
