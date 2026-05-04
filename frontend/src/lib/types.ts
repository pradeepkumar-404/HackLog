export type ID = string;

export type FindingStatus = "none" | "testing" | "finding" | "vuln";

export interface Workspace {
  id: ID;
  name: string;
  createdAt: number;
}

export interface Project {
  id: ID;
  workspaceId: ID;
  name: string;
  domain?: string;
  scope?: string;
  programInfo?: string;
  color?: string;
  createdAt: number;
}

export interface Note {
  id: ID;
  projectId: ID;
  title: string;
  content: string; // markdown
  tags: string[];
  attachments: Attachment[];
  createdAt: number;
  updatedAt: number;
}

export interface Attachment {
  id: ID;
  name: string;
  type: string;
  dataUrl: string; // base64
  size: number;
}

export interface DailyLog {
  id: ID; // dateKey YYYY-MM-DD
  date: string; // YYYY-MM-DD
  projectId?: ID;
  notes: string; // markdown
  cookies: string;
  headers: string;
  recon: string;
  vulns: string;
  status: FindingStatus;
  tags: string[];
  attachments: Attachment[];
  updatedAt: number;
}
