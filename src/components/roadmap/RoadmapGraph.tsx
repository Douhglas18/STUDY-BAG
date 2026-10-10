import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Unlock, CheckCircle2, 
  Sparkles, ZoomIn, ZoomOut, RotateCcw, Flame,
  Search, X, Eye, Check, Link2, BookOpen
} from 'lucide-react';
import { PersonalRoadmap, RoadmapStage } from '../../types';

interface RoadmapGraphProps {
  roadmap: PersonalRoadmap;
  onSelectStage: (stage: RoadmapStage) => void;
  activeStageId?: string;
  className?: string;
}

interface NodePosition {
  stage: RoadmapStage;
  x: number;
  y: number;
  width: number;
  height: number;
  animIndex: number;
}

export const RoadmapGraph: React.FC<RoadmapGraphProps> = ({
  roadmap,
  onSelectStage,
  activeStageId,
  className = ''
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_progress' | 'available' | 'completed' | 'locked'>('all');

  // Standard dimensions for nodes matching the NeetCode flowchart layout
  const NODE_WIDTH = 154;
  const NODE_HEIGHT = 50;

  // Calculate layout coordinates for stages
  const { nodePositions, edges, canvasWidth, canvasHeight } = useMemo(() => {
    const stageMap = new Map<string, RoadmapStage>();
    roadmap.stages.forEach(s => stageMap.set(s.id, s));

    // Preset coordinates for the 18 NeetCode stages (matching screenshot flowchart)
    const NEETCODE_COORDS: Record<string, { x: number; y: number }> = {
      'st-r-arrays': { x: 450, y: 45 },
      'st-r-twopointers': { x: 370, y: 145 },
      'st-r-stack': { x: 550, y: 145 },
      'st-r-binarysearch': { x: 230, y: 245 },
      'st-r-slidingwindow': { x: 390, y: 245 },
      'st-r-linkedlist': { x: 570, y: 245 },
      'st-r-trees': { x: 390, y: 345 },
      'st-r-tries': { x: 250, y: 445 },
      'st-r-heap': { x: 390, y: 445 },
      'st-r-backtracking': { x: 550, y: 445 },
      'st-r-intervals': { x: 120, y: 550 },
      'st-r-greedy': { x: 280, y: 550 },
      'st-r-advgraphs': { x: 440, y: 565 },
      'st-r-graphs': { x: 545, y: 540 },
      'st-r-1ddp': { x: 690, y: 540 },
      'st-r-2ddp': { x: 590, y: 645 },
      'st-r-bitmanip': { x: 745, y: 645 },
      'st-r-math': { x: 675, y: 745 }
    };

    // Preset coordinates for academic stages
    const ACADEMIC_COORDS: Record<string, { x: number; y: number }> = {
      'st-alex-1': { x: 400, y: 45 },
      'st-alex-2': { x: 400, y: 145 },
      'st-alex-3': { x: 280, y: 245 },
      'st-alex-4': { x: 520, y: 245 },
      'st-alex-5': { x: 400, y: 350 },
      'st-alex-6': { x: 400, y: 455 },
      'st-alex-7': { x: 400, y: 560 },
      'st-alex-8': { x: 400, y: 665 }
    };

    const rawPositions: { stage: RoadmapStage; x: number; y: number; width: number; height: number }[] = [];
    let maxX = 850;
    let maxY = 800;

    // Check if stages have preset or explicit coordinates
    const hasPresetCoords = roadmap.stages.some(s => NEETCODE_COORDS[s.id] || ACADEMIC_COORDS[s.id]);

    if (hasPresetCoords) {
      roadmap.stages.forEach(stage => {
        let coord = NEETCODE_COORDS[stage.id] || ACADEMIC_COORDS[stage.id];
        if (!coord) {
          coord = { x: 400, y: 45 + (stage.order - 1) * 95 };
        }
        rawPositions.push({
          stage,
          x: coord.x,
          y: coord.y,
          width: NODE_WIDTH,
          height: NODE_HEIGHT
        });
        if (coord.x + NODE_WIDTH + 80 > maxX) maxX = coord.x + NODE_WIDTH + 80;
        if (coord.y + NODE_HEIGHT + 80 > maxY) maxY = coord.y + NODE_HEIGHT + 80;
      });
    } else {
      // Dynamic topological DAG layout algorithm for arbitrary AI-generated roadmaps
      const rankMap = new Map<string, number>();

      function getRank(stageId: string, visited = new Set<string>()): number {
        if (rankMap.has(stageId)) return rankMap.get(stageId)!;
        if (visited.has(stageId)) return 0;
        visited.add(stageId);

        const st = stageMap.get(stageId);
        if (!st || !st.prerequisiteStageIds || st.prerequisiteStageIds.length === 0) {
          rankMap.set(stageId, 0);
          return 0;
        }

        let maxPrereqRank = -1;
        for (const pid of st.prerequisiteStageIds) {
          const pr = getRank(pid, new Set(visited));
          if (pr > maxPrereqRank) maxPrereqRank = pr;
        }
        const rank = maxPrereqRank + 1;
        rankMap.set(stageId, rank);
        return rank;
      }

      roadmap.stages.forEach(s => getRank(s.id));

      const rankGroups = new Map<number, RoadmapStage[]>();
      roadmap.stages.forEach(s => {
        const r = rankMap.get(s.id) || 0;
        if (!rankGroups.has(r)) rankGroups.set(r, []);
        rankGroups.get(r)!.push(s);
      });

      const sortedRanks = Array.from(rankGroups.keys()).sort((a, b) => a - b);
      const totalWidth = 850;

      sortedRanks.forEach(rank => {
        const stagesInRank = rankGroups.get(rank)!;
        const count = stagesInRank.length;
        const y = 45 + rank * 105;

        stagesInRank.forEach((st, idx) => {
          const spacing = totalWidth / (count + 1);
          const x = spacing * (idx + 1) - NODE_WIDTH / 2;

          rawPositions.push({
            stage: st,
            x: Math.max(40, x),
            y,
            width: NODE_WIDTH,
            height: NODE_HEIGHT
          });

          if (x + NODE_WIDTH + 80 > maxX) maxX = x + NODE_WIDTH + 80;
          if (y + NODE_HEIGHT + 80 > maxY) maxY = y + NODE_HEIGHT + 80;
        });
      });
    }

    // Sort positions top-to-bottom (and left-to-right) to give a natural staggering waterfall entrance
    const sortedByFlow = [...rawPositions].sort((a, b) => {
      if (Math.abs(a.y - b.y) > 20) return a.y - b.y;
      return a.x - b.x;
    });

    const animIndexMap = new Map<string, number>();
    sortedByFlow.forEach((item, idx) => animIndexMap.set(item.stage.id, idx));

    const positions: NodePosition[] = rawPositions.map(p => ({
      ...p,
      animIndex: animIndexMap.get(p.stage.id) ?? 0
    }));

    // Build DAG Edges with source and destination positions
    const posMap = new Map<string, NodePosition>();
    positions.forEach(p => posMap.set(p.stage.id, p));

    const edgeList: {
      id: string;
      fromStage: RoadmapStage;
      toStage: RoadmapStage;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isDottedActive: boolean;
    }[] = [];

    positions.forEach(childPos => {
      const child = childPos.stage;
      (child.prerequisiteStageIds || []).forEach(parentId => {
        const parentPos = posMap.get(parentId);
        if (parentPos) {
          const x1 = parentPos.x + parentPos.width / 2;
          const y1 = parentPos.y + parentPos.height;
          const x2 = childPos.x + childPos.width / 2;
          const y2 = childPos.y;

          // Highlighted active path matching the NeetCode reference
          const isNeetCodeActiveEdge = 
            (parentId === 'st-r-arrays' && child.id === 'st-r-twopointers') ||
            (parentId === 'st-r-twopointers' && (child.id === 'st-r-binarysearch' || child.id === 'st-r-slidingwindow')) ||
            ((parentId === 'st-r-binarysearch' || parentId === 'st-r-slidingwindow') && child.id === 'st-r-trees') ||
            (parentId === 'st-r-trees' && child.id === 'st-r-heap');

          const isFlowActive = (parentPos.stage.status === 'completed' && (child.status === 'in_progress' || child.status === 'available' || child.status === 'completed'));
          const isDottedActive = isNeetCodeActiveEdge || isFlowActive;

          edgeList.push({
            id: `${parentId}->${child.id}`,
            fromStage: parentPos.stage,
            toStage: child,
            x1,
            y1,
            x2,
            y2,
            isDottedActive
          });
        }
      });
    });

    return {
      nodePositions: positions,
      edges: edgeList,
      canvasWidth: Math.max(900, maxX),
      canvasHeight: Math.max(820, maxY)
    };
  }, [roadmap]);

  // Cubic Bezier curve generator
  const createBezierPath = (x1: number, y1: number, x2: number, y2: number) => {
    const deltaY = y2 - y1;
    const cy1 = y1 + deltaY * 0.5;
    const cy2 = y2 - deltaY * 0.5;
    return `M ${x1} ${y1} C ${x1} ${cy1}, ${x2} ${cy2}, ${x2} ${y2}`;
  };

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(1.4, Math.max(0.65, prev + delta)));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  // Filter and search matching logic
  const filteredStageIds = useMemo(() => {
    return new Set(
      roadmap.stages
        .filter(st => {
          // Status filter
          if (statusFilter !== 'all' && st.status !== statusFilter) return false;
          // Search query
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            const nameMatch = st.name.toLowerCase().includes(q);
            const taskMatch = st.tasks.some(t => t.title.toLowerCase().includes(q));
            return nameMatch || taskMatch;
          }
          return true;
        })
        .map(s => s.id)
    );
  }, [roadmap.stages, statusFilter, searchQuery]);

  // Quick summary counts
  const stageCounts = useMemo(() => {
    let completed = 0;
    let inProgress = 0;
    let available = 0;
    let locked = 0;

    roadmap.stages.forEach(s => {
      if (s.status === 'completed') completed++;
      else if (s.status === 'in_progress') inProgress++;
      else if (s.status === 'locked') locked++;
      else available++;
    });

    return { completed, inProgress, available, locked, total: roadmap.stages.length };
  }, [roadmap.stages]);

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-[#0f1118] ${className}`}>
      
      {/* TOP CONTROLS BAR: Clean, Easy to Use & Filter */}
      <div className="p-3 sm:px-4 sm:py-3 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 z-20 relative">
        
        {/* Left: Quick Status Filter Pills for Easy Navigation */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              statusFilter === 'all'
                ? 'bg-slate-700 text-white font-semibold shadow-xs'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            All ({stageCounts.total})
          </button>

          <button
            onClick={() => setStatusFilter('in_progress')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'in_progress'
                ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                : 'text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-3 h-3 fill-current" />
            <span>In Progress ({stageCounts.inProgress})</span>
          </button>

          <button
            onClick={() => setStatusFilter('available')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'available'
                ? 'bg-slate-600 text-white font-semibold shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Unlock className="w-3 h-3" />
            <span>Available ({stageCounts.available})</span>
          </button>

          <button
            onClick={() => setStatusFilter('completed')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'completed'
                ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                : 'text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Completed ({stageCounts.completed})</span>
          </button>

          <button
            onClick={() => setStatusFilter('locked')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
              statusFilter === 'locked'
                ? 'bg-slate-700 text-slate-200 font-semibold shadow-xs'
                : 'text-slate-500 hover:text-slate-400 hover:bg-slate-800/60'
            }`}
          >
            <Lock className="w-3 h-3" />
            <span>Locked ({stageCounts.locked})</span>
          </button>
        </div>

        {/* Right: Quick Search & Zoom Controls */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Quick Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Find topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-7 py-1 text-xs rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-32 sm:w-44 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => handleZoom(0.1)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleZoom(-0.1)}
              className="p-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-1.5 py-0.5 rounded-lg hover:bg-slate-800 text-[11px] font-mono text-slate-400 hover:text-white transition-colors"
              title="Reset Zoom"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
          </div>
        </div>
      </div>

      {/* FLOATING STATUS LEGEND (Bottom-left) */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center gap-3 bg-slate-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 shadow-xl text-[11px] text-slate-300 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 ring-2 ring-indigo-500/40" />
          <span>In Progress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-slate-700 border border-slate-600 border-dashed" />
          <span>Locked</span>
        </div>
        <div className="h-3 w-px bg-slate-800" />
        <div className="flex items-center gap-1 text-indigo-300 font-mono text-[10px]">
          <span className="w-3.5 h-0.5 border-t border-dashed border-indigo-400" />
          <span>Active Path</span>
        </div>
      </div>

      {/* DOTTED GRID VIEWPORT CONTAINER */}
      <div
        ref={containerRef}
        className="overflow-auto max-h-[750px] w-full cursor-grab active:cursor-grabbing p-6 select-none"
        style={{
          backgroundColor: '#0f1118',
          backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.15) 1.25px, transparent 1.25px)',
          backgroundSize: '24px 24px'
        }}
      >
        <div
          className="relative transition-transform duration-200 origin-top-center mx-auto"
          style={{
            width: canvasWidth,
            height: canvasHeight,
            transform: `scale(${zoomLevel})`
          }}
        >
          {/* SVG Connections Layer with subtle entrance fade */}
          <motion.svg
            key={`svg-${roadmap.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
            width={canvasWidth}
            height={canvasHeight}
          >
            <defs>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {edges.map(edge => {
              const pathD = createBezierPath(edge.x1, edge.y1, edge.x2, edge.y2);
              const isHovered = hoveredStageId === edge.fromStage.id || hoveredStageId === edge.toStage.id;
              const matchesFilter = filteredStageIds.has(edge.fromStage.id) && filteredStageIds.has(edge.toStage.id);

              return (
                <g key={edge.id}>
                  {/* Background shadow stroke for crisp contrast against grid */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#090a0f"
                    strokeWidth={edge.isDottedActive ? 5 : 4}
                    strokeLinecap="round"
                    opacity={matchesFilter ? 1 : 0.25}
                  />

                  {/* Main connection curve */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke={
                      isHovered
                        ? '#38bdf8'
                        : edge.isDottedActive
                        ? '#818cf8'
                        : '#475569'
                    }
                    strokeWidth={isHovered ? 3 : edge.isDottedActive ? 2.5 : 2}
                    strokeDasharray={edge.isDottedActive ? '5 5' : 'none'}
                    strokeLinecap="round"
                    filter={edge.isDottedActive || isHovered ? 'url(#glow)' : undefined}
                    opacity={matchesFilter ? (edge.isDottedActive || isHovered ? 1 : 0.8) : 0.15}
                  />
                </g>
              );
            })}
          </motion.svg>

          {/* Interactive Stage Nodes with Framer Motion Staggered Entrance Animations */}
          <div key={`nodes-${roadmap.id}`} className="absolute inset-0 pointer-events-none">
            {nodePositions.map(pos => {
              const { stage, animIndex } = pos;
              const total = stage.tasks.length;
              const completed = stage.tasks.filter(t => t.status === 'Completed').length;
              const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

              const isCompleted = stage.status === 'completed';
              const isInProgress = stage.status === 'in_progress' || stage.id === activeStageId;
              const isLocked = stage.status === 'locked';
              const isAvailable = stage.status === 'available';

              const isHovered = hoveredStageId === stage.id;
              const matchesFilter = filteredStageIds.has(stage.id);

              // Subtle Framer Motion staggered entrance configuration
              return (
                <motion.div
                  key={stage.id}
                  initial={{ opacity: 0, scale: 0.9, y: 14 }}
                  animate={{ 
                    opacity: matchesFilter ? 1 : 0.28, 
                    scale: matchesFilter ? 1 : 0.95, 
                    y: 0 
                  }}
                  transition={{
                    duration: 0.38,
                    delay: animIndex * 0.032,
                    ease: [0.16, 1, 0.3, 1] // modern cubic bezier spring-like curve
                  }}
                  whileHover={matchesFilter ? { 
                    scale: 1.05, 
                    y: -3, 
                    transition: { duration: 0.15, ease: 'easeOut' } 
                  } : undefined}
                  whileTap={matchesFilter ? { scale: 0.98 } : undefined}
                  onClick={() => onSelectStage(stage)}
                  onMouseEnter={() => setHoveredStageId(stage.id)}
                  onMouseLeave={() => setHoveredStageId(null)}
                  style={{
                    position: 'absolute',
                    left: `${pos.x}px`,
                    top: `${pos.y}px`,
                    width: `${pos.width}px`,
                    height: `${pos.height}px`
                  }}
                  className={`pointer-events-auto group cursor-pointer select-none rounded-xl transition-colors duration-150 z-10 flex flex-col justify-center px-3 py-1.5 ${
                    isCompleted
                      ? 'bg-[#222538] hover:bg-[#282c44] border border-emerald-500/60 shadow-md shadow-emerald-500/10'
                      : isInProgress
                      ? 'bg-[#272b44] hover:bg-[#2f3554] border-2 border-indigo-400 shadow-xl shadow-indigo-500/25 ring-2 ring-indigo-500/25'
                      : isLocked
                      ? 'bg-[#181926] border border-slate-700/60 border-dashed hover:border-slate-500'
                      : 'bg-[#222538] hover:bg-[#2a2e46] border border-slate-600/70 hover:border-slate-400'
                  } ${isHovered ? 'shadow-2xl' : ''}`}
                >
                  {/* Node Title & State Icon */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className={`text-xs font-bold truncate leading-tight tracking-wide ${
                      isCompleted 
                        ? 'text-white' 
                        : isInProgress 
                        ? 'text-white' 
                        : isLocked 
                        ? 'text-slate-400' 
                        : 'text-slate-200'
                    }`}>
                      {stage.name.replace(/^\d+\.\s*/, '')}
                    </span>

                    {/* Icon indicator with subtle state semantics */}
                    <div className="flex items-center gap-1 shrink-0">
                      {stage.resources && stage.resources.length > 0 && (
                        <span title={`${stage.resources.length} reference links`} className="text-indigo-400">
                          <Link2 className="w-2.5 h-2.5" />
                        </span>
                      )}
                      <span>
                        {isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 stroke-[2.5]" />
                        ) : isInProgress ? (
                          <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400 animate-pulse" />
                        ) : isLocked ? (
                          <Lock className="w-3 h-3 text-slate-500" />
                        ) : (
                          <Unlock className="w-3 h-3 text-slate-400" />
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Progress Underline & Task Count (NeetCode Style) */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-1 bg-slate-700/70 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isCompleted
                            ? 'bg-white'
                            : isInProgress
                            ? 'bg-gradient-to-r from-indigo-400 to-white'
                            : 'bg-slate-500'
                        }`}
                        style={{ width: `${isCompleted ? 100 : progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {completed}/{total}
                    </span>
                  </div>

                  {/* Tooltip on hover */}
                  <AnimatePresence>
                    {isHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 2 }}
                        transition={{ duration: 0.12 }}
                        className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 text-white text-[10px] font-mono px-2.5 py-0.5 rounded-lg whitespace-nowrap shadow-2xl pointer-events-none z-30 flex items-center gap-1.5"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          isCompleted ? 'bg-emerald-400' : isInProgress ? 'bg-amber-400' : isLocked ? 'bg-slate-500' : 'bg-indigo-400'
                        }`} />
                        <span>
                          {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : isLocked ? 'Locked' : 'Available'} • {completed}/{total} tasks ({progress}%)
                          {stage.resources && stage.resources.length > 0 ? ` • ${stage.resources.length} links` : ''}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

