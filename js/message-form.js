/* Formularz komunikatu i zdjęcie komunikatu. */

let messageImageLoadToken = 0;

function handleMessageImage(event) {

    const file =
        event.target.files[0];

    if (!file) {
        return;
    }

    if (!file.type.startsWith("image/")) {
        showToast("Wybierz plik graficzny");
        return;
    }

    if (file.size > 10 * 1024 * 1024) {
        showToast("Zdjęcie komunikatu nie może być większe niż 10 MB.");
        event.target.value = "";
        return;
    }

    const loadToken = ++messageImageLoadToken;

    const reader =
        new FileReader();

    reader.onload =
        async function(e) {
            const optimizedImage = await optimizeImageDataUrl(e.target.result);

            if (loadToken !== messageImageLoadToken) {
                return;
            }

            currentMessageImage = optimizedImage;
            showMessageImagePreview(currentMessageImage);
        };

    reader.readAsDataURL(file);

}

function showMessageImagePreview(src) {

    const preview =
        document.getElementById("messageImagePreview");

    const removeButton =
        document.getElementById("removeMessageImageButton");

    if (!src) {
        preview.style.display = "none";
        preview.src = "";
        removeButton.style.display = "none";
        return;
    }

    preview.src = src;
    preview.style.display = "block";
    removeButton.style.display = "inline-block";

}

function removeMessageImage() {

    messageImageLoadToken++;

    currentMessageImage = null;

    document.getElementById(
        "messageImagePicker"
    ).value = "";

    showMessageImagePreview("");

}

function getSelectedMessageDays() {

    return Array.from(
        document.querySelectorAll("#messageDays .dayButton.active")
    ).map(
        button => parseInt(button.dataset.day)
    );

}

function toggleMessageBarOption() {

    const fullscreen =
        document.getElementById("messageFullscreen").checked;

    const field =
        document.getElementById("messageShowBarField");

    field.style.display = fullscreen ? "flex" : "none";

    if (!fullscreen) {
        document.getElementById("messageShowBar").checked = false;
    }

}

function clearMessageForm() {

    messageImageLoadToken++;

    document.getElementById("editingMessageId").value = "";
    document.getElementById("messageTitle").value = "";
    document.getElementById("messageDescription").value = "";
    document.getElementById("messageType").value = "info";
    document.getElementById("messageDateFrom").value = "";
    document.getElementById("messageDateTo").value = "";
    document.getElementById("messageTimeFrom").value = "00:00";
    document.getElementById("messageTimeTo").value = "23:59";
    document.getElementById("messageActive").checked = true;
    document.getElementById("messageFullscreen").checked = false;
    document.getElementById("messageShowBar").checked = false;

    toggleMessageBarOption();

    currentMessageImage = "";
    document.getElementById("messageImagePicker").value = "";
    showMessageImagePreview("");

    document.querySelectorAll(
        "#messageDays .dayButton"
    ).forEach(
        button => button.classList.toggle("active", true)
    );

}

function editMessage(id) {

    const message =
        messages.find(
            item => String(item.id) === String(id)
        );

    if (!message) {
        return;
    }

    messageImageLoadToken++;

    document.getElementById("editingMessageId").value = message.id;
    document.getElementById("messageTitle").value = message.title || "";
    document.getElementById("messageDescription").value = message.description || "";
    document.getElementById("messageType").value = message.type || "info";
    document.getElementById("messageDateFrom").value = message.dateFrom || "";
    document.getElementById("messageDateTo").value = message.dateTo || "";
    document.getElementById("messageTimeFrom").value = message.timeFrom || "00:00";
    document.getElementById("messageTimeTo").value = message.timeTo || "23:59";
    document.getElementById("messageActive").checked = message.active !== false;
    document.getElementById("messageFullscreen").checked = Boolean(message.fullscreen);
    document.getElementById("messageShowBar").checked = Boolean(message.showBar);

    toggleMessageBarOption();

    currentMessageImage = message.image || "";
    showMessageImagePreview(currentMessageImage);

    document.querySelectorAll(
        "#messageDays .dayButton"
    ).forEach(
        button => button.classList.toggle(
            "active",
            (message.days || []).includes(parseInt(button.dataset.day))
        )
    );

    document.getElementById("messageEditor").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

}
