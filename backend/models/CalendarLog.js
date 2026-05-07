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
    allowNull: false
    // REMOVED: unique: true
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
    onDelete: 'SET NULL',
    field: 'project_id'  // Explicitly map to snake_case column
  },
  projectName: {
    type: DataTypes.STRING,
    defaultValue: '',
    field: 'project_name'  // Explicitly map to snake_case column
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
  tableName: 'calendar_logs',
  indexes: [
    {
      unique: true,
      fields: ['date', 'project_id']  // Use snake_case column name
    }
  ]
});

Project.hasMany(CalendarLog, { foreignKey: 'projectId' });
CalendarLog.belongsTo(Project, { foreignKey: 'projectId' });

export default CalendarLog;