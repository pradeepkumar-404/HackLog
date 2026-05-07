import CalendarLog from '../models/CalendarLog.js';
import Project from '../models/Project.js';

export const logActivity = async (projectId, activityType, details) => {
  try {
    if (!projectId) {
      console.log("⚠️ No projectId provided, skipping activity log");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    
    // Get project name
    let projectName = "";
    try {
      const project = await Project.findByPk(projectId);
      projectName = project?.name || "";
    } catch (err) {
      console.log("Could not fetch project name:", err.message);
    }
    
    // Use findOrCreate to handle duplicates gracefully
    const [log, created] = await CalendarLog.findOrCreate({
      where: { date: today, projectId: projectId },
      defaults: {
        date: today,
        projectId: projectId,
        projectName: projectName,
        notes: "",
        cookies: "",
        headers: "",
        findings: "",
        vulnerabilities: "",
        status: "no_progress"
      }
    });
    
    // Update project name if it changed
    if (!created && projectName && log.projectName !== projectName) {
      log.projectName = projectName;
    }
    
    const timestamp = new Date().toLocaleTimeString();
    const activityEntry = `[${timestamp}] ${activityType}: ${details}\n`;
    
    switch (activityType) {
      case "note_created":
      case "note_updated":
      case "note_deleted":
        log.notes = (log.notes || "") + activityEntry;
        break;
      case "vulnerability_created":
      case "vulnerability_updated":
      case "vulnerability_deleted":
        log.vulnerabilities = (log.vulnerabilities || "") + activityEntry;
        if (log.status !== "vulnerability") log.status = "vulnerability";
        break;
      case "payload_created":
      case "payload_updated":
      case "payload_deleted":
      case "recon_created":
      case "recon_updated":
      case "recon_deleted":
        log.findings = (log.findings || "") + activityEntry;
        if (log.status === "no_progress") log.status = "findings";
        break;
      default:
        log.notes = (log.notes || "") + activityEntry;
    }
    
    // Update status based on content
    if (log.status !== "vulnerability") {
      if (log.vulnerabilities && log.vulnerabilities.trim().length > 0) {
        log.status = "vulnerability";
      } else if (log.findings && log.findings.trim().length > 0) {
        log.status = "findings";
      } else if (log.notes && log.notes.trim().length > 0) {
        log.status = "testing";
      }
    }
    
    await log.save();
    console.log(`✅ Logged activity for project ${projectName || projectId}: ${activityType}`);
  } catch (error) {
    console.error("❌ Error logging activity:", error);
  }
};