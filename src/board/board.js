import "../styles/board.less";
import "../styles/calculator.less";

import { createCalculatorWidget } from "../calculator/calculator-widget.js";

const openCalcBtn = document.getElementById("openCalc");
createCalculatorWidget({ button: openCalcBtn, floating: false });

  (function(){
    const canvas = document.getElementById("pad");
    const ctx = canvas.getContext("2d", { alpha: true });
    const statusEl = document.getElementById("status");

    const penBtn = document.getElementById("pen");
    const eraseBtn = document.getElementById("erase");
    const sizeEl = document.getElementById("size");
    const sizeVal = document.getElementById("sizeVal");
    const clearBtn = document.getElementById("clear");
    const saveBtn = document.getElementById("save");

    // NEW: color UI
    const swatchesEl = document.getElementById("swatches");
    const colorPickerEl = document.getElementById("colorPicker");

    const LS_INK_RAW = "vatio_board_ink_raw";

    let tool = "pen"; // "pen" | "eraser"
    let drawing = false;
    let last = null;

    // Theme-aware colors from CSS variables
    function cssVar(name){
      return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    }
    function currentInk(){ return cssVar("--ink") || "#111827"; }
    function currentCanvasBg(){ return cssVar("--canvas-bg") || "#ffffff"; }

    function setStatus(s){ statusEl.textContent = s; }

    function setActive(){
      penBtn.setAttribute("aria-pressed", tool === "pen" ? "true" : "false");
      eraseBtn.setAttribute("aria-pressed", tool === "eraser" ? "true" : "false");
      setStatus(tool === "pen" ? "Pen" : "Eraser");
    }

    // ---- Color utilities (contrast-safe ink) ----
    function clamp01(x){ return Math.max(0, Math.min(1, x)); }

    function normalizeHex(hex){
      if(!hex) return null;
      let h = String(hex).trim();
      if(h[0] !== "#") h = "#" + h;
      // #rgb -> #rrggbb
      if(/^#([0-9a-fA-F]{3})$/.test(h)){
        const m = h.match(/^#([0-9a-fA-F]{3})$/)[1];
        h = "#" + m.split("").map(ch => ch + ch).join("");
      }
      if(!/^#([0-9a-fA-F]{6})$/.test(h)) return null;
      return h.toLowerCase();
    }

    function hexToRgb(hex){
      const h = normalizeHex(hex);
      if(!h) return null;
      const n = parseInt(h.slice(1), 16);
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }

    function rgbToHex({r,g,b}){
      const to = (v)=> v.toString(16).padStart(2, "0");
      return "#" + to(r) + to(g) + to(b);
    }

    function srgbToLin(c){
      const v = c / 255;
      return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    }

    function relLuminance(rgb){
      const R = srgbToLin(rgb.r), G = srgbToLin(rgb.g), B = srgbToLin(rgb.b);
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    }

    function contrastRatio(hexA, hexB){
      const a = hexToRgb(hexA), b = hexToRgb(hexB);
      if(!a || !b) return 1;
      const L1 = relLuminance(a);
      const L2 = relLuminance(b);
      const hi = Math.max(L1, L2);
      const lo = Math.min(L1, L2);
      return (hi + 0.05) / (lo + 0.05);
    }

    function mixHex(hexA, hexB, t){
      const a = hexToRgb(hexA), b = hexToRgb(hexB);
      if(!a || !b) return hexA;
      const tt = clamp01(t);
      const r = Math.round(a.r + (b.r - a.r) * tt);
      const g = Math.round(a.g + (b.g - a.g) * tt);
      const bb = Math.round(a.b + (b.b - a.b) * tt);
      return rgbToHex({r,g,b:bb});
    }

    // Make sure ink stays readable on current canvas background.
    // Keeps the user's chosen hue as much as possible, nudging toward white/black only if needed.
    function ensureInkContrast(rawInkHex){
      const bg = normalizeHex(currentCanvasBg()) || "#ffffff";
      const raw = normalizeHex(rawInkHex) || "#111827";

      const TARGET = 4.0; // practical readability for lines
      let cr = contrastRatio(raw, bg);
      if(cr >= TARGET) return raw;

      // Decide which direction improves contrast faster (toward white or toward black)
      const toWhite = mixHex(raw, "#ffffff", 0.65);
      const toBlack = mixHex(raw, "#000000", 0.65);
      const crW = contrastRatio(toWhite, bg);
      const crB = contrastRatio(toBlack, bg);
      const toward = (crW >= crB) ? "#ffffff" : "#000000";

      // Binary search a mix amount that hits target (or gets close)
      let lo = 0, hi = 1, best = raw;
      for(let i=0;i<12;i++){
        const mid = (lo + hi) / 2;
        const cand = mixHex(raw, toward, mid);
        const c = contrastRatio(cand, bg);
        if(c >= TARGET){
          best = cand;
          hi = mid;
        } else {
          lo = mid;
        }
      }
      return best;
    }

    function setCssInk(hex){
      document.documentElement.style.setProperty("--ink", hex);
    }

    function isDarkMode(){
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    }

    // Presets tuned for Tesla-ish minimal look (different per theme)
    const PRESETS = [
      { id: "graphite",  name: "Graphite", light: "#111827", dark: "#e5e7eb" },
      { id: "slate",     name: "Slate",    light: "#334155", dark: "#cbd5e1" },
      { id: "blue",      name: "Blue",     light: "#2563eb", dark: "#60a5fa" },
      { id: "green",     name: "Green",    light: "#10b981", dark: "#34d399" },
      { id: "amber",     name: "Amber",    light: "#f59e0b", dark: "#fbbf24" },
      { id: "rose",      name: "Rose",     light: "#e11d48", dark: "#fb7185" }
    ];

    let inkRaw = normalizeHex(localStorage.getItem(LS_INK_RAW)) || (isDarkMode() ? "#e5e7eb" : "#111827");

    function appliedInkFromRaw(){
      return ensureInkContrast(inkRaw);
    }

    function renderSwatches(){
      swatchesEl.innerHTML = "";
      const dark = isDarkMode();

      for(const p of PRESETS){
        const hex = dark ? p.dark : p.light;

        const b = document.createElement("button");
        b.type = "button";
        b.className = "swatch";
        b.setAttribute("aria-label", p.name);
        b.setAttribute("title", p.name);
        b.dataset.hex = hex;

        b.style.background = hex;

        b.addEventListener("click", () => {
          setInkRaw(hex);
        });

        swatchesEl.appendChild(b);
      }

      syncColorUI();
    }

    function syncColorUI(){
      // Color input shows the user's raw selection (not the adjusted one)
      if(colorPickerEl){
        colorPickerEl.value = normalizeHex(inkRaw) || "#111827";
      }

      // Mark active swatch (match against theme-specific preset hex)
      const dark = isDarkMode();
      const raw = normalizeHex(inkRaw);

      [...swatchesEl.querySelectorAll(".swatch")].forEach(btn => {
        const hx = normalizeHex(btn.dataset.hex);
        btn.classList.toggle("is-active", !!raw && hx === raw);
      });
    }

    function applyInk(){
      const applied = appliedInkFromRaw();
      setCssInk(applied);
      syncColorUI();
    }

    function setInkRaw(hex){
      const h = normalizeHex(hex);
      if(!h) return;
      inkRaw = h;
      localStorage.setItem(LS_INK_RAW, inkRaw);
      applyInk();
      setStatus("Color updated");
    }

    if(colorPickerEl){
      // Set initial value
      colorPickerEl.value = inkRaw;

      colorPickerEl.addEventListener("input", (e) => {
        setInkRaw(e.target.value);
      });
    }

    // Preserve drawings across resize by snapshotting pixels
    function resize(){
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      // Snapshot current drawing
      let snapshot = null;
      if (canvas.width && canvas.height){
        snapshot = document.createElement("canvas");
        snapshot.width = canvas.width;
        snapshot.height = canvas.height;
        snapshot.getContext("2d").drawImage(canvas, 0, 0);
      }

      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);

      // Work in CSS pixels
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Fill background for visibility + saved PNG background
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = currentCanvasBg();
      ctx.fillRect(0, 0, rect.width, rect.height);
      ctx.restore();

      // Restore snapshot scaled into new size
      if (snapshot){
        const oldCssW = snapshot.width / dpr;
        const oldCssH = snapshot.height / dpr;

        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.drawImage(snapshot, 0, 0, oldCssW, oldCssH);
        ctx.restore();
      }
    }

    function styleStroke(){
      const size = parseInt(sizeEl.value || "6", 10);
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if(tool === "eraser"){
        ctx.globalCompositeOperation = "destination-out";
        ctx.strokeStyle = "rgba(0,0,0,1)";
      } else {
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = currentInk();
      }
    }

    function pos(ev){
      const r = canvas.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }

    function start(ev){
      drawing = true;
      canvas.setPointerCapture(ev.pointerId);
      last = pos(ev);
      styleStroke();
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
    }

    function move(ev){
      if(!drawing) return;
      const p = pos(ev);
      styleStroke();

      const mx = (last.x + p.x) / 2;
      const my = (last.y + p.y) / 2;
      ctx.quadraticCurveTo(last.x, last.y, mx, my);
      ctx.stroke();
      last = p;
    }

    function end(){
      drawing = false;
      last = null;
      setStatus("Saved locally (not persisted)");
    }

    function clear(){
      const r = canvas.getBoundingClientRect();
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = currentCanvasBg();
      ctx.fillRect(0,0,r.width,r.height);
      ctx.restore();
      setStatus("Cleared");
    }

    function savePNG(){
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.max(1, window.devicePixelRatio || 1);

      const out = document.createElement("canvas");
      out.width = canvas.width;
      out.height = canvas.height;
      const octx = out.getContext("2d");

      octx.setTransform(dpr, 0, 0, dpr, 0, 0);
      octx.fillStyle = currentCanvasBg();
      octx.fillRect(0,0,rect.width,rect.height);

      octx.setTransform(1,0,0,1,0,0);
      octx.drawImage(canvas, 0, 0);

      const a = document.createElement("a");
      a.href = out.toDataURL("image/png");
      a.download = "drawing.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setStatus("Downloaded PNG");
    }

    // Events
    canvas.addEventListener("pointerdown", (e)=>{ e.preventDefault(); start(e); });
    canvas.addEventListener("pointermove", (e)=>{ e.preventDefault(); move(e); });
    canvas.addEventListener("pointerup",   (e)=>{ e.preventDefault(); end(); });
    canvas.addEventListener("pointercancel",(e)=>{ e.preventDefault(); end(); });
    canvas.addEventListener("contextmenu",(e)=>e.preventDefault());

    penBtn.addEventListener("click", ()=>{ tool="pen"; setActive(); });
    eraseBtn.addEventListener("click", ()=>{ tool="eraser"; setActive(); });

    sizeEl.addEventListener("input", ()=>{ sizeVal.textContent = sizeEl.value; });

    clearBtn.addEventListener("click", clear);
    saveBtn.addEventListener("click", savePNG);

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq && mq.addEventListener){
      mq.addEventListener("change", () => {
        // recompute presets + apply ink contrast for new background
        renderSwatches();
        applyInk();
        resize();
        setStatus("Theme updated");
      });
    }

    window.addEventListener("resize", resize);

    // Init
    sizeVal.textContent = sizeEl.value;
    setActive();

    renderSwatches();
    applyInk();

    resize();
    setStatus("Ready");
  })();