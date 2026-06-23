'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { signOut } from 'next-auth/react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Save, Lock, User, Trash2, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ConfirmDialog } from '@/components/ui/Dialog';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [name, setName] = useState(session?.user?.name || '');
  const [hasPassword, setHasPassword] = useState(true);
  const [loadingPasswordStatus, setLoadingPasswordStatus] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    axios.get('/api/user/password').then(({ data }) => {
      setHasPassword(data.hasPassword);
    }).catch(() => {}).finally(() => setLoadingPasswordStatus(false));
  }, []);

  const handleProfileSave = async () => {
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSavingProfile(true);
    try {
      await axios.patch('/api/user/profile', { name });
      await update();
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async () => {
    if (!newPassword) { toast.error('Enter a new password'); return; }
    if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    if (hasPassword && !currentPassword) { toast.error('Enter your current password'); return; }
    setSavingPassword(true);
    try {
      const { data } = await axios.patch('/api/user/password', { currentPassword, newPassword });
      toast.success(data.isNew ? 'Password set' : 'Password updated');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setHasPassword(true);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await axios.delete('/api/user/account');
      toast.success('Account deleted');
      await signOut({ callbackUrl: '/auth/signin' });
    } catch {
      toast.error('Failed to delete account');
      setDeleting(false);
    }
    setShowDeleteConfirm(false);
  };

  if (!session) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <p style={{ color: '#a8a29e' }}>Please sign in</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '36px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
        <button onClick={() => router.push('/dashboard')} className="btn btn-ghost btn-sm" style={{ padding: '6px' }}>
          <ArrowLeft size={17} />
        </button>
        <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.02em' }}>Settings</h1>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <User size={18} color="#f97316" />
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>Profile</h2>
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', marginBottom: '6px', display: 'block' }}>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" style={{ width: '100%' }} />
        </div>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', marginBottom: '6px', display: 'block' }}>Email</label>
          <input type="email" value={session.user?.email || ''} disabled className="input" style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed' }} />
          <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '4px' }}>Email cannot be changed</p>
        </div>
        <button onClick={handleProfileSave} disabled={savingProfile} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Save size={14} /> {savingProfile ? 'Saving...' : 'Save'}
        </button>
      </div>

      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Lock size={18} color="#f97316" />
          <h2 style={{ fontSize: '16px', fontWeight: 600 }}>{hasPassword ? 'Change Password' : 'Set Password'}</h2>
        </div>
        {!loadingPasswordStatus && (
          <>
            {hasPassword && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', marginBottom: '6px', display: 'block' }}>Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input" style={{ width: '100%' }} />
              </div>
            )}
            {!hasPassword && (
              <div style={{ marginBottom: '12px', padding: '10px 14px', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px', fontSize: '12px', color: '#c2410c' }}>
                You signed in with Google. Set a password to enable email sign-in.
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', marginBottom: '6px', display: 'block' }}>{hasPassword ? 'New Password' : 'Password'}</label>
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" style={{ width: '100%' }} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', marginBottom: '6px', display: 'block' }}>Confirm {hasPassword ? 'New ' : ''}Password</label>
              <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="input" style={{ width: '100%' }} />
            </div>
            <button onClick={handlePasswordSave} disabled={savingPassword} className="btn btn-primary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} /> {savingPassword ? 'Saving...' : hasPassword ? 'Update Password' : 'Set Password'}
            </button>
          </>
        )}
      </div>

      <div className="card" style={{ padding: '24px', border: '1.5px solid #fecaca' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <AlertTriangle size={18} color="#ef4444" />
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#ef4444' }}>Delete Account</h2>
        </div>
        <p style={{ fontSize: '13px', color: '#78716c', marginBottom: '16px', lineHeight: 1.5 }}>
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>
        <button onClick={() => setShowDeleteConfirm(true)} className="btn btn-danger btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Trash2 size={14} /> Delete Account
        </button>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAccount}
        title="Delete your account?"
        description="All your documents, comments, and data will be permanently deleted. You will be signed out immediately."
        confirmText={deleting ? 'Deleting...' : 'Delete Forever'}
        variant="danger"
      />
    </div>
  );
}
