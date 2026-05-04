// backend/models/CalendarLog.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Project from './Project.js';

const CalendarLog = sequelize.define('CalendarLog', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  date: {
    type: DataTypes.STRING,    // YYYY-MM-DD
    allowNull: false,
    unique: true
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  cookies: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  headers: {
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
  },
  projectName: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  findings: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  vulnerabilities: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  status: {
    type: DataTypes.ENUM('no_progress', 'testing', 'findings', 'vulnerability'),
    defaultValue: 'no_progress'
  }
}, {
  tableName: 'calendar_logs'
});

Project.hasMany(CalendarLog, { foreignKey: 'projectId' });
CalendarLog.belongsTo(Project, { foreignKey: 'projectId' });

export default CalendarLog;