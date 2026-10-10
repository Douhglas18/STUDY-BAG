import React, { useState } from 'react';
import { 
  Users, Flame, Trophy, Sparkles, MessageCircle, Heart, ThumbsUp, 
  Send, Shield, CheckCircle2, Clock, Plus, Award, Eye, Copy, Check,
  UserCheck, ArrowRight, Zap, RefreshCw, Unlink, ExternalLink, Radio
} from 'lucide-react';
import { GroupWorkspace, GroupMember, UserProfile } from '../types';
import { PartnerPlanModal } from '../components/PartnerPlanModal';
import { DEFAULT_FOCUS_PARTNER } from '../services/storage';

interface GroupsScreenProps {
  group?: GroupWorkspace | null;
  profile: UserProfile;
  duoRoomId?: string | null;
  onPostAccountabilityRequest: (text: string) => void;
  onReactToActivity: (activityId: string, emoji: string) => void;
  onChangeGroupType: (type: 'single' | 'duo' | 'trio' | 'squad') => void;
  onAddPartner?: (partner: GroupMember) => void;
  onJoinRoom?: (roomId: string) => Promise<void> | void;
  onLeaveRoom?: () => Promise<void> | void;
  onSendPingToPartner?: (partnerName: string, message: string, type: 'nudge' | 'high_five') => void;
  onSimulateDemoPartner?: () => void;
}

