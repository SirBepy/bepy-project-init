(function () {
  // ─── Config ───────────────────────────────────────────────────────────────
  // Disable:        set window.BEPY_BACKGROUND = false before this script
  // Custom pattern: set window.BEPY_BG_PATTERN = 'path/to/pattern.svg' before this script

  if (window.BEPY_BACKGROUND === false) return;

  var CDN =
    "https://cdn.jsdelivr.net/gh/sirbepy/bepy-project-init@main/widget/";
  var patternUrl = window.BEPY_BG_PATTERN || CDN + "background_pattern.svg";

  // ─── Styles ───────────────────────────────────────────────────────────────

  var css = `
    html, body { background: transparent !important; }

    #bepy-bg {
      position: fixed;
      inset: 0;
      z-index: -1;
      overflow: hidden;
      pointer-events: none;
    }

    #bepy-bg-fill {
      position: relative;
      width: 100%;
      height: 100%;
      background: radial-gradient(
        ellipse at 50% 60%,
        var(--color-background) 0%,
        var(--color-background) 200%
      );
    }

    #bepy-bg-pattern {
      position: absolute;
      inset: 0;
      opacity: 0.08;
      -webkit-mask-image: radial-gradient(ellipse at 50% 60%, black 40%, transparent 80%);
      mask-image: radial-gradient(ellipse at 50% 60%, black 40%, transparent 80%);
    }

    #bepy-bg-pattern::before {
      content: '';
      position: absolute;
      inset: -200px;
      background: var(--color-primary, #9d7dfc);
      -webkit-mask-image: url("${patternUrl}");
      mask-image: url("${patternUrl}");
      -webkit-mask-size: 120px 120px;
      mask-size: 120px 120px;
      animation: bepy-pan 30s linear infinite;
      will-change: transform;
    }

    @keyframes bepy-pan {
      0%   { transform: translate(0, 0); }
      100% { transform: translate(120px, -240px); }
    }
  `;

  var style = document.createElement("style");
  style.id = "bepy-bg-style";
  style.textContent = css;
  document.head.appendChild(style);

  // ─── DOM ──────────────────────────────────────────────────────────────────

  var bg = document.createElement("div");
  bg.id = "bepy-bg";
  var fill = document.createElement("div");
  fill.id = "bepy-bg-fill";
  var pattern = document.createElement("div");
  pattern.id = "bepy-bg-pattern";

  fill.appendChild(pattern);
  bg.appendChild(fill);

  // ─── Mount ────────────────────────────────────────────────────────────────

  function mount() {
    document.body.insertBefore(bg, document.body.firstChild);
  }

  if (document.body) {
    mount();
  } else {
    document.addEventListener("DOMContentLoaded", mount);
  }
})();
