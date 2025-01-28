import { useLocation, useRoute } from "wouter";
import { useEffect, useState } from "react";

interface NavigationState {
  history: string[];
  currentIndex: number;
}

export function useNavigation() {
  const [location, setLocation] = useLocation();
  const [state, setState] = useState<NavigationState>({
    history: [location],
    currentIndex: 0,
  });

  useEffect(() => {
    if (location !== state.history[state.currentIndex]) {
      setState(prev => ({
        history: [...prev.history.slice(0, prev.currentIndex + 1), location],
        currentIndex: prev.currentIndex + 1,
      }));
    }
  }, [location]);

  const canGoBack = state.currentIndex > 0;
  const canGoForward = state.currentIndex < state.history.length - 1;

  const goBack = () => {
    if (canGoBack) {
      const newIndex = state.currentIndex - 1;
      setLocation(state.history[newIndex]);
      setState(prev => ({ ...prev, currentIndex: newIndex }));
    }
  };

  const goForward = () => {
    if (canGoForward) {
      const newIndex = state.currentIndex + 1;
      setLocation(state.history[newIndex]);
      setState(prev => ({ ...prev, currentIndex: newIndex }));
    }
  };

  return {
    location,
    setLocation,
    canGoBack,
    canGoForward,
    goBack,
    goForward,
  };
}
