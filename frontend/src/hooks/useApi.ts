// frontend/src/hooks/useApi.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  workspacesApi,
  projectsApi,
  notesApi,
  calendarLogsApi,
  vulnsApi,
  payloadsApi,
  reconApi,
  noteLinksApi,    
  statsApi,
} from "@/lib/api";

import { backupApi } from "@/lib/api";

// Helper to convert MongoDB-like id to string id and add _id
const mapId = (item: any) => {
  const idValue = item.id ?? item._id;
  return { ...item, id: String(idValue), _id: String(idValue) };
};

// Helper to always get an array – prevents .map errors
const safeArray = <T>(data: any): T[] => (Array.isArray(data) ? data : []);

// ------------------- Workspaces -------------------
export const useWorkspaces = () =>
  useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const res = await workspacesApi.getAll();
      return safeArray(res.data).map(mapId);
    },
  });

export const useCreateWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => workspacesApi.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
};

export const useUpdateWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      workspacesApi.update(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
};

export const useDeleteWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["workspaces"] }),
  });
};

// ------------------- Backup & Import/Export -------------------
export const useExportWorkspace = () => {
  return useMutation({
    mutationFn: async (workspaceId: string) => {
      const response = await backupApi.exportWorkspace(workspaceId);
      return response.data;
    },
  });
};

export const useImportWorkspace = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ data, workspaceName }: { data: any; workspaceName: string }) =>
      backupApi.importWorkspace(data, workspaceName),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["workspaces"] });
    },
  });
};

export const useBackupInfo = (workspaceId: string) =>
  useQuery({
    queryKey: ["backup-info", workspaceId],
    queryFn: async () => {
      const res = await backupApi.getBackupInfo(workspaceId);
      return res.data;
    },
    enabled: !!workspaceId,
  });

// ------------------- Projects -------------------
export const useProjects = (workspaceId?: string) =>
  useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const res = await projectsApi.getAll();
      const projects = safeArray(res.data).map(mapId);
      return workspaceId
        ? projects.filter((p: any) => String(p.workspaceId) === String(workspaceId))
        : projects;
    },
  });

export const useProject = (id: string) =>
  useQuery({
    queryKey: ["projects", id],
    queryFn: async () => {
      const res = await projectsApi.getById(id);
      return mapId(res.data);
    },
    enabled: !!id,
  });

export const useCreateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => projectsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useUpdateProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      projectsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

export const useDeleteProject = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
};

// ------------------- Notes -------------------
export const useProjectNotes = (projectId: string) =>
  useQuery({
    queryKey: ["notes", projectId],
    queryFn: async () => {
      try {
        const res = await notesApi.getByProject(projectId);
        // Defensive: always return an array
        return safeArray(res.data).map(mapId);
      } catch (error) {
        console.error(`Failed to fetch notes for project ${projectId}:`, error);
        return []; // never crash
      }
    },
    enabled: !!projectId,
  });

export const useNote = (noteId: string) =>
  useQuery({
    queryKey: ["note", noteId],

    queryFn: async () => {
      if (!noteId) {
        console.error("❌ useNote called without noteId");
        return null;
      }

      try {
        const res = await notesApi.getOne(noteId);

        console.log("📝 Raw note response:", res.data);

        let noteData = res.data;

        // If backend accidentally returns array
        if (Array.isArray(noteData)) {
          console.warn("⚠️ Backend returned array instead of note object");

          // Find matching note
          const matched = noteData.find(
            (n: any) => String(n.id || n._id) === String(noteId)
          );

          if (matched) {
            noteData = matched;
          } else if (noteData.length > 0) {
            noteData = noteData[0];
          } else {
            return null;
          }
        }

        // Invalid object safety
        if (!noteData || typeof noteData !== "object") {
          console.error("❌ Invalid note data:", noteData);
          return null;
        }

        const note = mapId(noteData);

        return {
          ...note,

          id: String(note.id),
          projectId: String(note.projectId),

          name: note.name || "Untitled",
          content: note.content || "",

          tags: Array.isArray(note.tags) ? note.tags : [],
          attachments: Array.isArray(note.attachments)
            ? note.attachments
            : [],

          createdAt: note.createdAt
            ? new Date(note.createdAt)
            : new Date(),

          updatedAt: note.updatedAt
            ? new Date(note.updatedAt)
            : new Date(),
        };
      } catch (error) {
        console.error(`❌ Failed to fetch note ${noteId}:`, error);
        throw error;
      }
    },

    enabled: !!noteId,

    staleTime: 30000,

    retry: 1,
  });


