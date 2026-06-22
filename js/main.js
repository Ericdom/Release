function getStorage(key, def) { try { return localStorage.getItem(key) || def; } catch(e) { return def; } }
function setStorage(key, val) { try { localStorage.setItem(key, val); } catch(e) {} }

(function () {
  try {
    const theme = getStorage("release-theme", "dark");
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
      document.documentElement.classList.remove("dark-theme");
    } else {
      document.documentElement.classList.add("dark-theme");
      document.documentElement.classList.remove("light-theme");
    }
  } catch (e) {
    console.log("Theme Init Error", e);
  }
})();

function handleWaitlistSubmit(e) {
  if (e) e.preventDefault();

  const emailInput = document.getElementById("modal-waitlist-email");
  const email = emailInput.value.trim();
  const btn = document.getElementById("modal-waitlist-btn");

  // Check local storage
  const joinedEmails = JSON.parse(
    getStorage("nexus_joined_emails", "[]"),
  );
  if (joinedEmails.includes(email)) {
    document.getElementById("waitlist-modal-form").classList.add("hidden");
    document
      .getElementById("modal-waitlist-already")
      .classList.remove("hidden");
    document
      .getElementById("modal-waitlist-share-btn")
      .classList.remove("hidden");
    return;
  }

  btn.innerText = "Joining...";
  btn.style.opacity = 0.5;
  btn.disabled = true;

  const params = new URLSearchParams();
  params.append("sheet", "Waitlist");
  params.append("Date", new Date().toLocaleString());
  params.append("Email_id", email);

  fetch(GOOGLE_SHEETS_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    body: params,
  })
    .then(() => {
      // Update local storage
      joinedEmails.push(email);
      setStorage("nexus_joined_emails", JSON.stringify(joinedEmails));

      document.getElementById("waitlist-modal-form").classList.add("hidden");
      document
        .getElementById("modal-waitlist-success")
        .classList.remove("hidden");
      document
        .getElementById("modal-waitlist-share-btn")
        .classList.remove("hidden");
      track(`Waitlist Modal Joined: ${email}`);
    })
    .catch((err) => {
      console.error("Waitlist Error:", err);
      document.getElementById("waitlist-modal-form").classList.add("hidden");

      // Modify the success modal visually to represent an error
      const successDiv = document.getElementById("modal-waitlist-success");
      successDiv.innerHTML = `
                      <div class="flex flex-col items-center text-center">
                        <div class="text-red-500 font-black uppercase tracking-[0.2em] text-[15px]">
                          Error
                        </div>
                        <div class="text-red-400 font-bold tracking-wide text-[11px] mt-2">
                          <i class="fa-solid fa-xmark mr-1.5"></i> Connection failed.
                        </div>
                        <div class="opacity-40 text-white font-light lowercase tracking-normal text-[10px] mt-2">
                          Please try again later.
                        </div>
                      </div>
                      <button
                        type="button"
                        onclick="toggleWaitlist(false)"
                        class="group/back flex items-center justify-center px-6 py-2 border border-white/10 rounded-full mx-auto transition-all hover:bg-white/5 hover:border-white/30"
                      >
                        <span class="text-[10px] uppercase tracking-[0.2em] opacity-60 text-white font-bold group-hover/back:opacity-100 transition-opacity">
                          Close
                        </span>
                      </button>
                    `;
      successDiv.classList.remove("hidden");

      document
        .getElementById("modal-waitlist-share-btn")
        .classList.add("hidden");
    });
}

function shareNexus() {
  const shareData = {
    title: "Nexus",
    text: "Join the waitlist for Nexus - the future of empathy.",
    url: window.location.href,
  };

  if (navigator.share) {
    navigator
      .share(shareData)
      .catch((err) => console.error("Error sharing:", err));
  } else {
    // Fallback: Copy to clipboard
    navigator.clipboard
      .writeText(shareData.url)
      .then(() => {
        alert("Link copied to clipboard!");
      })
      .catch((err) => console.error("Error copying link:", err));
  }
}

const GOOGLE_SHEETS_WEBAPP_URL =
  "https://script.google.com/macros/s/AKfycbx7U85zuzD0ayouUPcKZx5XFlMFmAYI8jMtpTATFq0BcC2ARR2SZ-FthZlky-Y5gO0k/exec";

// --- CORE CORE ---
const state = {
  view: "home",
  hits: 0,
  interval: null,
  textSizeIndex: 1, // Default to Small (2nd option)
  themeColorIndex: 0, // Default: White
  fontFamilyIndex: 0, // Default: Sans
  mode: "text", // 'text' or 'audio'
  globalTheme: getStorage("release-theme", "dark"),

  // Audio Context & State
  audioBlob: null,
  isRecording: false,
  isPlaying: false,
  mediaRecorder: null,
  audioChunks: [],
  audioContext: null,
  analyser: null,
  source: null,
  visualizerId: null,
  startTime: null,
  timerInterval: null,
  burnComplete: false,
  hapticsEnabled: true,
  globalTheme: getStorage("release-theme", "dark"),

  // Calm Mode Config
  calmMode: "presets", // "presets" or "custom"
  customBreathing: {
    inhale: 4,
    hold: 4,
    exhale: 4,
    rest: 4,
  },
  calmBaseTime: 4,
  calmRestTime: 4,
  calmHoldTime: 4,
  calmExhaleTime: 4,
  calmPaused: true,
  activeTechniqueIndex: 0,
  calmTechniques: [
    {
      name: "Box",
      inhale: 4,
      hold: 4,
      exhale: 4,
      rest: 4,
      icon: "fa-square",
    },
    {
      name: "4-7-8",
      inhale: 4,
      hold: 7,
      exhale: 8,
      rest: 0,
      icon: "fa-wind",
    },
    {
      name: "Resonant",
      inhale: 5,
      hold: 0,
      exhale: 5,
      rest: 0,
      icon: "fa-wave-square",
    },
    {
      name: "Equal",
      inhale: 4,
      hold: 0,
      exhale: 4,
      rest: 0,
      icon: "fa-arrows-left-right",
    },
    {
      name: "Extended",
      inhale: 4,
      hold: 1,
      exhale: 7,
      rest: 0,
      icon: "fa-arrows-to-dot",
    },
    {
      name: "Belly",
      inhale: 4,
      hold: 0,
      exhale: 6,
      rest: 0,
      icon: "fa-circle-dot",
    },
  ],

  // Animation & Particles
  particles: [],
  particleLoopActive: false,
  canvas: document.getElementById("burn-canvas"),
  ctx: null, // Initialized only if needed for 2D, but we use WebGL now

  // WebGL Burn State
  burnGl: null,
  burnProgram: null,
  burnTexture: null,
  burnProgress: 0,
  burnCount: 0,
  visualIntensity: 0.0,
  fireAnimationEnabled:
    getStorage("fire-animation-enabled", "true") !== "false",
  isSubmittingBurn: false,

  // Cached elements for performance
  el: {
    area: document.getElementById("burn-area"),
    mainBtn: document.getElementById("btn-main-action"),
    timer: document.getElementById("audio-timer"),
    status: document.getElementById("audio-status"),
    visualizer: document.getElementById("audio-visualizer"),
    editorCard: document.getElementById("editor-card"),
    navBar: document.getElementById("nav-bar"),
    burnCanvas: document.getElementById("burn-canvas"),
  },
};

const textSizes = [
  { class: "text-lg md:text-2xl", label: "Tiny" },
  { class: "text-xl md:text-3xl", label: "Small" },
  { class: "text-3xl md:text-5xl", label: "Medium" }, // Default
  { class: "text-4xl md:text-6xl", label: "Large" },
  { class: "text-5xl md:text-7xl", label: "Extra" },
  { class: "text-6xl md:text-8xl", label: "Huge" },
];

const themeColors = [
  {
    isCardDark: true,
    themeColor: "#050505",
    bgClass: "bg-bg-deep",
    cardBg: "bg-text-light/5",
    textClass: "!text-white",
    dotColor: "var(--dot-color)",
    shadowColor: "rgba(0,0,0,0.05)",
    uiBg: "bg-text-light/5",
    uiBorder: "border-text-light/5",
    uiTextMain: "text-text-light",
    uiTextDim: "text-text-light/50",
  }, // Void
  {
    isCardDark: false,
    themeColor: "#fff3e0",
    bgClass: "!bg-[#fff3e0]/80",
    cardBg: "!bg-[#fff3e0]",
    textClass: "!text-gray-900",
    dotColor: "rgba(255,255,255,0.15)",
    shadowColor: "rgba(0,0,0,0.1)",
    uiBg: "bg-black/5",
    uiBorder: "border-black/10",
    uiTextMain: "text-black",
    uiTextDim: "text-black/50",
  }, // Ivory
  {
    isCardDark: false,
    themeColor: "#e5f3e8",
    bgClass: "!bg-[#e5f3e8]/80",
    cardBg: "!bg-[#e5f3e8]",
    textClass: "!text-gray-900",
    dotColor: "rgba(255,255,255,0.15)",
    shadowColor: "rgba(0,0,0,0.1)",
    uiBg: "bg-black/5",
    uiBorder: "border-black/10",
    uiTextMain: "text-black",
    uiTextDim: "text-black/50",
  }, // Mist
  {
    isCardDark: false,
    themeColor: "#dadecf",
    bgClass: "!bg-[#dadecf]/80",
    cardBg: "!bg-[#dadecf]",
    textClass: "!text-gray-900",
    dotColor: "rgba(255,255,255,0.15)",
    shadowColor: "rgba(0,0,0,0.1)",
    uiBg: "bg-black/5",
    uiBorder: "border-black/10",
    uiTextMain: "text-black",
    uiTextDim: "text-black/50",
  }, // Pewter
  {
    isCardDark: true,
    themeColor: "#191738",
    bgClass: "!bg-[#191738]",
    cardBg: "!bg-white/5",
    textClass: "!text-white",
    dotColor: "rgba(255,255,255,0.15)",
    shadowColor: "rgba(0,0,0,0.4)",
    uiBg: "bg-white/5",
    uiBorder: "border-white/5",
    uiTextMain: "text-white",
    uiTextDim: "text-white/50",
  }, // Midnight
];

const fontFamilies = [
  { class: "font-sans", label: "Outfit" },
  { class: "font-serif", label: "Playfair" },
  { class: "font-mono", label: "Mono" },
];

function track(event, properties = {}) {
  console.log(`[Analytics] ${event}`, properties);
  if (typeof posthog !== 'undefined') {
    posthog.capture(event, properties);
    
    // Send a virtual pageview to PostHog for clean funnel/pageview tracking on view change
    if (event.startsWith("App ") && event.endsWith(" Opened")) {
      const viewName = event.substring(4, event.length - 7);
      posthog.capture('$pageview', {
        $current_url: window.location.origin + window.location.pathname + '#' + viewName.toLowerCase(),
        view: viewName.toLowerCase()
      });
    }
  }
}

// --- NAVIGATION ---
function navigate(viewId) {
  document
    .querySelectorAll(".view-container")
    .forEach((v) => v.classList.remove("active"));
  const target = document.getElementById(`view-${viewId}`);
  target.classList.add("active");

  // Hide marketing overlays when navigating
  const calmMarketing = document.getElementById("calm-marketing");
  if (calmMarketing) calmMarketing.classList.add("hidden");
  const burnMarketing = document.getElementById("burn-marketing");
  if (burnMarketing) burnMarketing.classList.add("hidden");

  // Remove old view classes and add current one
  document.body.classList.remove(
    "view-active-home",
    "view-active-burn",
    "view-active-calm",
    "view-active-smash",
  );
  document.body.classList.add(`view-active-${viewId}`);

  state.view = viewId;
  if (window.updateFireBtnVisibility) window.updateFireBtnVisibility();

  // Reset burn intensity when going home
  if (viewId === "home") {
    state.burnCount = 0;
    if (window.liquidBg) window.liquidBg.start();
  }

  // Header state - Dim secondary items, keep logo and waitlist bright
  const nav = document.getElementById("nav-bar");
  const navWaitlist = nav.querySelector('button[onclick*="toggleWaitlist"]');
  const navLogo = nav.querySelector("div[onclick*=\"navigate('home')\"]");
  const navShare = nav.querySelector('button[onclick*="shareLink"]');

  if (viewId === "home") {
    nav.style.opacity = "1";
    if (navShare) navShare.style.opacity = "1";

    // Hide navigation links
    const linkContainer = document.getElementById("nav-links-container");
    if (linkContainer) {
      linkContainer.classList.add("opacity-0");
      setTimeout(() => linkContainer.classList.add("hidden"), 300);
    }

    // Mobile explicit handling: restore background liquid mask
    if (window.innerWidth <= 768) {
      const bgCanvas = document.getElementById("bg-canvas");
      if (bgCanvas && bgCanvas.parentElement) {
        bgCanvas.parentElement.style.opacity = "1";
      }
    }
  } else {
    // Overall header slightly dimmed but important items forced bright
    nav.style.opacity = "1";
    if (navLogo) navLogo.style.opacity = "0.6";
    if (navShare) navShare.style.opacity = "1";
    // Waitlist button stays 100%

    // Show correct navigation link
    const linkContainer = document.getElementById("nav-links-container");
    const linkAir = document.getElementById("nav-link-air");
    const linkAsh = document.getElementById("nav-link-ash");

    if (linkContainer) {
      linkContainer.classList.remove("hidden");
      setTimeout(() => linkContainer.classList.remove("opacity-0"), 10);

      if (viewId === "burn") {
        linkAir.classList.remove("hidden");
        linkAsh.classList.add("hidden");
      } else if (viewId === "calm") {
        linkAsh.classList.remove("hidden");
        linkAir.classList.add("hidden");
      } else {
        linkAir.classList.add("hidden");
        linkAsh.classList.add("hidden");
      }
    }
  }

  // Feature Inits
  if (state.view === "calm" && viewId !== "calm") {
    if (state.interval) {
      clearTimeout(state.interval);
      state.interval = null;
    }
    if (state.timerInterval) {
      clearInterval(state.timerInterval);
      state.timerInterval = null;
    }
  }

  if (viewId === "calm") {
    initCalmPresets();
    // Skip runCalmLoop() to prevent auto-start on page load
    updateCalmStyles();
    if (window.updateFocusMode) window.updateFocusMode();

    // Highlight play button as a cue
    const pauseBtn = document.getElementById("btn-calm-pause");
    if (pauseBtn) {
      pauseBtn.classList.add("play-cue");
      const icon = pauseBtn.querySelector("i");
      if (icon) {
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
      }
    }
  }
  const toolbar = document.querySelector("#editor-card > .absolute.bottom-0");
  if (toolbar) toolbar.classList.remove("opacity-0", "pointer-events-none");

  if (viewId === "burn") {
    setupCanvas();
    // Always show canvas on burn page for scraping effect
    const burnCanvas = document.getElementById("burn-canvas");
    if (burnCanvas) {
      burnCanvas.style.display = "block";
      requestAnimationFrame(renderAtmos);
    }
    // Auto-focus Ash area
    setTimeout(() => {
      const area = document.getElementById("burn-area");
      if (area && state.mode === "text" && !state.isSubmittingBurn) {
        area.focus();
      }
    }, 100);
  } else {
    // Hide canvas on other pages
    const burnCanvas = document.getElementById("burn-canvas");
    if (burnCanvas) burnCanvas.style.display = "none";
  }

  track(`App ${viewId.charAt(0).toUpperCase() + viewId.slice(1)} Opened`);
}

