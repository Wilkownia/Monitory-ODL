/*
 * Panel administracyjny: PIN, ustawienia ekranu i obsługa klawiatury.
 */

/* =========================================================
   KLAWIATURA
   ========================================================= */

const ADMIN_OPEN_STATE_KEY =
    "productionBoardAdminOpen";

let adminHeartbeatTimer = null;

function hasOpenAdminWindow() {

    const rawState =
        localStorage.getItem(ADMIN_OPEN_STATE_KEY);

    if (!rawState) {
        return false;
    }

    try {

        const state = JSON.parse(rawState);

        if (Date.now() - state.updatedAt < 10000) {
            return true;
        }

    } catch (error) {
        // Usuwamy uszkodzony znacznik i pozwalamy otworzyć panel.
    }

    localStorage.removeItem(ADMIN_OPEN_STATE_KEY);
    return false;

}

function updateAdminOpenState() {

    localStorage.setItem(
        ADMIN_OPEN_STATE_KEY,
        JSON.stringify({
            token: adminLaunchToken,
            updatedAt: Date.now()
        })
    );

}

function releaseAdminOpenState(removeLaunchToken = true) {

    let state;

    try {
        state = JSON.parse(
            localStorage.getItem(ADMIN_OPEN_STATE_KEY)
        );
    } catch (error) {
        state = null;
    }

    if (!state || state.token === adminLaunchToken) {
        localStorage.removeItem(ADMIN_OPEN_STATE_KEY);
    }

    if (removeLaunchToken && adminLaunchToken) {
        localStorage.removeItem("productionBoardAdminLaunch");
    }

    clearInterval(adminHeartbeatTimer);
    adminHeartbeatTimer = null;

}

function startAdminHeartbeat() {

    updateAdminOpenState();

    adminHeartbeatTimer =
        setInterval(
            updateAdminOpenState,
            3000
        );

}

function handleKeyboard(event) {

    if (
        event.key === "F12" ||
        (event.ctrlKey && event.shiftKey && ["I", "J", "C"].includes(event.key.toUpperCase())) ||
        (event.ctrlKey && event.key.toLowerCase() === "u")
    ) {

        event.preventDefault();
        event.stopPropagation();
        return;

    }

    if (event.key === "F2") {

        event.preventDefault();

        if (isAdminMode) {

            releaseAdminOpenState();
            window.close();
            return;

        }

        if (hasOpenAdminWindow()) {

            showToast(
                "Panel administracyjny jest już otwarty"
            );

            return;

        }

        const adminOverlay =
            document.getElementById("adminOverlay");

        if (adminOverlay && adminOverlay.style.display === "flex") {

            closeAdmin();

        } else {

            const launchToken =
                crypto.randomUUID();

            localStorage.setItem(
                "productionBoardAdminLaunch",
                launchToken
            );

            localStorage.setItem(
                ADMIN_OPEN_STATE_KEY,
                JSON.stringify({
                    token: launchToken,
                    updatedAt: Date.now()
                })
            );

            const adminWindow = window.open(
                `admin.html?mode=admin&launch=${encodeURIComponent(launchToken)}`,
                "productionBoardAdmin"
            );

            if (!adminWindow) {
                localStorage.removeItem(ADMIN_OPEN_STATE_KEY);
                localStorage.removeItem("productionBoardAdminLaunch");
                showToast("Przeglądarka zablokowała nowe okno");
            } else {
                adminWindow.focus();
            }

        }

    }

    if (event.key === "Escape") {

        closePin();

        closeAdmin();

    }

}

/* =========================================================
   PIN
   ========================================================= */

function openPin() {

    if (config.requirePin === false) {

        openAdmin();

        return;

    }

    document.getElementById(
        "pinOverlay"
    ).style.display = "flex";

    document.getElementById(
        "pinInput"
    ).value = "";

    setTimeout(
        () =>
            document.getElementById(
                "pinInput"
            ).focus(),
        100
    );

}


function closePin() {

    document.getElementById(
        "pinOverlay"
    ).style.display = "none";

}


async function hashPin(pin) {

    const encodedPin =
        new TextEncoder().encode(pin);

    const hashBuffer =
        await crypto.subtle.digest(
            "SHA-256",
            encodedPin
        );

    return Array.from(
        new Uint8Array(hashBuffer),
        byte => byte.toString(16).padStart(2, "0")
    ).join("");

}


