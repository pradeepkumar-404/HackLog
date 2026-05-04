import express from 'express';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Note from '../models/Note.js';

const router = express.Router();

// Helper to add _id field for frontend compatibility
const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/', async (req, res) => {
  try {
    const workspaces = await Workspace.findAll({ order: [['createdAt', 'DESC']] });
    res.json(workspaces.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    res.json(withId(workspace));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const workspace = await Workspace.create({ name: req.body.name });
    res.json(withId(workspace));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
    workspace.name = req.body.name;
    await workspace.save();
    res.json(withId(workspace));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const workspace = await Workspace.findByPk(req.params.id);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const projects = await Project.findAll({ where: { workspaceId: req.params.id } });
    const projectIds = projects.map(p => p.id);

    await Note.destroy({ where: { projectId: projectIds } });
    await Project.destroy({ where: { workspaceId: req.params.id } });
    await workspace.destroy();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;