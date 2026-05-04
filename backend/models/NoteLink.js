import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import Note from './Note.js';

const NoteLink = sequelize.define('NoteLink', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  fromNoteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Note,
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'from_note_id'   // map to actual snake_case column
  },
  toNoteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Note,
      key: 'id'
    },
    onDelete: 'CASCADE',
    field: 'to_note_id'     // map to actual snake_case column
  }
}, {
  tableName: 'note_links',
  indexes: [
    {
      unique: true,
      fields: ['from_note_id', 'to_note_id']   // use actual column names
    }
  ]
});

export default NoteLink;