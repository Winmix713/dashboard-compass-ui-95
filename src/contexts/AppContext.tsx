
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

export interface AppState {
  figmaToken: string;
  isProcessing: boolean;
  currentJob: any | null;
  errors: string[];
  projects: any[];
  components: any[];
}

export type AppAction = 
  | { type: 'SET_FIGMA_TOKEN'; payload: string }
  | { type: 'SET_PROCESSING'; payload: boolean }
  | { type: 'SET_CURRENT_JOB'; payload: any }
  | { type: 'ADD_ERROR'; payload: string }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'SET_PROJECTS'; payload: any[] }
  | { type: 'SET_COMPONENTS'; payload: any[] };

const initialState: AppState = {
  figmaToken: '',
  isProcessing: false,
  currentJob: null,
  errors: [],
  projects: [],
  components: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_FIGMA_TOKEN':
      return { ...state, figmaToken: action.payload };
    case 'SET_PROCESSING':
      return { ...state, isProcessing: action.payload };
    case 'SET_CURRENT_JOB':
      return { ...state, currentJob: action.payload };
    case 'ADD_ERROR':
      return { ...state, errors: [...state.errors, action.payload] };
    case 'CLEAR_ERRORS':
      return { ...state, errors: [] };
    case 'SET_PROJECTS':
      return { ...state, projects: action.payload };
    case 'SET_COMPONENTS':
      return { ...state, components: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
