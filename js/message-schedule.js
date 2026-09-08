/* Harmonogramy i wybór aktywnych komunikatów. */

function normalizeMessageItems(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    const types = new Set(["info", "warning", "danger", "success"]);

    const normalized = value
        .filter(message => message && typeof message === "object")
        .map((message, index) => ({
            ...message,
            id: String(message.id || crypto.randomUUID()),
            title: String(message.title || ""),
            description: String(message.description || ""),
            type: types.has(message.type) ? message.type : "info",
            active: message.active !== false,
            fullscreen: Boolean(message.fullscreen),
            showBar: Boolean(message.showBar),
            timeFrom: message.timeFrom || "00:00",
            timeTo: message.timeTo || "23:59",
            days: Array.isArray(message.days)
                ? message.days.filter(day => Number.isInteger(day) && day >= 0 && day <= 6)
                : [0, 1, 2, 3, 4, 5, 6],
            priority: Number.isFinite(parseInt(message.priority))
                ? parseInt(message.priority)
                : index + 1,
            image: typeof message.image === "string" ? message.image : ""
        }));

    return normalizeMessagePriorities(normalized);

}

function normalizeMessagePriorities(list) {

    return [...list]
        .sort(
            (a, b) =>
                (parseInt(a.priority) || 0) - (parseInt(b.priority) || 0)
        )
        .map((message, index) => ({
            ...message,
            priority: index + 1
        }));

}

function getActiveMessages() {

    const now = new Date();

    return messages
        .filter(
            message =>
                message.active !== false &&
                isScheduledNow(message, now)
        )
        .sort(
            (a, b) =>
                (parseInt(b.priority) || 0) -
                (parseInt(a.priority) || 0)
        );

}

function isScheduledNow(item, now) {

    const currentMinutes =
        now.getHours() * 60 + now.getMinutes();

    const from =
        timeToMinutes(item.timeFrom || "00:00");

    const to =
        timeToMinutes(item.timeTo || "23:59");

    const crossesMidnight = from > to;
    const isCurrentPart = currentMinutes >= from;
    const isNextDayPart = currentMinutes <= to;
    const scheduleDate = new Date(now);

    if (crossesMidnight && isNextDayPart) {
        scheduleDate.setDate(scheduleDate.getDate() - 1);
    } else if (crossesMidnight && !isCurrentPart) {
        return false;
    }

    const scheduleDay = scheduleDate.getDay();
    const scheduleDateText = formatDate(scheduleDate);

    if (!Array.isArray(item.days) || !item.days.length) {
        return false;
    }

    if (!item.days.includes(scheduleDay)) {
        return false;
    }

    if (item.dateFrom && scheduleDateText < item.dateFrom) {
        return false;
    }

    if (item.dateTo && scheduleDateText > item.dateTo) {
        return false;
    }

    return crossesMidnight
        ? isCurrentPart || isNextDayPart
        : currentMinutes >= from && currentMinutes <= to;

}
