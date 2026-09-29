/**
 * Storage and Serialization Engine
 * JSON import/export, local storage persistence, and URL hash sharing
 */

import { CircuitProject } from '../types/circuit';
import { CIRCUIT_TEMPLATES } from '../data/templates';

const STORAGE_KEY_CURRENT = 'logicraft_current_project';
const STORAGE_KEY_SAVED_LIST = 'logicraft_saved_projects';

export function getDefaultProject(): CircuitProject {
  // Use Basic Gates template by default
  const template = CIRCUIT_TEMPLATES[0];
  return JSON.parse(JSON.stringify(template.project));
}

export function loadCurrentProject(): CircuitProject {
  try {
    // Check URL hash first for shared projects
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.substring(1);
      if (hash.startsWith('circuit=')) {
        const encoded = hash.substring(8);
        const json = decodeURIComponent(atob(encoded));
        const parsed = JSON.parse(json);
        if (parsed.components && parsed.wires) {
          return parsed;
        }
      }
    }

    const saved = localStorage.getItem(STORAGE_KEY_CURRENT);
    if (saved) {
      const parsed = JSON.parse(saved);
      // If previous session had the old stuck oscilloscope in the starter template, refresh to clean starter
      if (parsed.id === 'template-or-gate' && parsed.components?.some((c: any) => c.type === 'TIMING_ANALYZER')) {
        return getDefaultProject();
      }
      if (parsed.components && parsed.wires) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Failed to load project from storage:', e);
  }

  return getDefaultProject();
}

export function saveCurrentProject(project: CircuitProject) {
  try {
    const updated = {
      ...project,
      updatedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEY_CURRENT, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save project:', e);
  }
}

export function getSavedProjectsList(): { id: string; name: string; updatedAt: number; compCount: number }[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_LIST);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function saveProjectToSlot(project: CircuitProject) {
  try {
    const list = getSavedProjectsList().filter((p) => p.id !== project.id);
    list.unshift({
      id: project.id,
      name: project.name,
      updatedAt: Date.now(),
      compCount: project.components.length,
    });
    localStorage.setItem(STORAGE_KEY_SAVED_LIST, JSON.stringify(list));
    localStorage.setItem(`logicraft_slot_${project.id}`, JSON.stringify(project));
  } catch (e) {
    console.error('Failed to save to slot:', e);
  }
}

export function loadProjectFromSlot(projectId: string): CircuitProject | null {
  try {
    const raw = localStorage.getItem(`logicraft_slot_${projectId}`);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load slot:', e);
  }
  return null;
}

export function deleteSavedProjectSlot(projectId: string) {
  try {
    const list = getSavedProjectsList().filter((p) => p.id !== projectId);
    localStorage.setItem(STORAGE_KEY_SAVED_LIST, JSON.stringify(list));
    localStorage.removeItem(`logicraft_slot_${projectId}`);
  } catch (e) {
    console.error('Failed to delete slot:', e);
  }
}

export function exportProjectToJSON(project: CircuitProject): string {
  return JSON.stringify(project, null, 2);
}

export function downloadProjectFile(project: CircuitProject) {
  const json = exportProjectToJSON(project);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.logicraft.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function generateShareableURL(project: CircuitProject): string {
  try {
    // Compress essential data
    const minimal = {
      id: project.id,
      name: project.name,
      components: project.components,
      wires: project.wires,
    };
    const json = JSON.stringify(minimal);
    const encoded = btoa(encodeURIComponent(json));
    const url = new URL(window.location.href);
    url.hash = `circuit=${encoded}`;
    return url.toString();
  } catch {
    return window.location.href;
  }
}
