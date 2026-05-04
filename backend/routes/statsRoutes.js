import express from 'express';
import { Op } from 'sequelize';
import Project from '../models/Project.js';
import Note from '../models/Note.js';
import Vulnerability from '../models/Vulnerability.js';
import Payload from '../models/Payload.js';
import ReconData from '../models/ReconData.js';
import CalendarLog from '../models/CalendarLog.js';

const router = express.Router();

router.get('/workspace/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const projects = await Project.findAll({ where: { workspaceId } });
    const projectIds = projects.map(p => p.id);

    const [targets, notes, vulns, payloads, recon, logs] = await Promise.all([
      Project.count({ where: { workspaceId } }),
      Note.count({ where: { projectId: projectIds } }),
      Vulnerability.count({ where: { projectId: projectIds } }),
      Payload.count({ where: { projectId: projectIds } }),
      ReconData.count({ where: { projectId: projectIds } }),
      CalendarLog.count({ where: { projectId: projectIds } }),
    ]);

    const activeVulns = await Vulnerability.count({
      where: {
        projectId: projectIds,
        status: { [Op.notIn]: ['Closed', 'Paid'] },
      },
    });

    const activeLogs = await CalendarLog.count({
      where: {
        projectId: projectIds,
        status: { [Op.in]: ['testing', 'findings', 'vulnerability'] },
      },
    });

    res.json({
      targets,
      notes,
      vulnerabilities: vulns,
      activeVulns,
      payloads,
      recon,
      calendarLogs: logs,
      activeLogs,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/workspace/:workspaceId/recent', async (req, res) => {
  try {
    const { workspaceId } = req.params;

    const projects = await Project.findAll({ where: { workspaceId } });
    const projectIds = projects.map(p => p.id);

    const notes = await Note.findAll({
      where: { projectId: projectIds },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: Project, attributes: ['name'] }],
    });

    const vulnerabilities = await Vulnerability.findAll({
      where: { projectId: projectIds },
      order: [['createdAt', 'DESC']],
      limit: 5,
      include: [{ model: Project, attributes: ['name'] }],
    });

    const logs = await CalendarLog.findAll({
      where: { projectId: projectIds },
      order: [['updatedAt', 'DESC']],
      limit: 5,
    });

    const format = (item, projectField = 'Project') => {
      const obj = item.toJSON();
      obj.projectId = obj.projectId ? { _id: obj.projectId, name: obj[projectField]?.name || '' } : null;
      return obj;
    };

    res.json({
      notes: notes.map(n => format(n, 'Project')),
      vulnerabilities: vulnerabilities.map(v => format(v, 'Project')),
      logs: logs.map(l => format(l)),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;