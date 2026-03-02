import { useAppStore } from '../useAppStore';

beforeEach(() => {
  // Reset store to initial state
  useAppStore.setState({
    isOnboarded: false,
    uiLanguage: 'en',
    bundeslandId: null,
    isDbReady: false,
  });
});

describe('useAppStore', () => {
  it('has correct initial state', () => {
    const state = useAppStore.getState();
    expect(state.isOnboarded).toBe(false);
    expect(state.uiLanguage).toBe('en');
    expect(state.bundeslandId).toBeNull();
    expect(state.isDbReady).toBe(false);
  });

  it('setOnboarded updates isOnboarded', () => {
    useAppStore.getState().setOnboarded(true);
    expect(useAppStore.getState().isOnboarded).toBe(true);
  });

  it('setUiLanguage updates uiLanguage', () => {
    useAppStore.getState().setUiLanguage('de');
    expect(useAppStore.getState().uiLanguage).toBe('de');
  });

  it('setBundeslandId updates bundeslandId', () => {
    useAppStore.getState().setBundeslandId(3);
    expect(useAppStore.getState().bundeslandId).toBe(3);
  });

  it('setDbReady updates isDbReady', () => {
    useAppStore.getState().setDbReady(true);
    expect(useAppStore.getState().isDbReady).toBe(true);
  });
});
