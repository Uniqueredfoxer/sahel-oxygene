import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const ActionLog = sequelize.define('ActionLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  livraisonId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  type: {
    // commande | attribution | position | validation | statut | suppression
    type: DataTypes.STRING,
    allowNull: false,
  },
  acteurId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  message: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  meta: {
    type: DataTypes.JSONB,
    allowNull: true,
  },
}, {
  tableName: 'action_logs',
  timestamps: true,
  updatedAt: false,
});

export default ActionLog;
