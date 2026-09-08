/*
 * Zarządzanie stronami WWW wyświetlanymi okresowo w iframe.
 */

/* =========================================================
   STRONY WWW
   ========================================================= */

function isAllowedWebUrl(value) {

    try {

        const parsedUrl = new URL(
            String(value || "").trim()
        );

        return parsedUrl.protocol === "http:" ||
            parsedUrl.protocol === "https:";

    } catch (error) {
        return false;
    }

}

function normalizeUrlItems(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    const normalized = value
        .filter(item => item && typeof item === "object")
        .map((item, index) => {
            const scheduleWindows = Array.isArray(item.scheduleWindows)
                ? item.scheduleWindows
                    .filter(window => window && typeof window === "object")
                    .map(window => ({
                        from: window.from || "00:00",
                        to: window.to || "23:59",
                        days: Array.isArray(window.days)
                            ? window.days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
                            : [0, 1, 2, 3, 4, 5, 6]
                    }))
                : [];

            return {
                ...item,
                id: String(item.id || crypto.randomUUID()),
                active: item.active !== false,
                duration: clamp(parseInt(item.duration) || 30, 1, 1440),
                interval: clamp(parseInt(item.interval) || 60, 1, 1440),
                priority: Number.isFinite(parseInt(item.priority))
                    ? parseInt(item.priority)
                    : index + 1,
                runOnStart: Boolean(item.runOnStart),
                showBar: item.showBar !== false,
                scheduleMode: item.scheduleMode === "scheduled" ? "scheduled" : "always",
                scheduleWindows
            };
        });

    return normalizeUrlPriorities(normalized);

}

function normalizeUrlPriorities(list) {

    return [...list]
        .sort(
            (a, b) =>
                (parseInt(a.priority) || 0) - (parseInt(b.priority) || 0)
        )
        .map((item, index) => ({
            ...item,
            priority: index + 1
        }));

}

function getSelectedUrlDays(container = document) {

    return Array.from(
        container.querySelectorAll(
            ".dayButton.active"
        )
    )
    .map(
        button =>
            parseInt(
                button.dataset.day
            )
    );

}

function syncUrlDisplayModeLabel() {

    const selectedMode =
        document.querySelector(
            'input[name="urlDisplayMode"]:checked'
        );

    const scheduleField =
        document.getElementById(
            "urlScheduleField"
        );

    if (!selectedMode || !scheduleField) {
        return;
    }

    scheduleField.hidden = selectedMode.value !== "scheduled";

}

function getUrlScheduleMode() {
    const selectedMode =
        document.querySelector(
            'input[name="urlDisplayMode"]:checked'
        );

    if (!selectedMode) {
        return "always";
    }

    return selectedMode.value === "scheduled"
        ? "scheduled"
        : "always";
}

function getUrlScheduleWindows() {

    const rows =
        document.querySelectorAll(
            ".urlTimeWindowRow"
        );

    return Array.from(rows).map(row => {

        const from =
            row.querySelector(".urlWindowFrom")?.value || "00:00";

        const to =
            row.querySelector(".urlWindowTo")?.value || "23:59";

        const days =
            getSelectedUrlDays(row);

        return {
            from,
            to,
            days
        };

    }).filter(item => item.from && item.to);

}

function bindUrlDayButtons(container = document) {

    container.querySelectorAll(
        ".dayButton"
    ).forEach(
        button => {

            if (button.dataset.bound === "url-day-toggle") {
                return;
            }

            button.dataset.bound = "url-day-toggle";

            button.addEventListener(
                "click",
                () => {
                    button.classList.toggle("active");
                }
            );

        }
    );

}

