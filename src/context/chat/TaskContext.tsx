'use client';

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  type ReactNode,
} from 'react';
import type { Task } from '@/types/chat';

// =============================================================================
// STATE
// =============================================================================

interface TaskState {
  tasks: Task[];
  selectedTaskId: string | null;
}

const initialState: TaskState = {
  tasks: [],
  selectedTaskId: null,
};

// =============================================================================
// ACTIONS
// =============================================================================

type TaskAction =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: { taskId: string; updates: Partial<Task> } }
  | { type: 'SET_SELECTED_TASK'; payload: string | null }
  | { type: 'ADVANCE_TASK_STEP'; payload: string }
  | { type: 'COMPLETE_TASK'; payload: string };

// =============================================================================
// REDUCER
// =============================================================================

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [action.payload, ...state.tasks],
      };

    case 'UPDATE_TASK': {
      const { taskId, updates } = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        ),
      };
    }

    case 'SET_SELECTED_TASK':
      return {
        ...state,
        selectedTaskId: action.payload,
      };

    case 'ADVANCE_TASK_STEP': {
      const taskId = action.payload;
      return {
        ...state,
        tasks: state.tasks.map((task) => {
          if (task.id !== taskId) return task;
          const newSteps = task.steps.map((step, i) => {
            if (i < task.currentStepIndex) return { ...step, status: 'done' as const };
            if (i === task.currentStepIndex) return { ...step, status: 'done' as const };
            if (i === task.currentStepIndex + 1) return { ...step, status: 'running' as const };
            return step;
          });
          return {
            ...task,
            currentStepIndex: task.currentStepIndex + 1,
            steps: newSteps,
          };
        }),
      };
    }

    case 'COMPLETE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload
            ? {
                ...task,
                status: 'ready' as const,
                steps: task.steps.map((s) => ({ ...s, status: 'done' as const })),
              }
            : task
        ),
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

interface TaskContextValue extends TaskState {
  // Derived state
  selectedTask: Task | null;
  inProgressTasks: Task[];
  readyTasks: Task[];

  // Actions
  selectTask: (taskId: string | null) => void;
  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  advanceTaskStep: (taskId: string) => void;
  completeTask: (taskId: string) => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface TaskProviderProps {
  children: ReactNode;
}

export function TaskProvider({ children }: TaskProviderProps) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Derived state
  const selectedTask = state.selectedTaskId
    ? state.tasks.find((t) => t.id === state.selectedTaskId) || null
    : null;

  const inProgressTasks = state.tasks.filter((t) => t.status === 'in_progress');
  const readyTasks = state.tasks.filter((t) => t.status === 'ready');

  // Actions
  const selectTask = useCallback((taskId: string | null) => {
    dispatch({ type: 'SET_SELECTED_TASK', payload: taskId });
  }, []);

  const addTask = useCallback((task: Task) => {
    dispatch({ type: 'ADD_TASK', payload: task });
  }, []);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    dispatch({ type: 'UPDATE_TASK', payload: { taskId, updates } });
  }, []);

  const advanceTaskStep = useCallback((taskId: string) => {
    dispatch({ type: 'ADVANCE_TASK_STEP', payload: taskId });
  }, []);

  const completeTask = useCallback((taskId: string) => {
    dispatch({ type: 'COMPLETE_TASK', payload: taskId });
  }, []);

  const value: TaskContextValue = {
    ...state,
    selectedTask,
    inProgressTasks,
    readyTasks,
    selectTask,
    addTask,
    updateTask,
    advanceTaskStep,
    completeTask,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

// =============================================================================
// HOOK
// =============================================================================

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}
