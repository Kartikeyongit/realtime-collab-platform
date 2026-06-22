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
  removeComment: (commentId: string) => void;
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
        if (state.document) {
          if (comment.parentId) {
            const parent = state.document.comments?.find((c) => c.id === comment.parentId);
            if (parent) {
              parent.replies = [...(parent.replies || []), comment];
            }
          } else {
            state.document.comments = [comment, ...(state.document.comments || [])];
          }
        }
      }),
    
    updateComment: (commentId, updates) =>
      set((state) => {
        const idx = state.comments.findIndex((c) => c.id === commentId);
        if (idx !== -1) {
          Object.assign(state.comments[idx], updates);
        }
        if (state.document) {
          const docIdx = state.document.comments?.findIndex((c) => c.id === commentId);
          if (docIdx !== undefined && docIdx !== -1) {
            Object.assign(state.document.comments![docIdx], updates);
          }
        }
      }),

    removeComment: (commentId) =>
      set((state) => {
        state.comments = state.comments.filter((c) => c.id !== commentId);
        if (state.document) {
          state.document.comments = state.document.comments?.filter((c) => c.id !== commentId);
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
