type PendingTimer = {
  callback: () => void;
  remaining: number;
  deadline: number;
  handle: ReturnType<typeof setTimeout> | undefined;
};

// UI time is separate from the runner's simulation so a local frame freeze can
// preserve transient panels and quiz feedback without changing gameplay phases.
export function createPresentationClock() {
  const pending = new Set<PendingTimer>();
  let frozen = false;
  let disposed = false;

  function arm(timer: PendingTimer) {
    timer.deadline = Date.now() + timer.remaining;
    timer.handle = setTimeout(() => {
      pending.delete(timer);
      timer.callback();
    }, timer.remaining);
  }

  function cancel(timer: PendingTimer | undefined) {
    if (!timer) return;
    clearTimeout(timer.handle);
    pending.delete(timer);
  }

  return {
    schedule(callback: () => void, delay: number) {
      const timer: PendingTimer = { callback, remaining: delay, deadline: 0, handle: undefined };
      if (disposed) return timer;
      pending.add(timer);
      if (!frozen) arm(timer);
      return timer;
    },
    cancel,
    setFrozen(value: boolean) {
      if (disposed || value === frozen) return;
      frozen = value;
      for (const timer of pending) {
        if (frozen) {
          clearTimeout(timer.handle);
          timer.remaining = Math.max(0, timer.deadline - Date.now());
        } else {
          arm(timer);
        }
      }
    },
    dispose() {
      disposed = true;
      for (const timer of pending) clearTimeout(timer.handle);
      pending.clear();
    },
  };
}

export type PresentationClock = ReturnType<typeof createPresentationClock>;
export type PresentationTimer = ReturnType<PresentationClock['schedule']>;