track("App Opened");

let lastCanvasWidth = 0;
let lastCanvasHeight = 0;
function setupCanvas() {
  // Throttle resize events: skip if change is small or happened too recently
  const now = performance.now();
  if (state.lastResizeTime && now - state.lastResizeTime < 100) return;
  state.lastResizeTime = now;

  const widthChanged = Math.abs(window.innerWidth - lastCanvasWidth) > 10;
  const heightChanged = Math.abs(window.innerHeight - lastCanvasHeight) > 100;

  if (!widthChanged && !heightChanged && state.canvas.width > 0) return;

  lastCanvasWidth = window.innerWidth;
  lastCanvasHeight = window.innerHeight;

  const dpr = window.devicePixelRatio || 1;
  state.canvas.width = window.innerWidth * dpr;
  state.canvas.height = window.innerHeight * dpr;

  if (state.burnGl) {
    state.burnGl.viewport(0, 0, state.canvas.width, state.canvas.height);

    // Force render immediately to prevent flicker
    if (state.view === "burn" && !state.isSubmittingBurn && state.burnProgram) {
      const gl = state.burnGl;
      gl.useProgram(state.burnProgram);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      if (state.uBurnTime) {
        gl.uniform1f(state.uBurnTime, performance.now() / 1000);
        gl.uniform1f(state.uBurnProgress, 0);
        gl.uniform1f(state.uBurnIntensity, state.visualIntensity);
        gl.uniform2f(
          state.uBurnResolution,
          state.canvas.width,
          state.canvas.height,
        );
        gl.uniform1f(state.uBurnDpr, window.devicePixelRatio || 1);
        gl.uniform2f(state.uBurnCardPos, -1000, -1000);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
}

function initBurnWebGL() {
  const gl = state.canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: false,
  });
  if (!gl) return;
  state.burnGl = gl;

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const createShader = (gl, type, sourceId) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, document.getElementById(sourceId).text);
    gl.compileShader(shader);
    return shader;
  };

  const vs = createShader(gl, gl.VERTEX_SHADER, "vs-burn");
  const fs = createShader(gl, gl.FRAGMENT_SHADER, "fs-burn");
  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  state.burnProgram = program;
  gl.useProgram(program);

  const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, 1, -1, -1, 1, 1, 1]);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  const posAttrib = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(posAttrib);
  gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);

  state.uBurnTexture = gl.getUniformLocation(program, "uTexture");
  state.uBurnTime = gl.getUniformLocation(program, "uTime");
  state.uBurnProgress = gl.getUniformLocation(program, "uProgress");
  state.uBurnSeed = gl.getUniformLocation(program, "uSeed");
  state.uBurnCardSize = gl.getUniformLocation(program, "uCardSize");
  state.uBurnCardPos = gl.getUniformLocation(program, "uCardPos");
  state.uBurnResolution = gl.getUniformLocation(program, "uResolution");
  state.uBurnIntensity = gl.getUniformLocation(program, "uIntensity");
  state.uBurnDpr = gl.getUniformLocation(program, "uDpr");
}
initBurnWebGL();
renderAtmos();

function renderAtmos() {
  if (state.view !== "burn") {
    state.atmosActive = false;
    return;
  }

  if (state.atmosActive && !arguments[0]) return; // Avoid double loops
  state.atmosActive = true;

  // If we are burning the card, the card animation loop takes over
  if (!state.isSubmittingBurn) {
    const gl = state.burnGl;
    if (gl) {
      gl.useProgram(state.burnProgram);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform1f(state.uBurnTime, performance.now() / 1000);
      gl.uniform1f(state.uBurnProgress, 0); // No card burn

      // Lerp visual intensity for smooth transitions
      // Limit to Dark Mode + Animation Enabled (Bottom ONLY in Dark Mode)
      const isFireActive = state.fireAnimationEnabled;
      const targetIntensity = isFireActive
        ? Math.pow(0.9, state.burnCount)
        : 0.0;
      state.visualIntensity += (targetIntensity - state.visualIntensity) * 0.05;
      gl.uniform1f(state.uBurnIntensity, state.visualIntensity);

      gl.uniform2f(
        state.uBurnResolution,
        state.canvas.width,
        state.canvas.height,
      );
      gl.uniform1f(state.uBurnDpr, window.devicePixelRatio || 1);
      // Hide card uniforms by setting large negative pos
      gl.uniform2f(state.uBurnCardPos, -1000, -1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  }
  requestAnimationFrame(renderAtmos);
}

function createParticle(x, y) {
  return {
    x,
    y,
    vx: (Math.random() - 0.5) * 4,
    vy: (Math.random() - 1.5) * 4,
    life: 1.0,
    size: Math.random() * 4,
  };
}

function renderParticles() {
  // Disabled in favor of WebGL burn effect
  return;
}

function handleMainAction() {
  const area = document.getElementById("burn-area");
  const mainBtn = document.getElementById("btn-main-action");

  // AUDIO MODE
  if (state.mode === "audio") {
    // Case 1: Start Recording
    if (!state.isRecording && !state.audioBlob) {
      toggleRecording();
      return;
    }
    // Case 2: Stop Recording
    if (state.isRecording) {
      stopRecording();
      return;
    }
    // Case 3: Burn It (Recorded)
    if (state.audioBlob) {
      performBurn();
      return;
    }
    return;
  }

  // TEXT MODE
  if (state.mode === "text" && area.value.trim().length > 0) {
    performBurn();
    return;
  }
}
// Expose to window to ensure HTML onclick can see it
window.handleMainAction = handleMainAction;

function performBurn() {
  const area = document.getElementById("burn-area");
  const btn = document.getElementById("btn-main-action");

  // AUDIO MODE BURN
  if (state.mode === "audio") {
    if (!state.audioBlob && !state.isRecording) return;

    track("Audio Ashed");

    // Visual Glitch Effect on Canvas
    const canvas = document.getElementById("audio-visualizer");
    canvas.classList.add(
      "transition-all",
      "duration-[1s]",
      "blur-xl",
      "scale-150",
      "opacity-0",
    );

    state.burnComplete = true;

    setTimeout(() => {
      state.burnCount++;
      resetMode("burn");
      const mkt = document.getElementById("burn-marketing");
      mkt.classList.remove("hidden");

      // Hide footer to prevent overscroll and visual clutter
      const footer = document.getElementById("ash-footer");
      if (footer) footer.classList.add("hidden");

      // Sync scroll with fly-in safely
      setTimeout(() => {
        mkt.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }, 500);
    }, 1000);
    return;
  }

  // TEXT MODE BURN
  if (!area.value.trim() || state.isSubmittingBurn) return;

  state.isSubmittingBurn = true;
  track("Ashed");

  // Instant UI Feedback
  btn.innerHTML = `<i class="fa-solid fa-fire animate-pulse mr-2"></i> Igniting...`;
  btn.classList.add("scale-95");

  if (state.hapticsEnabled && navigator.vibrate) {
    navigator.vibrate(50);
  }

  // Capture the card instantly without html2canvas
  if (!state.burnGl) {
    initBurnWebGL();
  }

  // Start animation loop immediately for flare
  state.burnProgress = 0;
  requestAnimationFrame(animateBurn);

  // Hide inner toolbar during burn
  const toolbar = document.querySelector("#editor-card > .absolute.bottom-0");
  if (toolbar) toolbar.classList.add("opacity-0", "pointer-events-none");

  // HIGH-SPEED CUSTOM TEXT RENDERER
  // Bypasses the synchronous layout engine lag of html2canvas entirely
  const dpr = window.devicePixelRatio || 1;
  const rect = state.el.editorCard.getBoundingClientRect();
  const areaRect = area.getBoundingClientRect();

  // Create offscreen canvas exactly the size of the editor card
  const cardCanvas = document.createElement("canvas");
  cardCanvas.width = rect.width * dpr;
  cardCanvas.height = rect.height * dpr;
  const ctx = cardCanvas.getContext("2d");
  ctx.scale(dpr, dpr);

  // Get exact computed styles from the textarea to mimic it perfectly
  const computed = window.getComputedStyle(area);

  // Draw text
  ctx.font = `${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;
  ctx.fillStyle = computed.color;
  ctx.textBaseline = "top";

  // Calculate Exact Relative Coordinates
  // Text starts at the exact pixel difference between the text area's edge and the parent card's edge
  const fontSize = parseFloat(computed.fontSize);
  const lineHeight = parseFloat(computed.lineHeight) || fontSize * 1.5;

  // In CSS, line-height adds "half-leading" to the top and bottom of every line. We must push the canvas down by this amount.
  const halfLeading = (lineHeight - fontSize) / 2;
  const textStartX =
    areaRect.left -
    rect.left +
    (parseFloat(computed.paddingLeft) || 0) -
    area.scrollLeft;
  const textStartY =
    areaRect.top -
    rect.top +
    (parseFloat(computed.paddingTop) || 0) +
    halfLeading -
    area.scrollTop;

  // Handle basic text wrapping (split by newlines, then by width)
  const text = area.value;
  const lines = text.split("\n");
  let y = textStartY;
  const x = textStartX;
  const maxWidth =
    areaRect.width -
    (parseFloat(computed.paddingLeft) || 0) -
    (parseFloat(computed.paddingRight) || 0);

  lines.forEach((line) => {
    const words = line.split(" ");
    let currentLine = "";

    words.forEach((word) => {
      const testLine = currentLine + word + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && currentLine !== "") {
        ctx.fillText(currentLine, x, y);
        currentLine = word + " ";
        y += lineHeight;
      } else {
        currentLine = testLine;
      }
    });
    ctx.fillText(currentLine, x, y);
    y += lineHeight;
  });

  // Send instant canvas to WebGL
  const gl = state.burnGl;
  const program = state.burnProgram;
  gl.useProgram(program);

  // Create texture
  if (state.burnTexture) gl.deleteTexture(state.burnTexture);
  state.burnTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, state.burnTexture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    cardCanvas,
  );
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  // Set uniforms
  gl.uniform2f(state.uBurnCardSize, rect.width * dpr, rect.height * dpr);
  gl.uniform2f(
    state.uBurnCardPos,
    (rect.left + rect.width / 2) * dpr,
    (rect.top + rect.height / 2) * dpr,
  );
  gl.uniform2f(state.uBurnResolution, state.canvas.width, state.canvas.height);
  gl.uniform1f(state.uBurnDpr, window.devicePixelRatio || 1);
  gl.uniform1f(state.uBurnSeed, Math.random() * 100.0);

  // Hide original card
  state.el.editorCard.classList.add("is-burning");
  btn.classList.remove("scale-95"); // Reset animation state
}

function animateBurn() {
  if (!state.isSubmittingBurn) return;

  // Only increment progress if we have a texture (capture complete)
  if (state.burnTexture) {
    state.burnProgress += 0.013; // Slower than 0.016 previously, faster than original 0.012 for the safe "sweet spot"
  }

  // Substantially reduce the completion threshold to avoid "blank screen" dead zones
  // The card burns away visually completely by ~0.55.
  if (state.burnProgress > 0.55) {
    const gl = state.burnGl;
    state.isSubmittingBurn = false;
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Finish the flow
    state.burnCount++;
    resetMode("burn");
    const mkt = document.getElementById("burn-marketing");
    mkt.classList.remove("hidden");

    const footer = document.getElementById("ash-footer");
    if (footer) footer.classList.add("hidden");

    // Sync scroll with fly-in safely
    setTimeout(() => {
      mkt.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }, 500);

    // Focus the text area so the user can immediately continue typing
    if (state.mode === "text" && state.el.area) {
      setTimeout(() => {
        state.el.area.focus();
      }, 100);
    }
    return;
  }

  const gl = state.burnGl;
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform1f(state.uBurnTime, performance.now() / 1000);
  gl.uniform1f(state.uBurnProgress, state.burnProgress);

  // Lerp visual intensity here too
  // Limit to Dark Mode + Animation Enabled (Bottom ONLY in Dark Mode)
  const isFireActive = state.fireAnimationEnabled;
  const targetIntensity = isFireActive ? Math.pow(0.9, state.burnCount) : 0.0;
  state.visualIntensity += (targetIntensity - state.visualIntensity) * 0.05;
  gl.uniform1f(state.uBurnIntensity, state.visualIntensity);
  gl.uniform1f(state.uBurnDpr, window.devicePixelRatio || 1);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  requestAnimationFrame(animateBurn);
}

// --- AUDIO LOGIC ---
function toggleMode() {
  const btn = document.getElementById("ui-btn-mode");
  const textArea = document.getElementById("burn-area");
  const audioWrapper = document.getElementById("audio-wrapper");

  // Controls containers
  const fontCtrl = document.getElementById("ctrl-font-container");
  const themeCtrl = document.getElementById("ctrl-theme-container");
  const familyCtrl = document.getElementById("ctrl-family-container");
  const hapticMobile = document.getElementById("ctrl-haptic-mobile");

  if (state.mode === "text") {
    state.mode = "audio";
    btn.innerHTML =
      '<i class="fa-solid fa-align-left"></i><span class="hidden sm:inline">Text</span>';

    // Mode Visibility
    fontCtrl.classList.add("hidden");
    themeCtrl.classList.add("hidden");
    familyCtrl.classList.add("hidden");
    hapticMobile.classList.remove("hidden");
    hapticMobile.classList.add("flex");

    // Dynamic adaptation for the toggle button itself
    const isActualDark =
      state.themeColorIndex === 0
        ? state.globalTheme === "dark"
        : themeColors[state.themeColorIndex].isCardDark;
    btn.classList.remove(
      "bg-white/5",
      "bg-black/5",
      "bg-white/20",
      "bg-black/20",
      "opacity-40",
      "opacity-70",
    );
    btn.classList.add(
      isActualDark ? "bg-white/20" : "bg-black/20",
      "opacity-100",
    );

    // Update Main Button for Audio
    document.getElementById("btn-main-action").innerText = "RECORD";

    textArea.classList.add("opacity-0", "pointer-events-none");
    audioWrapper.classList.remove("hidden", "pointer-events-none");
    // Small delay to allow display:block to apply before opacity transition
    setTimeout(() => audioWrapper.classList.remove("opacity-0"), 10);

    if (window.updateMainButtonOpacity) window.updateMainButtonOpacity();
    initAudio();
  } else {
    state.mode = "text";
    btn.innerHTML =
      '<i class="fa-solid fa-microphone"></i><span class="hidden sm:inline">Voice</span>';

    // Mode Visibility
    fontCtrl.classList.remove("hidden");
    themeCtrl.classList.remove("hidden");
    familyCtrl.classList.remove("hidden");
    hapticMobile.classList.add("hidden");
    hapticMobile.classList.remove("flex");

    const isActualDark =
      state.themeColorIndex === 0
        ? state.globalTheme === "dark"
        : themeColors[state.themeColorIndex].isCardDark;
    btn.classList.remove("bg-white/20", "bg-black/20", "opacity-100");
    btn.classList.add(isActualDark ? "bg-white/5" : "bg-black/5", "opacity-70");

    // Update Main Button for Text
    document.getElementById("btn-main-action").innerHTML =
      `<i class="fa-solid fa-fire mr-2 opacity-80"></i><span>Ash It</span><span class="hidden lg:inline-flex items-center opacity-100 mx-2 gap-1.5 translate-y-[1px]"><span class="text-[12px] font-sans">⌘</span><i class="fa-solid fa-plus text-[8px] opacity-70"></i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" class="translate-y-[1px]" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg></span>`;

    audioWrapper.classList.add("opacity-0");
    setTimeout(() => {
      audioWrapper.classList.add("hidden", "pointer-events-none");
      textArea.classList.remove("opacity-0", "pointer-events-none");
      textArea.focus();
    }, 300);

    stopRecording(); // Safety stop

    // Reset Button Style/Opacity for Text mode
    if (window.updateMainButtonOpacity) window.updateMainButtonOpacity();

    // Cleanup Audio Resources
    if (state.source) {
      state.source.mediaStream.getTracks().forEach((track) => track.stop());
      state.source = null;
    }
    if (state.audioContext) {
      state.audioContext.close();
      state.audioContext = null;
    }
  }
}

async function initAudio() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });

    state.audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    state.analyser = state.audioContext.createAnalyser();
    state.source = state.audioContext.createMediaStreamSource(stream);
    state.source.connect(state.analyser);

    state.analyser.fftSize = 256;
    drawVisualizer();

    // MIME Type Detection - Prioritize mp4 for Safari/iOS compatibility
    const mimeTypes = [
      "audio/mp4",
      "audio/mp4;codecs=mp4a",
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/aac",
      "audio/ogg",
      "audio/wav",
    ];
    let selectedMimeType = "";
    for (const type of mimeTypes) {
      if (MediaRecorder.isTypeSupported(type)) {
        selectedMimeType = type;
        break;
      }
    }

    if (!selectedMimeType) {
      console.warn(
        "No standard MIME type supported, letting browser choose default.",
      );
    } else {
      console.log("Initially selected MIME type:", selectedMimeType);
    }

    const options = selectedMimeType ? { mimeType: selectedMimeType } : {};
    state.mediaRecorder = new MediaRecorder(stream, options);

    state.mediaRecorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        state.audioChunks.push(e.data);
      }
    };

    state.mediaRecorder.onerror = (e) => {
      console.error("MediaRecorder Error:", e);
      alert("Recording error: " + e.error.message);
    };

    state.mediaRecorder.onstop = () => {
      // Use the actual mimeType the recorder used
      const finalMimeType =
        state.mediaRecorder.mimeType || selectedMimeType || "audio/webm";
      state.audioBlob = new Blob(state.audioChunks, {
        type: finalMimeType,
      });
      state.audioChunks = [];
      console.log(
        "Recording stopped. Blob created with type:",
        finalMimeType,
        "Size:",
        state.audioBlob.size,
      );
    };
  } catch (err) {
    console.error("Mic Error:", err);
    alert("Microphone access needed for Voice Ash. " + err.message);
    toggleMode(); // Go back to text
  }
}

