import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PreferencesState {
  birthYear: number | null;
  timelineCollapsed: boolean;
  collapsedPhases: string[];
  setBirthYear: (year: number) => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  togglePhaseCollapsed: (phaseId: string) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      birthYear: null,
      timelineCollapsed: false,
      collapsedPhases: [],
      
      setBirthYear: (year) => set({ birthYear: year }),
      setTimelineCollapsed: (collapsed) => set({ timelineCollapsed: collapsed }),
      togglePhaseCollapsed: (phaseId) => set((state) => ({
        collapsedPhases: state.collapsedPhases.includes(phaseId)
          ? state.collapsedPhases.filter(id => id !== phaseId)
          : [...state.collapsedPhases, phaseId]
      })),
    }),
    {
      name: 'user-preferences',
      partialize: (state) => ({
        ...state,
        birthYear: state.birthYear
      })
    }
  )
);