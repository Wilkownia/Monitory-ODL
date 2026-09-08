/* Dolny pasek i jego animacja. */

let tickerAnimationFrame = null;
let tickerAnimationLastTime = null;
let tickerAnimationPosition = 0;
let tickerAnimationSignature = "";

function hideMessageBar() {

    const bar = document.getElementById("bottomBar");
    const ticker = document.getElementById("tickerText");

    bar.dataset.mode = "default";
    bar.style.borderTopColor = "var(--layout-border)";
    bar.style.background = "rgba(4, 32, 68, .24)";
    document.getElementById("tickerBox").style.background = "rgba(4, 32, 68, .24)";
    bar.style.display = "flex";
    bar.style.visibility = "visible";
    bar.style.opacity = "1";
    bar.style.zIndex = "25";

    const nextTickerText = normalizeTickerText(config.tickerText);

    if (ticker.dataset.sourceText !== nextTickerText) {
        ticker.textContent = nextTickerText;
        ticker.dataset.sourceText = nextTickerText;
    }

    ticker.style.fontSize = config.tickerSize + "px";
    startTickerAnimation();

}

function startTickerAnimation() {

    const ticker = document.getElementById("tickerText");
    const tickerBox = document.getElementById("tickerBox");

    if (!ticker || !tickerBox) {
        return;
    }

    const sourceText = ticker.dataset.sourceText ?? ticker.textContent;
    const signature = sourceText + "|" + ticker.style.fontSize + "|" + config.tickerSpeed + "|" + tickerBox.clientWidth;

    if (tickerAnimationFrame !== null && tickerAnimationSignature === signature) {
        return;
    }

    tickerAnimationSignature = signature;
    ticker.replaceChildren();

    for (let copyIndex = 0; copyIndex < 2; copyIndex++) {
        const copy = document.createElement("span");
        copy.textContent = sourceText;
        ticker.appendChild(copy);
    }

    ticker.style.width = "max-content";
    ticker.style.maxWidth = "none";

    if (tickerAnimationFrame !== null) {
        cancelAnimationFrame(tickerAnimationFrame);
        tickerAnimationFrame = null;
    }

    tickerAnimationPosition = tickerBox.clientWidth;

    const firstCopy = ticker.firstElementChild;
    const cycleWidth = firstCopy
        ? firstCopy.getBoundingClientRect().width + 48
        : ticker.scrollWidth / 2;

    tickerAnimationLastTime = null;
    ticker.style.transform = `translate3d(${tickerAnimationPosition}px, 0, 0)`;

    const animateTicker = time => {
        if (tickerAnimationLastTime === null) {
            tickerAnimationLastTime = time;
        }

        const elapsed = Math.min(100, time - tickerAnimationLastTime);
        tickerAnimationLastTime = time;
        tickerAnimationPosition -= Math.max(1, parseInt(config.tickerSpeed) || 30) * elapsed / 1000;

        if (tickerAnimationPosition + cycleWidth < 0) {
            tickerAnimationPosition += cycleWidth;
        }

        ticker.style.transform = `translate3d(${tickerAnimationPosition}px, 0, 0)`;
        tickerAnimationFrame = requestAnimationFrame(animateTicker);
    };

    tickerAnimationFrame = requestAnimationFrame(animateTicker);

}

function stopTickerAnimation() {
    if (tickerAnimationFrame !== null) {
        cancelAnimationFrame(tickerAnimationFrame);
        tickerAnimationFrame = null;
    }
}
