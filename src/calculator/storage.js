const KEY = "embeddable_calc_state_v1";
const HISTORY_KEY = "embeddable_calc_history_v1";
const MAX_HISTORY = 7;

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
  }
}

export function addToHistory(expr, result) {
  const history = loadHistory();
  if (history.length > 0 && history[0].expr === expr && history[0].result === result) {
    return history;
  }
  history.unshift({ expr, result });
  if (history.length > MAX_HISTORY) {
    history.pop();
  }
  saveHistory(history);
  return history;
}

export function clearHistory() {
  saveHistory([]);
  return [];
}
