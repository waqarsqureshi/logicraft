/**
 * Interactive Circuit Canvas with Touch, Gestures, Zoom, Pan, and Wire Routing
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CircuitComponent,
  CircuitProject,
  GateType,
  LogicValue,
  Pin,
  Wire,
} from '../../types/circuit';
import { COMPONENT_DEFINITIONS, createComponentPins } from '../../engine/definitions';
import { GateSymbols } from './GateSymbols';
import { getPinAbsolutePosition, WireRenderer } from './WireRenderer';
import { TransistorSchematic } from '../transistor/TransistorSchematic';
import {
  evaluateTransistorCircuit,
  TRANSISTOR_MODELS,
} from '../../data/transistorModels';
import {
  ChevronDown,
  ChevronUp,
  Copy,
  Edit2,
  Info,
  Maximize2,
  Minimize2,
  RotateCw,
  Trash2,
  Zap,
} from 'lucide-react';

interface CircuitCanvasProps {
  project: CircuitProject;
  onChangeProject: (project: CircuitProject) => void;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  selectedWireId: string | null;
  onSelectWire: (id: string | null) => void;
  onOpenInsideGate: (gateType: 'AND' | 'NOT' | 'NAND' | 'OR' | 'NOR', component?: CircuitComponent) => void;
  showAnimations: boolean;
  snapToGrid: boolean;
  gridSize?: number;
  isSimRunning?: boolean;
  onComponentHover?: (comp: CircuitComponent | null) => void;
  theme?: 'dark' | 'light';
}

interface DraftWire {
  fromComponentId: string;
  fromPinId: string;
  fromPinType: 'input' | 'output';
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export const CircuitCanvas: React.FC<CircuitCanvasProps> = ({
  project,
  onChangeProject,
  selectedComponentId,
  onSelectComponent,
  selectedWireId,
  onSelectWire,
  onOpenInsideGate,
  showAnimations,
  snapToGrid,
  gridSize = 20,
  isSimRunning = false,
  theme = 'dark',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Viewport Pan & Zoom
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 40, y: 40 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging components
  const [draggingCompId, setDraggingCompId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Wire drawing
  const [draftWire, setDraftWire] = useState<DraftWire | null>(null);
  const [hoveredPinId, setHoveredPinId] = useState<string | null>(null);

  // Touch gesture support: 2-finger panning & pinch-to-zoom
  interface TouchGestureState {
    initialDistance: number;
    initialCenter: { x: number; y: number };
    initialPan: { x: number; y: number };
    initialZoom: number;
  }
  const touchGestureRef = useRef<TouchGestureState | null>(null);
  const isTwoFingerGestureRef = useRef<boolean>(false);

  // Coordinate transforms
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      if (!containerRef.current) return { x: screenX, y: screenY };
      const rect = containerRef.current.getBoundingClientRect();
      const clientX = screenX - rect.left;
      const clientY = screenY - rect.top;
      return {
        x: (clientX - pan.x) / zoom,
        y: (clientY - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // Snap coordinate helper
  const snapVal = useCallback(
    (val: number) => {
      if (!snapToGrid) return val;
      return Math.round(val / gridSize) * gridSize;
    },
    [snapToGrid, gridSize]
  );

  // Switch toggle
  const handleToggleSwitch = useCallback(
    (id: string) => {
      const updated = project.components.map((c) => {
        if (c.id === id) {
          const current = !!c.state?.toggle;
          return {
            ...c,
            state: { ...c.state, toggle: !current },
          };
        }
        return c;
      });
      onChangeProject({ ...project, components: updated });
    },
    [project, onChangeProject]
  );

  // Button press
  const handlePressButton = useCallback(
    (id: string, pressed: boolean) => {
      const updated = project.components.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            state: { ...c.state, pressed },
          };
        }
        return c;
      });
      onChangeProject({ ...project, components: updated });
    },
    [project, onChangeProject]
  );

  // Pin mouse/touch down -> start wire or connect wire (Bidirectional: Input to Output or Output to Input)
  const handlePinPointerDown = (
    e: React.PointerEvent,
    component: CircuitComponent,
    pin: Pin
  ) => {
    e.stopPropagation();

    // If we are already drawing a wire, complete connection if pins are complementary!
    if (draftWire) {
      let fromCompId = '';
      let fromPinId = '';
      let toCompId = '';
      let toPinId = '';

      if (draftWire.fromPinType === 'output' && pin.type === 'input') {
        fromCompId = draftWire.fromComponentId;
        fromPinId = draftWire.fromPinId;
        toCompId = component.id;
        toPinId = pin.id;
      } else if (draftWire.fromPinType === 'input' && pin.type === 'output') {
        fromCompId = component.id;
        fromPinId = pin.id;
        toCompId = draftWire.fromComponentId;
        toPinId = draftWire.fromPinId;
      }

      if (fromCompId && toCompId) {
        // Create new wire
        const newWire: Wire = {
          id: `w_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          fromComponentId: fromCompId,
          fromPinId: fromPinId,
          toComponentId: toCompId,
          toPinId: toPinId,
          value: 0,
          voltage: 0,
        };

        // Remove any existing wire connected to this specific input pin
        const filteredWires = project.wires.filter((w) => w.toPinId !== toPinId);
        onChangeProject({
          ...project,
          wires: [...filteredWires, newWire],
        });
      }

      setDraftWire(null);
      return;
    }

    // Start wire draft from ANY pin (output OR input)
    const pinPos = getPinAbsolutePosition(component, pin.id);
    if (pinPos) {
      setDraftWire({
        fromComponentId: component.id,
        fromPinId: pin.id,
        fromPinType: pin.type,
        startX: pinPos.x,
        startY: pinPos.y,
        currentX: pinPos.x,
        currentY: pinPos.y,
      });
    }
  };

  // Helper to tie an unconnected pin to Ground (0V) with 1 click
  const handleTiePinToGnd = (compId: string, pinId: string) => {
    const targetComp = project.components.find((c) => c.id === compId);
    if (!targetComp) return;

    let constLowComp = project.components.find((c) => c.type === 'CONST_LOW');
    const updatedComponents = [...project.components];

    if (!constLowComp) {
      const newLowId = `c_${Date.now()}_gnd`;
      const def = COMPONENT_DEFINITIONS['CONST_LOW'];
      const { inputs, outputs } = createComponentPins('CONST_LOW', def.width, def.height, newLowId);
      constLowComp = {
        id: newLowId,
        type: 'CONST_LOW',
        label: 'GND (0V)',
        x: targetComp.x - 30,
        y: targetComp.y + (targetComp.inputs.length > 2 ? 80 : 60),
        rotation: 0,
        inputs,
        outputs,
      };
      updatedComponents.push(constLowComp);
    }

    const outputPin = constLowComp.outputs[0];
    if (!outputPin) return;

    const newWire: Wire = {
      id: `w_${Date.now()}_gnd`,
      fromComponentId: constLowComp.id,
      fromPinId: outputPin.id,
      toComponentId: targetComp.id,
      toPinId: pinId,
      value: 0,
      voltage: 0,
    };

    const filteredWires = project.wires.filter((w) => w.toPinId !== pinId);
    onChangeProject({
      ...project,
      components: updatedComponents,
      wires: [...filteredWires, newWire],
    });
  };

  // Update component label
  const handleUpdateComponentLabel = (id: string, newLabel: string) => {
    const updated = project.components.map((c) =>
      c.id === id ? { ...c, label: newLabel } : c
    );
    onChangeProject({ ...project, components: updated });
  };

  // Component pointer down -> select and initiate drag
  const handleComponentPointerDown = (
    e: React.PointerEvent,
    component: CircuitComponent
  ) => {
    if (isTwoFingerGestureRef.current) return;
    e.stopPropagation();
    onSelectComponent(component.id);
    onSelectWire(null);

    const world = screenToWorld(e.clientX, e.clientY);
    setDraggingCompId(component.id);
    setDragOffset({
      x: world.x - component.x,
      y: world.y - component.y,
    });
  };

  // Canvas pointer down -> panning or deselect
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (isTwoFingerGestureRef.current) return;

    // If drawing wire, cancel wire on empty click
    if (draftWire) {
      setDraftWire(null);
      return;
    }

    onSelectComponent(null);
    onSelectWire(null);

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  // Global Pointer Move
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isTwoFingerGestureRef.current) return;

    // 1. Panning canvas
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    // 2. Dragging component
    if (draggingCompId) {
      const world = screenToWorld(e.clientX, e.clientY);
      const newX = snapVal(world.x - dragOffset.x);
      const newY = snapVal(world.y - dragOffset.y);

      const updated = project.components.map((c) => {
        if (c.id === draggingCompId) {
          return { ...c, x: Math.max(10, newX), y: Math.max(10, newY) };
        }
        return c;
      });
      onChangeProject({ ...project, components: updated });
      return;
    }

    // 3. Updating draft wire endpoint
    if (draftWire) {
      const world = screenToWorld(e.clientX, e.clientY);
      setDraftWire((prev) =>
        prev
          ? {
              ...prev,
              currentX: world.x,
              currentY: world.y,
            }
          : null
      );
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    setIsPanning(false);
    setDraggingCompId(null);
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!containerRef.current) return;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.min(2.5, Math.max(0.4, zoom * zoomFactor));

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom centered at mouse cursor
    setPan({
      x: mouseX - (mouseX - pan.x) * (newZoom / zoom),
      y: mouseY - (mouseY - pan.y) * (newZoom / zoom),
    });
    setZoom(newZoom);
  };

  // Touch Start: detect two-finger gesture initiation
  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        // Immediately halt any component dragging or single-pointer panning
        setIsPanning(false);
        setDraggingCompId(null);
        setDraftWire(null);
        isTwoFingerGestureRef.current = true;

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const dist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const center = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };

        touchGestureRef.current = {
          initialDistance: dist > 0 ? dist : 1,
          initialCenter: center,
          initialPan: { ...pan },
          initialZoom: zoom,
        };
      }
    },
    [pan, zoom]
  );

  // Touch Move: handle combined two-finger panning and pinch-to-zoom
  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();

        const t0 = e.touches[0];
        const t1 = e.touches[1];
        const currentDist = Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);
        const currentCenter = {
          x: (t0.clientX + t1.clientX) / 2,
          y: (t0.clientY + t1.clientY) / 2,
        };

        if (!touchGestureRef.current) {
          setIsPanning(false);
          setDraggingCompId(null);
          setDraftWire(null);
          isTwoFingerGestureRef.current = true;

          touchGestureRef.current = {
            initialDistance: currentDist > 0 ? currentDist : 1,
            initialCenter: currentCenter,
            initialPan: { ...pan },
            initialZoom: zoom,
          };
          return;
        }

        const { initialDistance, initialCenter, initialPan, initialZoom } = touchGestureRef.current;
        if (!containerRef.current || initialDistance <= 0) return;

        // Pinch scale factor
        const scale = currentDist / initialDistance;
        const newZoom = Math.min(3.0, Math.max(0.35, initialZoom * scale));

        const rect = containerRef.current.getBoundingClientRect();
        // Initial center relative to canvas container
        const initialLocalCenterX = initialCenter.x - rect.left;
        const initialLocalCenterY = initialCenter.y - rect.top;

        // Current center relative to canvas container
        const currentLocalCenterX = currentCenter.x - rect.left;
        const currentLocalCenterY = currentCenter.y - rect.top;

        // World anchor point under the initial center
        const worldAnchorX = (initialLocalCenterX - initialPan.x) / initialZoom;
        const worldAnchorY = (initialLocalCenterY - initialPan.y) / initialZoom;

        // New pan maintaining the world anchor directly under current center
        const newPanX = currentLocalCenterX - worldAnchorX * newZoom;
        const newPanY = currentLocalCenterY - worldAnchorY * newZoom;

        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      }
    },
    [pan, zoom]
  );

  // Touch End: release gesture
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      touchGestureRef.current = null;
      setTimeout(() => {
        isTwoFingerGestureRef.current = false;
      }, 120);
    }
  }, []);

  // Attach native non-passive touch listeners for mobile
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Rotate selected component
  const handleRotateSelected = useCallback(() => {
    if (!selectedComponentId) return;
    const updated = project.components.map((c) => {
      if (c.id === selectedComponentId) {
        const nextRot = ((c.rotation + 90) % 360) as 0 | 90 | 180 | 270;
        return { ...c, rotation: nextRot };
      }
      return c;
    });
    onChangeProject({ ...project, components: updated });
  }, [selectedComponentId, project, onChangeProject]);

  // Delete selected component or wire
  const handleDeleteSelected = useCallback(() => {
    if (selectedComponentId) {
      const remainingComps = project.components.filter((c) => c.id !== selectedComponentId);
      const remainingWires = project.wires.filter(
        (w) =>
          w.fromComponentId !== selectedComponentId &&
          w.toComponentId !== selectedComponentId
      );
      onChangeProject({
        ...project,
        components: remainingComps,
        wires: remainingWires,
      });
      onSelectComponent(null);
    } else if (selectedWireId) {
      const remainingWires = project.wires.filter((w) => w.id !== selectedWireId);
      onChangeProject({ ...project, wires: remainingWires });
      onSelectWire(null);
    }
  }, [selectedComponentId, selectedWireId, project, onChangeProject, onSelectComponent, onSelectWire]);

  // Duplicate selected component
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedComponentId) return;
    const comp = project.components.find((c) => c.id === selectedComponentId);
    if (!comp) return;

    const newId = `comp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
    const def = COMPONENT_DEFINITIONS[comp.type];
    const { inputs, outputs } = createComponentPins(comp.type, def.width, def.height, newId);

    const dupComp: CircuitComponent = {
      ...comp,
      id: newId,
      label: comp.label ? `${comp.label} (Copy)` : undefined,
      x: comp.x + 30,
      y: comp.y + 30,
      inputs,
      outputs,
    };

    onChangeProject({
      ...project,
      components: [...project.components, dupComp],
    });
    onSelectComponent(newId);
  }, [selectedComponentId, project, onChangeProject, onSelectComponent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRotateSelected();
      } else if (e.key === 'd' || e.key === 'D') {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          handleDuplicateSelected();
        }
      } else if (e.key === 'Escape') {
        setDraftWire(null);
        onSelectComponent(null);
        onSelectWire(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDeleteSelected, handleRotateSelected, handleDuplicateSelected, onSelectComponent, onSelectWire]);

  // Selected component details
  const selectedComp = project.components.find((c) => c.id === selectedComponentId);
  const hasTransistorMode =
    selectedComp &&
    ['AND', 'NOT', 'NAND', 'OR', 'NOR'].includes(selectedComp.type);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none cursor-crosshair touch-none transition-colors duration-150 ${
        theme === 'light' ? 'bg-[#f8fafc]' : 'bg-slate-950'
      }`}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      {/* Schematic Grid Background */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <pattern
            id="schematic-grid"
            width={gridSize * zoom}
            height={gridSize * zoom}
            patternUnits="userSpaceOnUse"
            x={pan.x % (gridSize * zoom)}
            y={pan.y % (gridSize * zoom)}
          >
            <circle
              cx="1"
              cy="1"
              r={1 * zoom}
              fill={theme === 'light' ? '#94a3b8' : '#334155'}
              opacity={theme === 'light' ? 0.75 : 0.6}
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#schematic-grid)" />
      </svg>

      {/* Main Schematic Circuit SVG Layer */}
      <svg className="absolute inset-0 w-full h-full overflow-visible">
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* 1. Completed Wires */}
          <WireRenderer
            wires={project.wires}
            components={project.components}
            selectedWireId={selectedWireId}
            onSelectWire={onSelectWire}
            showAnimations={showAnimations}
            isSimRunning={isSimRunning}
            theme={theme}
          />

          {/* 2. Draft Wire being drawn */}
          {draftWire && (
            <g>
              <line
                x1={draftWire.startX}
                y1={draftWire.startY}
                x2={draftWire.currentX}
                y2={draftWire.currentY}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
              />
              <circle
                cx={draftWire.currentX}
                cy={draftWire.currentY}
                r="5"
                fill="#38bdf8"
                className="animate-ping"
              />
            </g>
          )}

          {/* 3. Circuit Components */}
          {project.components.map((comp) => {
            const def = COMPONENT_DEFINITIONS[comp.type];
            const isSelected = selectedComponentId === comp.id;
            const w = def?.width || 80;
            const h = def?.height || 60;

            return (
              <g
                key={comp.id}
                transform={`translate(${comp.x}, ${comp.y}) rotate(${comp.rotation})`}
                className="cursor-move"
                onPointerDown={(e) => handleComponentPointerDown(e, comp)}
              >
                {/* Selection Highlight Box */}
                {isSelected && (
                  <rect
                    x="-6"
                    y="-6"
                    width={w + 12}
                    height={h + 12}
                    rx="10"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="1.8"
                    strokeDasharray="5 3"
                    className="animate-pulse"
                  />
                )}

                {/* Gate Graphic Symbol */}
                <GateSymbols
                  component={comp}
                  selected={isSelected}
                  onToggleSwitch={handleToggleSwitch}
                  onPressButton={handlePressButton}
                  isSimRunning={isSimRunning}
                />

                {/* Input Pins */}
                {comp.inputs.map((pin) => {
                  const isHovered = hoveredPinId === pin.id;
                  const isHigh = isSimRunning && pin.value === 1;
                  return (
                    <g
                      key={pin.id}
                      transform={`translate(${pin.relativeX}, ${pin.relativeY})`}
                      className="cursor-pointer"
                      onPointerDown={(e) => handlePinPointerDown(e, comp, pin)}
                      onPointerEnter={() => setHoveredPinId(pin.id)}
                      onPointerLeave={() => setHoveredPinId(null)}
                    >
                      {/* Generous touch target */}
                      <circle cx="0" cy="0" r="16" fill="transparent" />
                      {/* Visible terminal dot */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isHovered ? 5.5 : 4}
                        fill={isHigh ? '#22c55e' : '#0f172a'}
                        stroke={isHigh ? '#86efac' : isHovered ? '#38bdf8' : '#94a3b8'}
                        strokeWidth="2"
                        className="transition-all"
                      />
                      {/* Pin Name Label */}
                      {pin.name && (
                        <text
                          x="7"
                          y="3"
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          pointerEvents="none"
                        >
                          {pin.name}
                        </text>
                      )}
                    </g>
                  );
                })}

                {/* Output Pins */}
                {comp.outputs.map((pin) => {
                  const isHovered = hoveredPinId === pin.id;
                  const isHigh = isSimRunning && pin.value === 1;
                  return (
                    <g
                      key={pin.id}
                      transform={`translate(${pin.relativeX}, ${pin.relativeY})`}
                      className="cursor-pointer"
                      onPointerDown={(e) => handlePinPointerDown(e, comp, pin)}
                      onPointerEnter={() => setHoveredPinId(pin.id)}
                      onPointerLeave={() => setHoveredPinId(null)}
                    >
                      {/* Large touch hit radius */}
                      <circle cx="0" cy="0" r="16" fill="transparent" />
                      {/* Visible terminal pin */}
                      <circle
                        cx="0"
                        cy="0"
                        r={isHovered ? 6 : 4}
                        fill={isHigh ? '#22c55e' : '#0f172a'}
                        stroke={isHigh ? '#86efac' : isHovered ? '#38bdf8' : '#94a3b8'}
                        strokeWidth="2"
                        className="transition-all"
                      />
                      {/* Pin Name Label */}
                      {pin.name && (
                        <text
                          x="-8"
                          y="3"
                          fill="#94a3b8"
                          fontSize="9"
                          fontFamily="monospace"
                          textAnchor="end"
                          pointerEvents="none"
                        >
                          {pin.name}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Action Menu for Selected Component (Mobile + Desktop quick actions) */}
      {selectedComp && (
        <div
          className={`absolute z-20 flex items-center gap-1.5 p-1.5 backdrop-blur rounded-xl shadow-2xl animate-in fade-in zoom-in-95 border ${
            theme === 'light'
              ? 'bg-white/95 border-slate-300 text-slate-800'
              : 'bg-slate-900/95 border-slate-700 text-slate-200'
          }`}
          style={{
            left: Math.max(16, Math.min(window.innerWidth - 340, selectedComp.x * zoom + pan.x)),
            top: Math.max(70, selectedComp.y * zoom + pan.y - 50),
          }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          onPointerUp={(e) => e.stopPropagation()}
        >
          {/* Interactive Label Renamer */}
          <div className={`flex items-center gap-1 px-1.5 py-0.5 border-r ${
            theme === 'light' ? 'border-slate-200' : 'border-slate-700/60'
          }`}>
            <Edit2 className="w-3 h-3 text-blue-400 shrink-0" />
            <input
              type="text"
              value={selectedComp.label ?? ''}
              placeholder={selectedComp.type}
              onChange={(e) => handleUpdateComponentLabel(selectedComp.id, e.target.value)}
              className={`w-16 sm:w-24 text-xs font-semibold px-1 py-0.5 rounded outline-none border transition-colors ${
                theme === 'light'
                  ? 'bg-slate-100 text-slate-800 border-slate-300 focus:bg-white focus:border-blue-500'
                  : 'bg-slate-800 text-slate-200 border-slate-700 focus:bg-slate-950 focus:border-blue-500'
              }`}
              title="Click to rename this input, output, or component"
            />
            {/* Quick Rename Presets for Inputs */}
            {(selectedComp.type === 'SWITCH' || selectedComp.type === 'BUTTON' || selectedComp.type === 'CLOCK') && (
              <div className="hidden sm:flex items-center gap-0.5">
                {['A', 'B', 'C', 'CLK'].map((preset) => (
                  <button
                    key={preset}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateComponentLabel(selectedComp.id, preset);
                    }}
                    className={`px-1 py-0.5 rounded text-[10px] font-mono font-bold hover:bg-blue-600 hover:text-white transition-colors cursor-pointer ${
                      selectedComp.label === preset
                        ? 'bg-blue-600 text-white'
                        : theme === 'light'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
            {/* Quick Rename Presets for Outputs */}
            {(selectedComp.type === 'LED' || selectedComp.type === 'PROBE') && (
              <div className="hidden sm:flex items-center gap-0.5">
                {['Y', 'OUT', 'S', 'C'].map((preset) => (
                  <button
                    key={preset}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUpdateComponentLabel(selectedComp.id, preset);
                    }}
                    className={`px-1 py-0.5 rounded text-[10px] font-mono font-bold hover:bg-emerald-600 hover:text-white transition-colors cursor-pointer ${
                      selectedComp.label === preset
                        ? 'bg-emerald-600 text-white'
                        : theme === 'light'
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-Fix: 1-Click "Tie Pin to GND (0V)" for any unconnected gate pins */}
          {selectedComp.inputs
            .filter((p) => !project.wires.some((w) => w.toPinId === p.id))
            .map((pin) => (
              <button
                key={pin.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTiePinToGnd(selectedComp.id, pin.id);
                }}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-amber-300 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/50 rounded-lg transition-all shadow-sm animate-pulse"
                title={`Tie floating pin '${pin.name}' to Ground (0V) so logic output functions correctly`}
              >
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-current" />
                <span>Tie {pin.name} to 0V</span>
              </button>
            ))}

          {/* "Inside the Gate" Transistor View trigger */}
          {hasTransistorMode && (
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onOpenInsideGate(selectedComp.type as any, selectedComp);
              }}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 rounded-lg transition-all shadow-sm cursor-pointer hover:scale-105 active:scale-95"
              title="View Inside the Gate (Transistors & Voltages)"
            >
              <Zap className="w-3.5 h-3.5 fill-current animate-pulse text-emerald-400" />
              <span>Inside Gate</span>
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRotateSelected();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Rotate 90° (R)"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDuplicateSelected();
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'light' ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Duplicate (Ctrl+D)"
          >
            <Copy className="w-4 h-4" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSelected();
            }}
            className="p-1.5 text-rose-500 hover:text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Delete (Del)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Canvas Controls (Zoom In/Out, Reset View, Wire Status) */}
      <div className={`absolute bottom-4 right-4 z-20 flex items-center gap-1.5 backdrop-blur p-1.5 rounded-xl shadow-lg border ${
        theme === 'light'
          ? 'bg-white/90 border-slate-200 text-slate-700'
          : 'bg-slate-900/90 border-slate-800 text-slate-300'
      }`}>
        <button
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
          }`}
          title="Zoom Out"
        >
          <Minimize2 className="w-4 h-4" />
        </button>

        <span className={`text-xs font-mono font-medium px-2 min-w-[50px] text-center ${
          theme === 'light' ? 'text-slate-500' : 'text-slate-400'
        }`}>
          {Math.round(zoom * 100)}%
        </span>

        <button
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
          className={`p-1.5 rounded-lg transition-colors ${
            theme === 'light' ? 'hover:bg-slate-100' : 'hover:bg-slate-800'
          }`}
          title="Zoom In"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 40, y: 40 });
          }}
          className={`px-2 py-1 text-xs rounded-lg transition-colors border-l ml-1 ${
            theme === 'light'
              ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'
              : 'text-slate-300 hover:text-white hover:bg-slate-800 border-slate-800'
          }`}
          title="Reset Canvas View"
        >
          Reset
        </button>
      </div>

      {/* Wiring Instruction Toast when user is drawing a wire */}
      {draftWire && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3 py-1.5 bg-cyan-950/90 text-cyan-200 border border-cyan-500/50 rounded-full shadow-lg text-xs font-medium animate-pulse">
          <Info className="w-3.5 h-3.5" />
          <span>Click any component input pin (circle) to complete wire, or Esc to cancel</span>
        </div>
      )}
    </div>
  );
};