async function checkPin() {

    const pin =
        document.getElementById(
            "pinInput"
        ).value;

    const pinHash =
        await hashPin(pin);

    if (pinHash === config.pinHash) {

        closePin();

        openAdmin();

    } else {

        showToast(
            "Nieprawidłowy PIN"
        );

    }

}

/* =========================================================
   PANEL
   ========================================================= */

function openAdmin() {

    document.getElementById(
        "adminOverlay"
    ).style.display = "flex";

    fillAdminSettings();

    renderImages();

    renderUrls();

    renderMessages();

    resetAdminTimer();

}

function closeAdmin() {

    if (isAdminMode) {
        releaseAdminOpenState();
        window.close();
        return;
    }

    const adminOverlay =
        document.getElementById("adminOverlay");

    if (adminOverlay) {
        adminOverlay.style.display = "none";
    }

    clearTimeout(adminTimer);

}


function resetAdminTimer() {

    clearTimeout(adminTimer);

    adminTimer =
        setTimeout(
            closeAdmin,
            10 * 60 * 1000
        );

}


document.addEventListener(
    "mousemove",
    () => {

        const adminOverlay =
            document.getElementById("adminOverlay");

        if (
            adminOverlay &&
            adminOverlay.style.display === "flex"
        ) {

            resetAdminTimer();

        }

    }
);

/* =========================================================
   USTAWIENIA
   ========================================================= */

function fillAdminSettings() {

    document.getElementById(
        "tickerSize"
    ).value =
        config.tickerSize;

    document.getElementById(
        "tickerSpeed"
    ).value =
        config.tickerSpeed;

    document.getElementById(
        "showClock"
    ).checked =
        config.showClock;

    document.getElementById(
        "tickerInput"
    ).value = normalizeTickerText(
        config.tickerText
    ).slice(0, MAX_TICKER_LENGTH);

    updateTickerLimitHint();

    document.getElementById(
        "sideInfoInput"
    ).value = String(
        config.sideInfoText || ""
    ).slice(0, MAX_SIDE_INFO_LENGTH);

    updateSideInfoLimitHint();

    document.getElementById(
        "requirePin"
    ).checked =
        config.requirePin !== false;

}


async function saveScreenSettings(showConfirmation = true) {

    const tickerSizeInput =
        document.getElementById("tickerSize");

    config.tickerSize =
        clamp(
            parseInt(tickerSizeInput.value) || 38,
            12,
            100
        );

    tickerSizeInput.value =
        config.tickerSize;


    const tickerSpeedInput =
        document.getElementById("tickerSpeed");

    config.tickerSpeed =
        clamp(
            parseInt(tickerSpeedInput.value) || 30,
            5,
            300
        );

    tickerSpeedInput.value =
        config.tickerSpeed;


    config.showClock =
        document.getElementById(
            "showClock"
        ).checked;


    config.tickerText =
        normalizeTickerText(
            document.getElementById(
                "tickerInput"
            ).value
        ).slice(0, MAX_TICKER_LENGTH);

    document.getElementById(
        "tickerInput"
    ).value = config.tickerText;

    config.sideInfoText =
        document.getElementById(
            "sideInfoInput"
        ).value.slice(0, MAX_SIDE_INFO_LENGTH);

    await saveData(
        "productionBoardConfig",
        config
    );


    applyConfig();

    if (showConfirmation) {
        showToast(
            "Ustawienia zapisane"
        );
    }

}

function bindLiveAdminSettings() {

    [
        "tickerSize",
        "tickerSpeed",
        "showClock",
        "tickerInput",
        "sideInfoInput"
    ].forEach(
        id => {

            const field =
                document.getElementById(id);

            if (!field || field.dataset.liveBound === "true") {
                return;
            }

            field.dataset.liveBound = "true";

            if (id === "tickerSize") {
                field.addEventListener(
                    "input",
                    () => {
                        const value = parseInt(field.value);

                        if (Number.isFinite(value) && value > 100) {
                            field.value = "100";
                        }
                    }
                );
            }

            if (id === "tickerSpeed") {
                field.addEventListener(
                    "input",
                    () => {
                        const value = parseInt(field.value);

                        if (Number.isFinite(value) && value > 300) {
                            field.value = "300";
                        }
                    }
                );
            }

            if (id === "tickerInput") {
                field.addEventListener(
                    "input",
                    () => {
                        updateTickerLimitHint();
                    }
                );
            }

            if (id === "sideInfoInput") {
                field.addEventListener(
                    "input",
                    () => {
                        if (field.value.length > MAX_SIDE_INFO_LENGTH) {
                            field.value =
                                field.value.slice(0, MAX_SIDE_INFO_LENGTH);
                        }

                        updateSideInfoLimitHint();
                    }
                );
            }

        }
    );

}