function addUrlScheduleWindow() {

    const container =
        document.getElementById(
            "urlScheduleWindows"
        );

    if (!container) {
        return;
    }

    const row =
        document.createElement("div");

    row.className = "urlTimeWindowRow";

    row.innerHTML = `
        <input class="urlWindowFrom" type="time" value="18:00">
        <input class="urlWindowTo" type="time" value="21:00">
        <div class="days">
            <button type="button" class="dayButton active" data-day="1">Pn</button>
            <button type="button" class="dayButton active" data-day="2">Wt</button>
            <button type="button" class="dayButton active" data-day="3">Śr</button>
            <button type="button" class="dayButton active" data-day="4">Czw</button>
            <button type="button" class="dayButton active" data-day="5">Pt</button>
            <button type="button" class="dayButton active" data-day="6">Sob</button>
            <button type="button" class="dayButton active" data-day="0">Nd</button>
        </div>
        <button type="button" class="btnDanger removeUrlScheduleButton" style="padding:6px 10px;">×</button>
    `;

    bindUrlDayButtons(row);
    row.querySelector(".removeUrlScheduleButton").addEventListener(
        "click",
        event => removeUrlScheduleWindow(event.currentTarget.parentElement)
    );
    container.appendChild(row);

}

function removeUrlScheduleWindow(row) {

    if (!row) {
        return;
    }

    const container =
        row.parentElement;

    if (container && container.querySelectorAll(".urlTimeWindowRow").length > 1) {
        row.remove();
    }

}

function isUrlWithinSchedule(urlItem, now = Date.now()) {

    if (!urlItem || urlItem.scheduleMode !== "scheduled") {
        return true;
    }

    const windows =
        Array.isArray(urlItem.scheduleWindows) && urlItem.scheduleWindows.length
            ? urlItem.scheduleWindows
            : [
                {
                    from: urlItem.timeFrom || "00:00",
                    to: urlItem.timeTo || "23:59",
                    days: Array.isArray(urlItem.days) && urlItem.days.length ? urlItem.days : [0, 1, 2, 3, 4, 5, 6]
                }
            ];

    const nowDate = new Date(now);
    const currentMinutes =
        (nowDate.getHours() * 60) + nowDate.getMinutes();

    const toMinutes = value => {
        const [hours, minutes] = String(value || "00:00").split(":").map(Number);
        return (hours || 0) * 60 + (minutes || 0);
    };

    return windows.some(window => {

        const selectedDays =
            Array.isArray(window.days) && window.days.length
                ? window.days
                : [0, 1, 2, 3, 4, 5, 6];

        const fromMinutes = toMinutes(window.from || "00:00");
        const toMinutesValue = toMinutes(window.to || "23:59");
        const crossesMidnight = fromMinutes > toMinutesValue;
        const isCurrentPart = currentMinutes >= fromMinutes;
        const isNextDayPart = currentMinutes <= toMinutesValue;
        const scheduleDate = new Date(nowDate);

        if (crossesMidnight && isNextDayPart) {
            scheduleDate.setDate(scheduleDate.getDate() - 1);
        } else if (crossesMidnight && !isCurrentPart) {
            return false;
        }

        if (!selectedDays.includes(scheduleDate.getDay())) {
            return false;
        }

        return crossesMidnight
            ? isCurrentPart || isNextDayPart
            : currentMinutes >= fromMinutes && currentMinutes <= toMinutesValue;

    });

}

