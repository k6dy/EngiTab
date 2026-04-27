import { categorizeDomain, getDomain } from "./lib/categories";
import { getDailyStats, getFocusSession, saveDailyStats } from "./lib/storage";

let activeUrl = "";
let lastTick = Date.now();
let isIdle = false;

async function trackCurrentState() {
  const now = Date.now();
  const elapsedSeconds = Math.floor((now - lastTick) / 1000);
  lastTick = now;

  if (elapsedSeconds <= 0 || elapsedSeconds > 60) return;

  const stats = await getDailyStats();

  if (isIdle || !activeUrl) {
    stats.idleSeconds += elapsedSeconds;
    await saveDailyStats(stats);
    return;
  }

  const domain = getDomain(activeUrl);
  const category = categorizeDomain(domain);

  if (!stats.domains[domain]) {
    stats.domains[domain] = {
      domain,
      seconds: 0,
      category,
    };
  }

  stats.domains[domain].seconds += elapsedSeconds;

  if (category === "work") stats.workSeconds += elapsedSeconds;
  if (category === "distraction") stats.distractionSeconds += elapsedSeconds;
  if (category === "neutral") stats.neutralSeconds += elapsedSeconds;

  await saveDailyStats(stats);
}

async function updateActiveTab(tabId?: number) {
  if (!tabId) return;

  try {
    const tab = await chrome.tabs.get(tabId);
    activeUrl = tab.url ?? "";
    lastTick = Date.now();
  } catch {
    activeUrl = "";
  }
}

chrome.tabs.onActivated.addListener(async ({ tabId }) => {
  await trackCurrentState();
  await updateActiveTab(tabId);
});

chrome.tabs.onUpdated.addListener(async (_tabId, changeInfo, tab) => {
  if (!changeInfo.url && changeInfo.status !== "complete") return;

  if (tab.active) {
    await trackCurrentState();
    activeUrl = tab.url ?? activeUrl;
    lastTick = Date.now();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  await trackCurrentState();

  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    activeUrl = "";
    return;
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  await updateActiveTab(tabs[0]?.id);
});

chrome.idle.setDetectionInterval(60);

chrome.idle.onStateChanged.addListener(async (state) => {
  await trackCurrentState();

  isIdle = state === "idle" || state === "locked";

  if (!isIdle) {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    activeUrl = tabs[0]?.url ?? "";
  }

  lastTick = Date.now();
});

setInterval(trackCurrentState, 5000);

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "GET_FOCUS_STATE") {
    getFocusSession().then(sendResponse);
    return true;
  }
});