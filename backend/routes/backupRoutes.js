import express from 'express';
import Workspace from '../models/Workspace.js';
import Project from '../models/Project.js';
import Note from '../models/Note.js';
import Vulnerability from '../models/Vulnerability.js';
import Payload from '../models/Payload.js';
import ReconData from '../models/ReconData.js';
import CalendarLog from '../models/CalendarLog.js';

const router = express.Router();

// Export workspace data
router.get('/workspace/:workspaceId/export', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    // Get workspace
    const workspace = await Workspace.findByPk(workspaceId);
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    
    // Get all projects in workspace
    const projects = await Project.findAll({ where: { workspaceId } });
    const projectIds = projects.map(p => p.id);
    
    // Get all related data
    const notes = await Note.findAll({ where: { projectId: projectIds } });
    const vulnerabilities = await Vulnerability.findAll({ where: { projectId: projectIds } });
    const payloads = await Payload.findAll({ where: { projectId: projectIds } });
    const reconData = await ReconData.findAll({ where: { projectId: projectIds } });
    const calendarLogs = await CalendarLog.findAll({ where: { projectId: projectIds } });
    
    // Create export object
    const exportData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      workspace: workspace.toJSON(),
      projects: projects.map(p => p.toJSON()),
      notes: notes.map(n => n.toJSON()),
      vulnerabilities: vulnerabilities.map(v => v.toJSON()),
      payloads: payloads.map(p => p.toJSON()),
      reconData: reconData.map(r => r.toJSON()),
      calendarLogs: calendarLogs.map(c => c.toJSON()),
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="workspace_${workspace.name}_backup.json"`);
    res.json(exportData);
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Import workspace data
router.post('/workspace/import', async (req, res) => {
  try {
    const { data, workspaceName } = req.body;
    
    if (!data || !workspaceName) {
      return res.status(400).json({ error: 'Missing data or workspace name' });
    }
    
    // Check if workspace already exists
    const existingWorkspace = await Workspace.findOne({ where: { name: workspaceName } });
    if (existingWorkspace) {
      return res.status(409).json({ 
        error: 'Workspace already exists', 
        existingId: existingWorkspace.id 
      });
    }
    
    // Parse backup data if it's a string
    const backup = typeof data === 'string' ? JSON.parse(data) : data;
    
    // Create new workspace
    const newWorkspace = await Workspace.create({ name: workspaceName });
    
    // Map old IDs to new IDs for relationships
    const projectIdMap = new Map();
    
    // Import projects
    for (const project of backup.projects || []) {
      const newProject = await Project.create({
        name: project.name,
        target: project.target || '',
        scope: project.scope || '',
        programInfo: project.programInfo || '',
        workspaceId: newWorkspace.id,
      });
      projectIdMap.set(project.id, newProject.id);
    }
    
    // Import notes
    for (const note of backup.notes || []) {
      const newProjectId = projectIdMap.get(note.projectId);
      if (newProjectId) {
        await Note.create({
          name: note.name,
          content: note.content || '',
          tags: note.tags || [],
          attachments: note.attachments || [],
          projectId: newProjectId,
        });
      }
    }
    
    // Import vulnerabilities
    for (const vuln of backup.vulnerabilities || []) {
      const newProjectId = projectIdMap.get(vuln.projectId);
      if (newProjectId) {
        await Vulnerability.create({
          title: vuln.title,
          target: vuln.target || '',
          severity: vuln.severity || 'Medium',
          status: vuln.status || 'Open',
          notes: vuln.notes || '',
          poc: vuln.poc || '',
          projectId: newProjectId,
        });
      }
    }
    
    // Import payloads
    for (const payload of backup.payloads || []) {
      const newProjectId = projectIdMap.get(payload.projectId);
      if (newProjectId) {
        await Payload.create({
          name: payload.name,
          category: payload.category || 'Other',
          content: payload.content || '',
          description: payload.description || '',
          projectId: newProjectId,
        });
      } else if (!payload.projectId) {
        // Global payload (not associated with specific project)
        await Payload.create({
          name: payload.name,
          category: payload.category || 'Other',
          content: payload.content || '',
          description: payload.description || '',
          projectId: null,
        });
      }
    }
    
    // Import recon data
    for (const recon of backup.reconData || []) {
      const newProjectId = projectIdMap.get(recon.projectId);
      if (newProjectId) {
        await ReconData.create({
          type: recon.type,
          value: recon.value,
          source: recon.source || '',
          projectId: newProjectId,
        });
      }
    }
    
    // Import calendar logs - handle duplicates with findOrCreate
    for (const log of backup.calendarLogs || []) {
      const newProjectId = log.projectId ? projectIdMap.get(log.projectId) : null;
      
      // Use findOrCreate to avoid unique constraint errors
      const [calendarLog, created] = await CalendarLog.findOrCreate({
        where: { 
          date: log.date,
          projectId: newProjectId
        },
        defaults: {
          date: log.date,
          notes: log.notes || '',
          cookies: log.cookies || '',
          headers: log.headers || '',
          projectId: newProjectId,
          projectName: log.projectName || '',
          findings: log.findings || '',
          vulnerabilities: log.vulnerabilities || '',
          status: log.status || 'no_progress',
        }
      });
      
      if (!created) {
        // Update existing log with merged data
        await calendarLog.update({
          notes: calendarLog.notes || log.notes || '',
          cookies: calendarLog.cookies || log.cookies || '',
          headers: calendarLog.headers || log.headers || '',
          findings: calendarLog.findings || log.findings || '',
          vulnerabilities: calendarLog.vulnerabilities || log.vulnerabilities || '',
          status: log.status || calendarLog.status || 'no_progress',
        });
      }
    }
    
    res.json({ 
      success: true, 
      workspaceId: newWorkspace.id,
      workspaceName: newWorkspace.name,
      stats: {
        projects: projectIdMap.size,
        notes: backup.notes?.length || 0,
        vulnerabilities: backup.vulnerabilities?.length || 0,
        payloads: backup.payloads?.length || 0,
        recon: backup.reconData?.length || 0,
        logs: backup.calendarLogs?.length || 0,
      }
    });
  } catch (err) {
    console.error('Import error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Get workspace backup info
router.get('/workspace/:workspaceId/backup-info', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const projects = await Project.findAll({ where: { workspaceId } });
    const projectIds = projects.map(p => p.id);
    
    const [notesCount, vulnsCount, payloadsCount, reconCount, logsCount] = await Promise.all([
      Note.count({ where: { projectId: projectIds } }),
      Vulnerability.count({ where: { projectId: projectIds } }),
      Payload.count({ where: { projectId: projectIds } }),
      ReconData.count({ where: { projectId: projectIds } }),
      CalendarLog.count({ where: { projectId: projectIds } }),
    ]);
    
    res.json({
      projects: projects.length,
      notes: notesCount,
      vulnerabilities: vulnsCount,
      payloads: payloadsCount,
      recon: reconCount,
      logs: logsCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;