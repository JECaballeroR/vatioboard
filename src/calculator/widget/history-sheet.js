import { el } from "../dom.js";

const HISTORY_RESULT_MAX_LEN = 10;

function formatHistoryResult(value, maxLen = HISTORY_RESULT_MAX_LEN) {
  const raw = String(value ?? "");
  if (raw.length <= maxLen) return raw;

  const num = Number(raw);
  if (!Number.isFinite(num)) return raw.slice(0, maxLen);

  for (let precision = maxLen; precision >= 1; precision -= 1) {
    let candidate = num.toPrecision(precision);
    if (!/[eE]/.test(candidate)) {
      candidate = candidate.replace(/\.?0+$/, "");
    }
    if (candidate.length <= maxLen) return candidate;
  }

  return raw.slice(0, maxLen);
}

export function initHistorySheet({
  panel,
  core,
  historySheet,
  historyBtn,
  historyList,
  historyClearBtn,
  render,
  t,
  loadHistory,
  clearHistory,
}) {
  const setHistorySheetOpen = (isOpen) => {
    if (isOpen) {
      renderHistoryList();
      historySheet.hidden = false;
      historySheet.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => historySheet.classList.add("is-open"));
      return;
    }

    historySheet.classList.remove("is-open");
    historySheet.setAttribute("aria-hidden", "true");
  };

  historySheet.addEventListener("transitionend", (e) => {
    if (e.propertyName !== "transform") return;
    if (!historySheet.classList.contains("is-open")) {
      historySheet.hidden = true;
    }
  });

  function renderHistoryList() {
    const history = loadHistory();
    historyList.innerHTML = "";
    if (history.length === 0) {
      historyList.appendChild(
        el("div", { class: "calc-history-empty" }, t("noHistory"))
      );
      return;
    }

    for (const item of history) {
      const row = el(
        "button",
        { class: "calc-history-item", type: "button" },
        el("span", { class: "calc-history-item-expr" }, item.expr),
        el(
          "span",
          { class: "calc-history-item-result" },
          formatHistoryResult(item.result)
        )
      );

      row.addEventListener("click", () => {
        core.setExpr(item.result);
        core.status = item.expr;
        render();
        setHistorySheetOpen(false);
      });

      historyList.appendChild(row);
    }
  }

  historyBtn.addEventListener("click", () => {
    setHistorySheetOpen(!historySheet.classList.contains("is-open"));
  });

  historyClearBtn.addEventListener("click", () => {
    clearHistory();
    renderHistoryList();
  });

  panel.addEventListener("click", (e) => {
    if (!historySheet.classList.contains("is-open")) return;
    if (!historySheet.contains(e.target) && !historyBtn.contains(e.target)) {
      setHistorySheetOpen(false);
    }
  });

  return { setHistorySheetOpen };
}
