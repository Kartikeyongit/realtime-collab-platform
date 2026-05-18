export interface User {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

export interface Document {
  id: string;
  title: string;
  content: any;
  ownerId: string;
  owner: User;
  collaborators: DocumentCollaborator[];
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
  trashed?: boolean;
}

export interface DocumentCollaborator {
  id: string;
  documentId: string;
  userId: string;
  role: 'editor' | 'viewer';
  user: User;
}

export interface Comment {
  id: string;
  content: string;
  documentId: string;
  userId: string;
  parentId?: string | null;
  resolved: boolean;
  position?: any;
  createdAt: string;
  updatedAt: string;
  user: User;
  replies?: Comment[];
  mentions?: { userId: string }[];
}

export interface Presence {
  userId: string;
  documentId: string;
  cursor?: { from: number; to: number } | null;
  user: User;
  lastSeen: string;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  content: any;
  version: number;
  createdAt: string;
  createdBy?: string | null;
}