async function addUrl() {

    const input =
        document.getElementById(
            "urlInput"
        );


    const durationInput =
        document.getElementById(
            "urlDurationInput"
        );


    const intervalInput =
        document.getElementById(
            "urlIntervalInput"
        );


    const runOnStartInput =
        document.getElementById(
            "urlRunOnStartInput"
        );

    const showBarInput =
        document.getElementById(
            "urlShowBarInput"
        );


    const url =
        input.value.trim();


    if (!url) {

        showToast(
            "Wpisz adres strony WWW"
        );

        return;

    }

    if (!isAllowedWebUrl(url)) {

        showToast(
            "Adres musi zaczynać się od http:// lub https://"
        );

        return;

    }


    const durationMin =
        clamp(
            parseInt(
                durationInput.value
            ) || 30,
            1,
            1440
        );


    const intervalMin =
        clamp(
            parseInt(
                intervalInput.value
            ) || 60,
            1,
            1440
        );

    durationInput.value = durationMin;
    intervalInput.value = intervalMin;


    const runOnStart =
        runOnStartInput.checked;

    const showBar =
        showBarInput
            ? showBarInput.checked
            : true;


    const scheduleMode =
        getUrlScheduleMode();

    const scheduleWindows =
        scheduleMode === "scheduled"
            ? getUrlScheduleWindows()
            : [];

    if (
        scheduleMode === "scheduled" &&
        scheduleWindows.some(window => !window.days.length)
    ) {
        showToast("Zaznacz co najmniej jeden dzień dla każdego okna harmonogramu.");
        return;
    }

    const now =
        Date.now();


    urls.push({

        id: crypto.randomUUID(),

        url:
            url,

        active:
            true,

        duration:
            durationMin,

        interval:
            intervalMin,

        runOnStart:
            runOnStart,

        showBar:
            showBar,

        priority:
            urls.length + 1,

        scheduleMode,

        scheduleWindows,

        timeFrom:
            scheduleWindows[0]?.from || "00:00",

        timeTo:
            scheduleWindows[0]?.to || "23:59",

        days:
            scheduleMode === "scheduled"
                ? scheduleWindows.flatMap(window => window.days)
                : [0, 1, 2, 3, 4, 5, 6],

        nextRunTime:
            runOnStart
            ? now
            : now + intervalMin * 60 * 1000

    });


    await saveData(
        "productionBoardUrls",
        urls
    );

    await saveUrlRuntimeState(
        urls[urls.length - 1].id,
        urls[urls.length - 1].nextRunTime
    );


    input.value = "";


    renderUrls();


    showToast(
        "Strona WWW dodana"
    );

}