function updateTickerLimitHint() {

    const tickerInput =
        document.getElementById("tickerInput");

    const limitHint =
        document.getElementById("tickerLimitHint");

    if (!tickerInput || !limitHint) {
        return;
    }

    limitHint.textContent =
        `Znaki: ${tickerInput.value.length}/${MAX_TICKER_LENGTH}`;

}

function updateSideInfoLimitHint() {

    const sideInfoInput =
        document.getElementById("sideInfoInput");

    const limitHint =
        document.getElementById("sideInfoLimitHint");

    if (!sideInfoInput || !limitHint) {
        return;
    }

    limitHint.textContent =
        `Znaki: ${sideInfoInput.value.length}/${MAX_SIDE_INFO_LENGTH}`;

}

/* =========================================================
   APLIKOWANIE KONFIGURACJI
   ========================================================= */

function applyConfig() {

    config.tickerText =
        normalizeTickerText(config.tickerText)
            .slice(0, MAX_TICKER_LENGTH);

    config.sideInfoText =
        String(config.sideInfoText || "")
            .slice(0, MAX_SIDE_INFO_LENGTH);

    document.documentElement
        .style
        .setProperty(
            "--ticker-size",
            config.tickerSize + "px"
        );


    const ticker =
        document.getElementById("tickerText");

    if (ticker) {
        ticker.textContent = config.tickerText || "";
        ticker.dataset.sourceText = ticker.textContent;
        startTickerAnimation();
    }

    const sideInfoText =
        document.getElementById("sideInfoText");

    if (sideInfoText) {
        sideInfoText.textContent = config.sideInfoText || "";
    }

    const clockBox =
        document.getElementById("clockBox");

    if (clockBox) {
        clockBox.style.display = config.showClock ? "flex" : "none";
    }

    if (typeof syncSidePanelToContentFrame === "function") {
        requestAnimationFrame(
            syncSidePanelToContentFrame
        );
    }


}

function initAdminDragging() {

    const panel =
        document.getElementById(
            "adminPanel"
        );

    const header =
        document.querySelector(
            "#adminPanel .adminHeader"
        );


    if (!panel || !header) {
        return;
    }


    let dragging = false;
    let offsetX = 0;
    let offsetY = 0;


    header.addEventListener(
        "pointerdown",
        event => {

            if (
                event.target.closest(
                    "button, input, select, textarea"
                )
            ) {
                return;
            }


            const rect =
                panel.getBoundingClientRect();


            dragging = true;
            offsetX = event.clientX - rect.left;
            offsetY = event.clientY - rect.top;

            header.style.cursor =
                "grabbing";

            event.preventDefault();

        }
    );


    document.addEventListener(
        "pointermove",
        event => {

            if (!dragging) {
                return;
            }


            const maxLeft =
                Math.max(
                    0,
                    window.innerWidth - panel.offsetWidth
                );

            const maxTop =
                Math.max(
                    0,
                    window.innerHeight - panel.offsetHeight
                );


            panel.style.left =
                Math.min(
                    maxLeft,
                    Math.max(
                        0,
                        event.clientX - offsetX
                    )
                ) + "px";

            panel.style.top =
                Math.min(
                    maxTop,
                    Math.max(
                        0,
                        event.clientY - offsetY
                    )
                ) + "px";

        }
    );


    const stopDragging =
        event => {

            if (!dragging) {
                return;
            }


            dragging = false;
            header.style.cursor =
                "move";


        };


    document.addEventListener(
        "pointerup",
        stopDragging
    );

    document.addEventListener(
        "pointercancel",
        stopDragging
    );

}


document.addEventListener(
    "DOMContentLoaded",
    () => {

        document.body.classList.toggle(
            "adminWindow",
            isAdminMode
        );

        initAdminDragging();
        bindLiveAdminSettings();

        if (isAdminMode) {
            startAdminHeartbeat();
            window.addEventListener(
                "beforeunload",
                () => releaseAdminOpenState(false)
            );
        }

    }
);