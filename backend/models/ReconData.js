// backend/models/ReconData.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Project from './Project.js';

const ReconData = sequelize.define('ReconData', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('subdomain', 'url', 'parameter', 'endpoint'),
    allowNull: false
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  },
  source: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Project,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'recon_data'
});

Project.hasMany(ReconData, { foreignKey: 'projectId' });
ReconData.belongsTo(Project, { foreignKey: 'projectId' });

export default ReconData;