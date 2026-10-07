/**
 * Application Top Toolbar and Navigation
 * University of Galway - School of Computer Science
 * 
 * Includes:
 * 1. Desktop & Tablet Top Navbar with simulation controls and analytical shortcuts.
 * 2. Clean, compact mobile top bar.
 * 3. Comprehensive Mobile Slide-Out Drawer Menu providing quick access to all
 *    combinational benchmark circuits, truth table, oscilloscope, inside the gate,
 *    tutorials, export, simulation settings, and display preferences.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  BookOpen,
  Check,
  ChevronRight,
  FolderOpen,
  Grid,
  Menu,
  Moon,
  MoreVertical,
  Pause,
  Play,
  RotateCcw,
  Share2,
  SkipForward,
  Sparkles,
  Sun,
  Table,
  Volume2,
  VolumeX,
  X,
  Zap,
} from 'lucide-react';
import { SimulationState } from '../../types/circuit';
import { GalwayLogo } from '../common/GalwayLogo';
import {
  COMBINATIONAL_CIRCUITS,
  CombinationalCircuitBenchmark,
} from '../../data/combinationalCircuits';

interface TopNavbarProps {
  projectName: string;
  onChangeProjectName: (name: string) => void;
  simState: SimulationState;
  onToggleRun: () => void;
  onSingleStep: () => void;
  onChangeFrequency: (hz: number) => void;
  onOpenInsideGate: () => void;
  onOpenTruthTable: () => void;
  onOpenTimingDiagram: () => void;
  onOpenTutorials: () => void;
  onOpenProjects: () => void;
  onOpenExport: () => void;
  snapToGrid: boolean;
  onToggleGrid: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onTogglePalette: () => void;
  isPaletteOpen?: boolean;
  isMobile: boolean;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  autoPulldown: boolean;
  onToggleAutoPulldown: () => void;
  activeBenchmarkId?: string | null;
  onSelectBenchmark?: (benchmark: CombinationalCircuitBenchmark) => void;
  onSelectPlayground?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  projectName,
  onChangeProjectName,
  simState,
  onToggleRun,
  onSingleStep,
  onChangeFrequency,
  onOpenInsideGate,
  onOpenTruthTable,
  onOpenTimingDiagram,
  onOpenTutorials,
  onOpenProjects,
  onOpenExport,
  snapToGrid,
  onToggleGrid,
  isMuted,
  onToggleMute,
  onTogglePalette,
  isPaletteOpen = true,
  theme,
  onToggleTheme,
  autoPulldown,
  onToggleAutoPulldown,
  activeBenchmarkId,
  onSelectBenchmark,
  onSelectPlayground,
}) => {
  // Mobile slide-out drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Tablet/Desktop "More" menu state
  const [isTabletMoreOpen, setIsTabletMoreOpen] = useState(false);
  const tabletMoreRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  // Close tablet more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tabletMoreRef.current && !tabletMoreRef.current.contains(e.target as Node)) {
        setIsTabletMoreOpen(false);
      }
    };
    if (isTabletMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTabletMoreOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileDrawerOpen]);

  // Handle escape key to close drawers/menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
        setIsTabletMoreOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeBenchmark = COMBINATIONAL_CIRCUITS.find((c) => c.id === activeBenchmarkId) || null;

  // Shared Sample Circuit dropdown selector
  const sampleCircuitSelect = (
    <select
      value={activeBenchmarkId || ''}
      onChange={(e) => {
        const bId = e.target.value;
        if (bId === 'playground') {
          if (onSelectPlayground) onSelectPlayground();
        } else if (bId && onSelectBenchmark) {
          const b = COMBINATIONAL_CIRCUITS.find((c) => c.id === bId);
          if (b) onSelectBenchmark(b);
        }
      }}
      className={`text-[11px] sm:text-xs font-semibold px-1.5 sm:px-2 py-1 rounded-lg outline-none cursor-pointer border transition-colors w-full max-w-[85px] sm:max-w-[95px] md:max-w-[100px] lg:max-w-[115px] xl:max-w-[130px] truncate ${
        activeBenchmarkId === 'playground'
          ? 'bg-[#840038] text-white border-rose-900 focus:ring-1 focus:ring-rose-400'
          : isLight
          ? 'bg-white text-slate-800 border-slate-300 hover:border-slate-400 focus:border-[#840038]'
          : 'bg-slate-900 text-slate-100 border-slate-700 hover:border-slate-600 focus:border-rose-400'
      }`}
      title="Sample Circuits & Student Playground (Select to load or design freely)"
    >
      <option value="" disabled>
        ⚡ Circuit...
      </option>
      <option
        value="playground"
        className={isLight ? 'text-[#840038] font-bold bg-rose-50' : 'text-rose-300 font-bold bg-slate-900'}
      >
        🎨 Playground (Blank)
      </option>
      <optgroup label="Basic & Universal Logic Gates" className="font-bold text-slate-400">
        {COMBINATIONAL_CIRCUITS.filter(
          (c) => c.category === 'Simple Gates' || c.category === 'Universal Gates'
        ).map((item) => (
          <option
            key={item.id}
            value={item.id}
            className={isLight ? 'text-slate-800 bg-white' : 'text-slate-100 bg-slate-900'}
          >
            {item.name} ({item.primaryEquation})
          </option>
        ))}
      </optgroup>
      <optgroup label="Multiplexers (2:1, 4:1, 8:1, 16:1 & Internal)" className="font-bold text-slate-400">
        {COMBINATIONAL_CIRCUITS.filter(
          (c) => c.category === 'Multiplexers' || c.category === 'Data Routing'
        ).map((item) => (
          <option
            key={item.id}
            value={item.id}
            className={isLight ? 'text-slate-800 bg-white' : 'text-slate-100 bg-slate-900'}
          >
            {item.name} ({item.primaryEquation})
          </option>
        ))}
      </optgroup>
      <optgroup label="Decoders (2:4, 3:8, 4:16)" className="font-bold text-slate-400">
        {COMBINATIONAL_CIRCUITS.filter((c) => c.category === 'Decoders').map((item) => (
          <option
            key={item.id}
            value={item.id}
            className={isLight ? 'text-slate-800 bg-white' : 'text-slate-100 bg-slate-900'}
          >
            {item.name} ({item.primaryEquation})
          </option>
        ))}
      </optgroup>
      <optgroup label="Sequential Latches & Flip-Flops" className="font-bold text-slate-400">
        {COMBINATIONAL_CIRCUITS.filter((c) => c.category === 'Sequential & Latches').map((item) => (
          <option
            key={item.id}
            value={item.id}
            className={isLight ? 'text-slate-800 bg-white' : 'text-slate-100 bg-slate-900'}
          >
            {item.name} ({item.primaryEquation})
          </option>
        ))}
      </optgroup>
      <optgroup label="Counters & BCD Displays" className="font-bold text-slate-400">
        {COMBINATIONAL_CIRCUITS.filter((c) => c.category === 'Counters & Displays').map((item) => (
          <option
            key={item.id}
            value={item.id}
            className={isLight ? 'text-slate-800 bg-white' : 'text-slate-100 bg-slate-900'}
          >
            {item.name} ({item.primaryEquation})
          </option>
        ))}
      </optgroup>
      <optgroup label="Arithmetic Adders" className="font-bold text-slate-400">
        {COMBINATIONAL_CIRCUITS.filter((c) => c.category === 'Arithmetic').map((item) => (
          <option
            key={item.id}
            value={item.id}
            className={isLight ? 'text-slate-800 bg-white' : 'text-slate-100 bg-slate-900'}
          >
            {item.name} ({item.primaryEquation})
          </option>
        ))}
      </optgroup>
    </select>
  );

  return (
    <header
      className={`relative shrink-0 z-30 select-none border-b border-t-2 border-t-[#840038] transition-colors duration-150 ${
        isLight
          ? 'bg-white border-b-slate-200 text-slate-800 shadow-xs'
          : 'bg-slate-900 border-b-slate-800 text-slate-100'
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. MOBILE COMPACT HEADER (< 768px: Samsung Galaxy, iPhones, small screens) */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center justify-between h-14 px-2.5 sm:px-3 gap-1.5 w-full">
        {/* Left: Component Palette Drawer Toggle & Logo */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={onTogglePalette}
            className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
              isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
            title="Open Component Library Side Tab (Gates, Inputs, Outputs)"
          >
            <Menu className="w-4 h-4" />
          </button>

          {/* Crest icon on mobile (< sm) to prevent crowding; compact with title on sm: */}
          <div className="block sm:hidden">
            <GalwayLogo variant="icon" theme={theme} size="sm" />
          </div>
          <div className="hidden sm:block">
            <GalwayLogo variant="compact" theme={theme} size="sm" />
          </div>
        </div>

        {/* Center: Play / Pause Quick Simulator Pill */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer ${
              simState.running
                ? 'bg-emerald-600 text-white'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={simState.running ? 'Pause Simulator' : 'Run Simulator Clock'}
          >
            {simState.running ? (
              <>
                <Pause className="w-3 h-3 fill-current" />
                <span className="text-[11px]">Running</span>
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-current" />
                <span className="text-[11px]">Run</span>
              </>
            )}
          </button>

          {/* Single Step Pulse */}
          <button
            onClick={onSingleStep}
            className={`p-1 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                : 'border-slate-800 text-slate-400 hover:bg-slate-800'
            }`}
            title="Step 1 Clock Pulse"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: 1-Click Truth Table & Slide-Out Drawer Menu Trigger */}
        <div className="flex items-center gap-1.5 shrink-0 min-w-0">
          {/* Direct 1-Click Truth Table button on Mobile - sized & styled with generous room so it NEVER cuts off */}
          <button
            onClick={onOpenTruthTable}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-transform active:scale-95 cursor-pointer shrink-0"
            title="Generate Truth Table & Mathematical Boolean Equations"
          >
            <Table className="w-3.5 h-3.5 shrink-0" />
            <span className="text-[11px] font-bold">Table</span>
          </button>

          {/* Mobile Drawer Menu Toggle (Hamburger / App Actions) */}
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className={`flex items-center gap-1 p-2 rounded-xl border transition-all cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-white'
            }`}
            title="Open Mobile Navigation & Action Menu Drawer"
            aria-label="Open Navigation Menu"
          >
            <MoreVertical className="w-4 h-4 text-[#840038] dark:text-rose-400" />
          </button>
        </div>
      </div>

      {/* Mobile Sub-strip: Instant Access to Sample Circuits & Analysis Tools (< 768px) */}
      <div
        className={`flex md:hidden items-center justify-between px-2.5 py-1.5 border-t text-xs gap-1.5 transition-colors ${
          isLight
            ? 'bg-slate-50/95 border-slate-200 text-slate-800'
            : 'bg-slate-950/95 border-slate-800 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#840038] dark:text-rose-400 shrink-0">
            Sample:
          </span>
          <div className="flex-1 min-w-0 max-w-[190px]">
            {sampleCircuitSelect}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onOpenInsideGate}
            className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 rounded-lg cursor-pointer"
            title="Inside Gate"
          >
            <Zap className="w-3 h-3 text-emerald-400 animate-pulse" />
            <span>Gate</span>
          </button>

          <button
            onClick={onOpenTimingDiagram}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              isLight
                ? 'border-slate-200 text-slate-600 hover:bg-slate-100 bg-white'
                : 'border-slate-700 text-slate-300 hover:bg-slate-800 bg-slate-900'
            }`}
            title="Logic Timing Waveforms (Oscilloscope)"
          >
            <Activity className="w-3.5 h-3.5 text-purple-400" />
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TABLET & DESKTOP NAVIGATION BAR (>= 768px: iPad, Laptops, Desktops)    */}
      {/* ========================================================================= */}
      <div className="hidden md:flex items-center justify-between h-13 px-2 sm:px-2.5 lg:px-3 pr-4 sm:pr-5 lg:pr-6 gap-1 sm:gap-1.5 w-full max-w-full overflow-visible">
        {/* Left: Brand Logo & Project Name (Squeezed for optimal screen fit) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
          {/* Palette toggle button: Squeezed Side Tab button */}
          <button
            onClick={onTogglePalette}
            className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg border transition-all cursor-pointer shrink-0 ${
              isPaletteOpen
                ? 'bg-[#840038]/15 border-[#840038]/40 text-[#840038] dark:text-rose-300 shadow-xs'
                : isLight
                ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title={isPaletteOpen ? 'Hide Component Library Side Tab' : 'Show Component Library Side Tab'}
          >
            <Menu className="w-3.5 h-3.5 shrink-0" />
            <span className="text-xs font-semibold hidden xl:inline">Side Tab</span>
            <span className="text-xs font-semibold xl:hidden">Side</span>
          </button>

          {/* Official University of Galway Brand Logo: Squeezed compact badge to save space */}
          <div className="flex items-center shrink-0">
            <div className="block min-[1800px]:hidden">
              <GalwayLogo variant="compact" theme={theme} size="sm" />
            </div>
            <div className="hidden min-[1800px]:block">
              <GalwayLogo variant="landscape" theme={theme} size="sm" />
            </div>
          </div>

          {/* Project Name editable */}
          <input
            type="text"
            value={projectName}
            onChange={(e) => onChangeProjectName(e.target.value)}
            className={`text-xs font-medium px-1.5 py-0.5 rounded-lg border outline-none max-w-[50px] md:max-w-[65px] lg:max-w-[80px] xl:max-w-[95px] truncate transition-colors ${
              isLight
                ? 'text-slate-700 bg-transparent hover:bg-slate-100 focus:bg-white focus:text-slate-900 border-transparent focus:border-[#840038]/40'
                : 'text-slate-300 bg-transparent hover:bg-slate-800/60 focus:bg-slate-950 focus:text-white border-transparent focus:border-[#840038]/60'
            }`}
            title="Click to rename circuit"
          />
        </div>

        {/* Center: Simulation Controls & Sample Circuits ("Running Tab") */}
        <div
          className={`flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 rounded-xl shadow-inner border shrink min-w-0 ${
            isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          {/* Play / Pause Toggle */}
          <button
            onClick={onToggleRun}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              simState.running
                ? 'bg-emerald-600 text-white shadow-md'
                : isLight
                ? 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border border-slate-200 shadow-xs'
                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={simState.running ? 'Pause Simulator' : 'Run Simulator Clock'}
          >
            {simState.running ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span className="hidden sm:inline">Running</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run</span>
              </>
            )}
          </button>

          {/* Single Step Pulse */}
          <button
            onClick={onSingleStep}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/70'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Single Step Clock Pulse"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Clock Frequency Selector */}
          <select
            value={simState.frequencyHz}
            onChange={(e) => onChangeFrequency(Number(e.target.value))}
            className={`bg-transparent text-xs font-mono px-0.5 sm:px-1 py-0.5 rounded outline-none cursor-pointer ${
              isLight ? 'text-slate-700 hover:text-slate-900' : 'text-slate-300 hover:text-white'
            }`}
            title="Clock Frequency"
          >
            <option value="0.5" className="bg-slate-900 text-white">0.5Hz</option>
            <option value="1" className="bg-slate-900 text-white">1Hz</option>
            <option value="2" className="bg-slate-900 text-white">2Hz</option>
            <option value="5" className="bg-slate-900 text-white">5Hz</option>
            <option value="10" className="bg-slate-900 text-white">10Hz</option>
          </select>

          {/* Divider */}
          <div className={`h-3.5 w-[1px] ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />

          {/* Combinational Sample Circuits Dropdown in Running Tab */}
          <div className="flex items-center min-w-0">
            {sampleCircuitSelect}
          </div>
        </div>

        {/* Right: Analytical Tools & Action Buttons (Always securely bounded on PC Chrome) */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 pr-1 mr-1">
          {/* Ultra-wide shortcuts (only on >= 1800px monitors) */}
          <div className="hidden min-[1800px]:flex items-center gap-1">
            {/* Auto-Pulldown Toggle */}
            <button
              onClick={onToggleAutoPulldown}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors border cursor-pointer ${
                autoPulldown
                  ? 'bg-blue-950/70 border-blue-500/50 text-blue-300'
                  : isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-800'
                  : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
              title={
                autoPulldown
                  ? 'Auto-Pulldown ON: Unconnected pins default to 0V (GND)'
                  : 'Auto-Pulldown OFF (Strict): Unconnected pins float at high impedance (Z)'
              }
            >
              <span className={`w-2 h-2 rounded-full ${autoPulldown ? 'bg-blue-400' : 'bg-slate-400'}`} />
              <span>{autoPulldown ? 'Auto-0V' : 'Strict (Z)'}</span>
            </button>

            {/* Inside the Gate */}
            <button
              onClick={onOpenInsideGate}
              className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-emerald-400 bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 rounded-lg transition-all shadow-xs cursor-pointer"
              title="View Inside the Gate (Transistors & Voltages)"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Inside Gate</span>
            </button>
          </div>

          {/* Truth Table Generator */}
          <button
            onClick={onOpenTruthTable}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer"
            title="Generate Truth Table & Mathematical Boolean Equations"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Table</span>
          </button>

          {/* Logic Waveforms */}
          <button
            onClick={onOpenTimingDiagram}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Logic Timing Waveforms (Oscilloscope Panel)"
          >
            <Activity className="w-4 h-4" />
          </button>

          {/* Share / Export */}
          <button
            onClick={onOpenExport}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isLight
                ? 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                : 'text-blue-400 hover:text-blue-300 hover:bg-blue-950/40'
            }`}
            title="Export & Share Circuit (.json / image)"
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className={`p-1.5 rounded-lg transition-all cursor-pointer ${
              isLight
                ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                : 'text-amber-300 hover:text-white hover:bg-slate-800'
            }`}
            title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {/* Tablet & Desktop "More" dropdown toggle (Always guaranteed visible and fully on-screen) */}
          <div className="relative" ref={tabletMoreRef}>
            <button
              onClick={() => setIsTabletMoreOpen((prev) => !prev)}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isTabletMoreOpen
                  ? isLight
                    ? 'bg-slate-200 text-slate-900 border-slate-300'
                    : 'bg-slate-800 text-white border-slate-700'
                  : isLight
                  ? 'border-slate-200 text-slate-600 hover:bg-slate-100'
                  : 'border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
              title="More Circuit Options & Settings"
              aria-label="More Options Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Desktop & Tablet More Menu Popover */}
            {isTabletMoreOpen && (
              <div
                className={`absolute right-0 top-full mt-1.5 w-60 max-w-[calc(100vw-32px)] rounded-2xl border shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-800'
                    : 'bg-slate-900 border-slate-700 text-slate-100'
                }`}
              >
                <button
                  onClick={() => {
                    onOpenInsideGate();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <span>Inside the Gate (Transistors)</span>
                </button>

                <button
                  onClick={() => {
                    onOpenTutorials();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <BookOpen className="w-4 h-4 text-purple-500" />
                  <span>Tutorials & Labs</span>
                </button>

                <button
                  onClick={() => {
                    onOpenProjects();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <FolderOpen className="w-4 h-4 text-amber-500" />
                  <span>Projects & Templates</span>
                </button>

                <button
                  onClick={() => {
                    onOpenExport();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <Share2 className="w-4 h-4 text-blue-500" />
                  <span>Export & Share (.json / image)</span>
                </button>

                <button
                  onClick={() => {
                    onToggleAutoPulldown();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>Auto-Pulldown (0V)</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {autoPulldown ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToggleMute();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>Sound Audio FX</span>
                  <span className="text-[10px] text-slate-400">
                    {isMuted ? 'Muted' : 'Active'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    onToggleGrid();
                    setIsTabletMoreOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer ${
                    isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                  }`}
                >
                  <span>Grid Snapping</span>
                  <span className="text-[10px] text-slate-400">
                    {snapToGrid ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE SLIDE-OUT DRAWER MENU (Smooth slide-in panel on small screens) */}
      {/* ========================================================================= */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
            onClick={() => setIsMobileDrawerOpen(false)}
            aria-label="Close Drawer Overlay"
          />

          {/* Slide-Out Drawer Panel */}
          <aside
            className={`relative w-[86vw] max-w-[340px] h-full shadow-2xl flex flex-col z-10 overflow-hidden animate-in slide-in-from-right duration-300 border-l ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-slate-900 border-slate-800 text-slate-100'
            }`}
          >
            {/* Drawer Header */}
            <div
              className={`p-4 border-b flex items-center justify-between shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <GalwayLogo variant="compact" theme={theme} size="sm" />
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#840038] text-white">
                  Menu
                </span>
              </div>

              <button
                onClick={() => setIsMobileDrawerOpen(false)}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isLight
                    ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
                title="Close Navigation Drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Project Rename Field */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Current Circuit Name
                </label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => onChangeProjectName(e.target.value)}
                  className={`w-full text-xs font-semibold px-3 py-2 rounded-xl border outline-none transition-colors ${
                    isLight
                      ? 'bg-slate-50 text-slate-900 border-slate-300 focus:border-[#840038]'
                      : 'bg-slate-800/90 text-white border-slate-700 focus:border-[#840038]'
                  }`}
                  placeholder="Circuit Name"
                />
              </div>

              {/* Section 1: Combinational Sample Circuits & Playground */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#840038] dark:text-rose-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Canvas & Circuits
                  </span>
                  {activeBenchmarkId === 'playground' ? (
                    <span className="text-[10px] font-mono font-bold text-rose-400">
                      Playground
                    </span>
                  ) : activeBenchmark ? (
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {activeBenchmark.shortLabel}
                    </span>
                  ) : null}
                </div>

                {/* Playground Blank Canvas Option on Top */}
                <button
                  onClick={() => {
                    if (onSelectPlayground) onSelectPlayground();
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left border transition-all cursor-pointer flex items-center justify-between ${
                    activeBenchmarkId === 'playground'
                      ? 'bg-[#840038] border-[#840038] text-white shadow-xs'
                      : isLight
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-900'
                      : 'bg-rose-950/40 hover:bg-rose-900/60 border-rose-800/60 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎨</span>
                    <div>
                      <div className="font-bold text-xs">Playground (Blank Canvas)</div>
                      <div className="text-[10px] opacity-80 font-mono">Build any circuit & export/share JSON</div>
                    </div>
                  </div>
                  {activeBenchmarkId === 'playground' && <Check className="w-3.5 h-3.5 text-white" />}
                </button>

                <div className="grid grid-cols-2 gap-1.5 max-h-64 overflow-y-auto pr-1">
                  {COMBINATIONAL_CIRCUITS.map((item) => {
                    const isSelected = activeBenchmarkId === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          if (onSelectBenchmark) onSelectBenchmark(item);
                          setIsMobileDrawerOpen(false);
                        }}
                        className={`p-2 rounded-xl text-left border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#840038] border-[#840038] text-white shadow-xs'
                            : isLight
                            ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                            : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/60 text-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="font-bold text-xs">{item.shortLabel}</span>
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                        </div>
                        <span
                          className={`font-mono text-[10px] mt-1 ${
                            isSelected
                              ? 'text-rose-100'
                              : isLight
                              ? 'text-slate-500'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.primaryEquation.replace(/^Y\s*=\s*/, '')}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Analytical & Testing Tools */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Analysis & Instruments
                </span>

                <div className="space-y-1.5">
                  {/* Truth Table */}
                  <button
                    onClick={() => {
                      onOpenTruthTable();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-blue-50/70 hover:bg-blue-100/70 border-blue-200 text-blue-950'
                        : 'bg-blue-950/40 hover:bg-blue-950/70 border-blue-800/60 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-blue-600 text-white">
                        <Table className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs">Truth Table & Equations</div>
                        <div className="text-[10px] text-slate-400">
                          Derive formulas, SOP & truth tables
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                  </button>

                  {/* Inside the Gate */}
                  <button
                    onClick={() => {
                      onOpenInsideGate();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-emerald-50/70 hover:bg-emerald-100/70 border-emerald-200 text-emerald-950'
                        : 'bg-emerald-950/40 hover:bg-emerald-950/70 border-emerald-800/60 text-emerald-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-600 text-white">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs">Inside the Gate</div>
                        <div className="text-[10px] text-slate-400">
                          CMOS transistors, voltages & currents
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-emerald-400" />
                  </button>

                  {/* Logic Waveforms */}
                  <button
                    onClick={() => {
                      onOpenTimingDiagram();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-colors cursor-pointer ${
                      isLight
                        ? 'bg-purple-50/70 hover:bg-purple-100/70 border-purple-200 text-purple-950'
                        : 'bg-purple-950/40 hover:bg-purple-950/70 border-purple-800/60 text-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-600 text-white">
                        <Activity className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xs">Oscilloscope Waveforms</div>
                        <div className="text-[10px] text-slate-400">
                          Multi-channel digital timing analyzer
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </button>
                </div>
              </div>

              {/* Section 3: Learning & Library */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Library & Assignments
                </span>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      onOpenTutorials();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <BookOpen className="w-4 h-4 text-indigo-500" />
                      <span>Guided Interactive Tutorials</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onOpenProjects();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-4 h-4 text-amber-500" />
                      <span>Templates & Saved Circuits</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  <button
                    onClick={() => {
                      onOpenExport();
                      setIsMobileDrawerOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                      isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-slate-800 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Share2 className="w-4 h-4 text-blue-500" />
                      <span>Export & Share (.json / image)</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Section 4: Simulation & Settings */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Simulation & Controls
                </span>

                <div className="space-y-1.5">
                  {/* Clock Frequency */}
                  <div
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <span>Clock Speed</span>
                    <select
                      value={simState.frequencyHz}
                      onChange={(e) => onChangeFrequency(Number(e.target.value))}
                      className={`font-mono text-xs font-bold px-2 py-1 rounded outline-none border cursor-pointer ${
                        isLight
                          ? 'bg-white text-slate-800 border-slate-300'
                          : 'bg-slate-900 text-slate-100 border-slate-700'
                      }`}
                    >
                      <option value="0.5">0.5 Hz (Slow)</option>
                      <option value="1">1.0 Hz (Normal)</option>
                      <option value="2">2.0 Hz</option>
                      <option value="5">5.0 Hz</option>
                      <option value="10">10.0 Hz (Fast)</option>
                    </select>
                  </div>

                  {/* Auto-Pulldown */}
                  <button
                    onClick={onToggleAutoPulldown}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${autoPulldown ? 'bg-blue-500' : 'bg-slate-400'}`} />
                      <span>Auto-Pulldown (0V default)</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-400">
                      {autoPulldown ? 'Active' : 'Strict (Z)'}
                    </span>
                  </button>

                  {/* Audio Sound Feedback */}
                  <button
                    onClick={onToggleMute}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
                      <span>Audio Feedback</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {isMuted ? 'Muted' : 'Sound On'}
                    </span>
                  </button>

                  {/* Grid Snap Toggle */}
                  <button
                    onClick={onToggleGrid}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Grid className="w-4 h-4 text-blue-500" />
                      <span>Canvas Grid Snap</span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {snapToGrid ? 'Snap On' : 'Freeform'}
                    </span>
                  </button>

                  {/* Theme Toggle */}
                  <button
                    onClick={onToggleTheme}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/50 border-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isLight ? <Moon className="w-4 h-4 text-amber-500" /> : <Sun className="w-4 h-4 text-amber-400" />}
                      <span>Appearance Theme</span>
                    </div>
                    <span className="text-[11px] text-slate-400 capitalize">
                      {theme} Mode
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div
              className={`p-3 border-t text-center text-[10px] text-slate-400 shrink-0 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}
            >
              <span className="font-semibold">University of Galway</span> • School of Computer Science
            </div>
          </aside>
        </div>
      )}
    </header>
  );
};
