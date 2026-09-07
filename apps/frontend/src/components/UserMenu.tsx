import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Settings, LogOut, X } from 'lucide-react';
import { api, ApiError, type ApiUser } from '../lib/api';
import { supabase, toApiUser } from '../lib/supabaseClient';

interface UserMenuProps {
  user: ApiUser;
  onLogout: () => void;
  onUserUpdate: (user: ApiUser) => void;
}

export function UserMenu({ user, onLogout, onUserUpdate }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const initials = user.name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Account menu"
          className="grid h-9 w-9 place-items-center rounded-full border border-white/12 bg-white/6 text-[12px] font-medium text-ink transition hover:border-white/25"
        >
          {initials || 'U'}
        </button>

        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-11 z-30 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#171715] py-1.5 shadow-xl shadow-black/40"
          >
            <div className="px-4 pb-2 pt-2.5">
              <div className="text-[10px] font-medium tracking-[0.16em] text-ink-dim">YOUR ACCOUNT</div>
              <div className="mt-1 truncate text-[13px] text-ink">{user.email}</div>
            </div>
            <div className="border-t border-white/6" />
            <button
              onClick={() => {
                setOpen(false);
                setShowSettings(true);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-ink transition hover:bg-white/6"
            >
              <Settings size={14} className="text-ink-dim" /> Settings
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-[13px] text-ink transition hover:bg-white/6"
            >
              <LogOut size={14} className="text-ink-dim" /> Log out
            </button>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showSettings && (
          <SettingsModal
            user={user}
            onClose={() => setShowSettings(false)}
            onUserUpdate={onUserUpdate}
            onDeleted={onLogout}
          />
        )}
      </AnimatePresence>
    </>
  );
}

interface SettingsModalProps {
  user: ApiUser;
  onClose: () => void;
  onUserUpdate: (user: ApiUser) => void;
  onDeleted: () => void;
}

function SettingsModal({ user, onClose, onUserUpdate, onDeleted }: SettingsModalProps) {
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const attrs: { data?: { name: string }; password?: string } = {};
      if (name.trim() && name.trim() !== user.name) attrs.data = { name: name.trim() };

      if (newPassword) {
        // Supabase's own session doesn't require the current password to call
        // updateUser — reauthenticate first so this still behaves like the UI implies.
        const { error: reauthError } = await supabase.auth.signInWithPassword({
          email: user.email,
          password: currentPassword,
        });
        if (reauthError) throw new Error('Current password is incorrect');
        attrs.password = newPassword;
      }

      if (Object.keys(attrs).length === 0) {
        setMessage('Nothing to save.');
        return;
      }

      const { data, error: updateError } = await supabase.auth.updateUser(attrs);
      if (updateError) throw new Error(updateError.message);
      onUserUpdate(toApiUser(data.user));
      setCurrentPassword('');
      setNewPassword('');
      setMessage('Saved.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save changes');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setDeleteBusy(true);
    setError(null);
    try {
      await api.deleteAccount();
      onDeleted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not delete account');
      setDeleteBusy(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 340, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#141412] p-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-ink">Settings</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1.5 text-ink-dim transition hover:bg-white/6 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-5 space-y-3">
          <div>
            <label className="mb-1.5 block text-xs text-ink-dim">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[14px] text-ink focus:border-white/25 focus:outline-none"
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-ink-dim">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[14px] text-ink focus:border-white/25 focus:outline-none"
              placeholder="Leave blank to keep current"
            />
          </div>
          {newPassword && (
            <div>
              <label className="mb-1.5 block text-xs text-ink-dim">Current password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2.5 text-[14px] text-ink focus:border-white/25 focus:outline-none"
                placeholder="Needed to set a new password"
              />
            </div>
          )}
          {error && <p className="text-[12px] text-danger">{error}</p>}
          <div className="flex items-center gap-3">
            <button
              onClick={() => void save()}
              disabled={saving}
              className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-accent-ink transition hover:brightness-110 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            {message && <span className="text-[12px] text-ink-dim">{message}</span>}
          </div>
        </div>

        <div className="mt-6 border-t border-white/8 pt-5">
          {!deleting ? (
            <button
              onClick={() => setDeleting(true)}
              className="text-[13px] text-danger transition hover:opacity-80"
            >
              Delete account
            </button>
          ) : (
            <div className="space-y-2.5">
              <p className="text-[12px] leading-relaxed text-ink-dim">
                This permanently deletes your account and every memory. Type{' '}
                <span className="text-ink">DELETE</span> to confirm.
              </p>
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/30 px-3.5 py-2 text-[14px] text-ink focus:border-white/25 focus:outline-none"
                placeholder="DELETE"
              />
              <div className="flex gap-2">
                <button
                  disabled={confirmText !== 'DELETE' || deleteBusy}
                  onClick={() => void confirmDelete()}
                  className="rounded-lg bg-danger px-3.5 py-2 text-[13px] font-medium text-white disabled:opacity-40"
                >
                  {deleteBusy ? 'Deleting…' : 'Permanently delete'}
                </button>
                <button
                  onClick={() => setDeleting(false)}
                  disabled={deleteBusy}
                  className="rounded-lg px-3 py-2 text-[13px] text-ink-dim hover:text-ink disabled:opacity-40"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