function toggleRecording() {
  if (!state.mediaRecorder) {
    alert("Microphone not ready. Please allow access and try again.");
    // Attempt re-init if stuck?
    if (state.mode === "audio") initAudio();
    return;
  }

  // const recBtnIndicator = document.getElementById('record-indicator'); // REMOVED
  const statusText = document.getElementById("audio-status");
  // const btnRecord = document.getElementById('btn-record'); // REMOVED
  const mainBtn = document.getElementById("btn-main-action");

  if (state.isRecording) {
    stopRecording();
  } else {
    // Start
    state.isRecording = true;
    // Clear previous blob if any
    state.audioBlob = null;
    state.audioChunks = [];
    document.getElementById("btn-play-audio").classList.add("hidden");
    // document.getElementById('btn-download-audio').classList.add('hidden');

    state.mediaRecorder.start();
    mainBtn.innerText = "STOP"; // Update Main Button
    mainBtn.classList.add("bg-red-600", "animate-pulse"); // Add visual cue

    statusText.innerText = "Recording...";
    statusText.classList.add("text-nexus-orange", "animate-pulse");
    statusText.classList.remove("opacity-40");

    // Timer
    state.startTime = Date.now();
    state.timerInterval = setInterval(updateTimer, 1000);
  }
}

function stopRecording() {
  if (!state.isRecording) return;
  state.isRecording = false;
  if (state.mediaRecorder.state !== "inactive") state.mediaRecorder.stop();

  clearInterval(state.timerInterval);

  state.el.mainBtn.innerHTML =
    '<span>Ash It</span><i class="fa-solid fa-fire ml-2 opacity-50"></i>'; // Update Main Button
  state.el.mainBtn.classList.remove("bg-red-600", "animate-pulse");

  state.el.status.innerText = "Ready to Burn";
  state.el.status.classList.remove("text-nexus-orange", "animate-pulse");
  state.el.status.classList.add("opacity-40");

  // Show Play button
  document.getElementById("btn-play-audio").classList.remove("hidden");
  // document.getElementById('btn-download-audio').classList.remove('hidden');
}

function updateTimer() {
  const diff = Math.floor((Date.now() - state.startTime) / 1000);
  const m = Math.floor(diff / 60)
    .toString()
    .padStart(2, "0");
  const S = (diff % 60).toString().padStart(2, "0");
  state.el.timer.innerText = `${m}:${S}`;
}

function togglePlayback() {
  if (!state.audioBlob || state.audioBlob.size === 0) {
    console.warn("Playback attempted but audioBlob is empty or missing.");
    return;
  }

  const btn = document.getElementById("btn-play-audio");
  const icon = btn.querySelector("i");

  // If currently playing, pause it
  if (state.currentAudio && !state.currentAudio.paused) {
    state.currentAudio.pause();
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
    icon.classList.add("translate-x-1");
    return;
  }

  // If paused or new, play it
  if (!state.currentAudio) {
    console.log("Playing audio blob of type:", state.audioBlob.type);
    const url = URL.createObjectURL(state.audioBlob);
    state.currentAudio = new Audio(url);

    state.currentAudio.onended = () => {
      icon.classList.remove("fa-pause");
      icon.classList.add("fa-play");
      icon.classList.add("translate-x-1");
      state.currentAudio = null;
      URL.revokeObjectURL(url); // Cleanup
    };

    state.currentAudio.onerror = (e) => {
      console.error("Audio Element Error:", state.currentAudio.error);
      alert("Audio Error: " + state.currentAudio.error.message);
    };
  }

  state.currentAudio
    .play()
    .then(() => {
      icon.classList.remove("fa-play");
      icon.classList.remove("translate-x-1");
      icon.classList.add("fa-pause");
    })
    .catch((e) => {
      console.error("Playback failed:", e);
      // Provide more context in the alert
      alert(
        "Playback failed: " +
          e.message +
          " (Type: " +
          state.audioBlob.type +
          ")",
      );
    });
}
window.togglePlayback = togglePlayback;

function resetAudioState() {
  // Stop playback if active
  if (state.currentAudio) {
    state.currentAudio.pause();
    state.currentAudio = null;
  }
  const btn = document.getElementById("btn-play-audio");
  const icon = btn.querySelector("i");
  if (icon) {
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
    icon.classList.add("translate-x-1");
  }

  state.audioBlob = null;
  state.isRecording = false;
  clearInterval(state.timerInterval);
  document.getElementById("audio-timer").innerText = "00:00";
  if (state.hapticsEnabled && navigator.vibrate) navigator.vibrate(50);

  // Reset UI
  const audioWrapper = document.getElementById("audio-wrapper");
  const canvas = document.getElementById("audio-visualizer");
  canvas.classList.remove(
    "transition-all",
    "duration-[1s]",
    "blur-xl",
    "scale-150",
    "opacity-0",
  );
  document.getElementById("audio-status").innerText = "Tap to Record";
  document.getElementById("btn-play-audio").classList.add("hidden");
  // document.getElementById('btn-download-audio').classList.add('hidden');

  // Reset Main Button Text
  if (state.mode === "audio") {
    document.getElementById("btn-main-action").innerText = "RECORD";
  }
}

function drawVisualizer() {
  if (state.mode !== "audio" || !state.analyser) {
    cancelAnimationFrame(state.visualizerId);
    return;
  }

  const canvas = state.el.visualizer;
  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;

  const bufferLength = state.analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  state.analyser.getByteFrequencyData(dataArray);

  ctx.clearRect(0, 0, width, height);

  const barWidth = 2.5; // Fine bars
  const gap = 3;
  const barCount = Math.floor(width / (barWidth + gap));

  const isActualDark =
    state.themeColorIndex === 0
      ? state.globalTheme === "dark"
      : themeColors[state.themeColorIndex].isCardDark;
  const isActive = state.isRecording;

  // Move fillStyle and path initiation out of loop for performance
  if (isActive) {
    ctx.fillStyle = "rgba(255, 69, 0, 0.8)";
  } else if (isActualDark) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  } else {
    ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
  }

  ctx.beginPath();
  const radius = barWidth / 2;

  for (let i = 0; i < barCount; i++) {
    const percent = i / barCount;
    const freqIdx = Math.floor(Math.pow(percent, 0.75) * (bufferLength * 0.7));
    const value = dataArray[freqIdx];

    let barHeight = (value / 255) * height * 1.5;
    if (barHeight < 6) barHeight = 6;
    if (barHeight > height) barHeight = height;

    const x = i * (barWidth + gap);
    const y = (height - barHeight) / 2;

    if (ctx.roundRect) {
      ctx.roundRect(x, y, barWidth, barHeight, radius);
    } else {
      ctx.rect(x, y, barWidth, barHeight);
    }
  }
  ctx.fill();

  state.visualizerId = requestAnimationFrame(drawVisualizer);
}

