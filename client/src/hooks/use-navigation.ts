import { useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";

interface NavigationState {
  history: string[];
  currentIndex: number;
  isNavigating: boolean;
}

export function useNavigation() {
  const [location, setLocation] = useLocation();
  const [state, setState] = useState<NavigationState>({
    history: [location],
    currentIndex: 0,
    isNavigating: false,
  });

  // Only update history on user-initiated navigation
  useEffect(() => {
    if (location !== state.history[state.currentIndex] && state.isNavigating) {
      setState(prev => ({
        history: [...prev.history.slice(0, prev.currentIndex + 1), location],
        currentIndex: prev.currentIndex + 1,
        isNavigating: false,
      }));
    }
  }, [location, state.currentIndex, state.isNavigating]);

  const canGoBack = state.currentIndex > 0;
  const canGoForward = state.currentIndex < state.history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      const newIndex = state.currentIndex - 1;
      setState(prev => ({ ...prev, isNavigating: true }));
      setLocation(state.history[newIndex]);
      setState(prev => ({ ...prev, currentIndex: newIndex }));
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = state.currentIndex + 1;
      setState(prev => ({ ...prev, isNavigating: true }));
      setLocation(state.history[newIndex]);
      setState(prev => ({ ...prev, currentIndex: newIndex }));
    }
  };

  const navigate = (to: string) => {
    setState(prev => ({ ...prev, isNavigating: true }));
    setLocation(to);
  };

  return {
    location,
    navigate,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    isNavigating: state.isNavigating,
  };
}