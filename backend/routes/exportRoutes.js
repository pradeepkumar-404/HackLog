import express from 'express';
import Note from '../models/Note.js';
import Vulnerability from '../models/Vulnerability.js';
import Project from '../models/Project.js';

const router = express.Router();

router.get('/project/:projectId/markdown', async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findByPk(projectId);
    const notes = await Note.findAll({ where: { projectId } });
    const vulns = await Vulnerability.findAll({ where: { projectId } });

    let md = `# ${project.name}\n\n## Notes\n\n`;
    for (const note of notes) {
      md += `### ${note.name}\n${note.content}\n\n`;
    }
    md += `## Vulnerabilities\n\n`;
    for (const v of vulns) {
      md += `- **${v.title}** (${v.severity}) – ${v.status}\n  ${v.notes}\n  PoC: ${v.poc}\n\n`;
    }
    res.setHeader('Content-Type', 'text/markdown');
    res.setHeader('Content-Disposition', `attachment; filename="${project.name}.md"`);
    res.send(md);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;