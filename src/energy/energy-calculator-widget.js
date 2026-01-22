import { el } from "../calculator/dom.js";
import { t } from "../i18n.js";
import { clampElementToViewport, makePanelDraggable } from "../calculator/widget/drag.js";

/**
 * createEnergyCalculatorWidget(options)
 * - button: HTMLElement -> if provided, clicking it toggles the panel
 * - mount: HTMLElement -> where to append the panel (default document.body)
 */
export function createEnergyCalculatorWidget(options = {}) {
  const {
    mount = document.body,
    button = null,
  } = options;

  const DRAG_THRESHOLD_PX = 6;
  const POS_KEY = "energy_calc_pos_v1";

  function loadPos() {
    try {
      const raw = localStorage.getItem(POS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function savePos(pos) {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }

  // Build panel
  const panel = el(
    "section",
    { class: "energy-panel", hidden: true, role: "dialog", "aria-label": t("energyTitle") },
    el(
      "div",
      { class: "energy-header" },
      el("div", { class: "energy-title" }, t("energyTitle")),
      el("div", { class: "energy-spacer" }),
      el("button", { class: "energy-close", type: "button" }, t("close"))
    ),
    el(
      "div",
      { class: "energy-body" },
      el("p", { class: "energy-hello" }, "Hola Mundo")
    )
  );

  const header = panel.querySelector(".energy-header");
  const closeBtn = panel.querySelector(".energy-close");

  // Apply stored panel position (if any)
  {
    const pos = loadPos();
    if (pos?.panel?.left && pos?.panel?.top) {
      panel.style.position = "fixed";
      panel.style.left = pos.panel.left;
      panel.style.top = pos.panel.top;
      panel.style.right = "auto";
      panel.style.bottom = "auto";
    }
  }

  // Make panel draggable
  makePanelDraggable({
    panel,
    header,
    dragThresholdPx: DRAG_THRESHOLD_PX,
    savePos,
    loadPos,
  });

  function open() {
    panel.hidden = false;
    if (panel.style.left && panel.style.top) {
      clampElementToViewport(panel);
    }
  }

  function close() {
    panel.hidden = true;
  }

  function toggle() {
    panel.hidden ? open() : close();
  }

  closeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
  closeBtn.addEventListener("pointerup", (e) => e.stopPropagation());
  closeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    close();
  });

  // User-provided button hook
  if (button) {
    button.addEventListener("click", toggle);
  }

  mount.appendChild(panel);

  return {
    open,
    close,
    toggle,
  };
}
