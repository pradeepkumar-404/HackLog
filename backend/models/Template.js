// backend/models/Template.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'note'
  }
}, {
  tableName: 'templates'
});

export default Template;