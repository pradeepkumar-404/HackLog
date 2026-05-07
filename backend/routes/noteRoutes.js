import express from 'express';
import Note from '../models/Note.js';
import { logActivity } from '../utils/activityLogger.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const notes = await Note.findAll({
      where: { projectId },
      order: [['updatedAt', 'DESC']],
    });
    res.json(notes.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findByPk(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }
    // Return single object, not array
    res.json(withId(note));
  } catch (err) {
    console.error('Error fetching note:', err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { projectId, name, content, tags, attachments } = req.body;
    if (!projectId || !name) {
      return res.status(400).json({ error: 'projectId and name required' });
    }
    const note = await Note.create({
      projectId,
      name,
      content: content || '',
      tags: tags || [],
      attachments: attachments || [],
    });
    await logActivity(projectId, 'note_created', `"${name}" created`);
    res.json(withId(note));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:projectId/:id', async (req, res) => {
  try {
    const { id, projectId } = req.params;
    const { content, tags, name, attachments } = req.body;

    const note = await Note.findByPk(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    const oldName = note.name;
    await note.update({ content, tags, name, attachments });

    if (oldName !== name) {
      await logActivity(projectId, 'note_updated', `"${oldName}" renamed to "${name}"`);
    } else {
      await logActivity(projectId, 'note_updated', `"${name}" updated`);
    }

    res.json(withId(note));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:projectId/:id', async (req, res) => {
  try {
    const { id, projectId } = req.params;
    
    // Add validation
    if (!id || !projectId) {
      return res.status(400).json({ error: 'Missing noteId or projectId' });
    }
    
    const note = await Note.findByPk(id);
    if (!note) return res.status(404).json({ error: 'Note not found' });

    await note.destroy();
    await logActivity(projectId, 'note_deleted', `"${note.name}" deleted`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;