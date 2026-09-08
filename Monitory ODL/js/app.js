/* Bootstrap aplikacji. Pozostała logika jest podzielona na moduły. */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        document.addEventListener("keydown", handleKeyboard);
        bindStorageSynchronization();

        if (!isAdminMode) {
            updateClock();
            setInterval(updateClock, 1000);
        }

        await initializeStorage();

        const storedConfig = await loadDataAsync(
            "productionBoardConfig",
            DEFAULT_CONFIG
        );

        config = {
            ...DEFAULT_CONFIG,
            ...(storedConfig && typeof storedConfig === "object"
                ? storedConfig
                : {})
        };

        if (config.pin) {
            config.pinHash = await hashPin(config.pin);
            delete config.pin;
            await saveData("productionBoardConfig", config);
        }

        urlRuntimeStates = normalizeUrlRuntimeStates(
            await loadDataAsync("productionBoardUrlRuntime", {})
        );

        urls = applyUrlRuntimeStates(
            normalizeUrlItems(
                await loadDataAsync("productionBoardUrls", [])
            )
        );

        messages = normalizeMessageItems(
            await loadDataAsync(
                "productionBoardMessages",
                []
            )
        );

        try {
            await initDatabase();
            images = await loadImagesCollection();
        } catch (error) {
            console.error("Błąd odczytu zdjęć z IndexedDB.", error);
            images = [];
        }

        if (!isAdminMode) {
            const now = Date.now();

            urls.forEach(urlItem => {
                if (urlItem.active !== false && urlItem.runOnStart) {
                    urlItem.nextRunTime = now;
                }
            });

            applyConfig();
            syncSidePanelToContentFrame();
            window.addEventListener("resize", syncSidePanelToContentFrame);
        }

        renderImages();
        renderUrls();
        renderMessages();

        if (isAdminMode) {
            openPin();
        } else {
            updateSystem();
            startSystemScheduler();
        }
        const bindIfPresent = (id, event, handler) => {
            document
                .getElementById(id)
                ?.addEventListener(event, handler);
        };

        bindIfPresent("imagePicker", "change", addImages);
        bindIfPresent("messageImagePicker", "change", handleMessageImage);
        bindIfPresent("checkPinButton", "click", checkPin);
        bindIfPresent("closePinButton", "click", closePin);
        bindIfPresent("closeAdminButton", "click", closeAdmin);
        bindIfPresent("saveScreenSettingsButton", "click", saveScreenSettings);
        bindIfPresent("addUrlButton", "click", addUrl);
        bindIfPresent("addUrlScheduleButton", "click", addUrlScheduleWindow);
        bindIfPresent("removeMessageImageButton", "click", removeMessageImage);
        bindIfPresent("messageFullscreen", "change", toggleMessageBarOption);
        bindIfPresent("saveMessageButton", "click", saveMessage);
        bindIfPresent("clearMessageButton", "click", clearMessageForm);
        bindIfPresent("saveSystemSettingsButton", "click", saveSystemSettings);

        document
            .querySelector("#urlScheduleWindows .removeUrlScheduleButton")
            ?.addEventListener(
                "click",
                event => removeUrlScheduleWindow(event.currentTarget.parentElement)
            );

        const iframeDisplay =
            document.getElementById("iframeDisplay");

        if (iframeDisplay) {
            iframeDisplay.addEventListener("error", () => {
                const failedUrlId = iframeDisplay.dataset.urlId;

                if (
                    activeUrlMode &&
                    failedUrlId &&
                    String(currentActiveUrlId) === String(failedUrlId)
                ) {
                    stopUrlDisplay(failedUrlId);
                }
            });
        }

        document
            .querySelectorAll('input[name="urlDisplayMode"]')
            .forEach(
                input => input.addEventListener(
                    "change",
                    syncUrlDisplayModeLabel
                )
            );

        syncUrlDisplayModeLabel();

        document.querySelectorAll(".dayButton").forEach(
            button => button.addEventListener(
                "click",
                () => button.classList.toggle("active")
            )
        );

    }
);
