import { useState } from 'react';
import { api } from '../lib/api.js';
import { useLang } from '../i18n/LangContext.js';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

interface AdminUnlockModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminUnlockModal({ onClose, onSuccess }: AdminUnlockModalProps) {
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.unlockAdmin(password);
      onSuccess();
    } catch (err: any) {
      setError(err.message || t('wrongPassword'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div id="admin-unlock-modal" className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs">
      <div className="bg-[var(--cream-card)] w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-5 bg-[var(--ink)] text-white flex items-center gap-2.5">
          <ShieldCheck className="h-5 w-5 text-[var(--clay)]" />
          <h3 className="text-sm font-display font-bold">{t('adminPanelTitle')}</h3>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-[var(--ink)]/70 uppercase tracking-wider mb-1">
              {t('enterPassword')}
            </label>
            <input
              id="admin-password-input"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full py-2.5 px-3 border border-black/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[var(--clay)]/20 focus:border-[var(--clay)] transition-all bg-white"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-black/5 hover:bg-black/10 text-[var(--ink)] rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {t('cancel')}
            </button>
            <button
              id="admin-unlock-submit"
              type="submit"
              disabled={loading || !password}
              className="flex-1 py-2.5 bg-[var(--clay)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? '...' : t('unlock')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
