import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const GpsPosition = sequelize.define('GpsPosition', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  livraisonId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  livreurId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  lat: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  lng: { type: DataTypes.DECIMAL(10, 7), allowNull: false },
  recordedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'gps_positions',
  timestamps: false,
});

export default GpsPosition;
