import express from 'express';
import Template from '../models/Template.js';

const router = express.Router();

const withId = (obj) => ({ ...obj.toJSON(), id: obj.id, _id: obj.id });

router.get('/', async (req, res) => {
  try {
    const templates = await Template.findAll({ order: [['name', 'ASC']] });
    res.json(templates.map(withId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const template = await Template.create(req.body);
    res.json(withId(template));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await Template.destroy({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;