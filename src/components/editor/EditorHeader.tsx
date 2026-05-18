'use client';

import { Save, Loader2, Wifi, WifiOff, Users } from 'lucide-react';

interface EditorHeaderProps {
  isConnected: boolean;
  isSaving: boolean;
  lastSaved: Date | null;
  users: any[];
  onSave: () => void;
}

export function EditorHeader({ isConnected, isSaving, lastSaved, users, onSave }: EditorHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white/80 backdrop-blur-sm border-b border-gray-200/60 h-11">
      {/* Left section */}
      <div className="flex items-center gap-4">
        {/* Connection status */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isConnected 
              ? 'bg-green-50 text-green-700' 
              : 'bg-red-50 text-red-700'
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>
        
        {/* Connected users */}
        {users.length > 0 && (
          <div className="flex items-center gap-2 pl-4 border-l border-gray-200">
            <Users className="w-4 h-4 text-gray-400" />
            <div className="flex -space-x-2">
              {users.slice(0, 3).map((user, index) => (
                <div
                  key={index}
                  className="w-6 h-6 rounded-full ring-2 ring-white flex items-center justify-center text-[10px] font-medium text-white shadow-sm"
                  style={{ backgroundColor: user.color }}
                  title={user.name}
                >
                  {user.name?.charAt(0) || 'A'}
                </div>
              ))}
              {users.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-100 ring-2 ring-white flex items-center justify-center text-[10px] font-medium text-gray-500">
                  +{users.length - 3}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-500 ml-1">
              {users.length} online
            </span>
          </div>
        )}
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">
        {/* Save status */}
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {isSaving ? (
            <>
              <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
              <span>Saving...</span>
            </>
          ) : lastSaved ? (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
              <span>Saved {formatTime(lastSaved)}</span>
            </>
          ) : (
            <span>All changes saved</span>
          )}
        </div>
        
        {/* Save button */}
        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 
                   bg-white border border-gray-300 rounded-lg hover:bg-gray-50 
                   disabled:opacity-50 transition-all duration-200 shadow-sm"
        >
          <Save className="w-3.5 h-3.5" />
          Save
        </button>
      </div>
    </div>
  );
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
