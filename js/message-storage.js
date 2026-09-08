/* Zapis i modyfikacja komunikatów. */

async function saveMessage() {

    const title =
        document.getElementById("messageTitle").value.trim();

    const description =
        document.getElementById("messageDescription").value.trim();

    if (!title) {
        showToast("Wpisz tytuł");
        return;
    }

    if (!description) {
        showToast("Wpisz treść");
        return;
    }

    const timeFrom =
        document.getElementById("messageTimeFrom").value || "00:00";

    const timeTo =
        document.getElementById("messageTimeTo").value || "23:59";

    const dateFrom =
        document.getElementById("messageDateFrom").value;

    const dateTo =
        document.getElementById("messageDateTo").value;

    if (dateFrom && dateTo && dateFrom > dateTo) {
        showToast("Data końcowa nie może być wcześniejsza niż data początkowa.");
        return;
    }

    const id =
        document.getElementById("editingMessageId").value;

    const oldMessage =
        messages.find(
            message => String(message.id) === String(id)
        );

    const fullscreen =
        document.getElementById("messageFullscreen").checked;

    const message = {
        id: oldMessage ? oldMessage.id : crypto.randomUUID(),
        title,
        description,
        type: document.getElementById("messageType").value,
        priority: oldMessage
            ? oldMessage.priority
            : messages.length + 1,
        dateFrom,
        dateTo,
        timeFrom,
        timeTo,
        days: getSelectedMessageDays(),
        active: document.getElementById("messageActive").checked,
        fullscreen,
        showBar: fullscreen && document.getElementById("messageShowBar").checked,
        image: currentMessageImage || ""
    };

    let nextMessages;

    if (oldMessage) {
        const index =
            messages.findIndex(
                item => String(item.id) === String(id)
            );

        nextMessages = [...messages];
        nextMessages[index] = message;
    } else {
        nextMessages = [...messages, message];
    }

    nextMessages = normalizeMessagePriorities(nextMessages);

    try {
        await saveData("productionBoardMessages", nextMessages);
        messages = nextMessages;
        renderMessages();
        clearMessageForm();
        updateSystem();
        showToast("Komunikat zapisany");
    } catch (error) {
        console.error("Nie udało się zapisać komunikatu.", error);
        showToast("Nie udało się zapisać komunikatu.");
    }

}

async function deleteMessage(id) {

    const message =
        messages.find(
            item => String(item.id) === String(id)
        );

    if (!message) {
        return;
    }

    if (!confirm(`Usunąć "${message.title}"?`)) {
        return;
    }

    const nextMessages = normalizeMessagePriorities(
        messages.filter(
            item => String(item.id) !== String(id)
        )
    );

    try {
        await saveData("productionBoardMessages", nextMessages);
        messages = nextMessages;

        if (
            document.getElementById("editingMessageId")?.value === String(id)
        ) {
            clearMessageForm();
        }

        renderMessages();
        updateSystem();
    } catch (error) {
        console.error("Nie udało się usunąć komunikatu.", error);
        showToast("Nie udało się usunąć komunikatu.");
    }

}

async function toggleMessage(id) {

    const message =
        messages.find(
            item => String(item.id) === String(id)
        );

    if (!message) {
        return;
    }

    const nextMessages = messages.map(item =>
        String(item.id) === String(id)
            ? { ...item, active: !item.active }
            : item
    );

    try {
        await saveData("productionBoardMessages", nextMessages);
        messages = nextMessages;
        renderMessages();
        updateSystem();
    } catch (error) {
        console.error("Nie udało się zmienić statusu komunikatu.", error);
        showToast("Nie udało się zmienić statusu komunikatu.");
    }

}

async function changeMessagePriority(id, value) {

    const orderedMessages = normalizeMessagePriorities(messages);
    const currentIndex = orderedMessages.findIndex(
        item => String(item.id) === String(id)
    );

    if (currentIndex === -1) {
        return;
    }

    const targetIndex =
        clamp(
            parseInt(value) || 1,
            1,
            orderedMessages.length
        ) - 1;

    const [movedMessage] = orderedMessages.splice(currentIndex, 1);
    orderedMessages.splice(targetIndex, 0, movedMessage);

    const nextMessages = orderedMessages.map((message, index) => ({
        ...message,
        priority: index + 1
    }));

    try {
        await saveData("productionBoardMessages", nextMessages);
        messages = nextMessages;
        renderMessages();
        updateSystem();
    } catch (error) {
        console.error("Nie udało się zmienić priorytetu komunikatu.", error);
        showToast("Nie udało się zmienić priorytetu komunikatu.");
    }

}