function resetMode(mode) {
  if (mode === "burn") {
    state.burnComplete = false;
    state.el.area.value = "";

    // Reset Button Style & Text
    if (state.mode === "text") {
      state.el.mainBtn.innerHTML = `<i class="fa-solid fa-fire mr-2 opacity-80"></i><span>Ash It</span><span class="hidden lg:inline-flex items-center opacity-100 mx-2 gap-1.5 translate-y-[1px]"><span class="text-[12px] font-sans">⌘</span><i class="fa-solid fa-plus text-[8px] opacity-70"></i><svg width="11" height="11" viewBox="0 0 24 24" fill="none" class="translate-y-[1px]" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M9 10l-5 5 5 5"/><path d="M20 4v7a4 4 0 0 1-4 4H4"/></svg></span>`;
    } else {
      state.el.mainBtn.innerText = "RECORD";
    }
    state.el.mainBtn.classList.remove("scale-95");
    if (window.updateMainButtonOpacity) window.updateMainButtonOpacity();

    // Reset Audio
    if (state.mode === "audio") {
      resetAudioState();
    }

    // Remove animation classes
    state.el.area.classList.remove(
      "transition-all",
      "duration-[1.5s]",
      "blur-2xl",
      "opacity-0",
      "scale-90",
    );
    state.el.editorCard.classList.remove("is-burning");

    // Re-apply current settings to ensure consistency
    const toolbar = document.querySelector("#editor-card > .absolute.bottom-0");
    if (toolbar) {
      toolbar.classList.remove("opacity-0", "pointer-events-none");
    }
    document.getElementById("burn-marketing").classList.add("hidden");
    const footer = document.getElementById("ash-footer");
    if (footer) footer.classList.remove("hidden");
    if (window.updateMainButtonOpacity) window.updateMainButtonOpacity();
  }
  if (mode === "smash") {
    state.hits = 0;
    document.querySelectorAll(".crack-layer").forEach((c) => c.remove());
    document.getElementById("smash-marketing").classList.add("hidden");
    document.getElementById("smash-hint").innerText =
      "Tap repeatedly to release energy";
  }
}

// --- SMASH IT ---
function triggerHammer(e) {
  if (state.hits >= 10) return;
  state.hits++;
  track("Smashed");

  // Haptic
  if (navigator.vibrate) navigator.vibrate(50);

  // Audio
  const sound = document.getElementById("crack-sound");
  sound.currentTime = 0;
  sound.play().catch((e) => {});

  // Visual
  const crack = document.createElement("img");
  crack.src =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cpath d='M10,10 L30,40 L5,60 M30,40 L60,30 L90,10 M60,30 L70,80 L40,90 M70,80 L95,65' stroke='white' fill='none' stroke-width='0.5'/%3E%3C/svg%3E";
  crack.className = "crack-layer w-40";
  crack.style.left = `${e.clientX - 80}px`;
  crack.style.top = `${e.clientY - 80}px`;
  crack.style.transform = `rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random()})`;
  document.getElementById("view-smash").appendChild(crack);

  document.getElementById("smash-hint").innerText = `${state.hits} / 10`;

  if (state.hits >= 10) {
    setTimeout(() => {
      document.getElementById("smash-marketing").classList.remove("hidden");
    }, 400);
  }
}

// --- CALM IT ---
function initCalmPresets() {
  const list = document.getElementById("calm-presets-list");
  if (!list) return;
  list.innerHTML = state.calmTechniques
    .map(
      (t, idx) => `
                    <div onclick="setTechnique(${idx})" 
                        title="${t.name}"
                        class="preset-pill snap-start flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all backdrop-blur-xl ${
                          state.activeTechniqueIndex === idx
                            ? state.globalTheme === "light"
                              ? "bg-white/30 text-white scale-110 shadow-lg"
                              : "bg-black/20 text-black scale-110 shadow-lg"
                            : state.globalTheme === "light"
                              ? "bg-white/10 text-white/50 hover:bg-white/20"
                              : "bg-white/10 text-black/30 hover:bg-white/20"
                        }">
                        <i class="fa-solid ${t.icon} text-sm"></i>
                    </div>
                `,
    )
    .join("");

  // Set initial active technique
  const tech = state.calmTechniques[state.activeTechniqueIndex];
  document.getElementById("active-technique-name").innerText =
    tech.name + " Breathing";
  updateCalmDisplay();
  initCalmVisualizer();
}
window.initCalmPresets = initCalmPresets;

function setTechnique(idx) {
  state.activeTechniqueIndex = idx;
  const tech = state.calmTechniques[idx];

  // Ensure we switch to Presets mode when a preset is selected
  setCalmMode("presets", true);

  // Update State
  state.calmBaseTime = tech.inhale;
  state.holdTime = tech.hold; // Note: current animate loop uses hold/exhale/rest
  state.calmHoldTime = tech.hold;
  state.calmExhaleTime = tech.exhale;
  state.calmRestTime = tech.rest;

  // Refresh UI
  document.getElementById("active-technique-name").innerText =
    tech.name + " Breathing";
  initCalmPresets(); // Re-render list for active state
  updateCalmStyles();

  // Always force reset to Inhale phase when switching techniques
  runCalmLoop(0, null);

  // If switch happens while paused, ensure internal state is primed for Inhale
  if (state.calmPaused) {
    state.currentCalmPhase = 0;
    state.currentPhaseStartTime = performance.now();
  }

  if (navigator.vibrate) navigator.vibrate(10);
}
window.setTechnique = setTechnique;

function setCalmMode(mode, silent = false) {
  state.calmMode = mode;
  const presetsBtn = document.getElementById("btn-tab-presets");
  const customBtn = document.getElementById("btn-tab-custom");

  const presetsViews = document.querySelectorAll(".calm-presets-view, .calm-presets-hold, .calm-presets-exhale, .calm-presets-rest");
  const customViews = document.querySelectorAll(".calm-custom-view, .calm-custom-hold, .calm-custom-exhale, .calm-custom-rest");

  if (mode === "custom") {
    presetsBtn.classList.remove("text-black", "dark:text-white");
    presetsBtn.classList.add("text-[#666]", "dark:text-[#aaa]");
    customBtn.classList.remove("text-[#666]", "dark:text-[#aaa]");
    customBtn.classList.add("text-black", "dark:text-white");

    presetsViews.forEach(el => {
      el.classList.add("hidden");
      el.classList.remove("flex");
    });
    customViews.forEach(el => {
      el.classList.remove("hidden");
      el.classList.add("flex");
    });

    // Load custom values into active state
    state.calmBaseTime = state.customBreathing.inhale;
    state.calmHoldTime = state.customBreathing.hold;
    state.calmExhaleTime = state.customBreathing.exhale;
    state.calmRestTime = state.customBreathing.rest;
  } else {
    customBtn.classList.remove("text-black", "dark:text-white");
    customBtn.classList.add("text-[#666]", "dark:text-[#aaa]");
    presetsBtn.classList.remove("text-[#666]", "dark:text-[#aaa]");
    presetsBtn.classList.add("text-black", "dark:text-white");

    customViews.forEach(el => {
      el.classList.add("hidden");
      el.classList.remove("flex");
    });
    presetsViews.forEach(el => {
      el.classList.remove("hidden");
      el.classList.add("flex");
    });

    if (!silent) {
      const tech = state.calmTechniques[state.activeTechniqueIndex];
      state.calmBaseTime = tech.inhale;
      state.calmHoldTime = tech.hold;
      state.calmExhaleTime = tech.exhale;
      state.calmRestTime = tech.rest;
    }
  }

  updateCalmDisplay();
  updateCalmStyles();
  if (!silent) runCalmLoop(0, null);
}
window.setCalmMode = setCalmMode;

function adjustCustomTime(type, delta) {
  if (state.calmMode !== "custom") return;

  const val = Math.max(0, Math.min(20, state.customBreathing[type] + delta));
  // Force Inhale/Exhale to be at least 1
  if ((type === "inhale" || type === "exhale") && val < 1) return;

  state.customBreathing[type] = val;

  // Sync to active animation state
  state.calmBaseTime = state.customBreathing.inhale;
  state.calmHoldTime = state.customBreathing.hold;
  state.calmExhaleTime = state.customBreathing.exhale;
  state.calmRestTime = state.customBreathing.rest;

  updateCalmDisplay();
  updateCalmStyles();

  // Restart loop with new timings if active
  if (!state.calmPaused) {
    runCalmLoop(state.currentCalmPhase, null);
  }

  if (navigator.vibrate) navigator.vibrate(5);
}
window.adjustCustomTime = adjustCustomTime;

function updateCalmDisplay() {
  if (document.getElementById("display-inhale"))
    document.getElementById("display-inhale").innerText = state.calmBaseTime;
  if (document.getElementById("display-hold"))
    document.getElementById("display-hold").innerText = state.calmHoldTime;
  if (document.getElementById("display-exhale"))
    document.getElementById("display-exhale").innerText = state.calmExhaleTime;
  if (document.getElementById("display-rest"))
    document.getElementById("display-rest").innerText = state.calmRestTime;
}

function initCalmVisualizer() {
  if (!state.calmVisActive) {
    state.calmVisActive = true;
    requestAnimationFrame(animateCalmVis);
  }
}

function animateCalmVis() {
  if (state.view !== "calm") {
    state.calmVisActive = false;
    return;
  }

  if (state.calmPaused) {
    requestAnimationFrame(animateCalmVis);
    return;
  }

  const ctx = state.calmVisCtx;
  if (!ctx) return;

  const w = state.calmVisWidth;
  const h = state.calmVisHeight;
  ctx.clearRect(0, 0, w, h);

  const tech = state.calmTechniques[state.activeTechniqueIndex];

  // --- Phase Management ---
  const phases = [
    { text: "Inhale", duration: state.calmBaseTime },
    { text: "Hold", duration: state.calmHoldTime },
    { text: "Exhale", duration: state.calmExhaleTime },
    { text: "Rest", duration: state.calmRestTime },
  ].filter((p) => p.duration > 0 || p.text === "Inhale" || p.text === "Exhale");

  let now = performance.now();
  let elapsed = now - state.currentPhaseStartTime;

  // Handle Phase Transition
  if (elapsed >= state.currentPhaseDuration) {
    const overflow = elapsed - state.currentPhaseDuration;
    state.currentCalmPhase = (state.currentCalmPhase + 1) % phases.length;
    const nextPhaseData = phases[state.currentCalmPhase];

    state.currentPhaseDuration = nextPhaseData.duration * 1000;
    state.currentPhaseStartTime = now - overflow;
    elapsed = now - state.currentPhaseStartTime;

    // Update UI Text immediately on transition
    document.getElementById("breathing-txt").innerText = nextPhaseData.text;
  }

  const progress = Math.min(1, elapsed / state.currentPhaseDuration);

  // Update Countdown UI based on high-precision time
  const timeLeftSec = Math.ceil((state.currentPhaseDuration - elapsed) / 1000);
  const countdownEl = document.getElementById("calm-timer-countdown");
  if (countdownEl && countdownEl.innerText != timeLeftSec && timeLeftSec >= 0) {
    countdownEl.innerText = timeLeftSec;
  }

  // Physics/Dynamic Visualization based on technique
  const dot = document.getElementById("calm-dot");
  if (dot) {
    const phase = state.currentCalmPhase;
    let left = "0%",
      top = "100%",
      scale = 1;

    if (phase === 0) {
      // Inhale: Move Up
      left = "0%";
      top = 100 - progress * 100 + "%";
      scale = 0.4 + progress * 0.6;
    } else if (phase === 1) {
      // Hold: Move Right
      left = progress * 100 + "%";
      top = "0%";
      scale = 1;
    } else if (phase === 2) {
      // Exhale: Move Down
      left = "100%";
      top = progress * 100 + "%";
      scale = 1 - progress * 0.6;
    } else if (phase === 3) {
      // Rest: Move Left
      left = 100 - progress * 100 + "%";
      top = "100%";
      scale = 0.4;
    }

    dot.style.left = left;
    dot.style.top = top;
    dot.style.transform = `translate(-50%, -50%) scale(${scale})`;
  }

  requestAnimationFrame(animateCalmVis);
}

