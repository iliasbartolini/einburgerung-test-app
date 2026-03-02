import { create } from 'zustand';
import type { LanguageCode } from '../i18n';

interface AppState {
  isOnboarded: boolean;
  uiLanguage: LanguageCode;
  bundeslandId: number | null;
  isDbReady: boolean;

  setOnboarded: (value: boolean) => void;
  setUiLanguage: (language: LanguageCode) => void;
  setBundeslandId: (id: number) => void;
  setDbReady: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isOnboarded: false,
  uiLanguage: 'en',
  bundeslandId: null,
  isDbReady: false,

  setOnboarded: (value) => set({ isOnboarded: value }),
  setUiLanguage: (language) => set({ uiLanguage: language }),
  setBundeslandId: (id) => set({ bundeslandId: id }),
  setDbReady: (value) => set({ isDbReady: value }),
}));
