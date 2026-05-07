import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Workspaces
export const workspacesApi = {
  getAll: () => api.get("/workspaces"),
  getById: (id: string) => api.get(`/workspaces/${id}`),
  create: (name: string) => api.post("/workspaces", { name }),
  update: (id: string, name: string) => api.put(`/workspaces/${id}`, { name }),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
};

// Backup & Import/Export
export const backupApi = {
  exportWorkspace: (workspaceId: string) => 
    api.get(`/backup/workspace/${workspaceId}/export`, { responseType: 'blob' }),
  importWorkspace: (data: any, workspaceName: string) => 
    api.post('/backup/workspace/import', { data, workspaceName }),
  getBackupInfo: (workspaceId: string) => 
    api.get(`/backup/workspace/${workspaceId}/backup-info`),
};

// Projects (include workspaceId)
export const projectsApi = {
  getAll: () => api.get("/projects"),
  getById: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post("/projects", data),
  update: (id: string, data: any) => api.put(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
};

// Notes
export const notesApi = {
  getByProject: (projectId: string) => api.get(`/notes/project/${projectId}`),
  getOne: (id: string) => api.get(`/notes/${id}`),
  create: (data: any) => api.post("/notes", data),
  update: (projectId: string, noteId: string, data: any) =>
    api.put(`/notes/${projectId}/${noteId}`, data),
  delete: (projectId: string, noteId: string) =>
    api.delete(`/notes/${projectId}/${noteId}`),
};

// Calendar Logs
export const calendarLogsApi = {
  getAll: () => api.get("/calendar-logs"),
  getByDate: (date: string) => api.get(`/calendar-logs/${date}`),
  upsert: (data: any) => api.post("/calendar-logs", data),
  delete: (date: string) => api.delete(`/calendar-logs/${date}`),
};

// Vulnerabilities
export const vulnsApi = {
  getByProject: (projectId: string) => api.get(`/vulnerabilities/project/${projectId}`),
  getOne: (id: string) => api.get(`/vulnerabilities/${id}`),
  create: (data: any) => api.post("/vulnerabilities", data),
  update: (id: string, data: any) => api.put(`/vulnerabilities/${id}`, data),
  delete: (id: string) => api.delete(`/vulnerabilities/${id}`),
};

// Payloads
export const payloadsApi = {
  getAll: (projectId?: string) => api.get("/payloads", { params: { projectId } }),
  getOne: (id: string) => api.get(`/payloads/${id}`),
  create: (data: any) => api.post("/payloads", data),
  update: (id: string, data: any) => api.put(`/payloads/${id}`, data),
  delete: (id: string) => api.delete(`/payloads/${id}`),
};

// Recon Data
export const reconApi = {
  getByProject: (projectId: string) => api.get(`/recon/project/${projectId}`),
  getOne: (id: string) => api.get(`/recon/${id}`),
  create: (data: any) => api.post("/recon", data),
  delete: (id: string) => api.delete(`/recon/${id}`),
};

// Note Links
export const noteLinksApi = {
  getBacklinks: (noteId: string) => api.get(`/note-links/backlinks/${noteId}`),
  create: (fromNoteId: string, toNoteId: string) => 
    api.post("/note-links", { fromNoteId, toNoteId }),
  delete: (fromNoteId: string, toNoteId: string) => 
    api.delete("/note-links", { data: { fromNoteId, toNoteId } }),
};

// Templates
export const templatesApi = {
  getAll: () => api.get("/templates"),
  create: (data: any) => api.post("/templates", data),
  delete: (id: string) => api.delete(`/templates/${id}`),
};

// Export
export const exportApi = {
  projectMarkdown: (projectId: string) =>
    api.get(`/export/project/${projectId}/markdown`, { responseType: "blob" }),
};

// Stats API (Global Dashboard)
export const statsApi = {
  getWorkspaceStats: (workspaceId: string) => api.get(`/stats/workspace/${workspaceId}`),
  getWorkspaceRecent: (workspaceId: string) => api.get(`/stats/workspace/${workspaceId}/recent`),
};