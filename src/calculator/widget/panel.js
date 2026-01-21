import { el } from "../dom.js";

export function buildPanel({ t, isTouchLike }) {
  const panel = el(
    "section",
    { class: "calc-panel", hidden: true, role: "dialog", "aria-label": t("calcTitle") },
    el(
      "div",
      { class: "calc-header" },
      el("div", { class: "calc-title" }, t("calcTitle")),
      el("div", { class: "calc-spacer" }),
      el("button", { class: "calc-close", type: "button" }, t("close"))
    ),
    el(
      "div",
      { class: "calc-display" },
      el(
        "div",
        { class: "calc-history-row" },
        el("button", {
          class: "calc-history-btn",
          type: "button",
          "aria-label": t("history"),
          html: `<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.6"/>
            <path d="M12 7v5l3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
          </svg>`
        }),
        el("div", { class: "calc-history-text" })
      ),
      el("input", {
        class: "calc-expr",
        type: "text",
        inputmode: isTouchLike ? "none" : "decimal",
        autocomplete: "off",
        spellcheck: "false",
      })
    ),
    el(
      "div",
      { class: "calc-history-sheet", hidden: true, "aria-hidden": "true" },
      el("div", { class: "calc-history-sheet-header" },
        el("span", {}, t("history")),
        el("button", { class: "calc-history-clear", type: "button" }, t("clear"))
      ),
      el("div", { class: "calc-history-list" })
    ),
    el("div", { class: "calc-keys" })
  );

  const exprInput = panel.querySelector(".calc-expr");

  if (isTouchLike) {
    exprInput.setAttribute("readonly", "");
    exprInput.setAttribute("inputmode", "none");

    // Prevent focus entirely (stronger than blur)
    const blockFocus = (e) => {
      e.preventDefault();
      e.stopPropagation();
      exprInput.blur();
    };

    exprInput.addEventListener("pointerdown", blockFocus, { passive: false });
    exprInput.addEventListener("touchstart", blockFocus, { passive: false });
    exprInput.addEventListener("mousedown", blockFocus);
    exprInput.addEventListener("click", blockFocus);
    exprInput.addEventListener("focus", () => exprInput.blur());
  }

  return {
    panel,
    exprInput,
    historyEl: panel.querySelector(".calc-history-text"),
    historyBtn: panel.querySelector(".calc-history-btn"),
    historySheet: panel.querySelector(".calc-history-sheet"),
    historyList: panel.querySelector(".calc-history-list"),
    historyClearBtn: panel.querySelector(".calc-history-clear"),
    closeBtn: panel.querySelector(".calc-close"),
    keys: panel.querySelector(".calc-keys"),
    header: panel.querySelector(".calc-header"),
  };
}