function renderBoxVis(ctx, w, h, phase, progress) {
  const size = 200;
  const x = (w - size) / 2;
  const y = (h - size) / 2;

  // Draw Square Path
  ctx.strokeStyle =
    state.globalTheme === "light"
      ? "rgba(255,255,255,0.2)"
      : "rgba(0,0,0,0.05)";
  ctx.lineWidth = 1;
  ctx.strokeRect(x, y, size, size);

  // Dot Position
  let dotX, dotY;
  if (phase === 0) {
    // Inhale (Up)
    dotX = x + progress * size;
    dotY = y;
  } else if (phase === 1) {
    // Hold (Right)
    dotX = x + size;
    dotY = y + progress * size;
  } else if (phase === 2) {
    // Exhale (Bottom)
    dotX = x + size - progress * size;
    dotY = y + size;
  } else {
    // Rest (Left)
    dotX = x;
    dotY = y + size - progress * size;
  }

  // Draw Dot
  ctx.fillStyle =
    state.globalTheme === "light" ? "#ffffff" : "var(--calm-blue)";
  ctx.shadowBlur = 15;
  ctx.shadowColor =
    state.globalTheme === "light"
      ? "rgba(255, 255, 255, 0.5)"
      : "rgba(135, 206, 235, 0.5)";
  ctx.beginPath();
  ctx.arc(dotX, dotY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function renderFlowVis(ctx, w, h, phase, progress) {
  const centerX = w / 2;
  const centerY = h / 2;
  const maxRadius = 120;
  const baseRadius = 60;

  let radius = baseRadius;
  if (phase === 0) {
    // Inhale
    radius = baseRadius + (maxRadius - baseRadius) * progress;
  } else if (phase === 1) {
    // Hold
    radius = maxRadius;
  } else if (phase === 2) {
    // Exhale
    radius = maxRadius - (maxRadius - baseRadius) * progress;
  } else {
    // Rest
    radius = baseRadius;
  }

  // Flowing Gradient Circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  const grd = ctx.createRadialGradient(
    centerX,
    centerY,
    0,
    centerX,
    centerY,
    radius,
  );
  const color =
    state.globalTheme === "light" ? "255, 255, 255" : "135, 206, 235";
  grd.addColorStop(0, `rgba(${color}, 0.2)`);
  grd.addColorStop(1, `rgba(${color}, 0.05)`);
  ctx.fillStyle = grd;
  ctx.fill();

  ctx.strokeStyle = `rgba(${color}, 0.3)`;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function updateCalmStyles() {
  const base = state.calmBaseTime;
  const hold = state.calmHoldTime;
  const exhale = state.calmExhaleTime;
  const rest = state.calmRestTime;
  const total = base + hold + exhale + rest;

  // Update Display Numbers
  if (document.getElementById("display-inhale")) {
    updateCalmDisplay();
  }

  let calmStyle = document.getElementById("dynamic-calm-style");
  if (!calmStyle) {
    calmStyle = document.createElement("style");
    calmStyle.id = "dynamic-calm-style";
    document.head.appendChild(calmStyle);
  }

  calmStyle.innerHTML = `
                    :root { --calm-duration: ${total}s; }
                    .preset-pill { transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1); }
                    .no-scrollbar::-webkit-scrollbar { display: none; }
                    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                `;
}

function adjustRestTime(delta) {
  state.calmRestTime = Math.max(1, Math.min(10, state.calmRestTime + delta));
  document.getElementById("calm-rest-display").innerText = state.calmRestTime;
  updateCalmStyles();
  if (!state.calmPaused) {
    runCalmLoop();
  }
}
window.adjustRestTime = adjustRestTime;

function toggleCalmPause() {
  state.calmPaused = !state.calmPaused;
  const btn = document.getElementById("btn-calm-pause");
  const icon = btn.querySelector("i");

  // Remove the cue once the user interacts
  if (btn) btn.classList.remove("play-cue");

  if (state.calmPaused) {
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
    // Phase-perfect pause handled by the animation loop
  } else {
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
    runCalmLoop(state.currentCalmPhase, state.currentCalmTimeLeft);
  }
  updateCalmStyles();
  if (window.updateFocusMode) window.updateFocusMode();
}
window.toggleCalmPause = toggleCalmPause;

function updateFocusMode() {
  const isFocused = state.view === "calm" && !state.calmPaused;
  if (isFocused) {
    document.body.classList.add("focused-breathing");
  } else {
    document.body.classList.remove("focused-breathing");
  }
}
window.updateFocusMode = updateFocusMode;

function runCalmLoop(startPhase = 0, startTimeLeft = null) {
  const txt = document.getElementById("breathing-txt");
  const countdownEl = document.getElementById("calm-timer-countdown");

  const phases = [
    { text: "Inhale", duration: state.calmBaseTime },
    { text: "Hold", duration: state.calmHoldTime },
    { text: "Exhale", duration: state.calmExhaleTime },
    { text: "Rest", duration: state.calmRestTime },
  ].filter((p) => p.duration > 0 || p.text === "Inhale" || p.text === "Exhale");

  state.currentCalmPhase = startPhase % phases.length;
  const current = phases[state.currentCalmPhase];

  txt.innerText = current.text;

  const timeLeft = startTimeLeft !== null ? startTimeLeft : current.duration;
  state.currentPhaseDuration = current.duration * 1000;
  state.currentPhaseStartTime = performance.now();
  if (startTimeLeft !== null) {
    state.currentPhaseStartTime -= (current.duration - startTimeLeft) * 1000;
  }

  countdownEl.innerText = Math.ceil(timeLeft);

  updateCalmStyles();
  track("Calmed");
}

function finishCalm() {
  if (state.interval) {
    clearTimeout(state.interval);
    clearInterval(state.timerInterval);
    state.interval = null;
  }
  document.getElementById("calm-marketing").classList.remove("hidden");
}

// --- MODAL & SHARE ---
function toggleWaitlist(show) {
  const modal = document.getElementById("waitlist-modal");
  const nav = document.getElementById("nav-bar");
  const shareBtn = document.getElementById("modal-waitlist-share-btn");
  const successModal = document.getElementById("modal-waitlist-success");
  const alreadyModal = document.getElementById("modal-waitlist-already");

  modal.classList.toggle("hidden", !show);
  if (nav) nav.classList.toggle("hidden", show);

  if (show) {
    // If the modal is already in the success or already joined state, keep the share button visible
    if (
      (successModal && !successModal.classList.contains("hidden")) ||
      (alreadyModal && !alreadyModal.classList.contains("hidden"))
    ) {
      if (shareBtn) shareBtn.classList.remove("hidden");
    } else {
      if (shareBtn) shareBtn.classList.add("hidden");
    }
    if (state.view !== "home") navigate("home");
    track("Waitlist Overlay Viewed");
  } else {
    // Hide share button when closing modal
    if (shareBtn) shareBtn.classList.add("hidden");
  }
}

async function shareLink() {
  try {
    await navigator.share({
      title: "Nexus",
      text: "Into the void.",
      url: window.location.href,
    });
  } catch (e) {}
}

function submitInlineWaitlist() {
  const input = document.getElementById("waitlist-email-inline");
  let email = input.value.trim();

  // Sanitization and Strict Validation
  email = email.replace(/[<>]/g, "");
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!email || !emailRegex.test(email)) {
    input.classList.add("border-red-500/50", "text-red-500");
    setTimeout(
      () => input.classList.remove("border-red-500/50", "text-red-500"),
      2000,
    );
    return;
  }

  const joinedEmails = JSON.parse(
    getStorage("nexus_joined_emails", "[]"),
  );
  if (joinedEmails.includes(email)) {
    const container = input.parentElement;
    container.innerHTML = `
                    <div class="w-full py-2 text-nexus-orange font-black uppercase tracking-[0.2em] text-[10px] animate-fade pl-4">
                        <i class="fa-solid fa-circle-info mr-2"></i> Already joined
                    </div>
                `;
    return;
  }

  input.disabled = true;

  const params = new URLSearchParams();
  params.append("sheet", "Waitlist");
  params.append("Date", new Date().toLocaleString());
  params.append("Email_id", email);

  fetch(GOOGLE_SHEETS_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    body: params,
  })
    .then(() => {
      joinedEmails.push(email);
      setStorage("nexus_joined_emails", JSON.stringify(joinedEmails));
      track(`Waitlist Joined: ${email}`);
      const container = input.parentElement;
      container.innerHTML = `
                      <div class="w-full py-2 text-nexus-orange font-black uppercase tracking-[0.2em] text-[10px] animate-fade pl-4">
                          <i class="fa-solid fa-check mr-2"></i> You're on the list
                      </div>
                  `;
    })
    .catch((err) => {
      console.error("Inline Waitlist Error:", err);
      // Show success anyway as no-cors might block actual success signal
      const container = input.parentElement;
      container.innerHTML = `
                      <div class="w-full py-2 text-red-500 font-bold tracking-wide text-[10px] animate-fade pl-4">
                          <i class="fa-solid fa-xmark mr-2"></i> Connection error. Please try again later.
                      </div>
                  `;
      input.disabled = false;
    });
}

window.submitInlineWaitlist = submitInlineWaitlist;

function toggleEditorMenu() {
  const group = document.getElementById("editor-controls-group");
  // Ensure the 'flex' class is added on mobile when not hidden
  if (group.classList.contains("hidden")) {
    group.classList.remove("hidden");
    group.classList.add("flex");
    // Small delay to allow CSS transition
    setTimeout(() => group.classList.remove("opacity-0"), 10);
  } else {
    group.classList.add("opacity-0");
    setTimeout(() => {
      if (group.classList.contains("opacity-0")) {
        group.classList.add("hidden");
        group.classList.remove("flex");
      }
    }, 300);
  }
}
window.toggleEditorMenu = toggleEditorMenu;

// --- PWA Service Worker Registration & Updates ---
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then((reg) => {
        console.log("PWA: SW registered scope:", reg.scope);

        // Auto-update check every 24 hours
        setInterval(
          () => {
            reg.update();
            console.log("PWA: Daily update check...");
          },
          1000 * 60 * 60 * 24,
        );

        // Check for update when app is opened/focused
        window.addEventListener("focus", () => {
          reg.update();
        });

        reg.onupdatefound = () => {
          const installingWorker = reg.installing;
          installingWorker.onstatechange = () => {
            if (
              installingWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              console.log("PWA: New version available.");
            }
          };
        };
      })
      .catch((e) => console.log("PWA: SW registration failed", e));
  });

  // Handle page reload when a new service worker takes control
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (refreshing) return;

    // Don't reload on the very first visit (no controller yet)
    if (!navigator.serviceWorker.controller) return;

    // Don't reload if the installation nudge is currently visible
    const installModal = document.getElementById("install-modal");
    if (installModal && !installModal.classList.contains("hidden")) {
      console.log(
        "PWA: Update available but install modal is active. Delaying refresh.",
      );
      return;
    }

    refreshing = true;
    // Mark that we are refreshing due to an update
    sessionStorage.setItem("pwa-recent-refresh", "true");
    window.location.reload();
  });
}

// --- PWA Installation Modal & Logic ---
let deferredPrompt;
const installModal = document.getElementById("install-modal");
const installModalContent = document.getElementById("install-modal-content");

function toggleInstallModal(show) {
  if (show) {
    installModal.classList.remove("hidden");
    // Small delay to allow CSS transition
    setTimeout(() => {
      installModal.classList.remove("opacity-0", "translate-y-4");
      installModal.classList.add("opacity-100", "translate-y-0");
    }, 10);
  } else {
    // Set the cooldown timestamp only when the user dismisses the nudge
    setStorage("nexus_joined_emails", JSON.stringify(joinedEmails));

    installModal.classList.add("opacity-0", "translate-y-4");
    installModal.classList.remove("opacity-100", "translate-y-0");
    setTimeout(() => installModal.classList.add("hidden"), 300);
  }
}

window.toggleInstallModal = toggleInstallModal;

window.addEventListener("beforeinstallprompt", (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault();
  // Stash the event so it can be triggered later.
  deferredPrompt = e;

  // Show the Install button in the navbar
  const navBtn = document.getElementById("nav-btn-install");
  if (navBtn) {
    navBtn.classList.remove("hidden");
  }

  // Automatically show the nudge once every 24h if installable
  setTimeout(() => {
    // Don't show if we just refreshed for an update in this session
    if (sessionStorage.getItem("pwa-recent-refresh")) return;

    const lastPrompt = getStorage("release-install-last-prompt", null);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastPrompt || now - lastPrompt > oneDay) {
      toggleInstallModal(true);
      // We set it upon closed/install instead of here
    }
  }, 2500);
});

async function promptInstall() {
  if (deferredPrompt) {
    toggleInstallModal(false);
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    track(`Install Prompt Result: ${outcome}`);
    deferredPrompt = null;
    const navBtn = document.getElementById("nav-btn-install");
    if (navBtn && outcome === "accepted") {
      navBtn.classList.add("hidden");
    }
  }
}
window.promptInstall = promptInstall;

// Resize handler
window.addEventListener("resize", setupCanvas);

// Close controls when clicking elsewhere
window.addEventListener("click", (e) => {
  if (
    !e.target.closest("#ctrl-font-container") &&
    !e.target.closest("#ctrl-theme-container") &&
    !e.target.closest("#ctrl-family-container") &&
    !e.target.closest("#btn-mobile-menu") &&
    !e.target.closest("#editor-controls-group")
  ) {
    toggleControl(null);
    const group = document.getElementById("editor-controls-group");
    if (group && !group.classList.contains("hidden")) {
      group.classList.add("opacity-0");
      setTimeout(() => {
        if (group.classList.contains("opacity-0"))
          group.classList.add("hidden");
      }, 300);
    }
  }
});

// --- EDITOR CONTROLS ---
function toggleControl(id) {
  const fontControl = document.getElementById("ctrl-font");
  const themeControl = document.getElementById("ctrl-theme");

  if (id === null) {
    fontControl.classList.remove("w-32");
    fontControl.classList.add("w-0");
    themeControl.classList.remove("w-32", "pl-4");
    themeControl.classList.add("w-0");
    if (document.getElementById("ctrl-family")) {
      document.getElementById("ctrl-family").classList.remove("w-32", "pl-4");
      document.getElementById("ctrl-family").classList.add("w-0");
    }
    return;
  }

  const el = document.getElementById(id);
  // Close others
  if (id === "ctrl-font") {
    themeControl.classList.remove("w-32", "pl-4");
    themeControl.classList.add("w-0");
    if (document.getElementById("ctrl-family")) {
      document.getElementById("ctrl-family").classList.remove("w-32", "pl-4");
      document.getElementById("ctrl-family").classList.add("w-0");
    }
  } else if (id === "ctrl-family") {
    fontControl.classList.remove("w-32");
    fontControl.classList.add("w-0");
    themeControl.classList.remove("w-32", "pl-4");
    themeControl.classList.add("w-0");
  } else {
    fontControl.classList.remove("w-32");
    fontControl.classList.add("w-0");
    if (document.getElementById("ctrl-family")) {
      document.getElementById("ctrl-family").classList.remove("w-32", "pl-4");
      document.getElementById("ctrl-family").classList.add("w-0");
    }
  }

  // Toggle current
  if (id === "ctrl-font") {
    if (el.classList.contains("w-0")) {
      el.classList.remove("w-0");
      el.classList.add("w-32");
    } else {
      el.classList.add("w-0");
      el.classList.remove("w-32");
    }
  } else if (id === "ctrl-theme") {
    // Theme
    if (el.classList.contains("w-0")) {
      el.classList.remove("w-0");
      el.classList.add("w-32", "pl-4");
    } else {
      el.classList.add("w-0");
      el.classList.remove("w-32", "pl-4");
    }
  } else {
    // Family
    if (el.classList.contains("w-0")) {
      el.classList.remove("w-0");
      el.classList.add("w-32", "pl-4");
    } else {
      el.classList.add("w-0");
      el.classList.remove("w-32", "pl-4");
    }
  }
}

