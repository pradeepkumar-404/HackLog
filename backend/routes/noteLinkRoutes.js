import express from 'express';
import NoteLink from '../models/NoteLink.js';
import Note from '../models/Note.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/backlinks/:noteId', async (req, res) => {
  try {
    const { noteId } = req.params;
    const links = await NoteLink.findAll({
      where: { toNoteId: noteId },
      include: [{ model: Note, as: 'fromNote', attributes: ['id', 'name'] }],
    });
    const backlinks = links.map(link => ({
      _id: link.fromNote.id,
      id: link.fromNote.id,
      name: link.fromNote.name,
    }));
    res.json(backlinks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { fromNoteId, toNoteId } = req.body;
    const existing = await NoteLink.findOne({ where: { fromNoteId, toNoteId } });
    if (existing) return res.status(409).json({ error: 'Link already exists' });
    const link = await NoteLink.create({ fromNoteId, toNoteId });
    res.json(withId(link));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/', async (req, res) => {
  try {
    const { fromNoteId, toNoteId } = req.body;
    await NoteLink.destroy({ where: { fromNoteId, toNoteId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;