function renderUrls() {

    const container =
        document.getElementById(
            "urlList"
        );


    if (!container) {
        return;
    }


    container.innerHTML = "";


    if (!urls.length) {

        container.innerHTML =
            '<div style="color:#777">Brak stron WWW.</div>';

        return;

    }


    urls.forEach(
        (item, index) => {

            const card =
                document.createElement(
                    "div"
                );


            card.className =
                "mediaCard" +
                (
                    item.active === false
                    ? " inactive"
                    : ""
                );


            card.innerHTML = `

                <div class="mediaInfo">

                    <div class="mediaTitle">
                        ${escapeHtml(item.url)}
                    </div>

                    <div class="mediaDetails">

                        Wyświetlaj przez:

                        <input
                            class="urlDurationInput"
                            type="number"
                            min="1"
                            max="1440"
                            value="${item.duration || 30}"
                            data-index="${index}"
                            style="width:60px">

                        min


                        &nbsp; | &nbsp;


                        Co:

                        <input
                            class="urlIntervalInput"
                            type="number"
                            min="1"
                            max="1440"
                            value="${item.interval || 60}"
                            data-index="${index}"
                            style="width:60px">

                        min


                        <br>

                        <div style="margin-top:6px; color:#dfefff;">
                            ${item.scheduleMode === "scheduled"
                                ? (Array.isArray(item.scheduleWindows) && item.scheduleWindows.length
                                    ? item.scheduleWindows.map(window => {
                                        const days = Array.isArray(window.days) && window.days.length
                                            ? window.days.map(day => ["Nd","Pn","Wt","Śr","Czw","Pt","Sob"][day]).join(", ")
                                            : "każdy dzień";
                                        return `Harmonogram: ${escapeHtml(window.from || "00:00")}–${escapeHtml(window.to || "23:59")} · ${escapeHtml(days)}`;
                                    }).join("<br>")
                                    : `Harmonogram: ${escapeHtml(item.timeFrom || "00:00")}–${escapeHtml(item.timeTo || "23:59")} · ${escapeHtml(item.days && item.days.length ? item.days.map(day => ["Nd","Pn","Wt","Śr","Czw","Pt","Sob"][day]).join(", ") : "każdy dzień")}`)
                                : "Wyświetlaj cały czas"
                            }
                        </div>

                        <br>


                        <span class="priorityAction">

                            <span class="priorityLabel">Pozycja</span>

                            <input
                                class="urlPriorityInput"
                                type="number"
                                min="1"
                                max="${urls.length}"
                                value="${clamp(parseInt(item.priority) || 1, 1, urls.length)}"
                                aria-label="Pozycja strony WWW"
                                data-index="${index}">

                            <span class="priorityTotal">z ${urls.length}</span>

                        </span>


                        Start natychmiast:

                        <input
                            class="urlRunOnStartInput"
                            type="checkbox"
                            ${item.runOnStart ? "checked" : ""}
                            data-index="${index}">
                        Pasek dolny:

                        <input
                            class="urlShowBarInput"
                            type="checkbox"
                            ${item.showBar !== false ? "checked" : ""}
                            data-index="${index}">
                    </div>

                </div>


                <div class="mediaActions">

                    <button
                        class="btnWarning toggleUrlButton"
                        data-id="${escapeHtml(String(item.id))}"
                        type="button">

                        ${
                            item.active === false
                            ? "WŁ."
                            : "WYŁ."
                        }

                    </button>


                    <button
                        class="btnDanger deleteUrlButton"
                        data-index="${index}"
                        type="button">

                        ×

                    </button>

                </div>

            `;

            card.querySelector(".urlDurationInput").addEventListener(
                "change",
                event => changeUrl(index, "duration", event.currentTarget.value)
            );

            card.querySelector(".urlIntervalInput").addEventListener(
                "change",
                event => changeUrl(index, "interval", event.currentTarget.value)
            );

            card.querySelector(".urlPriorityInput").addEventListener(
                "change",
                event => changeUrl(index, "priority", event.currentTarget.value)
            );

            card.querySelector(".urlRunOnStartInput").addEventListener(
                "change",
                event => changeUrl(index, "runOnStart", event.currentTarget.checked)
            );

            card.querySelector(".urlShowBarInput").addEventListener(
                "change",
                event => changeUrl(index, "showBar", event.currentTarget.checked)
            );

            card.querySelector(".toggleUrlButton").addEventListener(
                "click",
                () => toggleUrl(item.id)
            );

            card.querySelector(".deleteUrlButton").addEventListener(
                "click",
                () => deleteUrl(index)
            );


            container.appendChild(
                card
            );

        }
    );

}

/* =========================================================
   WŁĄCZ / WYŁĄCZ STRONĘ WWW
   ========================================================= */

async function toggleUrl(
    id
) {

    const urlItem =
        urls.find(
            item =>
                String(item.id) ===
                String(id)
        );
    if (!urlItem) {
        return;
    }


    const shouldActivate =
        urlItem.active === false;

    urlItem.active =
        shouldActivate;

    if (shouldActivate) {

        urlItem.nextRunTime =
            urlItem.runOnStart
            ? Date.now()
            : Date.now() +
                (parseInt(urlItem.interval) || 60) *
                60 *
                1000;

    } else {

        urlItem.nextRunTime =
            null;

    }

    if (
        !shouldActivate &&
        String(currentActiveUrlId) ===
        String(urlItem.id)
    ) {

        await stopUrlDisplay(
            urlItem.id,
            true
        );

    }


    await saveData(
        "productionBoardUrls",
        urls
    );

    await saveUrlRuntimeState(urlItem.id, urlItem.nextRunTime);


    renderUrls();

    updateSystem();

}


