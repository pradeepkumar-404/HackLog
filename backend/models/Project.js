// backend/models/Project.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Workspace from './Workspace.js';

const Project = sequelize.define('Project', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true
  },
  target: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  scope: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  programInfo: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  workspaceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Workspace,
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'projects'
});

Workspace.hasMany(Project, { foreignKey: 'workspaceId' });
Project.belongsTo(Workspace, { foreignKey: 'workspaceId' });

export default Project;