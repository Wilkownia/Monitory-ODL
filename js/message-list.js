/* Lista komunikatów w panelu administracyjnym. */

function renderMessages() {

    const container =
        document.getElementById("messageList");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (!messages.length) {
        container.innerHTML = '<div style="color:#777">Brak komunikatów.</div>';
        return;
    }

    messages.forEach(
        message => {

            const row =
                document.createElement("div");

            row.className =
                "messageRow" + (message.active ? "" : " inactive");

            const priority =
                clamp(parseInt(message.priority) || 1, 1, messages.length);

            const priorityControl = `
                    <div class="priorityAction">
                        <span class="priorityLabel">Pozycja</span>
                        <input
                            class="messagePriorityInput"
                            type="number"
                            min="1"
                            max="${messages.length}"
                            value="${priority}"
                            aria-label="Ważność komunikatu"
                            data-id="${escapeHtml(String(message.id))}">
                        <span class="priorityTotal">z ${messages.length}</span>
                    </div>`;

            row.innerHTML = `
                <div>
                    <div class="rowTitle">${escapeHtml(message.title)}</div>
                    <div class="rowDetails">
                        ${message.fullscreen ? "PEŁNY EKRAN" : "PASEK"}
                        ${message.fullscreen && message.showBar ? " + PASEK" : ""}
                        |
                        ${escapeHtml(message.timeFrom || "00:00")}
                        -
                        ${escapeHtml(message.timeTo || "23:59")}
                        |
                        ${formatDays(message.days)}
                    </div>
                </div>
                <div>
                    ${escapeHtml(getMessageTypeName(message.type))}
                </div>
                <div class="buttons">
                    ${priorityControl}
                    <button
                        class="btnSecondary editMessageButton"
                        data-id="${escapeHtml(String(message.id))}"
                        type="button">
                        EDYTUJ
                    </button>
                    <button
                        class="btnWarning toggleMessageButton"
                        data-id="${escapeHtml(String(message.id))}"
                        type="button">
                        ${message.active ? "WYŁ." : "WŁ."}
                    </button>
                    <button
                        class="btnDanger deleteMessageButton"
                        data-id="${escapeHtml(String(message.id))}"
                        type="button">
                        ×
                    </button>
                </div>
            `;

            row.querySelector(".messagePriorityInput").addEventListener(
                "change",
                event => changeMessagePriority(
                    message.id,
                    event.currentTarget.value
                )
            );

            row.querySelector(".editMessageButton").addEventListener(
                "click",
                () => editMessage(message.id)
            );

            row.querySelector(".toggleMessageButton").addEventListener(
                "click",
                () => toggleMessage(message.id)
            );

            row.querySelector(".deleteMessageButton").addEventListener(
                "click",
                () => deleteMessage(message.id)
            );

            if (isAllowedImageSource(message.image)) {
                const preview = document.createElement("img");
                preview.className = "messagePreview";
                preview.alt = "";
                preview.src = message.image;
                row.querySelector(".rowDetails").appendChild(preview);
            }

            container.appendChild(row);

        }
    );

}
