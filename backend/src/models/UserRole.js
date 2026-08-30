import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

// Les rôles sont stockés dans une table dédiée (jamais sur le profil)
// pour empêcher toute élévation de privilèges côté client.
const UserRole = sequelize.define('UserRole', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('administrateur', 'gestionnaire', 'livreur', 'vendeur_gaz'),
    allowNull: false,
  },
}, {
  tableName: 'user_roles',
  timestamps: true,
  indexes: [{ unique: true, fields: ['user_id', 'role'] }],
});

export default UserRole;
