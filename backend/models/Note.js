// backend/models/Note.js
import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Project from './Project.js';

const Note = sequelize.define('Note', {
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
  content: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  tags: {
    type: DataTypes.JSON,        // store array of strings as JSON
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,        // store array of attachment objects
    defaultValue: []
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
  tableName: 'notes'
});

Project.hasMany(Note, { foreignKey: 'projectId' });
Note.belongsTo(Project, { foreignKey: 'projectId' });

export default Note;