function toggleHaptics() {
  state.hapticsEnabled = !state.hapticsEnabled;

  // Update new mobile haptic icon
  const iconMobile = document.getElementById("icon-haptic-mobile");
  if (iconMobile) {
    if (state.hapticsEnabled) {
      iconMobile.classList.remove("text-white/50");
      iconMobile.classList.add(
        "text-white",
        "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]",
      );
      if (navigator.vibrate) navigator.vibrate(50);
    } else {
      iconMobile.classList.add("text-white/50");
      iconMobile.classList.remove(
        "text-white",
        "drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]",
      );
    }
  }

  // Legacy button
  const btn = document.getElementById("ui-btn-haptic");
  if (btn) {
    if (state.hapticsEnabled) {
      btn.classList.add("opacity-100");
      btn.classList.remove("opacity-40");
      if (navigator.vibrate && !iconMobile) navigator.vibrate(50);
    } else {
      btn.classList.remove("opacity-100");
      btn.classList.add("opacity-40");
    }
  }
  track(`Haptics Toggled: ${state.hapticsEnabled}`);
}
window.toggleHaptics = toggleHaptics;

function changeTextSize(val) {
  // If val is provided, use it (slider). Otherwise cycle (button fallback, though button is removed)
  const area = document.getElementById("burn-area");

  // Remove current size class
  area.classList.remove(...textSizes[state.textSizeIndex].class.split(" "));

  if (val !== undefined) {
    state.textSizeIndex = parseInt(val);
  } else {
    // Cycle index (fallback)
    state.textSizeIndex = (state.textSizeIndex + 1) % textSizes.length;
  }

  // Add new size class
  area.classList.add(...textSizes[state.textSizeIndex].class.split(" "));
  track(`Text Size Changed`);
}

function changeFontFamily(index) {
  const area = document.getElementById("burn-area");

  // Remove current family class
  area.classList.remove("font-sans", "font-serif", "font-mono");
  area.style.fontFamily = ""; // Clear inline if any

  if (index !== undefined) {
    state.fontFamilyIndex = index;
  } else {
    state.fontFamilyIndex = (state.fontFamilyIndex + 1) % fontFamilies.length;
  }

  const family = fontFamilies[state.fontFamilyIndex];
  area.classList.add(family.class);

  // Explicitly set for standard Tailwind fonts if needed, or specific Google Fonts
  if (family.class === "font-serif")
    area.style.fontFamily = '"Playfair Display", serif';
  if (family.class === "font-mono")
    area.style.fontFamily = '"JetBrains Mono", monospace';
  if (family.class === "font-sans")
    area.style.fontFamily = '"Outfit", sans-serif';

  track(`Font Family Changed to ${family.label}`);
}

function changeThemeColor(index) {
  const view = document.getElementById("view-burn");
  const card = document.getElementById("editor-card");
  const area = document.getElementById("burn-area");

  // Remove current classes
  view.classList.remove(themeColors[state.themeColorIndex].bgClass);
  card.classList.remove(themeColors[state.themeColorIndex].cardBg);

  // Card no longer has theme bg directly (it's glass now)

  // Set new index
  if (index !== undefined) {
    state.themeColorIndex = index;
  } else {
    state.themeColorIndex = (state.themeColorIndex + 1) % themeColors.length;
  }

  // Add new classes
  view.classList.add(themeColors[state.themeColorIndex].bgClass);
  card.classList.add(themeColors[state.themeColorIndex].cardBg);

  // Update CSS Variable for dot pattern and shadow
  view.style.setProperty(
    "--dot-color",
    themeColors[state.themeColorIndex].dotColor,
  );
  card.style.setProperty(
    "--shadow-color",
    themeColors[state.themeColorIndex].shadowColor,
  );

  // --- DYNAMIC UI UPDATES ---
  const t = themeColors[state.themeColorIndex];

  // Determine if the theme's background is ACTUALLY dark right now
  let isActualDark = t.isCardDark;
  if (state.themeColorIndex === 0) {
    // Void theme
    isActualDark = state.globalTheme === "dark";
  } else if (state.themeColorIndex === 4) {
    // Midnight theme
    isActualDark = true;
  }

  // Adaptive properties based on actual darkness
  // Adaptive properties based on actual darkness
  document.body.setAttribute(
    "data-theme-context",
    isActualDark ? "dark" : "light",
  );

  const activeUiBg = isActualDark ? "bg-white/5" : "bg-black/5";
  const activeUiBorder = isActualDark ? "border-white/5" : "border-black/5";
  const activeHover = isActualDark ? "hover:bg-white/10" : "hover:bg-black/10";
  const activeTextMain = isActualDark ? "text-white" : "text-black";
  const activeTextDim = isActualDark ? "text-white/50" : "text-black/50";
  const activeHoverIcon = isActualDark
    ? "hover:text-white/80"
    : "hover:text-black/80";

  const uiNodes = [
    document.getElementById("ui-btn-back"),
    document.getElementById("ctrl-font-container"),
    document.getElementById("ctrl-theme-container"),
    document.getElementById("ctrl-family-container"),
  ];

  const iconNodes = [
    document.getElementById("ui-icon-font"),
    document.getElementById("ui-icon-theme"),
    document.getElementById("ui-icon-family"),
  ];

  const textNodes = [
    document.getElementById("ui-text-project"),
    document.getElementById("burn-area"),
    ...document.querySelectorAll(
      "#view-burn h1, #view-burn h1 span, #view-burn p",
    ),
  ];

  const dimNodes = [
    document.getElementById("ui-text-release"),
    document.getElementById("ui-text-footer"),
    document.getElementById("audio-status"),
  ];

  const accentNodes = [document.getElementById("audio-timer")];

  // 1. Buttons & Containers
  uiNodes.forEach((el) => {
    if (!el) return;
    el.classList.remove(
      "bg-white/5",
      "bg-black/5",
      "border-white/5",
      "border-black/5",
      "text-white",
      "text-black",
      "hover:bg-white/10",
      "hover:bg-black/10",
      "bg-text-light/5",
      "border-text-light/5",
    );
    el.classList.add(activeUiBg, activeUiBorder, activeHover);
  });

  // 2. Control Icons
  iconNodes.forEach((el) => {
    if (!el) return;
    el.classList.remove(
      "text-white/50",
      "text-black/50",
      "hover:text-white/80",
      "hover:text-black/80",
    );
    el.classList.add(activeTextDim, activeHoverIcon);
  });

  // 3. Main UI Text
  textNodes.forEach((el) => {
    if (!el) return;
    el.classList.remove(
      "text-white",
      "text-black",
      "text-text-light",
      "!text-white",
      "!text-gray-900",
      "!text-gray-200",
    );
    el.classList.add(activeTextMain);
    // Force high contrast for headings, paragraphs, and textareas
    if (
      el.tagName === "H1" ||
      el.tagName === "P" ||
      el.tagName === "SPAN" ||
      el.tagName === "TEXTAREA"
    ) {
      el.style.color = isActualDark
        ? "rgba(255,255,255,0.95)"
        : "rgba(0,0,0,0.95)";
      // Handle shiny tagline gradient override
      if (el.id === "shiny-tagline-burn") {
        if (isActualDark) {
          el.style.background = `linear-gradient(-35deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.95) 40%, var(--nexus-orange) 50%, rgba(255,255,255,0.95) 60%, rgba(255,255,255,0.95) 100%)`;
        } else {
          el.style.background = `linear-gradient(-35deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.95) 40%, var(--nexus-orange) 50%, rgba(0,0,0,0.95) 60%, rgba(0,0,0,0.95) 100%)`;
        }
        el.style.backgroundSize = "400% auto";
        el.style.webkitBackgroundClip = "text";
        el.style.backgroundClip = "text";
      }
    }
  });

  // 4. Dim UI Text
  dimNodes.forEach((el) => {
    if (!el) return;
    el.classList.remove("text-white/50", "text-black/50", "text-text-light/50");
    el.classList.add(activeTextDim);
  });

  // 5. Accent UI Text (Timer)
  accentNodes.forEach((el) => {
    if (!el) return;
    el.classList.remove(
      "text-white",
      "text-black",
      "text-text-light",
      "text-white/50",
      "text-black/50",
    );
    el.classList.add(activeTextMain);
    // Slight dim for timer but still high contrast
    el.style.opacity = "0.8";
  });

  // 5. Placeholder & Selection Dynamic Style
  let styleEl = document.getElementById("dynamic-theme-style");
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "dynamic-theme-style";
    document.head.appendChild(styleEl);
  }

  // If theme index is 0 (Void), placeholder darkness follows global theme
  const isDark = isActualDark;
  const phColor = isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)";
  const phStroke = isDark
    ? "1px rgba(255, 255, 255, 0.3)"
    : "1px rgba(0, 0, 0, 0.5)";
  const selectionBg = isDark
    ? "rgba(255, 69, 0, 0.3)"
    : "rgba(255, 69, 0, 0.2)";
  const shinyBase = "#fff";

  styleEl.textContent = `
                    #burn-area::placeholder {
                        color: ${phColor};
                        opacity: 0.8;
                        font-weight: 300;
                    }
                    ::selection {
                        background: ${selectionBg};
                    }
                    .active-theme-ring {
                        box-shadow: 0 0 0 2px var(--nexus-orange);
                        transform: scale(1.2);
                    }
                `;

  // 6. Highlight active theme button
  const themeContainer = document.getElementById("ctrl-theme");
  if (themeContainer) {
    themeContainer.querySelectorAll("button").forEach((btn, idx) => {
      if (idx === state.themeColorIndex) {
        btn.classList.add("active-theme-ring");
      } else {
        btn.classList.remove("active-theme-ring");
      }
    });
  }

  // 7. Adaptive colors for Mode Toggles
  const modeToggles = [
    document.getElementById("ui-btn-mode"),
    document.getElementById("ui-btn-haptic"),
  ];
  modeToggles.forEach((btn) => {
    if (!btn) return;
    // Force high contrast: 85% opacity text and 25% opacity border
    btn.style.color = isActualDark
      ? "rgba(255,255,255,0.85)"
      : "rgba(0,0,0,0.85)";
    btn.classList.remove(
      "border-white/5",
      "border-black/5",
      "border-white/20",
      "border-black/20",
    );
    btn.style.borderColor = isActualDark
      ? "rgba(255,255,255,0.25)"
      : "rgba(0,0,0,0.25)";
  });

  // Style Audio Play Control - Standard Grey
  const playBtn = document.getElementById("btn-play-audio");
  if (playBtn) {
    playBtn.style.backgroundColor = isActualDark
      ? "rgba(255,255,255,0.1)"
      : "rgba(0,0,0,0.1)";
    playBtn.style.borderColor = isActualDark
      ? "rgba(255,255,255,0.2)"
      : "rgba(0,0,0,0.2)";
    const playIcon = playBtn.querySelector("i");
    if (playIcon) {
      playIcon.style.color = isActualDark
        ? "rgba(255,255,255,0.85)"
        : "rgba(0,0,0,0.85)";
    }
  }

  // 8. Update Theme Color Meta Tag
  let currentHex = t.themeColor;
  if (state.themeColorIndex === 0) {
    currentHex = state.globalTheme === "light" ? "#ffffff" : "#050505";
  }
  const metaTheme = document.getElementById("theme-color-meta");
  if (metaTheme) metaTheme.setAttribute("content", currentHex);
  const navMeta = document.querySelector(
    'meta[name="msapplication-navbutton-color"]',
  );
  if (navMeta) navMeta.setAttribute("content", currentHex);

  if (window.initCalmPresets) window.initCalmPresets();
  track(`Theme Color Changed`);
}

// Export to window for HTML onclicks
window.navigate = navigate;
window.performBurn = performBurn;
window.resetMode = resetMode;
window.triggerHammer = triggerHammer;
window.toggleMode = toggleMode;
window.toggleRecording = toggleRecording;
window.finishCalm = finishCalm;
window.toggleWaitlist = toggleWaitlist;
window.shareLink = shareLink;
window.changeTextSize = changeTextSize;
window.changeThemeColor = changeThemeColor;
window.toggleControl = toggleControl;

function toggleGlobalTheme() {
  state.globalTheme = state.globalTheme === "dark" ? "light" : "dark";
  applyGlobalTheme();
  setStorage("release-theme", state.globalTheme);
  track(`Global Theme Toggled: ${state.globalTheme}`);
}
window.toggleGlobalTheme = toggleGlobalTheme;

