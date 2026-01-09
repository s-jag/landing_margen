import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { TaskProvider, useTaskContext } from '../TaskContext';
import type { Task } from '@/types/chat';

// =============================================================================
// HELPER
// =============================================================================

function renderTaskContext() {
  return renderHook(() => useTaskContext(), {
    wrapper: ({ children }) => <TaskProvider>{children}</TaskProvider>,
  });
}

function createMockTask(overrides: Partial<Task> = {}): Task {
  return {
    id: `task-${Date.now()}`,
    title: 'Test Task',
    status: 'in_progress',
    currentStepIndex: 0,
    steps: [
      { label: 'Step 1', status: 'running' },
      { label: 'Step 2', status: 'pending' },
      { label: 'Step 3', status: 'pending' },
    ],
    startedAt: new Date().toISOString(),
    ...overrides,
  };
}

// =============================================================================
// HOOK ERROR TESTS
// =============================================================================

describe('useTaskContext', () => {
  it('throws error when used outside provider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTaskContext());
    }).toThrow('useTaskContext must be used within a TaskProvider');

    spy.mockRestore();
  });
});

// =============================================================================
// INITIAL STATE TESTS
// =============================================================================

describe('TaskProvider initial state', () => {
  it('has correct initial state values', () => {
    const { result } = renderTaskContext();

    expect(result.current.tasks).toEqual([]);
    expect(result.current.selectedTaskId).toBeNull();
    expect(result.current.selectedTask).toBeNull();
    expect(result.current.inProgressTasks).toEqual([]);
    expect(result.current.readyTasks).toEqual([]);
  });
});

// =============================================================================
// ADD TASK TESTS
// =============================================================================

describe('addTask', () => {
  it('adds a task to the list', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({ id: 'task-1' });

    act(() => {
      result.current.addTask(task);
    });

    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toEqual(task);
  });

  it('adds new tasks at the beginning', () => {
    const { result } = renderTaskContext();
    const task1 = createMockTask({ id: 'task-1', title: 'First Task' });
    const task2 = createMockTask({ id: 'task-2', title: 'Second Task' });

    act(() => {
      result.current.addTask(task1);
    });

    act(() => {
      result.current.addTask(task2);
    });

    expect(result.current.tasks[0].id).toBe('task-2');
    expect(result.current.tasks[1].id).toBe('task-1');
  });
});

// =============================================================================
// SELECT TASK TESTS
// =============================================================================

describe('selectTask', () => {
  it('selects a task by ID', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({ id: 'task-1' });

    act(() => {
      result.current.addTask(task);
    });

    act(() => {
      result.current.selectTask('task-1');
    });

    expect(result.current.selectedTaskId).toBe('task-1');
    expect(result.current.selectedTask).toEqual(task);
  });

  it('deselects task when null is passed', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({ id: 'task-1' });

    act(() => {
      result.current.addTask(task);
      result.current.selectTask('task-1');
    });

    act(() => {
      result.current.selectTask(null);
    });

    expect(result.current.selectedTaskId).toBeNull();
    expect(result.current.selectedTask).toBeNull();
  });

  it('returns null for selectedTask when ID not found', () => {
    const { result } = renderTaskContext();

    act(() => {
      result.current.selectTask('non-existent');
    });

    expect(result.current.selectedTaskId).toBe('non-existent');
    expect(result.current.selectedTask).toBeNull();
  });
});

// =============================================================================
// UPDATE TASK TESTS
// =============================================================================

describe('updateTask', () => {
  it('updates task properties', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({ id: 'task-1', title: 'Original Title' });

    act(() => {
      result.current.addTask(task);
    });

    act(() => {
      result.current.updateTask('task-1', { title: 'Updated Title' });
    });

    expect(result.current.tasks[0].title).toBe('Updated Title');
  });

  it('does not modify other tasks', () => {
    const { result } = renderTaskContext();
    const task1 = createMockTask({ id: 'task-1', title: 'Task 1' });
    const task2 = createMockTask({ id: 'task-2', title: 'Task 2' });

    act(() => {
      result.current.addTask(task1);
      result.current.addTask(task2);
    });

    act(() => {
      result.current.updateTask('task-1', { title: 'Updated Task 1' });
    });

    expect(result.current.tasks.find((t) => t.id === 'task-1')?.title).toBe('Updated Task 1');
    expect(result.current.tasks.find((t) => t.id === 'task-2')?.title).toBe('Task 2');
  });
});

