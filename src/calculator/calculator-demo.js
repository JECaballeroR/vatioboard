import "../styles/calculator.less";
import { createCalculatorWidget } from "./calculator-widget.js";

const widget = createCalculatorWidget({
  onResult: (value) => {
    const out = document.getElementById("out");
    if (out) out.textContent = `Result: ${value}`;
  },
});

document
  .getElementById("openCalc")
  ?.addEventListener("click", () => widget.toggle());