export const useCreateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => notesApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["notes", vars.projectId] });
    },
  });
};

export const useUpdateNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, noteId, data }: { projectId: string; noteId: string; data: any }) =>
      notesApi.update(projectId, noteId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["notes", vars.projectId] });
    },
  });
};

export const useDeleteNote = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ projectId, noteId }: { projectId: string; noteId: string }) =>
      notesApi.delete(projectId, noteId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["notes", vars.projectId] });
    },
  });
};

// ------------------- Note Links -------------------
export const useNoteLinks = (noteId: string, direction: "backlinks" | "outgoing" = "backlinks") =>
  useQuery({
    queryKey: ["noteLinks", noteId, direction],
    queryFn: async () => {
      if (direction === "backlinks") {
        const res = await noteLinksApi.getBacklinks(noteId);
        return safeArray(res.data);
      }
      return [];
    },
    enabled: !!noteId,
  });

export const useCreateNoteLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fromNoteId, toNoteId }: { fromNoteId: string; toNoteId: string }) =>
      noteLinksApi.create(fromNoteId, toNoteId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["noteLinks", vars.fromNoteId] });
      qc.invalidateQueries({ queryKey: ["noteLinks", vars.toNoteId] });
    },
  });
};

export const useDeleteNoteLink = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ fromNoteId, toNoteId }: { fromNoteId: string; toNoteId: string }) =>
      noteLinksApi.delete(fromNoteId, toNoteId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["noteLinks", vars.fromNoteId] });
      qc.invalidateQueries({ queryKey: ["noteLinks", vars.toNoteId] });
    },
  });
};

// Get all project data in one query
export const useProjectData = (projectId: string) =>
  useQuery({
    queryKey: ["project-data", projectId],
    queryFn: async () => {
      const [vulnsRes, payloadsRes, reconRes] = await Promise.all([
        vulnsApi.getByProject(projectId),
        payloadsApi.getAll(projectId),
        reconApi.getByProject(projectId),
      ]);
      return {
        vulnerabilities: safeArray(vulnsRes.data).map(mapId),
        payloads: safeArray(payloadsRes.data).map(mapId),
        recon: safeArray(reconRes.data).map(mapId),
      };
    },
    enabled: !!projectId,
    staleTime: 30000,
  });

// ------------------- Workspace-wide Data Fetching -------------------
const getProjectsInWorkspace = async (workspaceId: string) => {
  const res = await projectsApi.getAll();
  return safeArray(res.data).filter((p: any) => String(p.workspaceId) === String(workspaceId));
};

export const useWorkspaceNotes = (workspaceId?: string) =>
  useQuery({
    queryKey: ["workspace-notes", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const projects = await getProjectsInWorkspace(workspaceId);
      const allNotes = await Promise.all(
        projects.map(async (p: any) => {
          try {
            const res = await notesApi.getByProject(p._id);
            return safeArray(res.data).map((n: any) => ({ ...n, projectId: p._id }));
          } catch {
            return [];
          }
        })
      );
      return allNotes.flat().map(mapId);
    },
    enabled: !!workspaceId,
  });

export const useWorkspaceVulnerabilities = (workspaceId?: string) =>
  useQuery({
    queryKey: ["workspace-vulns", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const projects = await getProjectsInWorkspace(workspaceId);
      const allVulns = await Promise.all(
        projects.map(async (p: any) => {
          try {
            const res = await vulnsApi.getByProject(p._id);
            return safeArray(res.data).map((v: any) => ({ ...v, projectId: p._id }));
          } catch {
            return [];
          }
        })
      );
      return allVulns.flat().map(mapId);
    },
    enabled: !!workspaceId,
  });

export const useWorkspacePayloads = (workspaceId?: string) =>
  useQuery({
    queryKey: ["workspace-payloads", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const projects = await getProjectsInWorkspace(workspaceId);
      const allPayloads = await Promise.all(
        projects.map(async (p: any) => {
          try {
            const res = await payloadsApi.getAll(p._id);
            return safeArray(res.data).map((pay: any) => ({ ...pay, projectId: p._id }));
          } catch {
            return [];
          }
        })
      );
      return allPayloads.flat().map(mapId);
    },
    enabled: !!workspaceId,
  });

export const useWorkspaceRecon = (workspaceId?: string) =>
  useQuery({
    queryKey: ["workspace-recon", workspaceId],
    queryFn: async () => {
      if (!workspaceId) return [];
      const projects = await getProjectsInWorkspace(workspaceId);
      const allRecon = await Promise.all(
        projects.map(async (p: any) => {
          try {
            const res = await reconApi.getByProject(p._id);
            return safeArray(res.data).map((r: any) => ({ ...r, projectId: p._id }));
          } catch {
            return [];
          }
        })
      );
      return allRecon.flat().map(mapId);
    },
    enabled: !!workspaceId,
  });

