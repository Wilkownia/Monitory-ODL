/* Pasek komunikatu i widoki pełnoekranowe. */

function isAllowedImageSource(value) {

    return typeof value === "string" &&
        (
            value.startsWith("blob:") ||
            value.startsWith("data:image/")
        );

}

function showMessageBar(message) {

    const bar =
        document.getElementById("bottomBar");

    const tickerBox =
        document.getElementById("tickerBox");

    const messageColor =
        getMessageColor(message.type);

    const useDefaultBarStyle =
        Boolean(message.fullscreen && message.showBar);

    bar.dataset.mode =
        useDefaultBarStyle ? "fullscreen-message" : "message";

    bar.style.borderTopColor =
        useDefaultBarStyle
            ? "rgba(91, 165, 219, 0.12)"
            : "var(--layout-border)";

    bar.style.background =
        useDefaultBarStyle
            ? "rgba(3, 15, 26, 0.62)"
            : messageColor;

    bar.style.opacity = "1";
    bar.style.zIndex = "25";

    document.documentElement.style.setProperty(
        "--bottom-bar-height",
        "calc(var(--ticker-size) + 16px)"
    );

    tickerBox.style.background =
        useDefaultBarStyle
            ? "rgba(3, 15, 26, 0.62)"
            : messageColor;

    const ticker =
        document.getElementById("tickerText");

    const nextTickerText =
        message.fullscreen
            ? (config.tickerText || "")
            : [
                message.title,
                ...String(message.description || "")
                    .split(/\r?\n/)
                    .map(line => line.trim())
                    .filter(Boolean)
            ]
                .filter(Boolean)
                .join("  •  ");

    if (ticker.dataset.sourceText !== nextTickerText) {
        ticker.textContent = nextTickerText;
        ticker.dataset.sourceText = nextTickerText;
    }

    ticker.style.fontSize = config.tickerSize + "px";
    startTickerAnimation();

    bar.style.display = "flex";
    bar.style.visibility = "visible";
    bar.style.opacity = "1";

}

function showFullScreenMessage(message) {

    isFullScreenMessageActive = true;
    isFullScreenImageActive = false;

    if (rotationTimer) {
        clearTimeout(rotationTimer);
        rotationTimer = null;
    }

    const overlay =
        document.getElementById("fullScreenMessage");

    overlay.classList.remove("image-only");

    const text =
        document.getElementById("fullScreenMessageText");

    const image =
        document.getElementById("fullScreenMessageImage");

    if (isAllowedImageSource(message.image)) {
        image.src = message.image;
        image.classList.add("active");
        overlay.style.background = "#000";
    } else {
        image.classList.remove("active");
        image.src = "";
        overlay.style.background = getMessageColor(message.type);
    }

    text.textContent = [
        message.title,
        message.description
    ].filter(Boolean).join("\n\n");
    text.style.display = "block";
    overlay.classList.add("active");

    if (message.showBar) {
        showMessageBar(message);
        document.getElementById("bottomBar").style.zIndex = "25";
    } else {
        stopTickerAnimation();
        document.getElementById("bottomBar").style.display = "none";
        document.getElementById("bottomBar").style.zIndex = "0";
    }

    requestAnimationFrame(
        () => fitFullScreenMessageText(
            text,
            overlay,
            config.tickerSize
        )
    );

}

function showFullScreenImage(source) {

    isFullScreenImageActive = true;
    isFullScreenMessageActive = false;

    const overlay =
        document.getElementById("fullScreenMessage");

    overlay.classList.add("image-only");

    const image =
        document.getElementById("fullScreenMessageImage");

    const text =
        document.getElementById("fullScreenMessageText");

    image.src = source;
    image.classList.add("active");
    text.textContent = "";
    text.style.display = "none";
    overlay.style.background = "#000";
    overlay.classList.add("active");

    document.getElementById("bottomBar").style.display = "none";
    document.getElementById("bottomBar").style.zIndex = "20";
    stopTickerAnimation();

}

function hideFullScreenMessage() {

    const wasActive = isFullScreenMessageActive;

    isFullScreenMessageActive = false;
    isFullScreenImageActive = false;

    const overlay =
        document.getElementById("fullScreenMessage");

    const image =
        document.getElementById("fullScreenMessageImage");

    overlay.classList.remove("active");
    overlay.classList.remove("image-only");
    image.classList.remove("active");
    image.src = "";

    document.getElementById("fullScreenMessageText").style.display = "block";
    document.getElementById("bottomBar").style.display = "flex";
    document.getElementById("bottomBar").style.zIndex = "25";

    document.documentElement.style.setProperty(
        "--bottom-bar-height",
        "calc(var(--ticker-size) + 16px)"
    );

    if (wasActive) {
        imageIndex = 0;
    }

}

function fitFullScreenMessageText(text, screen, preferredSize) {

    const availableWidth = screen.clientWidth * 0.98;
    const availableHeight = screen.clientHeight * 0.98;

    text.style.width = "max-content";
    text.style.maxWidth = availableWidth + "px";
    text.style.maxHeight = "none";
    text.style.overflow = "hidden";
    text.style.overflowWrap = "break-word";
    text.style.wordBreak = "normal";
    text.style.whiteSpace = "pre-line";

    const maximumSize =
        Math.min(
            160,
            Math.floor(
                Math.min(
                    screen.clientWidth * 0.10,
                    screen.clientHeight * 0.14
                )
            )
        );

    let low = 10;
    let high = maximumSize;
    let best = maximumSize;

    while (low <= high) {
        const size = Math.floor((low + high) / 2);
        text.style.fontSize = size + "px";

        if (text.scrollHeight <= availableHeight) {
            best = size;
            low = size + 1;
        } else {
            high = size - 1;
        }
    }

    text.style.fontSize = best + "px";
    text.style.maxHeight = availableHeight + "px";

}