function applyGlobalTheme() {
  const body = document.body;
  const icon = document.getElementById("theme-icon");
  const burnCanvas = document.getElementById("burn-canvas");

  if (state.globalTheme === "light") {
    body.classList.add("light-theme");
    if (icon) {
      icon.classList.remove("fa-moon");
      icon.classList.add("fa-sun");
    }
    // Ensure burn canvas is shown if on burn page (for scrape effect)
    if (burnCanvas)
      burnCanvas.style.display = state.view === "burn" ? "block" : "none";
  } else {
    body.classList.remove("light-theme");
    if (icon) {
      icon.classList.remove("fa-sun");
      icon.classList.add("fa-moon");
    }
    // Ensure burn canvas is shown immediately if not light theme AND on burn page
    if (burnCanvas) {
      burnCanvas.style.display = state.view === "burn" ? "block" : "none";
    }
  }

  const isLight = state.globalTheme === "light";
  document.documentElement.classList.toggle("light-theme", isLight);
  document.documentElement.classList.toggle("dark-theme", !isLight);

  const themeColor = isLight ? "#f8f9fa" : "#050505";

  // Update Marketing Card Colors if visible
  const beam = document.getElementById("marketing-beam");
  const inner = document.getElementById("marketing-pill-inner");
  const emailInput = document.getElementById("waitlist-email-inline");
  if (beam && inner && emailInput) {
    if (state.globalTheme === "dark") {
      // Dark Mode: Swap white border with orange, and orange beam with yellowish
      beam.style.background =
        "conic-gradient(from 0deg, transparent 0%, #ffcc00 10%, transparent 20%)"; // Yellowish
      inner.style.borderColor = "#ff6633"; // Orange border
      inner.classList.replace("bg-white", "bg-black/80");
      inner.classList.add("backdrop-blur-xl");

      emailInput.classList.replace("text-black", "text-white");
      emailInput.classList.remove("placeholder:text-black/40");
      emailInput.classList.add("placeholder:text-white/40");
    } else {
      // Light Mode: Default colors
      beam.style.background =
        "conic-gradient(from 0deg, transparent 0%, #ff6633 10%, transparent 20%)"; // Orange
      inner.style.borderColor = "rgba(255,255,255,0.05)";
      inner.classList.replace("bg-black/80", "bg-white");
      inner.classList.remove("backdrop-blur-xl");

      emailInput.classList.replace("text-white", "text-black");
      emailInput.classList.remove("placeholder:text-white/40");
      emailInput.classList.add("placeholder:text-black/40");
    }
  }

  // Ash It Flash Fix: Reset intensity instantly to avoid flash/fade-in transitions
  const isFireActive =
    state.globalTheme === "dark" && state.fireAnimationEnabled;
  state.visualIntensity = isFireActive ? Math.pow(0.9, state.burnCount) : 0.0;

  if (state.view === "burn" && !state.isSubmittingBurn) {
    renderAtmos();
  }

  // Update Theme Color
  let currentHex = isLight ? "#f8f9fa" : "#050505";
  // Only use global theme color if we're in Void mode (index 0)
  if (state.themeColorIndex !== 0) {
    currentHex = themeColors[state.themeColorIndex].themeColor;
  }

  const metaTheme = document.getElementById("theme-color-meta");
  if (metaTheme) metaTheme.setAttribute("content", currentHex);
  const navMeta = document.querySelector(
    'meta[name="msapplication-navbutton-color"]',
  );
  if (navMeta) navMeta.setAttribute("content", currentHex);

  // Refresh Ash page theme if it exists
  if (typeof changeThemeColor === "function")
    changeThemeColor(state.themeColorIndex);
  if (window.updateFireBtnVisibility) window.updateFireBtnVisibility();
  if (window.initCalmPresets) window.initCalmPresets();
}
window.applyGlobalTheme = applyGlobalTheme;

function setMainButtonStyle(style) {
  const btn = document.getElementById("btn-main-action");
  if (!btn) return;
  if (style === "secondary") {
    btn.classList.add(
      "glass-card",
      "btn-secondary",
      "opacity-50",
      "bg-white/10",
      "hover:bg-white/20",
    );
    btn.classList.remove(
      "bg-nexus-orange",
      "text-white",
      "shadow-[0_0_30px_rgba(255,68,0,0.3)]",
      "hover:shadow-[0_0_50px_rgba(255,68,0,0.5)]",
      "text-black",
      "text-white/80",
      "text-black/80",
    );
  } else {
    btn.classList.remove(
      "glass-card",
      "opacity-50",
      "btn-secondary",
      "bg-white/10",
      "hover:bg-white/20",
    );
    // Text color is explicitly white for primary orange button
    btn.classList.add(
      "bg-nexus-orange",
      "text-white",
      "shadow-[0_0_30px_rgba(255,68,0,0.3)]",
      "hover:shadow-[0_0_50px_rgba(255,68,0,0.5)]",
    );
  }
}
window.setMainButtonStyle = setMainButtonStyle;

const area = document.getElementById("burn-area");
area.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key === "Enter") {
    e.preventDefault();
    handleMainAction();
  }
});

const mainBtn = document.getElementById("btn-main-action");

function updateMainButtonOpacity(isHover = false) {
  if (state.mode === "audio") {
    setMainButtonStyle("primary");
    mainBtn.style.opacity = "1";
    mainBtn.style.pointerEvents = "auto";
    mainBtn.disabled = false;
    return;
  }

  const hasText = area.value.trim().length > 0;

  if (hasText) {
    setMainButtonStyle("primary");
    mainBtn.style.pointerEvents = "auto";
    mainBtn.disabled = false;
  } else {
    setMainButtonStyle("secondary");
    mainBtn.style.pointerEvents = "none";
    mainBtn.disabled = true;
  }
}

area.addEventListener("input", () => updateMainButtonOpacity());
mainBtn.addEventListener("mouseenter", () => updateMainButtonOpacity(true));
mainBtn.addEventListener("mouseleave", () => updateMainButtonOpacity(false));

// Initialize Opacity
updateMainButtonOpacity();
window.updateMainButtonOpacity = updateMainButtonOpacity;

// Initialize Theme
// Initial Themes
changeThemeColor(state.themeColorIndex);
changeTextSize(1);
applyGlobalTheme(); // Ensure UI state matches stored theme
navigate("home");

// Attach to window for HTML access
window.navigate = navigate;
window.handleMainAction = handleMainAction;
window.toggleRecording = toggleRecording;
window.toggleControl = toggleControl;
window.changeThemeColor = changeThemeColor;
window.changeTextSize = changeTextSize;
window.changeFontFamily = changeFontFamily;
window.shareLink = shareLink;
window.toggleWaitlist = toggleWaitlist;
window.submitInlineWaitlist = submitInlineWaitlist;
window.performBurn = performBurn;
window.resetMode = resetMode;
window.stopRecording = stopRecording;
window.state = state;

// --- FEEDBACK LOGIC ---
const stateRatings = { ash: 0, air: 0 };

function toggleFeedbackModal(show) {
  const modal = document.getElementById("feedback-modal");
  const content = document.getElementById("feedback-modal-content");
  if (show) {
    modal.classList.remove("hidden");
    // Force reflow
    void modal.offsetWidth;
    modal.classList.remove("opacity-0");
    content.classList.remove("scale-95", "opacity-0");
    content.classList.add("scale-100", "opacity-100");
  } else {
    modal.classList.add("opacity-0");
    content.classList.remove("scale-100", "opacity-100");
    content.classList.add("scale-95", "opacity-0");
    setTimeout(() => {
      modal.classList.add("hidden");
    }, 300);
  }
}
window.toggleFeedbackModal = toggleFeedbackModal;

function setRating(tool, value) {
  stateRatings[tool] = value;
  const stars = document.querySelectorAll(`#rating-${tool} i`);
  const activeColor = tool === "ash" ? "text-nexus-orange" : "text-calm-blue";
  stars.forEach((star, index) => {
    if (index < value) {
      star.classList.remove("text-white/10");
      star.classList.add(activeColor);
      star.style.textShadow = `0 0 10px var(--${tool === "ash" ? "nexus-orange" : "calm-blue"})`;
      star.classList.add("scale-110");
    } else {
      star.classList.remove(activeColor, "scale-110");
      star.classList.add("text-white/10");
      star.style.textShadow = "none";
    }
  });
}
window.setRating = setRating;

function submitFeedback() {
  const btn = document.getElementById("btn-submit-feedback");
  const msg = document.getElementById("feedback-success-msg");
  const text = document.getElementById("feedback-text").value;

  btn.innerText = "Sending...";
  btn.style.opacity = 0.5;
  btn.disabled = true;

  const params = new URLSearchParams();
  params.append("sheet", "Feedback");
  params.append("Date", new Date().toLocaleString());
  params.append("Ash_Rating", stateRatings["ash"]);
  params.append("Air_Rating", stateRatings["air"]);
  params.append("Feedback_text", text);

  fetch(GOOGLE_SHEETS_WEBAPP_URL, {
    method: "POST",
    mode: "no-cors",
    body: params,
  })
    .then(() => {
      setTimeout(() => {
        btn.classList.add("hidden");
        msg.classList.remove("hidden");
        setTimeout(() => msg.classList.remove("opacity-0"), 10);

        setTimeout(() => {
          setRating("ash", 0);
          setRating("air", 0);
          document.getElementById("feedback-text").value = "";
          btn.classList.remove("hidden");
          btn.innerText = "Send Feedback";
          btn.style.opacity = 1;
          btn.disabled = false;
          msg.classList.add("opacity-0", "hidden");
        }, 10000);
      }, 800);
    })
    .catch((err) => {
      console.error("Feedback Error:", err);
      // Show error message
      msg.innerHTML = `
              <div class="text-xs text-red-500 font-bold tracking-widest">
                <i class="fa-solid fa-xmark mr-2"></i> Connection Failed.
              </div>
            `;
      btn.classList.add("hidden");
      msg.classList.remove("hidden");
      setTimeout(() => msg.classList.remove("opacity-0"), 10);

      setTimeout(() => {
        btn.classList.remove("hidden");
        btn.innerText = "Send Feedback";
        btn.style.opacity = 1;
        btn.disabled = false;
        msg.classList.add("opacity-0", "hidden");
        // Restore original success message HTML for future use
        setTimeout(() => {
          msg.innerHTML = `
                  <div class="text-xs text-nexus-orange font-bold uppercase tracking-widest">
                    <i class="fa-solid fa-check mr-2"></i> Received. Thank you.
                  </div>
                  <button
                    onclick="
                      toggleFeedbackModal(false);
                      toggleWaitlist(true);
                    "
                    class="text-[10px] uppercase tracking-[0.2em] font-normal text-white/50 hover:text-white transition-colors border-b border-white/20 hover:border-white pb-1"
                  >
                    Join the Waitlist
                  </button>
                `;
        }, 300);
      }, 5000);
    });
}
window.submitFeedback = submitFeedback;

// --- END CORE ---

function toggleFireAnimation() {
  state.fireAnimationEnabled = !state.fireAnimationEnabled;
  setStorage("fire-animation-enabled", state.fireAnimationEnabled);
  updateFireToggleUI();
  if (state.view === "burn" && !state.isSubmittingBurn) {
    renderAtmos();
  }
}

function updateFireToggleUI() {
  const btn = document.getElementById("ui-btn-fire");
  const icon = document.getElementById("fire-toggle-icon");
  if (state.fireAnimationEnabled) {
    btn.classList.remove("opacity-20");
    btn.classList.add("opacity-100", "text-nexus-orange");
    icon.className = "fa-solid fa-fire-flame-curved text-xs";
  } else {
    btn.classList.add("opacity-20");
    btn.classList.remove("opacity-100", "text-nexus-orange");
    icon.className = "fa-solid fa-fire-flame-simple text-xs";
  }
}

function updateFireBtnVisibility() {
  const btn = document.getElementById("ui-btn-fire");
  if (!btn) return;
  const isBurnPage = state.view === "burn";

  if (isBurnPage) {
    btn.classList.remove("hidden");
    // Enable fire animation by default when entering Ash It page
    state.fireAnimationEnabled = true;
    updateFireToggleUI();
  } else {
    btn.classList.add("hidden");
  }
}

window.toggleFireAnimation = toggleFireAnimation;
window.updateFireBtnVisibility = updateFireBtnVisibility;

// Initialize UI states
document.addEventListener("DOMContentLoaded", () => {
  updateFireToggleUI();
  updateFireBtnVisibility();
  const area = document.getElementById("burn-area");
  if (area) area.focus();
});

(function () {
  const isMobile = window.innerWidth <= 768;
  const criticalImages = isMobile
    ? ["index/916/white.jpeg", "index/916/blue_butterfly.webp"]
    : ["index/white.jpeg", "index/blue_butterfly.webp"];

  criticalImages.forEach((src) => {
    const img = new Image();
    img.src = src;
  });
})();

