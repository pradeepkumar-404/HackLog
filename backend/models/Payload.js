// backend/models/Payload.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Project from './Project.js';

const Payload = sequelize.define('Payload', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('XSS', 'SQLi', 'SSRF', 'LFI', 'RCE', 'IDOR', 'Other'),
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  projectId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: Project,
      key: 'id'
    },
    onDelete: 'SET NULL'
  }
}, {
  tableName: 'payloads'
});

Project.hasMany(Payload, { foreignKey: 'projectId' });
Payload.belongsTo(Project, { foreignKey: 'projectId' });

export default Payload;