export const GroupsScreen: React.FC<GroupsScreenProps> = ({
  group,
  profile,
  duoRoomId,
  onPostAccountabilityRequest,
  onReactToActivity,
  onChangeGroupType,
  onAddPartner,
  onJoinRoom,
  onLeaveRoom,
  onSendPingToPartner,
  onSimulateDemoPartner
}) => {
  const [requestText, setRequestText] = useState('');
  const [squadAiModal, setSquadAiModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<GroupMember | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [partnerInviteCode, setPartnerInviteCode] = useState('');
  const [inviteSuccessMsg, setInviteSuccessMsg] = useState<string | null>(null);

  if (!group) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-5 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-sky-600/10 border border-sky-500/20 text-sky-400 mx-auto flex items-center justify-center shadow-lg shadow-sky-600/10">
          <Users className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-extrabold text-white">Accountability Squad</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Stay accountable with 1 to 4 focus partners. Maximum capacity is strictly capped at 4 members (Solo, Duo, Trio, Squad).
          </p>
        </div>
      </div>
    );
  }

  const handlePostRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim()) return;
    onPostAccountabilityRequest(requestText.trim());
    setRequestText('');
  };

  const handleViewPartner = (partner: GroupMember) => {
    setSelectedPartner(partner);
    setPartnerModalOpen(true);
  };

  const activeRoomCode = duoRoomId || 'PAIR-DEMO';

  const handleCopyInviteCode = () => {
    navigator.clipboard.writeText(activeRoomCode).catch(() => {});
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2500);
  };

  const handleJoinPartnerCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = partnerInviteCode.trim().toUpperCase();
    if (!cleanCode) return;
    
    if (onJoinRoom) {
      await onJoinRoom(cleanCode);
      setInviteSuccessMsg(`Connecting to duo room ${cleanCode}... Real-time partner sync active.`);
    }
    setPartnerInviteCode('');
    setTimeout(() => setInviteSuccessMsg(null), 5000);
  };

  const partners = group.members.filter(m => 
    !m.isCurrentUser && 
    !m.name.includes('Priya') && 
    m.id !== 'partner-priya'
  );
  const groupGoalPercent = Math.round((group.groupGoal.current / group.groupGoal.target) * 100);

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Banner & Squad Type Switcher (Single / Duo / Trio / Squad) */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-950 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Accountability & Mutual Momentum Workspace</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            {group.name}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            Different individual goals, shared execution discipline. Process metrics compared — never shame.
          </p>
        </div>

        {/* Group size selector */}
        <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
          {(['single', 'duo', 'trio', 'squad'] as const).map(t => (
            <button
              key={t}
              onClick={() => onChangeGroupType(t)}
              className={`px-3 py-1.5 rounded-xl capitalize font-semibold transition-all ${
                group.type === t
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'duo' ? 'Duo (Partner)' : t}
            </button>
          ))}
        </div>
      </div>

      {/* PARTNER SPOTLIGHT: Directly Answers "Where can I see my partner's plans or account?" */}
      {partners.length > 0 ? (
        <div className="p-5 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-emerald-400" />
              <span>Connected Focus Partner • Active Sync</span>
            </div>
            <span className="text-xs text-slate-400">Click below to inspect full roadmap & tasks</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {partners.map(p => (
              <div 
                key={p.id}
                className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-3 shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0 p-1 bg-slate-900 rounded-xl border border-slate-800">
                      {p.avatar}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-sm text-white truncate">{p.name}</h3>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded-full font-bold border border-emerald-500/20">
                          {p.currentStreak}d Streak 🔥
                        </span>
                      </div>
                      <p className="text-xs text-indigo-300 font-medium truncate mt-0.5">
                        🎯 {p.goalTitle}
                      </p>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">
                        Milestone: <span className="text-slate-200 font-semibold">{p.partnerPlan?.currentLevelName || 'Level 2: Core Execution'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-extrabold text-sm text-emerald-400">
                      {p.progressPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-400">Pace</div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <span>⏱️ {p.hoursInvested}h deep work</span>
                    <span>•</span>
                    <span>✅ {p.weeklyTasksCompleted}/{p.weeklyTargetTasks} tasks</span>
                  </div>

                  <button
                    onClick={() => handleViewPartner(p)}
                    className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Partner Plan & Account</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : group.type === 'duo' ? (
        <div className="p-5 rounded-3xl bg-slate-900 border border-indigo-500/40 shadow-lg space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Duo Mode Active • Waiting for Focus Partner to Connect</span>
              </div>
              <h3 className="font-extrabold text-base text-white">
                Share Your Duo Room Code to Connect Real Accounts
              </h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Your live room code is <strong className="font-mono text-indigo-300 font-bold px-1.5 py-0.5 bg-slate-950 rounded border border-slate-800">{activeRoomCode}</strong>. Give this code to your partner to connect, or enter their room code below.
              </p>
            </div>
            <button
              onClick={handleCopyInviteCode}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0 transition-colors"
            >
              {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{inviteCopied ? 'Code Copied!' : 'Copy Room Code'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Empty Partner Callout when in Solo mode */
        <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-400" />
              <span>Looking for your partner's plan or account?</span>
            </h3>
            <p className="text-xs text-slate-400 max-w-xl">
              You are currently in Solo mode. Switch to <strong>Duo (Partner)</strong> mode or invite a friend using your squad invite code to track their live roadmap, tasks, and consistency streaks.
            </p>
          </div>
          <button
            onClick={() => onChangeGroupType('duo')}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0"
          >
            <span>Switch to Duo (Partner Mode)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Shared Group Goal Progress (Requirement #22, #39) */}
      <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-lg space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5 mb-0.5">
              <Trophy className="w-3.5 h-3.5" />
              <span>Squad Collective Mission</span>
            </div>
            <h2 className="text-base font-extrabold text-white">
              {group.groupGoal.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-lg font-mono font-bold text-white">
                {group.groupGoal.current} / {group.groupGoal.target}
              </div>
              <div className="text-[10px] text-slate-400 font-semibold">{group.groupGoal.unit}</div>
            </div>

            <button
              onClick={() => setSquadAiModal(true)}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask Squad AI</span>
            </button>
          </div>
        </div>

        <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-violet-500 to-emerald-400 rounded-full transition-all duration-700"
            style={{ width: `${groupGoalPercent}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Healthy Process-Metric Leaderboard (Requirement #21, #39) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>Process Metrics Leaderboard</span>
                <span className="text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  Healthy Competition
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Comparing consistency & hours invested — not comparing different goals.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {group.members.map((member) => (
              <div
                key={member.id}
                className={`p-4 rounded-2xl border transition-all ${
                  member.isCurrentUser
                    ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md'
                    : 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/40'
                }`}
              >
                <div className="flex items-center justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-2xl">{member.avatar}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white truncate">
                          {member.name}
                        </span>
                        {member.isCurrentUser ? (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                            YOU
                          </span>
                        ) : (
                          <button
                            onClick={() => handleViewPartner(member)}
                            className="text-[10px] px-2 py-0.5 rounded bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-bold border border-indigo-500/30 flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Plan</span>
                          </button>
                        )}
                        <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-950 border border-slate-850">
                          {member.role}
                        </span>
                      </div>
                      <div className="text-xs text-slate-300 font-medium truncate mt-0.5">
                        Goal: <span className="text-indigo-300">{member.goalTitle}</span>
                      </div>
                    </div>
                  </div>

                  {/* Streak & online */}
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs font-mono font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded-xl">
                      <Flame className="w-3.5 h-3.5" />
                      <span>{member.currentStreak}d</span>
                    </div>
                  </div>
                </div>

                {/* Metrics row: Tasks done, Hours, Completion % */}
                <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-xl border border-slate-850 text-center text-xs">
                  <div>
                    <div className="font-mono font-bold text-slate-200">
                      {member.weeklyTasksCompleted}/{member.weeklyTargetTasks}
                    </div>
                    <div className="text-[10px] text-slate-400">Weekly Tasks</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-indigo-400">
                      {member.hoursInvested}h
                    </div>
                    <div className="text-[10px] text-slate-400">Deep Work Logged</div>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-emerald-400">
                      {member.progressPercentage}%
                    </div>
                    <div className="text-[10px] text-slate-400">Milestone Pace</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Real-Time Focus Partner Connectivity Widget */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-indigo-950/40 border border-indigo-500/30 space-y-4 shadow-lg">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <span>Live Focus Partner Connectivity</span>
                  </h3>
                  <p className="text-[10px] text-slate-400">
                    Real-time duo synchronization via Firestore & cross-tab bridge.
                  </p>
                </div>
              </div>

              {partners.length > 0 && onLeaveRoom && (
                <button
                  onClick={onLeaveRoom}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  title="Disconnect from current partner room"
                >
                  <Unlink className="w-3 h-3" />
                  <span>Disconnect</span>
                </button>
              )}
            </div>

            {/* Quick Action Bar for Connected Partner */}
            {partners.length > 0 ? (
              <div className="p-3 rounded-xl bg-slate-950/80 border border-emerald-500/30 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="font-bold text-white">Live Connected:</span>
                    <span className="text-indigo-300 font-semibold">{partners[0].name}</span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full font-mono">
                      Room {activeRoomCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {partners[0].progressPercentage}% Progress
                  </span>
                </div>

                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button
                    onClick={() => handleViewPartner(partners[0])}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Live Plan</span>
                  </button>
                  {onSendPingToPartner && (
                    <>
                      <button
                        onClick={() => onSendPingToPartner(partners[0].name, 'High-five! Keep up the momentum 🔥', 'high_five')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span>🙌 Send High-Five</span>
                      </button>
                      <button
                        onClick={() => onSendPingToPartner(partners[0].name, 'Focus time! Starting deep work sprint ⚡', 'nudge')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-semibold text-xs flex items-center gap-1.5 transition-colors"
                      >
                        <span>⚡ Send Nudge</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : null}

            {/* Room Code & Connect Input: Render full form only when no partner is connected */}
            {partners.length === 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between text-slate-400 font-medium text-[11px]">
                    <span>Your Live Duo Room Code:</span>
                    <span className="text-[10px] text-indigo-400">Share with partner</span>
                  </div>
                  <div className="flex items-center justify-between bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <span className="font-mono font-bold text-white text-sm tracking-wider">{activeRoomCode}</span>
                    <button
                      onClick={handleCopyInviteCode}
                      className="p-1 px-2 rounded-md bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 transition-colors flex items-center gap-1 text-[11px] font-semibold"
                      title="Copy your Duo room code"
                    >
                      {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{inviteCopied ? 'Copied' : 'Copy Code'}</span>
                    </button>
                  </div>
                </div>

                <form onSubmit={handleJoinPartnerCode} className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
                  <div className="text-slate-400 font-medium text-[11px]">Enter Partner's Room Code:</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      placeholder="e.g. PAIR-7829"
                      value={partnerInviteCode}
                      onChange={e => setPartnerInviteCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 font-mono uppercase focus:outline-none focus:border-indigo-500"
                    />
                    <button
                      type="submit"
                      disabled={!partnerInviteCode.trim()}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shrink-0 transition-colors shadow-sm"
                    >
                      Connect
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-400">
                <span className="text-[11px]">
                  Shared Duo Room: <strong className="text-white font-mono">{activeRoomCode}</strong>
                </span>
                <button
                  onClick={handleCopyInviteCode}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                >
                  {inviteCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{inviteCopied ? 'Copied' : 'Copy Code'}</span>
                </button>
              </div>
            )}

            {/* Presentation & Demo Helpers */}
            <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
              <span className="text-[11px] text-slate-400">
                Demo presentation mode: test real-time pairing in multi-tabs or with demo partner.
              </span>
              <div className="flex items-center gap-2">
                {onSimulateDemoPartner && (
                  <button
                    type="button"
                    onClick={onSimulateDemoPartner}
                    className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-indigo-300 border border-indigo-500/20 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                    title="Link a simulated active partner for solo live presentations"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    <span>Quick Demo Partner</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyInviteCode();
                    window.open(window.location.href, '_blank');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition-colors"
                  title="Open a second tab to test live two-way synchronization"
                >
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                  <span>Open 2nd Tab to Test</span>
                </button>
              </div>
            </div>

            {inviteSuccessMsg && (
              <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold animate-in fade-in">
                ✓ {inviteSuccessMsg}
              </div>
            )}
          </div>

          {/* Squad Challenges (Requirement #22) */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>Active Weekly Challenges</span>
            </h3>

            <div className="space-y-2 text-xs">
              {group.challenges.map(c => (
                <div key={c.id} className="p-3 rounded-xl bg-slate-950 border border-slate-850 flex items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-200">{c.title}</div>
                    <div className="text-[11px] text-slate-400">{c.description}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="font-mono font-bold text-indigo-400">{c.progress}/{c.target} {c.unit}</span>
                    <div className="text-[10px] text-slate-400">{c.deadline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Live Activity Feed & Accountability Request (Requirement #24) */}
        <div className="space-y-4">
          
          {/* Post Accountability Request */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Ask Squad to Hold You Accountable</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Commit publicly to a deadline. Squad members will encourage and verify completion.
            </p>

            <form onSubmit={handlePostRequest} className="space-y-2 pt-1">
              <input
                type="text"
                placeholder="e.g. Finish DSA Tree Assignment before 8 PM tonight..."
                value={requestText}
                onChange={e => setRequestText(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-850 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!requestText.trim()}
                className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Send className="w-3 h-3" />
                <span>Post Commitment</span>
              </button>
            </form>
          </div>

          {/* Activity Feed */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Squad Activity Stream</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </h3>

            <div className="space-y-3 text-xs">
              {group.activityFeed.map(act => (
                <div key={act.id} className="p-3 rounded-xl bg-slate-950 border border-slate-850 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-semibold text-slate-200">
                      <span>{act.userAvatar}</span>
                      <span className="truncate">{act.userName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">{act.timestamp}</span>
                  </div>

                  <div className="text-[11px] text-slate-300">
                    <span className="text-slate-400">{act.action}: </span>
                    <strong className="text-white">{act.target}</strong>
                  </div>

                  {/* Reaction buttons */}
                  <div className="flex items-center gap-1.5 pt-1">
                    {act.reactions.map((r, rIdx) => (
                      <button
                        key={rIdx}
                        onClick={() => onReactToActivity(act.id, r.emoji)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] flex items-center gap-1 border transition-all ${
                          r.userReacted
                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span>{r.count}</span>
                      </button>
                    ))}
                    <button
                      onClick={() => onReactToActivity(act.id, '👏')}
                      className="px-1.5 py-0.5 rounded-lg text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400"
                      title="Add clap"
                    >
                      +👏
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Partner Plan & Account Inspector Modal */}
      <PartnerPlanModal
        isOpen={partnerModalOpen}
        onClose={() => setPartnerModalOpen(false)}
        partner={selectedPartner}
        onSendEncouragement={(name, msg) => {
          onPostAccountabilityRequest(`High-Five to ${name}! 🔥 ${msg}`);
        }}
        onSendNudge={(name) => {
          onPostAccountabilityRequest(`Friendly nudge sent to ${name} 🔔 Focus session time!`);
        }}
      />

      {/* Squad AI Modal (Requirement #40) */}
      {squadAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-5 text-white space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
              <Sparkles className="w-4 h-4" />
              <span>Squad AI Synthesis</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed">
              "The squad has completed <strong>{group.groupGoal.current} / {group.groupGoal.target} {group.groupGoal.unit}</strong> this month. 
              Compounding momentum comes from morning consistency and protected focus blocks. Keep executing calmly on your primary milestones!"
            </p>
            <div className="text-[11px] text-slate-400 italic">
              Private goal notes and personal study materials remain shielded.
            </div>
            <button
              onClick={() => setSquadAiModal(false)}
              className="w-full py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
