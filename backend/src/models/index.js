import sequelize from '../config/db.js';
import User from './User.js';
import UserRole from './UserRole.js';
import Livraison from './Livraison.js';
import AdminWhatsapp from './AdminWhatsapp.js';
import GpsPosition from './GpsPosition.js';
import ActionLog from './ActionLog.js';
import Setting from './Setting.js';
import GasVendor from './GasVendor.js';

// Associations
User.hasMany(UserRole, { foreignKey: 'userId', as: 'roles' });
UserRole.belongsTo(User, { foreignKey: 'userId' });

User.hasOne(GasVendor, { foreignKey: 'userId', as: 'pointGaz' });
GasVendor.belongsTo(User, { foreignKey: 'userId', as: 'vendeur' });

User.hasMany(Livraison, { foreignKey: 'livreurId', as: 'coursesLivreur' });
Livraison.belongsTo(User, { foreignKey: 'livreurId', as: 'livreur' });

User.hasMany(Livraison, { foreignKey: 'creeParId', as: 'coursesCreees' });
Livraison.belongsTo(User, { foreignKey: 'creeParId', as: 'creePar' });

Livraison.hasMany(GpsPosition, { foreignKey: 'livraisonId', as: 'positions' });
GpsPosition.belongsTo(Livraison, { foreignKey: 'livraisonId' });

Livraison.hasMany(ActionLog, { foreignKey: 'livraisonId', as: 'historique' });
ActionLog.belongsTo(Livraison, { foreignKey: 'livraisonId' });

export {
  sequelize,
  User,
  UserRole,
  Livraison,
  AdminWhatsapp,
  GpsPosition,
  ActionLog,
  Setting,
  GasVendor,
};
