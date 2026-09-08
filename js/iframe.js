/* Odtwarzanie stron WWW w iframe. */

function syncUrlBarState(urlItem = null) {

    const bottomBar = document.getElementById("bottomBar");
    if (!bottomBar) return;

    const activeUrl = urlItem || urls.find(
        item => String(item.id) === String(currentActiveUrlId)
    );

    const shouldHideBar = activeUrl && activeUrl.showBar === false;

    document.documentElement.style.setProperty(
        "--bottom-bar-height",
        shouldHideBar ? "0px" : "calc(var(--ticker-size) + 16px)"
    );

    if (!activeUrl) {
        bottomBar.dataset.mode = "default";
        bottomBar.style.display = "flex";
        bottomBar.style.visibility = "visible";
        bottomBar.style.opacity = "1";
        return;
    }

    if (shouldHideBar) {
        bottomBar.dataset.mode = "hidden";
        bottomBar.style.display = "none";
        bottomBar.style.visibility = "hidden";
        stopTickerAnimation();
        return;
    }

    bottomBar.dataset.mode = "url";
    bottomBar.style.zIndex = "25";
    bottomBar.style.background = "rgba(3, 15, 26, 0.10)";
    bottomBar.style.borderColor = "rgba(91, 165, 219, 0.18)";
    bottomBar.style.display = "flex";
    bottomBar.style.visibility = "visible";
    bottomBar.style.opacity = "1";

}

function startUrlDisplay(urlItem) {

    if (!isAllowedWebUrl(urlItem?.url)) {
        stopUrlDisplay(urlItem?.id);
        return;
    }

    activeUrlMode = true;
    currentActiveUrlId = urlItem.id;
    syncUrlBarState(urlItem);

    if (rotationTimer) {
        clearTimeout(rotationTimer);
        rotationTimer = null;
    }

    document.getElementById("imageDisplay").classList.remove("active");

    const iframe = document.getElementById("iframeDisplay");
    iframe.src = urlItem.url;
    iframe.dataset.urlId = String(urlItem.id);
    iframe.classList.add("active");

    const durationMs = (parseInt(urlItem.duration) || 10) * 60 * 1000;
    clearTimeout(urlTimer);
    urlTimer = setTimeout(() => stopUrlDisplay(urlItem.id), durationMs);

}

async function stopUrlDisplay(urlId, resetSchedule = false) {

    clearTimeout(urlTimer);

    const iframe = document.getElementById("iframeDisplay");
    iframe.classList.remove("active");
    iframe.src = "about:blank";
    delete iframe.dataset.urlId;

    activeUrlMode = false;
    urlTimer = null;

    const urlItem = urls.find(
        item => String(item.id) === String(urlId)
    );

    if (urlItem) {
        syncUrlBarState(null);
        const bottomBar = document.getElementById("bottomBar");
        if (bottomBar) bottomBar.style.zIndex = "30";

        if (resetSchedule) {
            urlItem.nextRunTime = null;
        } else {
            urlItem.nextRunTime = Date.now() + (parseInt(urlItem.interval) || 30) * 60 * 1000;
        }

        saveUrlRuntimeState(urlItem.id, urlItem.nextRunTime).catch(error => {
            console.error("Nie udało się zapisać czasu następnego uruchomienia strony WWW.", error);
        });
    }

    rotateImages();
    scheduleSystemUpdate(0);

}
