import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, Send, Sparkles, User, HelpCircle, ArrowRight, 
  RotateCcw, ShieldCheck, CheckCircle2, Compass, BookOpen, Globe, FileText, GraduationCap 
} from 'lucide-react';
import { ChatMessage, Goal, Task, UserProfile, PersonalRoadmap } from '../types';
import { aiService } from '../services/aiService';

interface AICoachScreenProps {
  profile: UserProfile;
  goals: Goal[];
  roadmap?: PersonalRoadmap | null;
  tasks: Task[];
  chatHistory: ChatMessage[];
  onSendMessage?: (text: string) => void;
  onAddMessage?: (message: ChatMessage) => void;
  onClearHistory: () => void;
  initialQuestion?: string | null;
}

export const AICoachScreen: React.FC<AICoachScreenProps> = ({
  profile,
  goals,
  roadmap,
  tasks,
  chatHistory,
  onSendMessage,
  onAddMessage,
  onClearHistory,
  initialQuestion
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scenarioChips = [
    'What should I do now?',
    'Why am I behind?',
    'Explain Level 2',
    'Make this easier',
    'I only have 30 minutes today',
    'Teach me this topic',
    'Why did I get this question wrong?',
    'Change my target deadline',
    'What is the latest syllabus for this exam?',
    'Explain this chapter from my PDF'
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (initialQuestion) {
      handleSend(initialQuestion);
    }
  }, [initialQuestion]);

  const dispatchMessage = (msg: ChatMessage) => {
    if (onAddMessage) {
      onAddMessage(msg);
    } else if (onSendMessage) {
      onSendMessage(msg.text);
    }
  };

  const handleSend = async (messageToSend = inputText) => {
    if (!messageToSend.trim()) return;

    setInputText('');
    
    // User message with guaranteed unique ID
    const userMsg: ChatMessage = {
      id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
      sender: 'user',
      text: messageToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    dispatchMessage(userMsg);
    setIsTyping(true);

    const completedCount = tasks.filter(t => t.status === 'Completed').length;
    const activeGoal = goals[0];
    const currentStage = roadmap?.stages?.find(s => s.status === 'current') || roadmap?.stages?.[0];

    try {
      const response = await aiService.askUnifiedAI(messageToSend, {
        goalTitle: activeGoal?.title,
        targetMetric: activeGoal?.targetMetric,
        currentLevelName: currentStage?.name,
        pendingCount: tasks.length - completedCount,
        availableHoursPerDay: profile.availableHoursPerDay,
        userId: 'guest'
      });

      const aiMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        sender: 'sara',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        routedTo: response.routedTo,
        sourceUsed: response.sourceUsed,
        quickReplies: response.suggestedNext
      };
      dispatchMessage(aiMsg);
    } catch (e) {
      const fallbackMsg: ChatMessage = {
        id: 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9),
        sender: 'sara',
        text: `Here is the key priority: Complete your primary practice block on **${currentStage?.name || 'your core topic'}** first. Keep distractions away and focus on steady execution.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        routedTo: 'planner',
        sourceUsed: 'Planner Fallback'
      };
      dispatchMessage(fallbackMsg);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-w-4xl mx-auto">
      {/* Coach Header */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md mb-3 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
              Sara Unified AI
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Planner • Tutor • Document • Search
              </span>
            </h1>
            <p className="text-[11px] text-slate-400">
              One clear AI entry point. Automatically routes to Planner Coach, Interactive Tutor, or Document retrieval.
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="text-[11px] text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          title="Reset conversation"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Chat Messages Log */}
      <div className="flex-1 overflow-y-auto pr-2 space-y-3.5 text-xs">
        {chatHistory.map((msg, idx) => {
          const isAI = msg.sender === 'sara' || msg.sender === 'kairon';

          return (
            <div
              key={`${msg.id || 'msg'}-${idx}`}
              className={`flex items-start gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}
            >
              {isAI && (
                <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5">
                  {msg.routedTo === 'planner' ? (
                    <Compass className="w-4 h-4 text-cyan-400" />
                  ) : msg.routedTo === 'document' ? (
                    <FileText className="w-4 h-4 text-amber-400" />
                  ) : msg.routedTo === 'web_search' ? (
                    <Globe className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <GraduationCap className="w-4 h-4 text-violet-400" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] p-3.5 rounded-2xl leading-relaxed whitespace-pre-line ${
                  isAI
                    ? 'bg-slate-900 border border-slate-800 text-slate-200 shadow-sm'
                    : 'bg-indigo-600 text-white font-medium shadow-md shadow-indigo-600/20'
                }`}
              >
                {/* Role and Source Attribution Badge for AI Responses */}
                {isAI && (
                  <div className="mb-2 pb-2 border-b border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5">
                      {msg.routedTo === 'planner' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                          <Compass className="w-3 h-3 text-cyan-400" />
                          AI 1: Planner & Coach
                        </span>
                      )}
                      {msg.routedTo === 'document' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
                          <FileText className="w-3 h-3 text-amber-400" />
                          Document Intelligence
                        </span>
                      )}
                      {msg.routedTo === 'web_search' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
                          <Globe className="w-3 h-3 text-emerald-400" />
                          Google Search Grounding
                        </span>
                      )}
                      {(!msg.routedTo || msg.routedTo === 'tutor') && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-violet-950/60 text-violet-300 border border-violet-800/60">
                          <GraduationCap className="w-3 h-3 text-violet-400" />
                          AI 2: Interactive Tutor
                        </span>
                      )}
                    </div>
                    {msg.sourceUsed && (
                      <span className="text-[10px] text-slate-400 italic">
                        {msg.sourceUsed}
                      </span>
                    )}
                  </div>
                )}

                {msg.text}

                {/* Quick chip options if offered */}
                {msg.quickReplies && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800 flex flex-wrap gap-1.5">
                    {msg.quickReplies.map((qr, i) => (
                      <button
                        key={i}
                        onClick={() => handleSend(qr)}
                        className="text-[10px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-950/80 text-indigo-300 border border-slate-800 hover:border-indigo-500/40 transition-colors font-medium flex items-center gap-1"
                      >
                        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                        {qr}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {!isAI && (
                <div className="w-7 h-7 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Scenario Chips (Sections 6, 8, 9) */}
      <div className="py-2 overflow-x-auto flex items-center gap-1.5 text-[11px] shrink-0 no-scrollbar">
        {scenarioChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="px-2.5 py-1 rounded-full bg-slate-900 hover:bg-indigo-950/60 border border-slate-800 hover:border-indigo-500/30 text-slate-300 hover:text-indigo-200 transition-colors whitespace-nowrap font-medium shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="mt-1 flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Ask anything: What should I do now? Explain Level 2, I only have 30 minutes, or ask from your PDF..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 shadow-inner"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-all shadow-md shadow-indigo-600/30 shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
