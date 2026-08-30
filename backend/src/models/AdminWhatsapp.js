import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const AdminWhatsapp = sequelize.define('AdminWhatsapp', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  numero: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  principal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  actif: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'admin_whatsapp',
  timestamps: true,
});

export default AdminWhatsapp;
