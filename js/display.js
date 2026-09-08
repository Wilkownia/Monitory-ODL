/* Koordynacja widocznej treści i układu ekranu. */

function syncSidePanelToContentFrame() {

    const frame = document.getElementById("contentFrame");
    const panel = document.getElementById("sideInfoPanel");
    if (!frame || !panel) return;

    const frameRect = frame.getBoundingClientRect();
    panel.style.top = frameRect.top + "px";
    panel.style.bottom = Math.max(0, window.innerHeight - frameRect.bottom) + "px";

    const bottomBar = document.getElementById("bottomBar");
    if (bottomBar) {
        bottomBar.style.right = Math.max(0, window.innerWidth - frameRect.right) + "px";
    }

}

let systemUpdateTimer = null;
let systemUpdateRunning = false;
let systemUpdateQueued = false;

function updateSystem() {

    if (isAdminMode || !document.getElementById("screen")) {
        return;
    }

    if (systemUpdateRunning) {
        systemUpdateQueued = true;
        return;
    }

    systemUpdateRunning = true;

    try {
        reconcileSystem();
    } finally {
        systemUpdateRunning = false;

        if (systemUpdateQueued) {
            systemUpdateQueued = false;
            scheduleSystemUpdate(0);
        }
    }

}

function startSystemScheduler() {

    if (systemUpdateTimer !== null) {
        return;
    }

    const scheduleNext = () => {
        systemUpdateTimer = setTimeout(
            () => {
                systemUpdateTimer = null;
                updateSystem();

                if (systemUpdateTimer === null) {
                    scheduleNext();
                }
            },
            1000
        );
    };

    scheduleNext();

}

function scheduleSystemUpdate(delay = 0) {

    if (systemUpdateRunning) {
        systemUpdateQueued = true;
        return;
    }

    if (systemUpdateTimer !== null) {
        clearTimeout(systemUpdateTimer);
        systemUpdateTimer = null;
    }

    systemUpdateTimer = setTimeout(
        () => {
            systemUpdateTimer = null;
            updateSystem();
            startSystemScheduler();
        },
        delay
    );

}

function reconcileSystem() {

    if (activeUrlMode) {
        const currentUrl = urls.find(
            item => String(item.id) === String(currentActiveUrlId)
        );

        if (
            !currentUrl ||
            currentUrl.active === false ||
            !isAllowedWebUrl(currentUrl.url) ||
            !isUrlWithinSchedule(currentUrl)
        ) {
            stopUrlDisplay(currentActiveUrlId, true);
            return;
        }
    }

    const activeMessages = getActiveMessages();

    if (isFullScreenImageActive && !activeMessages.length) return;

    if (activeMessages.length) {
        const message = activeMessages[0];

        if (message.fullscreen) {
            if (activeUrlMode) {
                stopUrlDisplay(currentActiveUrlId, true);
            }

            if (rotationTimer) {
                clearTimeout(rotationTimer);
                rotationTimer = null;
            }
            showFullScreenMessage(message);
            return;
        }

        hideFullScreenMessage();
        showMessageBar(message);
    } else {
        if (isFullScreenImageActive) return;

        hideFullScreenMessage();
        hideMessageBar();

        if (activeUrlMode) {
            const currentUrl = urls.find(
                item => String(item.id) === String(currentActiveUrlId)
            );

            if (currentUrl) {
                syncUrlBarState(currentUrl);
            }
        }

        const hasActiveImages = images.some(
            image => image.active !== false
        );

        const now = Date.now();
        const hasReadyUrl = urls.some(
            item =>
                item.active !== false &&
                isAllowedWebUrl(item.url) &&
                isUrlWithinSchedule(item, now) &&
                (item.nextRunTime == null || now >= item.nextRunTime)
        );

        const bottomBar = document.getElementById("bottomBar");
        if (bottomBar) {
            bottomBar.style.display = "flex";
            bottomBar.style.visibility = "visible";
            bottomBar.style.opacity = "1";
        }

        if (!hasActiveImages && !hasReadyUrl) hideMessageBar();
    }

    if (!activeUrlMode && !isFullScreenMessageActive && !isFullScreenImageActive) {
        const now = Date.now();
        const readyUrl = urls
            .filter(
                item =>
                    item.active !== false &&
                    isAllowedWebUrl(item.url) &&
                    isUrlWithinSchedule(item, now) &&
                    (item.nextRunTime == null || now >= item.nextRunTime)
            )
            .sort(
                (a, b) =>
                    (parseInt(b.priority) || 1) - (parseInt(a.priority) || 1)
            )[0];

        if (readyUrl) {
            startUrlDisplay(readyUrl);
            return;
        }
    }

    if (!activeUrlMode && !isFullScreenMessageActive && !isFullScreenImageActive && !rotationTimer) {
        rotateImages();
    }

}
