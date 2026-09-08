/* Wspólne narzędzia harmonogramów i funkcje systemowe. */

function timeToMinutes(time) {
    if (!time) return 0;
    const parts = String(time).split(":");
    return (parseInt(parts[0]) || 0) * 60 + (parseInt(parts[1]) || 0);
}

function formatDate(date) {
    return date.getFullYear() + "-" +
        String(date.getMonth() + 1).padStart(2, "0") + "-" +
        String(date.getDate()).padStart(2, "0");
}

function formatDays(days) {
    const names = ["ND", "PON", "WT", "ŚR", "CZW", "PT", "SOB"];
    if (!days || !days.length) return "brak dni";
    return days.map(day => names[day]).join(", ");
}

function getMessageTypeName(type) {
    switch (type) {
        case "warning": return "OSTRZEŻENIE";
        case "danger": return "PILNE";
        case "success": return "POZYTYWNA";
        default: return "INFORMACJA";
    }
}

function getMessageColor(type) {
    return MESSAGE_TYPE_COLORS[type] || MESSAGE_TYPE_COLORS.info;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function escapeHtml(text) {
    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function saveSystemSettings(showConfirmation = true) {

    const pin = document.getElementById("newPin").value.trim();

    if (pin) {
        config.pinHash = await hashPin(pin);
        delete config.pin;
    }

    config.requirePin = document.getElementById("requirePin").checked;
    await saveData("productionBoardConfig", config);
    document.getElementById("newPin").value = "";

    if (showConfirmation) showToast("Ustawienia zapisane");

}

function showToast(text) {

    const toast = document.getElementById("toast");
    toast.textContent = text;
    toast.style.display = "block";
    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
        toast.style.display = "none";
    }, 3000);

}