// ------------------- Vulnerabilities -------------------
export const useProjectVulnerabilities = (projectId: string) =>
  useQuery({
    queryKey: ["vulns", projectId],
    queryFn: async () => {
      const res = await vulnsApi.getByProject(projectId);
      return safeArray(res.data).map(mapId);
    },
    enabled: !!projectId,
  });

export const useCreateVulnerability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vulnsApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["vulns", vars.projectId] });
    },
  });
};

export const useUpdateVulnerability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => vulnsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulns"] }),
  });
};

export const useDeleteVulnerability = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vulnsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vulns"] }),
  });
};

// ------------------- Stats -------------------
export const useWorkspaceStats = (workspaceId: string) =>
  useQuery({
    queryKey: ["workspace-stats", workspaceId],
    queryFn: async () => {
      const res = await statsApi.getWorkspaceStats(workspaceId);
      return res.data || { targets:0, notes:0, vulnerabilities:0, activeVulns:0, payloads:0, recon:0, calendarLogs:0, activeLogs:0 };
    },
    enabled: !!workspaceId,
  });

export const useWorkspaceRecent = (workspaceId: string) =>
  useQuery({
    queryKey: ["workspace-recent", workspaceId],
    queryFn: async () => {
      const res = await statsApi.getWorkspaceRecent(workspaceId);
      return res.data || { notes: [], vulnerabilities: [], logs: [] };
    },
    enabled: !!workspaceId,
  });

// ------------------- Single Item Fetching -------------------
export const useVulnerability = (id: string) =>
  useQuery({
    queryKey: ["vulnerability", id],
    queryFn: async () => {
      const res = await vulnsApi.getOne(id);
      return mapId(res.data);
    },
    enabled: !!id,
  });

export const usePayload = (id: string) =>
  useQuery({
    queryKey: ["payload", id],
    queryFn: async () => {
      const res = await payloadsApi.getOne(id);
      return mapId(res.data);
    },
    enabled: !!id,
  });

export const useReconItem = (id: string) =>
  useQuery({
    queryKey: ["recon-item", id],
    queryFn: async () => {
      const res = await reconApi.getOne(id);
      return mapId(res.data);
    },
    enabled: !!id,
  });

// ------------------- Payloads -------------------
export const useProjectPayloads = (projectId?: string) =>
  useQuery({
    queryKey: ["payloads", projectId],
    queryFn: async () => {
      const res = await payloadsApi.getAll(projectId);
      return safeArray(res.data).map(mapId);
    },
  });

export const useCreatePayload = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => payloadsApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payloads"] }),
  });
};

export const useDeletePayload = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => payloadsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["payloads"] }),
  });
};

// ------------------- Recon Data -------------------
export const useProjectRecon = (projectId: string) =>
  useQuery({
    queryKey: ["recon", projectId],
    queryFn: async () => {
      const res = await reconApi.getByProject(projectId);
      return safeArray(res.data).map(mapId);
    },
    enabled: !!projectId,
  });

export const useCreateRecon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => reconApi.create(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["recon", vars.projectId] });
    },
  });
};

export const useDeleteRecon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reconApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["recon"] }),
  });
};

// ------------------- Calendar Logs -------------------
export const useAllLogs = () =>
  useQuery({
    queryKey: ["logs"],
    queryFn: async () => {
      const res = await calendarLogsApi.getAll();
      return safeArray(res.data).map(mapId);
    },
  });

export const useLogByDate = (date: string) =>
  useQuery({
    queryKey: ["logs", date],
    queryFn: async () => {
      const res = await calendarLogsApi.getByDate(date);
      return res.data ? mapId(res.data) : null;
    },
    enabled: !!date,
  });

export const useUpsertLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => calendarLogsApi.upsert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });
};

export const useDeleteLog = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (date: string) => calendarLogsApi.delete(date),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["logs"] }),
  });
};

export const useProjectLogs = (projectId?: string) =>
  useQuery({
    queryKey: ["logs", projectId],
    queryFn: async () => {
      const res = await calendarLogsApi.getAll();
      const logs = safeArray(res.data).map(mapId);
      return projectId ? logs.filter((l: any) => String(l.projectId) === String(projectId)) : logs;
    },
  });

// ------------------- All Notes (fallback) -------------------
export const useAllNotes = () =>
  useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => [],
  });