/*
 * Konfiguracja i wspólny stan aplikacji.
 * Zmienne z tego pliku są używane przez pozostałe moduły.
 */

/* =========================================================
   DOMYŚLNA KONFIGURACJA
   ========================================================= */

const DEFAULT_CONFIG = {

    pinHash: "03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4",

    requirePin: true,

    tickerSize: 38,

    tickerSpeed: 30,

    showClock: true,

    tickerText:
        "UWAGA: Przestrzegaj zasad BHP! | Informacja produkcyjna",

    sideInfoText:
        ""

};

const MAX_TICKER_LENGTH = 1500;
const MAX_SIDE_INFO_LENGTH = 360;

function normalizeTickerText(value) {

    return String(value || "")
        .replace(/\s+/g, " ")
        .trim();

}

const adminLaunchToken =
    new URLSearchParams(window.location.search)
        .get("launch");

const isAdminMode =
    new URLSearchParams(window.location.search)
        .get("mode") === "admin" &&
    adminLaunchToken &&
    localStorage.getItem("productionBoardAdminLaunch") === adminLaunchToken;

const appIdentity = isAdminMode
    ? {
        title: "Panel sterowania",
        icon: "⚙️",
        color: "#c8b6ff"
    }
    : {
        title: "Monitory ODL",
        icon: "●",
        color: "#1687e8"
    };

document.title = appIdentity.title;

const appFavicon =
    document.getElementById("appFavicon");

if (appFavicon) {
    appFavicon.href =
        "data:image/svg+xml," +
        encodeURIComponent(
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#061b36"/><text x="32" y="45" text-anchor="middle" font-size="42" fill="${appIdentity.color}">${appIdentity.icon}</text></svg>`
        );
}

const MESSAGE_TYPE_COLORS = Object.freeze({
    info: "#000000",
    warning: "#f59e0b",
    danger: "#ef4444",
    success: "#39d353"
});

/* =========================================================
   DANE
   ========================================================= */

let config =
    loadData(
        "productionBoardConfig",
        DEFAULT_CONFIG
    );

let images = [];

let urls =
    loadData(
        "productionBoardUrls",
        []
    );

let urlRuntimeStates = {};

let messages =
    loadData(
        "productionBoardMessages",
        []
    );

/* =========================================================
   STAN
   ========================================================= */

let imageIndex = 0;

let rotationTimer = null;

let activeUrlMode = false;

let urlTimer = null;

let currentActiveUrlId = null;

let isFullScreenMessageActive = false;

let isFullScreenImageActive = false;

let adminTimer = null;

let currentMessageImage = "";