// --- AUTO-GENERATED EVENT LISTENERS FOR CSP COMPLIANCE ---
function initCSPListeners() {
  const el_btn_auto_1 = document.getElementById('btn-auto-1');
  if (el_btn_auto_1) {
    el_btn_auto_1.addEventListener('click', (event) => {
      toggleWaitlist(false)
    });
  }

  const el_btn_auto_2 = document.getElementById('btn-auto-2');
  if (el_btn_auto_2) {
    el_btn_auto_2.addEventListener('click', (event) => {
      toggleWaitlist(false)
    });
  }

  const el_modal_waitlist_share_btn = document.getElementById('modal-waitlist-share-btn');
  if (el_modal_waitlist_share_btn) {
    el_modal_waitlist_share_btn.addEventListener('click', (event) => {
      shareLink()
    });
  }

  const el_btn_auto_3 = document.getElementById('btn-auto-3');
  if (el_btn_auto_3) {
    el_btn_auto_3.addEventListener('click', (event) => {
      toggleInstallModal(false)
    });
  }

  const el_btn_auto_4 = document.getElementById('btn-auto-4');
  if (el_btn_auto_4) {
    el_btn_auto_4.addEventListener('click', (event) => {
      promptInstall()
    });
  }

  const el_btn_auto_5 = document.getElementById('btn-auto-5');
  if (el_btn_auto_5) {
    el_btn_auto_5.addEventListener('click', (event) => {
      toggleInstallModal(false)
    });
  }

  const el_btn_auto_6 = document.getElementById('btn-auto-6');
  if (el_btn_auto_6) {
    el_btn_auto_6.addEventListener('click', (event) => {
      
                toggleFeedbackModal(false);
                toggleWaitlist(true);
              
    });
  }

  const el_btn_auto_7 = document.getElementById('btn-auto-7');
  if (el_btn_auto_7) {
    el_btn_auto_7.addEventListener('click', (event) => {
      submitFeedback()
    });
  }

  const el_btn_auto_8 = document.getElementById('btn-auto-8');
  if (el_btn_auto_8) {
    el_btn_auto_8.addEventListener('click', (event) => {
      setRating('air', 5)
    });
  }

  const el_btn_auto_9 = document.getElementById('btn-auto-9');
  if (el_btn_auto_9) {
    el_btn_auto_9.addEventListener('click', (event) => {
      setRating('air', 4)
    });
  }

  const el_btn_auto_10 = document.getElementById('btn-auto-10');
  if (el_btn_auto_10) {
    el_btn_auto_10.addEventListener('click', (event) => {
      setRating('air', 3)
    });
  }

  const el_btn_auto_11 = document.getElementById('btn-auto-11');
  if (el_btn_auto_11) {
    el_btn_auto_11.addEventListener('click', (event) => {
      setRating('air', 2)
    });
  }

  const el_btn_auto_12 = document.getElementById('btn-auto-12');
  if (el_btn_auto_12) {
    el_btn_auto_12.addEventListener('click', (event) => {
      setRating('air', 1)
    });
  }

  const el_btn_auto_13 = document.getElementById('btn-auto-13');
  if (el_btn_auto_13) {
    el_btn_auto_13.addEventListener('click', (event) => {
      setRating('ash', 5)
    });
  }

  const el_btn_auto_14 = document.getElementById('btn-auto-14');
  if (el_btn_auto_14) {
    el_btn_auto_14.addEventListener('click', (event) => {
      setRating('ash', 4)
    });
  }

  const el_btn_auto_15 = document.getElementById('btn-auto-15');
  if (el_btn_auto_15) {
    el_btn_auto_15.addEventListener('click', (event) => {
      setRating('ash', 3)
    });
  }

  const el_btn_auto_16 = document.getElementById('btn-auto-16');
  if (el_btn_auto_16) {
    el_btn_auto_16.addEventListener('click', (event) => {
      setRating('ash', 2)
    });
  }

  const el_btn_auto_17 = document.getElementById('btn-auto-17');
  if (el_btn_auto_17) {
    el_btn_auto_17.addEventListener('click', (event) => {
      setRating('ash', 1)
    });
  }

  const el_btn_auto_18 = document.getElementById('btn-auto-18');
  if (el_btn_auto_18) {
    el_btn_auto_18.addEventListener('click', (event) => {
      toggleFeedbackModal(false)
    });
  }

  const el_btn_auto_19 = document.getElementById('btn-auto-19');
  if (el_btn_auto_19) {
    el_btn_auto_19.addEventListener('click', (event) => {
      toggleFeedbackModal(false)
    });
  }

  const el_btn_auto_20 = document.getElementById('btn-auto-20');
  if (el_btn_auto_20) {
    el_btn_auto_20.addEventListener('click', (event) => {
      toggleFeedbackModal(true)
    });
  }

  const el_btn_auto_21 = document.getElementById('btn-auto-21');
  if (el_btn_auto_21) {
    el_btn_auto_21.addEventListener('click', (event) => {
      navigate('home')
    });
  }

  const el_btn_calm_pause = document.getElementById('btn-calm-pause');
  if (el_btn_calm_pause) {
    el_btn_calm_pause.addEventListener('click', (event) => {
      toggleCalmPause()
    });
  }

  const el_btn_auto_22 = document.getElementById('btn-auto-22');
  if (el_btn_auto_22) {
    el_btn_auto_22.addEventListener('click', (event) => {
      adjustCustomTime('rest', 1)
    });
  }

  const el_btn_auto_23 = document.getElementById('btn-auto-23');
  if (el_btn_auto_23) {
    el_btn_auto_23.addEventListener('click', (event) => {
      adjustCustomTime('rest', -1)
    });
  }

  const el_btn_auto_24 = document.getElementById('btn-auto-24');
  if (el_btn_auto_24) {
    el_btn_auto_24.addEventListener('click', (event) => {
      adjustCustomTime('exhale', 1)
    });
  }

  const el_btn_auto_25 = document.getElementById('btn-auto-25');
  if (el_btn_auto_25) {
    el_btn_auto_25.addEventListener('click', (event) => {
      adjustCustomTime('exhale', -1)
    });
  }

  const el_btn_auto_26 = document.getElementById('btn-auto-26');
  if (el_btn_auto_26) {
    el_btn_auto_26.addEventListener('click', (event) => {
      adjustCustomTime('hold', 1)
    });
  }

  const el_btn_auto_27 = document.getElementById('btn-auto-27');
  if (el_btn_auto_27) {
    el_btn_auto_27.addEventListener('click', (event) => {
      adjustCustomTime('hold', -1)
    });
  }

  const el_btn_auto_28 = document.getElementById('btn-auto-28');
  if (el_btn_auto_28) {
    el_btn_auto_28.addEventListener('click', (event) => {
      adjustCustomTime('inhale', 1)
    });
  }

  const el_btn_auto_29 = document.getElementById('btn-auto-29');
  if (el_btn_auto_29) {
    el_btn_auto_29.addEventListener('click', (event) => {
      adjustCustomTime('inhale', -1)
    });
  }

  const el_btn_auto_30 = document.getElementById('btn-auto-30');
  if (el_btn_auto_30) {
    el_btn_auto_30.addEventListener('click', (event) => {
      setTechnique(3)
    });
  }

  const el_btn_auto_31 = document.getElementById('btn-auto-31');
  if (el_btn_auto_31) {
    el_btn_auto_31.addEventListener('click', (event) => {
      setTechnique(2)
    });
  }

  const el_btn_auto_32 = document.getElementById('btn-auto-32');
  if (el_btn_auto_32) {
    el_btn_auto_32.addEventListener('click', (event) => {
      setTechnique(1)
    });
  }

  const el_btn_auto_33 = document.getElementById('btn-auto-33');
  if (el_btn_auto_33) {
    el_btn_auto_33.addEventListener('click', (event) => {
      setTechnique(0)
    });
  }

  const el_btn_tab_custom = document.getElementById('btn-tab-custom');
  if (el_btn_tab_custom) {
    el_btn_tab_custom.addEventListener('click', (event) => {
      setCalmMode('custom')
    });
  }

  const el_btn_tab_presets = document.getElementById('btn-tab-presets');
  if (el_btn_tab_presets) {
    el_btn_tab_presets.addEventListener('click', (event) => {
      setCalmMode('presets')
    });
  }

  const el_btn_auto_34 = document.getElementById('btn-auto-34');
  if (el_btn_auto_34) {
    el_btn_auto_34.addEventListener('click', (event) => {
      resetMode('smash')
    });
  }

  const el_btn_auto_35 = document.getElementById('btn-auto-35');
  if (el_btn_auto_35) {
    el_btn_auto_35.addEventListener('click', (event) => {
      toggleWaitlist(true)
    });
  }

  const el_view_smash = document.getElementById('view-smash');
  if (el_view_smash) {
    el_view_smash.addEventListener('click', (event) => {
      triggerHammer(event)
    });
  }

  const el_btn_auto_36 = document.getElementById('btn-auto-36');
  if (el_btn_auto_36) {
    el_btn_auto_36.addEventListener('click', (event) => {
      submitInlineWaitlist()
    });
  }

  const el_btn_play_audio = document.getElementById('btn-play-audio');
  if (el_btn_play_audio) {
    el_btn_play_audio.addEventListener('click', (event) => {
      togglePlayback()
    });
  }

  const el_btn_auto_37 = document.getElementById('btn-auto-37');
  if (el_btn_auto_37) {
    el_btn_auto_37.addEventListener('click', (event) => {
      handleMainAction()
    });
  }

  const el_ui_btn_mode = document.getElementById('ui-btn-mode');
  if (el_ui_btn_mode) {
    el_ui_btn_mode.addEventListener('click', (event) => {
      toggleMode()
    });
  }

  const el_ctrl_haptic_mobile = document.getElementById('ctrl-haptic-mobile');
  if (el_ctrl_haptic_mobile) {
    el_ctrl_haptic_mobile.addEventListener('click', (event) => {
      toggleHaptics()
    });
  }

  const el_btn_auto_38 = document.getElementById('btn-auto-38');
  if (el_btn_auto_38) {
    el_btn_auto_38.addEventListener('click', (event) => {
      
                            changeThemeColor(4);
                            event.stopPropagation();
                          
    });
  }

  const el_btn_auto_39 = document.getElementById('btn-auto-39');
  if (el_btn_auto_39) {
    el_btn_auto_39.addEventListener('click', (event) => {
      
                            changeThemeColor(3);
                            event.stopPropagation();
                          
    });
  }

  const el_btn_auto_40 = document.getElementById('btn-auto-40');
  if (el_btn_auto_40) {
    el_btn_auto_40.addEventListener('click', (event) => {
      
                            changeThemeColor(2);
                            event.stopPropagation();
                          
    });
  }

  const el_btn_auto_41 = document.getElementById('btn-auto-41');
  if (el_btn_auto_41) {
    el_btn_auto_41.addEventListener('click', (event) => {
      
                            changeThemeColor(1);
                            event.stopPropagation();
                          
    });
  }

  const el_btn_auto_42 = document.getElementById('btn-auto-42');
  if (el_btn_auto_42) {
    el_btn_auto_42.addEventListener('click', (event) => {
      
                            changeThemeColor(0);
                            event.stopPropagation();
                          
    });
  }

  const el_ctrl_theme_container = document.getElementById('ctrl-theme-container');
  if (el_ctrl_theme_container) {
    el_ctrl_theme_container.addEventListener('click', (event) => {
      toggleControl('ctrl-theme')
    });
  }

  const el_btn_auto_43 = document.getElementById('btn-auto-43');
  if (el_btn_auto_43) {
    el_btn_auto_43.addEventListener('click', (event) => {
      event.stopPropagation()
    });
  }

  const el_ctrl_font_container = document.getElementById('ctrl-font-container');
  if (el_ctrl_font_container) {
    el_ctrl_font_container.addEventListener('click', (event) => {
      toggleControl('ctrl-font')
    });
  }

  const el_btn_auto_44 = document.getElementById('btn-auto-44');
  if (el_btn_auto_44) {
    el_btn_auto_44.addEventListener('click', (event) => {
      
                            changeFontFamily(2);
                            event.stopPropagation();
                          
    });
  }

  const el_btn_auto_45 = document.getElementById('btn-auto-45');
  if (el_btn_auto_45) {
    el_btn_auto_45.addEventListener('click', (event) => {
      
                            changeFontFamily(1);
                            event.stopPropagation();
                          
    });
  }

  const el_btn_auto_46 = document.getElementById('btn-auto-46');
  if (el_btn_auto_46) {
    el_btn_auto_46.addEventListener('click', (event) => {
      
                            changeFontFamily(0);
                            event.stopPropagation();
                          
    });
  }

  const el_ctrl_family_container = document.getElementById('ctrl-family-container');
  if (el_ctrl_family_container) {
    el_ctrl_family_container.addEventListener('click', (event) => {
      toggleControl('ctrl-family')
    });
  }

  const el_btn_mobile_menu = document.getElementById('btn-mobile-menu');
  if (el_btn_mobile_menu) {
    el_btn_mobile_menu.addEventListener('click', (event) => {
      toggleEditorMenu()
    });
  }

  const el_btn_auto_47 = document.getElementById('btn-auto-47');
  if (el_btn_auto_47) {
    el_btn_auto_47.addEventListener('click', (event) => {
      navigate('home')
    });
  }

  const el_btn_auto_48 = document.getElementById('btn-auto-48');
  if (el_btn_auto_48) {
    el_btn_auto_48.addEventListener('click', (event) => {
      navigate('calm')
    });
  }

  const el_btn_auto_49 = document.getElementById('btn-auto-49');
  if (el_btn_auto_49) {
    el_btn_auto_49.addEventListener('click', (event) => {
      navigate('burn')
    });
  }

  const el_btn_auto_50 = document.getElementById('btn-auto-50');
  if (el_btn_auto_50) {
    el_btn_auto_50.addEventListener('click', (event) => {
      shareLink()
    });
  }

  const el_btn_auto_51 = document.getElementById('btn-auto-51');
  if (el_btn_auto_51) {
    el_btn_auto_51.addEventListener('click', (event) => {
      toggleWaitlist(true)
    });
  }

  const el_btn_auto_52 = document.getElementById('btn-auto-52');
  if (el_btn_auto_52) {
    el_btn_auto_52.addEventListener('click', (event) => {
      toggleGlobalTheme()
    });
  }

  const el_btn_auto_53 = document.getElementById('btn-auto-53');
  if (el_btn_auto_53) {
    el_btn_auto_53.addEventListener('click', (event) => {
      toggleFireAnimation()
    });
  }

  const el_nav_btn_install = document.getElementById('nav-btn-install');
  if (el_nav_btn_install) {
    el_nav_btn_install.addEventListener('click', (event) => {
      promptInstall()
    });
  }

  const el_nav_link_ash = document.getElementById('nav-link-ash');
  if (el_nav_link_ash) {
    el_nav_link_ash.addEventListener('click', (event) => {
      navigate('burn')
    });
  }

  const el_nav_link_air = document.getElementById('nav-link-air');
  if (el_nav_link_air) {
    el_nav_link_air.addEventListener('click', (event) => {
      navigate('calm')
    });
  }

  const el_btn_auto_54 = document.getElementById('btn-auto-54');
  if (el_btn_auto_54) {
    el_btn_auto_54.addEventListener('click', (event) => {
      navigate('home')
    });
  }

}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCSPListeners);
} else {
  initCSPListeners();
}
