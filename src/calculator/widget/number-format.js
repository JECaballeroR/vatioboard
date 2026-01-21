function clampInt(value, min, max) {
  const n = Math.round(Number(value));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function getDecimalSeparator(thousandSeparator) {
  return thousandSeparator === "." ? "," : ".";
}

export function formatNumber(value, settings) {
  const raw = String(value ?? "");
  if (!raw) return "";

  if (!/^[+\-]?\d+(?:\.\d+)?(?:[eE][+\-]?\d+)?$/.test(raw)) {
    return raw;
  }

  const num = Number(raw);
  if (!Number.isFinite(num)) return raw;

  const decimals = clampInt(settings?.decimals ?? 0, 0, 10);
  const thousandSeparator = settings?.thousandSeparator ?? "";
  const decimalSeparator = getDecimalSeparator(thousandSeparator);

  let rounded = num.toFixed(decimals);
  if (decimals > 0) {
    rounded = rounded.replace(/\.?0+$/, "");
  }

  const sign = rounded.startsWith("-") ? "-" : "";
  const unsigned = sign ? rounded.slice(1) : rounded;
  const [intPart, fracPart] = unsigned.split(".");

  const withSep = thousandSeparator
    ? intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandSeparator)
    : intPart;

  return sign + withSep + (fracPart ? decimalSeparator + fracPart : "");
}

export function normalizeInput(value, settings) {
  let s = String(value ?? "");
  if (!s) return s;

  const thousandSeparator = settings?.thousandSeparator ?? "";
  const decimalSeparator = getDecimalSeparator(thousandSeparator);

  if (decimalSeparator === ",") {
    if (thousandSeparator) {
      s = s.split(thousandSeparator).join("");
    }
    if (s.includes(",")) {
      s = s.replaceAll(",", ".");
    }
    return s;
  }

  if (thousandSeparator) {
    s = s.split(thousandSeparator).join("");
  }
  return s;
}
