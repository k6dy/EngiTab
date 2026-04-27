import { categorizeDomain, getDomain } from "./lib/categories";
import { getDailyStats, getFocusSession, saveDailyStats } from "./lib/storage";

async function runDistractionCheck() {
  const domain = getDomain(window.location.href);
  const category = categorizeDomain(domain);
  const session = await getFocusSession();

  if (!session.active || category !== "distraction") return;

  const stats = await getDailyStats();
  stats.blockedAttempts += 1;
  await saveDailyStats(stats);

  const overlay = document.createElement("div");
  overlay.id = "engitab-blocker";
  overlay.style.position = "fixed";
  overlay.style.inset = "0";
  overlay.style.zIndex = "2147483647";
  overlay.style.background =
    "radial-gradient(circle at top, rgba(124,58,237,.2), transparent 35%), #080713";
  overlay.style.color = "#f5f3ff";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.fontFamily = "monospace";

  overlay.innerHTML = `
    <div style="max-width:560px;padding:32px;border:1px solid rgba(139,92,246,.35);border-radius:24px;background:rgba(255,255,255,.045);box-shadow:0 24px 100px rgba(0,0,0,.35)">
      <p style="color:#a78bfa;font-weight:900;letter-spacing:.25em;text-transform:uppercase">EngiTab Focus Mode</p>
      <h1 style="font-size:34px;margin:14px 0">Distraction intercepted.</h1>
      <p style="color:#c4b5fd;line-height:1.7">
        You opened <b>${domain}</b> during a focus session.
      </p>
      <p style="color:#a3a3a3;line-height:1.7">
        Goal: ${session.goal}
      </p>
      <div style="display:flex;gap:12px;margin-top:22px">
        <button id="engitab-close" style="padding:12px 16px;border-radius:12px;border:0;background:#7c3aed;color:white;font-weight:900;cursor:pointer">
          Back to work
        </button>
        <button id="engitab-continue" style="padding:12px 16px;border-radius:12px;border:1px solid rgba(139,92,246,.45);background:transparent;color:#ddd;font-weight:900;cursor:pointer">
          Continue anyway
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("engitab-close")?.addEventListener("click", () => {
    window.location.href = "chrome://newtab";
  });

  document
    .getElementById("engitab-continue")
    ?.addEventListener("click", () => overlay.remove());
}

runDistractionCheck();