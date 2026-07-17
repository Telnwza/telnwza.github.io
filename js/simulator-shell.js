(() => {
  "use strict";

  const simulator = document.body.dataset.simulator;
  if (!simulator) return;

  const definitions = {
    automata: {
      title: "Automata Studio",
      subtitle: "DFA · NFA · PDA · Turing Machine",
      fixedHeader: true,
      root: ".app",
      workspace: "main.workspace",
      left: "main.workspace > aside:first-of-type",
      right: "main.workspace > aside:last-of-type",
      canvas: ".canvas-panel",
      essentials: ["machineType", "undoBtn", "redoBtn"],
      advanced: ["saveBtn", "loadBtn", "exportBtn", "importBtn", "exportSvgBtn", "importFile", "clearBtn"],
      leftLabel: "เครื่องมือ",
      rightLabel: "จำลอง",
      defaultLeft: true,
      defaultRight: false,
      tips: [
        "ดับเบิลคลิกพื้นที่ว่างเพื่อเพิ่ม state ได้ทันที",
        "กด Regex → Automata แล้วเลือกผลลัพธ์เป็น Minimal DFA, NFA หรือ λ-NFA ได้",
        "แท็บ ตรวจ Regex ใช้พิสูจน์ว่ารูปที่วาดรับภาษาเดียวกับ Regular Expression หรือไม่",
        "เลือก state หรือ transition แล้วตัวแก้ไขที่เกี่ยวข้องจึงจะแสดง",
        "กด Shift ค้างแล้วเลือก state สองตัวเพื่อสร้าง transition",
      ],
    },
    logic: {
      title: "Logic Gates Lab",
      subtitle: "Circuit · Truth Table · Boolean Expression",
      root: ".logic-app",
      workspace: ".logic-workspace",
      left: ".component-panel",
      right: ".analysis-panel",
      canvas: ".canvas-panel",
      essentials: ["projectName", "undoBtn", "redoBtn"],
      advanced: ["saveBtn", "importBtn", "exportJsonBtn", "exportSvgBtn", "exportPngBtn", "importFile", "clearBtn"],
      leftLabel: "Gate",
      rightLabel: "วิเคราะห์",
      defaultLeft: true,
      defaultRight: false,
      tips: [
        "ลากจากวงกลมด้านขวาของอุปกรณ์ไปยัง input port เพื่อเชื่อมสายได้ทันที",
        "คลิกค่าบน Input เพื่อสลับระหว่าง 0 และ 1",
        "เปิดแผงวิเคราะห์เมื่อต้องการดู Truth Table หรือสมการ",
      ],
    },
    vector: {
      title: "Vector Addition",
      subtitle: "2D · 3D · Head-to-tail",
      root: ".app",
      workspace: ".app",
      left: ".sidebar",
      right: null,
      canvas: ".workspace",
      essentials: ["undoBtn", "fitBtn"],
      advanced: ["exportBtn", "importBtn", "importFileInput", "clearBtn"],
      leftLabel: "Vectors",
      rightLabel: null,
      defaultLeft: true,
      defaultRight: false,
      tips: [
        "เพิ่ม vector จากช่องด้านซ้าย แล้วกราฟจะอัปเดตทันที",
        "ลากบนกราฟเพื่อเลื่อน และใช้ล้อเมาส์เพื่อ zoom",
        "ลากสัญลักษณ์ ⠿ ในรายการเพื่อเปลี่ยนลำดับการบวก",
      ],
    },
  };

  const definition = definitions[simulator];
  if (!definition) return;

  const root = document.querySelector(definition.root);
  const workspace = document.querySelector(definition.workspace);
  const leftPanel = document.querySelector(definition.left);
  const rightPanel = definition.right ? document.querySelector(definition.right) : null;
  const canvasRegion = document.querySelector(definition.canvas);
  if (!root || !workspace || !leftPanel || !canvasRegion) return;

  const storageKey = `visualLearningShell:${simulator}`;
  const initialState = readState();
  let state = {
    headerMode: definition.fixedHeader || initialState.headerMode === "always" ? "always" : "auto",
    leftOpen: typeof initialState.leftOpen === "boolean" ? initialState.leftOpen : definition.defaultLeft,
    rightOpen: typeof initialState.rightOpen === "boolean" ? initialState.rightOpen : definition.defaultRight,
    focus: false,
  };
  if (window.matchMedia("(max-width: 820px)").matches && typeof initialState.leftOpen !== "boolean") {
    state.leftOpen = false;
    state.rightOpen = false;
  }
  let hideTimer = 0;
  let toastTimer = 0;
  let lastScrollY = window.scrollY;

  root.classList.add("sim-root");
  workspace.classList.add("sim-workspace");
  leftPanel.classList.add("sim-left-panel");
  if (rightPanel) rightPanel.classList.add("sim-right-panel");
  canvasRegion.classList.add("sim-canvas-region");

  const hotZone = create("div", "sim-shell-hot-zone");
  hotZone.setAttribute("aria-hidden", "true");

  const header = create("header", "sim-shell-header");
  header.setAttribute("aria-label", "เครื่องมือหลักของ Simulator");
  const home = create("a", "sim-shell-home", "Dashboard");
  home.href = "../";
  home.setAttribute("aria-label", "กลับ Dashboard");

  const title = create("div", "sim-shell-title");
  title.innerHTML = `<strong>${definition.title}</strong><span>${definition.subtitle}</span>`;

  const essentials = create("div", "sim-shell-essentials");
  const panels = create("div", "sim-shell-panels");
  const leftButton = shellButton(definition.leftLabel, "☰");
  leftButton.setAttribute("aria-controls", panelId(leftPanel, "left"));
  panels.append(leftButton);

  let rightButton = null;
  if (rightPanel) {
    rightButton = shellButton(definition.rightLabel, "▤");
    rightButton.setAttribute("aria-controls", panelId(rightPanel, "right"));
    panels.append(rightButton);
  }

  const focusButton = shellButton("Focus", "⛶");
  focusButton.setAttribute("aria-label", "เปิดหรือปิด Focus Mode (Shift+F)");
  panels.append(focusButton);

  const menu = create("details", "sim-shell-menu");
  const menuSummary = create("summary", "", "•••");
  menuSummary.setAttribute("aria-label", "เมนูเพิ่มเติม");
  const menuPanel = create("div", "sim-shell-menu-panel");
  menu.append(menuSummary, menuPanel);

  header.append(home, title, essentials, panels, menu);
  document.body.prepend(hotZone, header);

  moveControls(definition.essentials, essentials, false);
  moveControls(definition.advanced, menuPanel, true);

  const separator = create("div", "sim-shell-menu-separator");
  const modeLabel = create("label", "", "การแสดง Top bar");
  modeLabel.htmlFor = `simHeaderMode-${simulator}`;
  const modeSelect = create("select");
  modeSelect.id = `simHeaderMode-${simulator}`;
  modeSelect.innerHTML = '<option value="auto">Auto-hide</option><option value="always">แสดงตลอด</option>';
  modeSelect.value = state.headerMode;
  const helpButton = create("button", "", "วิธีใช้และคีย์ลัด");
  helpButton.type = "button";
  const dashboardLink = create("a", "", "กลับ Dashboard");
  dashboardLink.href = "../";
  if (definition.fixedHeader) menuPanel.append(separator, helpButton, dashboardLink);
  else menuPanel.append(separator, modeLabel, modeSelect, helpButton, dashboardLink);

  const scrim = create("button", "sim-panel-scrim");
  scrim.type = "button";
  scrim.setAttribute("aria-label", "ปิดแผงด้านข้าง");
  document.body.append(scrim);

  const toast = create("div", "sim-shell-toast");
  toast.hidden = true;
  toast.setAttribute("role", "status");
  toast.setAttribute("aria-live", "polite");
  document.body.append(toast);

  const helpDialog = buildHelpDialog();
  document.body.append(helpDialog);

  enhanceSimulator();
  updatePanels(false);
  updateFocus(false);
  document.body.classList.add("sim-shell-ready");
  if (state.headerMode === "auto") queueHide(2600);

  leftButton.addEventListener("click", () => {
    state.leftOpen = !state.leftOpen;
    if (isMobile() && state.leftOpen) state.rightOpen = false;
    updatePanels();
  });
  rightButton?.addEventListener("click", () => {
    state.rightOpen = !state.rightOpen;
    if (isMobile() && state.rightOpen) state.leftOpen = false;
    updatePanels();
  });
  focusButton.addEventListener("click", () => updateFocus(!state.focus));
  modeSelect.addEventListener("change", () => {
    state.headerMode = modeSelect.value;
    saveState();
    if (state.headerMode === "always") showHeader();
    else queueHide(900);
  });
  helpButton.addEventListener("click", () => {
    menu.open = false;
    openHelp();
  });
  scrim.addEventListener("click", () => {
    state.leftOpen = false;
    state.rightOpen = false;
    updatePanels();
  });

  header.addEventListener("pointerenter", showHeader);
  header.addEventListener("pointerleave", () => queueHide(650));
  header.addEventListener("focusin", showHeader);
  header.addEventListener("focusout", () => queueHide(850));
  hotZone.addEventListener("pointerenter", showHeader);
  hotZone.addEventListener("click", showHeader);
  canvasRegion.addEventListener("pointerdown", () => queueHide(260), { passive: true });
  if (simulator === "automata") {
    const canvasShell = canvasRegion.querySelector(".canvas-shell");
    canvasShell?.addEventListener("pointermove", (event) => {
      const bounds = canvasShell.getBoundingClientRect();
      canvasShell.style.setProperty("--canvas-x", `${event.clientX - bounds.left}px`);
      canvasShell.style.setProperty("--canvas-y", `${event.clientY - bounds.top}px`);
    }, { passive: true });
  }

  document.addEventListener("pointermove", (event) => {
    if (event.clientY <= 16) showHeader();
  }, { passive: true });
  document.addEventListener("pointerdown", (event) => {
    if (menu.open && !menu.contains(event.target)) menu.open = false;
  });
  window.addEventListener("scroll", () => {
    if (window.scrollY < lastScrollY || window.scrollY < 12) showHeader();
    else if (window.scrollY > lastScrollY + 8) queueHide(180);
    lastScrollY = window.scrollY;
  }, { passive: true });
  window.addEventListener("resize", () => {
    if (isMobile() && state.leftOpen && state.rightOpen) state.rightOpen = false;
    updatePanels(false);
  });
  window.addEventListener("keydown", handleShortcut, true);

  function readState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch {
      return {};
    }
  }

  function saveState() {
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        headerMode: state.headerMode,
        leftOpen: state.leftOpen,
        rightOpen: state.rightOpen,
      }));
    } catch {
      // UI preferences are optional.
    }
  }

  function create(tag, className = "", text = "") {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
  }

  function shellButton(label, symbol) {
    const button = create("button", "sim-shell-button");
    button.type = "button";
    button.innerHTML = `<span aria-hidden="true">${symbol}</span><span class="sim-shell-button-label">${label}</span>`;
    button.setAttribute("aria-label", label);
    return button;
  }

  function panelId(panel, fallback) {
    if (!panel.id) panel.id = `sim-${simulator}-${fallback}-panel`;
    return panel.id;
  }

  function moveControls(ids, destination, advanced) {
    ids.forEach((id) => {
      const control = document.getElementById(id);
      if (!control) return;
      control.classList.add("sim-shell-native-control");
      if (advanced) control.classList.add("sim-shell-advanced-control");
      if (control.tagName === "INPUT" && control.type !== "file") {
        control.setAttribute("aria-label", control.getAttribute("aria-label") || "ชื่อโปรเจกต์");
      }
      if (control.tagName === "SELECT") {
        control.setAttribute("aria-label", control.getAttribute("aria-label") || "เลือกประเภท Simulator");
      }
      destination.append(control);
    });
  }

  function updatePanels(persist = true) {
    workspace.classList.toggle("sim-left-collapsed", !state.leftOpen);
    workspace.classList.toggle("sim-right-collapsed", !state.rightOpen || !rightPanel);
    leftButton.setAttribute("aria-pressed", String(state.leftOpen));
    if (rightButton) rightButton.setAttribute("aria-pressed", String(state.rightOpen));
    document.body.classList.toggle(
      "sim-panel-drawer-open",
      isMobile() && !state.focus && (state.leftOpen || (rightPanel && state.rightOpen)),
    );
    if (persist) saveState();
    notifyResize();
  }

  function updateFocus(active) {
    state.focus = active;
    document.body.classList.toggle("sim-focus-mode", state.focus);
    focusButton.setAttribute("aria-pressed", String(state.focus));
    focusButton.querySelector(".sim-shell-button-label").textContent = state.focus ? "ออก Focus" : "Focus";
    document.body.classList.remove("sim-panel-drawer-open");
    showHeader();
    notifyResize();
    if (state.focus) {
      notify("Focus Mode · กด Esc หรือเลื่อนเมาส์ไปด้านบนเพื่อออก");
      queueHide(800);
    } else {
      notify("ออกจาก Focus Mode แล้ว");
    }
  }

  function showHeader() {
    window.clearTimeout(hideTimer);
    const changed = document.body.classList.contains("sim-header-hidden");
    document.body.classList.remove("sim-header-hidden");
    if (changed) {
      notifyResize();
      window.setTimeout(notifyResize, 200);
    }
  }

  function queueHide(delay) {
    window.clearTimeout(hideTimer);
    if (state.headerMode !== "auto") return;
    hideTimer = window.setTimeout(() => {
      if (header.matches(":hover") || header.contains(document.activeElement) || menu.open || helpDialog.open) return;
      document.body.classList.add("sim-header-hidden");
      notifyResize();
      window.setTimeout(notifyResize, 200);
    }, delay);
  }

  function notify(message) {
    toast.textContent = message;
    toast.hidden = false;
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => { toast.hidden = true; }, 2400);
  }

  function notifyResize() {
    window.requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  function isMobile() {
    return window.matchMedia("(max-width: 820px)").matches;
  }

  function isEditing() {
    const active = document.activeElement;
    return active && (["INPUT", "TEXTAREA", "SELECT"].includes(active.tagName) || active.isContentEditable);
  }

  function handleShortcut(event) {
    if (event.key === "Escape") {
      showHeader();
      if (state.focus) updateFocus(false);
      return;
    }
    if (isEditing()) return;
    if (event.shiftKey && event.key.toLowerCase() === "f") {
      event.preventDefault();
      event.stopImmediatePropagation();
      updateFocus(!state.focus);
      return;
    }
    if (event.key === "[") {
      event.preventDefault();
      state.leftOpen = !state.leftOpen;
      if (isMobile() && state.leftOpen) state.rightOpen = false;
      updatePanels();
      return;
    }
    if (event.key === "]" && rightPanel) {
      event.preventDefault();
      state.rightOpen = !state.rightOpen;
      if (isMobile() && state.rightOpen) state.leftOpen = false;
      updatePanels();
      return;
    }
    if (event.key === "?") {
      event.preventDefault();
      openHelp();
    }
  }

  function buildHelpDialog() {
    const dialog = create("dialog", "sim-help-dialog");
    const content = create("div", "sim-help-content");
    const tips = definition.tips.map((tip) => `<li>${tip}</li>`).join("");
    content.innerHTML = `
      <h2>${definition.title}: เริ่มใช้งานแบบเร็ว</h2>
      <ul>${tips}</ul>
      <p><strong>แผง:</strong> <kbd>[</kbd> เครื่องมือ · <kbd>]</kbd> วิเคราะห์</p>
      <p><strong>Focus:</strong> <kbd>Shift+F</kbd> · ออกด้วย <kbd>Esc</kbd></p>
      <p>Top bar จะแสดงเมื่อเลื่อนเมาส์ไปขอบบน และเลือกให้แสดงตลอดได้จากเมนู •••</p>`;
    const actions = create("div", "sim-help-actions");
    const close = create("button", "", "เข้าใจแล้ว");
    close.type = "button";
    close.addEventListener("click", () => dialog.close());
    actions.append(close);
    dialog.append(content, actions);
    dialog.addEventListener("close", () => queueHide(900));
    return dialog;
  }

  function openHelp() {
    showHeader();
    if (typeof helpDialog.showModal === "function") helpDialog.showModal();
    else helpDialog.setAttribute("open", "");
  }

  function enhanceSimulator() {
    if (simulator === "logic") enhanceLogic();
    if (simulator === "automata") enhanceAutomata();
    if (simulator === "vector") enhanceVector();
  }

  function enhanceLogic() {
    const grid = document.querySelector(".gate-grid");
    if (!grid) return;
    const advancedTypes = new Set(["NAND", "NOR", "XNOR"]);
    const advancedButtons = [...grid.querySelectorAll("[data-component]")]
      .filter((button) => advancedTypes.has(button.dataset.component));
    if (!advancedButtons.length) return;
    const details = create("details", "sim-progressive");
    details.append(create("summary", "", "Gate เพิ่มเติม"));
    const advancedGrid = create("div", "component-grid");
    advancedButtons.forEach((button) => advancedGrid.append(button));
    details.append(advancedGrid);
    grid.after(details);

    const presetList = document.querySelector(".preset-list");
    if (presetList) {
      const presetDetails = create("details", "sim-progressive");
      presetDetails.append(create("summary", "", "ตัวอย่างวงจร"));
      const heading = presetList.previousElementSibling;
      if (heading?.classList.contains("section-label")) heading.remove();
      presetList.before(presetDetails);
      presetDetails.append(presetList);
    }
  }

  function enhanceAutomata() {
    const stateSection = wrapHeadingBlock(leftPanel, "State ที่เลือก");
    const edgeSection = wrapHeadingBlock(leftPanel, "Transition ที่เลือก");
    const presetHeading = [...leftPanel.querySelectorAll("h3")].find((heading) => heading.textContent.trim() === "Preset");
    if (presetHeading && presetHeading.nextElementSibling) {
      const details = create("details", "sim-progressive");
      details.append(create("summary", "", "ตัวอย่างพร้อมใช้"));
      presetHeading.before(details);
      details.append(presetHeading, presetHeading.nextElementSibling);
    }
    [...leftPanel.querySelectorAll("h3")]
      .filter((heading) => heading.textContent.trim() === "ล้างงาน")
      .forEach((heading) => heading.remove());

    const canvas = document.getElementById("canvas");
    const updateContext = () => {
      if (stateSection) stateSection.hidden = !canvas?.querySelector(".state.selected");
      if (edgeSection) edgeSection.hidden = !canvas?.querySelector(".edge.selected");
    };
    updateContext();
    if (canvas) new MutationObserver(updateContext).observe(canvas, { subtree: true, childList: true, attributes: true, attributeFilter: ["class"] });
  }

  function enhanceVector() {
    const brand = leftPanel.querySelector(":scope > .brand");
    if (brand) brand.classList.add("sim-help-noise");
    const cards = [...leftPanel.children].filter((element) => element.classList.contains("card"));
    if (cards.length < 5) return;
    const details = create("details", "sim-progressive sim-sidebar-more");
    details.append(create("summary", "", "ตัวอย่างและการแสดงผล"));
    cards.slice(3).forEach((card) => details.append(card));
    leftPanel.append(details);
  }

  function wrapHeadingBlock(container, text) {
    const heading = [...container.querySelectorAll("h3")].find((item) => item.textContent.trim() === text);
    if (!heading || !heading.nextElementSibling) return null;
    const section = create("section", "sim-context-section");
    heading.before(section);
    section.append(heading, heading.nextElementSibling);
    return section;
  }
})();
