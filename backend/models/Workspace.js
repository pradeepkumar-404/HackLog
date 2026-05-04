// backend/models/Workspace.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Workspace = sequelize.define('Workspace', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    trim: true
  }
}, {
  tableName: 'workspaces'
});

export default Workspace;