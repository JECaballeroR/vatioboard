import { el } from "../dom.js";

export function buildPanel({ t, isTouchLike }) {
  const settingsSvg = `
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.25" stroke="currentColor" stroke-width="1.6"/>
      <path d="M12 3.5v2.1M12 18.4v2.1M3.5 12h2.1M18.4 12h2.1M5.7 5.7l1.5 1.5M16.8 16.8l1.5 1.5M18.3 5.7l-1.5 1.5M7.2 16.8l-1.5 1.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
    </svg>
  `;

  const panel = el(
    "section",
    { class: "calc-panel", hidden: true, role: "dialog", "aria-label": t("calcTitle") },
    el(
      "div",
      { class: "calc-header" },
      el("div", { class: "calc-title" }, t("calcTitle")),
      el("button", {
        class: "calc-icon-btn calc-settings-btn",
        type: "button",
        "aria-label": t("settings"),
        html: settingsSvg,
      }),
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
          class: "calc-icon-btn calc-history-btn",
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
    el(
      "div",
      { class: "calc-settings-sheet", hidden: true, "aria-hidden": "true" },
      el("div", { class: "calc-settings-sheet-header" },
        el("span", {}, t("settings")),
        el("button", { class: "calc-settings-close", type: "button" }, t("close"))
      ),
      el("div", { class: "calc-settings-body" },
        el(
          "div",
          { class: "calc-settings-row calc-settings-row-inline calc-settings-row-box" },
          el("span", { class: "calc-settings-label" }, t("decimalPlaces")),
          el(
            "div",
            { class: "calc-settings-stepper" },
            el("button", { class: "calc-settings-decimals-minus", type: "button" }, "-"),
            el("span", { class: "calc-settings-decimals-value" }, "0"),
            el("button", { class: "calc-settings-decimals-plus", type: "button" }, "+")
          )
        ),
        el(
          "label",
          { class: "calc-settings-row calc-settings-row-inline" },
          el("span", { class: "calc-settings-label" }, t("thousandSeparator")),
          el(
            "span",
            { class: "calc-settings-switch" },
            el("input", {
              class: "calc-settings-thousands",
              type: "checkbox",
            }),
            el("span", { class: "calc-settings-slider", "aria-hidden": "true" })
          )
        )
      )
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
    settingsBtn: panel.querySelector(".calc-settings-btn"),
    settingsSheet: panel.querySelector(".calc-settings-sheet"),
    settingsCloseBtn: panel.querySelector(".calc-settings-close"),
    settingsDecimalsMinus: panel.querySelector(".calc-settings-decimals-minus"),
    settingsDecimalsPlus: panel.querySelector(".calc-settings-decimals-plus"),
    settingsDecimalsValue: panel.querySelector(".calc-settings-decimals-value"),
    settingsThousandsToggle: panel.querySelector(".calc-settings-thousands"),
    closeBtn: panel.querySelector(".calc-close"),
    keys: panel.querySelector(".calc-keys"),
    header: panel.querySelector(".calc-header"),
  };
}