async function changeUrl(
    index,
    property,
    value
) {

    if (!urls[index]) {
        return;
    }

    if (property === "priority") {
        await changeUrlPriority(urls[index].id, value);
        return;
    }


    if (
        property === "duration" ||
        property === "interval"
    ) {

        urls[index][property] =
            clamp(
                parseInt(value) || 1,
                1,
                1440
            );

    }


    if (
        property === "runOnStart"
    ) {

        urls[index][property] =
            Boolean(value);

        if (
            !activeUrlMode
        ) {

            urls[index].nextRunTime =
                urls[index][property]
                ? Date.now()
                : Date.now() +
                    urls[index].interval *
                    60 *
                    1000;

        }

    }

    if (
        property === "showBar"
    ) {

        urls[index][property] =
            Boolean(value);

        if (
            String(currentActiveUrlId) ===
            String(urls[index].id)
        ) {
            syncUrlBarState(
                urls[index]
            );
        }

    }


    if (
        property === "interval" &&
        !activeUrlMode
    ) {

        urls[index].nextRunTime =
            Date.now() +
            urls[index].interval *
            60 *
            1000;

    }


    await saveData(
        "productionBoardUrls",
        urls
    );

    if (property === "interval" || property === "runOnStart") {
        await saveUrlRuntimeState(
            urls[index].id,
            urls[index].nextRunTime
        );
    }

    updateSystem();
    renderUrls();

}


async function deleteUrl(index) {

    if (
        !confirm(
            "Usunąć tę stronę WWW?"
        )
    ) {

        return;

    }

    const deletedUrl = urls[index];

    if (
        deletedUrl &&
        String(currentActiveUrlId) === String(deletedUrl.id)
    ) {
        stopUrlDisplay(deletedUrl.id);
    }


    urls.splice(
        index,
        1
    );


    await saveData(
        "productionBoardUrls",
        urls
    );

    await removeUrlRuntimeState(deletedUrl?.id);


    renderUrls();

    updateSystem();

}

async function changeUrlPriority(id, value) {

    const orderedUrls = normalizeUrlPriorities(urls);
    const currentIndex = orderedUrls.findIndex(
        item => String(item.id) === String(id)
    );

    if (currentIndex === -1) {
        return;
    }

    const targetIndex =
        clamp(
            parseInt(value) || 1,
            1,
            orderedUrls.length
        ) - 1;

    const [movedUrl] = orderedUrls.splice(currentIndex, 1);
    orderedUrls.splice(targetIndex, 0, movedUrl);

    const nextUrls = orderedUrls.map((item, index) => ({
        ...item,
        priority: index + 1
    }));

    try {
        await saveData("productionBoardUrls", nextUrls);
        urls = nextUrls;
        renderUrls();
        updateSystem();
    } catch (error) {
        console.error("Nie udało się zmienić pozycji strony WWW.", error);
        showToast("Nie udało się zmienić pozycji strony WWW.");
    }

}

function normalizeUrlRuntimeStates(value) {

    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return {};
    }

    return Object.fromEntries(
        Object.entries(value).filter(
            ([id, nextRunTime]) =>
                typeof id === "string" &&
                (nextRunTime === null || Number.isFinite(nextRunTime))
        )
    );

}

function applyUrlRuntimeStates(items, runtimeStates = urlRuntimeStates) {

    return items.map(item =>
        Object.prototype.hasOwnProperty.call(runtimeStates, item.id)
            ? { ...item, nextRunTime: runtimeStates[item.id] }
            : item
    );

}

async function saveUrlRuntimeState(id, nextRunTime) {

    urlRuntimeStates = {
        ...urlRuntimeStates,
        [String(id)]: nextRunTime
    };

    await saveData("productionBoardUrlRuntime", urlRuntimeStates);

}

async function removeUrlRuntimeState(id) {

    const nextStates = { ...urlRuntimeStates };
    delete nextStates[String(id)];
    urlRuntimeStates = nextStates;

    await saveData("productionBoardUrlRuntime", urlRuntimeStates);

}
