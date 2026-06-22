import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { enableMapSet } from 'immer';
import { Document, Presence, Comment } from '@/types';

enableMapSet();

interface DocumentState {
  document: Document | null;
  presences: Map<string, Presence>;
  comments: Comment[];
  isConnected: boolean;
  users: Map<string, any>;
  
  setDocument: (doc: Document) => void;
  updatePresence: (presence: Presence) => void;
  removePresence: (userId: string) => void;
  addComment: (comment: Comment) => void;
  updateComment: (commentId: string, updates: Partial<Comment>) => void;
  updateCursor: (userId: string, data: any) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

export const useDocumentStore = create<DocumentState>()(
  immer((set) => ({
    document: null,
    presences: new Map(),
    comments: [],
    isConnected: false,
    users: new Map(),
    
    setDocument: (doc) =>
      set((state) => {
        state.document = doc;
      }),
    
    updatePresence: (presence) =>
      set((state) => {
        state.presences.set(presence.userId, presence);
      }),
    
    removePresence: (userId) =>
      set((state) => {
        state.presences.delete(userId);
      }),
    
    addComment: (comment) =>
      set((state) => {
        state.comments.push(comment);
      }),
    
    updateComment: (commentId, updates) =>
      set((state) => {
        const idx = state.comments.findIndex((c) => c.id === commentId);
        if (idx !== -1) {
          Object.assign(state.comments[idx], updates);
        }
      }),

    updateCursor: (userId, data) =>
      set((state) => {
        state.users.set(userId, data);
      }),

    setConnected: (connected) =>
      set((state) => {
        state.isConnected = connected;
      }),

    reset: () =>
      set((state) => {
        state.document = null;
        state.presences = new Map();
        state.comments = [];
        state.isConnected = false;
        state.users = new Map();
      }),
  }))
);
