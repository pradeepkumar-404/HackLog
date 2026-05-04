import express from 'express';
import Project from '../models/Project.js';
import Note from '../models/Note.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/', async (req, res) => {
  try {
    const projects = await Project.findAll({ order: [['createdAt', 'DESC']] });
    res.json(projects.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json(withId(project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, target, scope, programInfo, workspaceId } = req.body;
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' });
    const project = await Project.create({ name, target, scope, programInfo, workspaceId });
    res.json(withId(project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await project.update(req.body);
    res.json(withId(project));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await Note.destroy({ where: { projectId: req.params.id } });
    await project.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;