// =============================================================================
// ADVANCE TASK STEP TESTS
// =============================================================================

describe('advanceTaskStep', () => {
  it('advances to the next step', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({
      id: 'task-1',
      currentStepIndex: 0,
      steps: [
        { label: 'Step 1', status: 'running' },
        { label: 'Step 2', status: 'pending' },
        { label: 'Step 3', status: 'pending' },
      ],
    });

    act(() => {
      result.current.addTask(task);
    });

    act(() => {
      result.current.advanceTaskStep('task-1');
    });

    const updatedTask = result.current.tasks[0];
    expect(updatedTask.currentStepIndex).toBe(1);
    expect(updatedTask.steps[0].status).toBe('done');
    expect(updatedTask.steps[1].status).toBe('running');
    expect(updatedTask.steps[2].status).toBe('pending');
  });

  it('marks previous steps as done when advancing', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({
      id: 'task-1',
      currentStepIndex: 1,
      steps: [
        { label: 'Step 1', status: 'done' },
        { label: 'Step 2', status: 'running' },
        { label: 'Step 3', status: 'pending' },
      ],
    });

    act(() => {
      result.current.addTask(task);
    });

    act(() => {
      result.current.advanceTaskStep('task-1');
    });

    const updatedTask = result.current.tasks[0];
    expect(updatedTask.currentStepIndex).toBe(2);
    expect(updatedTask.steps[0].status).toBe('done');
    expect(updatedTask.steps[1].status).toBe('done');
    expect(updatedTask.steps[2].status).toBe('running');
  });
});

// =============================================================================
// COMPLETE TASK TESTS
// =============================================================================

describe('completeTask', () => {
  it('sets task status to ready', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({ id: 'task-1', status: 'in_progress' });

    act(() => {
      result.current.addTask(task);
    });

    act(() => {
      result.current.completeTask('task-1');
    });

    expect(result.current.tasks[0].status).toBe('ready');
  });

  it('marks all steps as done', () => {
    const { result } = renderTaskContext();
    const task = createMockTask({
      id: 'task-1',
      steps: [
        { label: 'Step 1', status: 'done' },
        { label: 'Step 2', status: 'running' },
        { label: 'Step 3', status: 'pending' },
      ],
    });

    act(() => {
      result.current.addTask(task);
    });

    act(() => {
      result.current.completeTask('task-1');
    });

    const updatedTask = result.current.tasks[0];
    expect(updatedTask.steps.every((s) => s.status === 'done')).toBe(true);
  });
});

// =============================================================================
// DERIVED STATE TESTS
// =============================================================================

describe('derived state', () => {
  it('filters inProgressTasks correctly', () => {
    const { result } = renderTaskContext();

    act(() => {
      result.current.addTask(createMockTask({ id: 'task-1', status: 'in_progress' }));
      result.current.addTask(createMockTask({ id: 'task-2', status: 'ready' }));
      result.current.addTask(createMockTask({ id: 'task-3', status: 'in_progress' }));
    });

    expect(result.current.inProgressTasks).toHaveLength(2);
    expect(result.current.inProgressTasks.every((t) => t.status === 'in_progress')).toBe(true);
  });

  it('filters readyTasks correctly', () => {
    const { result } = renderTaskContext();

    act(() => {
      result.current.addTask(createMockTask({ id: 'task-1', status: 'in_progress' }));
      result.current.addTask(createMockTask({ id: 'task-2', status: 'ready' }));
      result.current.addTask(createMockTask({ id: 'task-3', status: 'ready' }));
    });

    expect(result.current.readyTasks).toHaveLength(2);
    expect(result.current.readyTasks.every((t) => t.status === 'ready')).toBe(true);
  });
});
