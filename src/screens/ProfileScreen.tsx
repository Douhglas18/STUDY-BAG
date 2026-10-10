import React, { useState, useEffect } from 'react';
import { User, Shield, Sparkles, Sliders, Bell, RefreshCw, Check, Clock, Database, CloudCheck, LogIn, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile, Occupation } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';

interface ProfileScreenProps {
  profile: UserProfile;
  firebaseUser?: FirebaseUser | null;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSwitchAccount?: () => void;
  onUpdateProfile: (profile: UserProfile) => void;
  onResetData: () => void;
  onWipeAllDemoData?: () => void;
  onOpenOnboarding: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  firebaseUser,
  onSignIn,
  onSignOut,
  onSwitchAccount,
  onUpdateProfile,
  onResetData,
  onWipeAllDemoData,
  onOpenOnboarding
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <span>Profile & Operating Configuration</span>
          </h1>
          <p className="text-xs text-slate-400">
            Customize your identity parameters, schedule limits, and squad privacy boundaries.
          </p>
        </div>

        {savedSuccess && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
            <Check className="w-3.5 h-3.5" />
            Saved to Cloud & Storage!
          </div>
        )}
      </div>

      {/* Cloud & User Record Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-lg space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                <span>User Record & Cloud Database</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Firestore Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Data persistence powered by Google Cloud Firestore with real-time sync.
              </p>
            </div>
          </div>

          {firebaseUser ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSwitchAccount || onSignIn}
                className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                title="Switch to another Google Account"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Switch Account</span>
              </button>
              <button
                type="button"
                onClick={onSignOut}
                className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 font-semibold text-xs flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onSignIn}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-colors"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In with Google</span>
            </button>
          )}
        </div>

        {firebaseUser ? (
          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              {firebaseUser.photoURL ? (
                <img 
                  src={firebaseUser.photoURL} 
                  alt="avatar" 
                  className="w-9 h-9 rounded-full object-cover border border-indigo-500/40"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center">
                  {(firebaseUser.displayName || firebaseUser.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0 truncate">
                <div className="font-bold text-white truncate">{firebaseUser.displayName || 'Kairon User'}</div>
                <div className="text-[11px] text-slate-400 truncate">{firebaseUser.email}</div>
                <div className="text-[10px] text-slate-500 font-mono">UID: {firebaseUser.uid}</div>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Synced
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Automated Backups</span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-850 text-xs text-slate-300">
            Sign in with your Google account to record and persist your customized roadmap, tasks, goals, and learning resources across any browser or device.
          </div>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Core Identity */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>"Become My Desired Self" Identity</span>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Desired Identity Statement
            </label>
            <textarea
              rows={2}
              value={formData.desiredIdentity}
              onChange={e => setFormData({ ...formData, desiredIdentity: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-indigo-500 resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Kairon references this identity during daily coaching interactions.
            </p>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Role & Domain Label
            </label>
            <input
              type="text"
              value={formData.roleLabel}
              onChange={e => setFormData({ ...formData, roleLabel: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Schedule & Energy Limits */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>Schedule & Cognitive Energy</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Target Available Focus Hours / Day
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="12"
                value={formData.availableHoursPerDay}
                onChange={e => setFormData({ ...formData, availableHoursPerDay: parseFloat(e.target.value) || 2 })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-300 block mb-1">
                Peak Energy Window
              </label>
              <select
                value={formData.energyPeak}
                onChange={e => setFormData({ ...formData, energyPeak: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="morning">Morning (08:00 - 12:00)</option>
                <option value="afternoon">Afternoon (12:00 - 17:00)</option>
                <option value="evening">Evening (18:00 - 22:00)</option>
                <option value="night">Night (22:00+)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-300 block mb-1">
              Preferred Study/Work Hours Window
            </label>
            <input
              type="text"
              value={formData.preferredHours}
              onChange={e => setFormData({ ...formData, preferredHours: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
        </div>

        {/* Squad Privacy Controls (Requirement #23) */}
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-sm">
          <div className="font-bold text-white text-sm flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-400" />
            <span>Squad Privacy Boundaries</span>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-850 cursor-pointer">
              <div>
                <div className="font-semibold text-white">Hide Task Details from Squad</div>
                <div className="text-[11px] text-slate-400">Squad sees that you completed a focus block without seeing exact titles or notes.</div>
              </div>
              <input
                type="checkbox"
                checked={formData.privacy.hideTaskDetailsFromSquad}
                onChange={e => setFormData({
                  ...formData,
                  privacy: { ...formData.privacy, hideTaskDetailsFromSquad: e.target.checked }
                })}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-800 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-850 cursor-pointer">
              <div>
                <div className="font-semibold text-white">Share Process Metrics on Leaderboard</div>
                <div className="text-[11px] text-slate-400">Display streak and hours invested to foster healthy mutual motivation.</div>
              </div>
              <input
                type="checkbox"
                checked={formData.privacy.shareMetricsWithSquad}
                onChange={e => setFormData({
                  ...formData,
                  privacy: { ...formData.privacy, shareMetricsWithSquad: e.target.checked }
                })}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-800 focus:ring-0"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-950 border border-slate-850 cursor-pointer">
              <div>
                <div className="font-semibold text-white">Allow Accountability Pings</div>
                <div className="text-[11px] text-slate-400">Allow squad members to send encouragement nudges on active commitments.</div>
              </div>
              <input
                type="checkbox"
                checked={formData.privacy.allowAccountabilityPings}
                onChange={e => setFormData({
                  ...formData,
                  privacy: { ...formData.privacy, allowAccountabilityPings: e.target.checked }
                })}
                className="w-4 h-4 text-indigo-600 rounded bg-slate-900 border-slate-800 focus:ring-0"
              />
            </label>
          </div>
        </div>

        {/* Save button */}
        <button
          type="submit"
          className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all"
        >
          Save Configuration Updates
        </button>
      </form>

      {/* Dangerous zone */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={onOpenOnboarding}
          className="text-xs text-indigo-400 hover:underline font-semibold"
        >
          Launch New Goal Wizard
        </button>

        <div className="flex items-center gap-3">
          {onWipeAllDemoData && (
            <button
              onClick={() => {
                onWipeAllDemoData();
              }}
              className="px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 active:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-all cursor-pointer"
            >
              Wipe Out Example Data (Clean Slate)
            </button>
          )}

          <button
            onClick={() => {
              onResetData();
            }}
            className="text-xs text-slate-400 hover:text-white hover:underline cursor-pointer"
          >
            Restore Presets
          </button>
        </div>
      </div>
    </div>
  );
};
