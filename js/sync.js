/* Synchronizacja danych między kartami i oknami aplikacji. */

const sharedDataRefreshTokens = new Map();

async function refreshSharedData(key) {

    if (!key) return;

    const refreshToken =
        (sharedDataRefreshTokens.get(key) || 0) + 1;

    sharedDataRefreshTokens.set(key, refreshToken);

    const isCurrentRefresh = () =>
        sharedDataRefreshTokens.get(key) === refreshToken;

    if (key === "productionBoardConfig") {
        const storedConfig = await loadDataAsync(key, DEFAULT_CONFIG);
        if (!isCurrentRefresh()) return;
        config = {
            ...DEFAULT_CONFIG,
            ...(storedConfig && typeof storedConfig === "object" ? storedConfig : {})
        };
        applyConfig();
    }

    if (key === "productionBoardUrls") {
        const nextUrls = normalizeUrlItems(await loadDataAsync(key, []));
        if (!isCurrentRefresh()) return;
        urls = applyUrlRuntimeStates(nextUrls);
        renderUrls();
        updateSystem();
    }

    if (key === "productionBoardUrlRuntime") {
        const nextRuntimeStates = normalizeUrlRuntimeStates(
            await loadDataAsync(key, {})
        );
        if (!isCurrentRefresh()) return;
        urlRuntimeStates = nextRuntimeStates;
        urls = applyUrlRuntimeStates(urls);
        updateSystem();
    }

    if (key === "productionBoardMessages") {
        const nextMessages = normalizeMessageItems(
            await loadDataAsync(key, [])
        );
        if (!isCurrentRefresh()) return;
        messages = nextMessages;
        renderMessages();
        updateSystem();
    }

    if (key === "productionBoardImages") {
        const nextImages = await loadImagesCollection();
        if (!isCurrentRefresh()) {
            releaseImageObjectUrls(nextImages);
            return;
        }
        releaseImageObjectUrls(images);
        images = nextImages;
        renderImages();
        updateSystem();
    }

}

function bindStorageSynchronization() {

    window.addEventListener("storage", event => {
        if (event.key !== "productionBoardSync" || !event.newValue) return;

        let key;
        try {
            key = JSON.parse(event.newValue).key;
        } catch (error) {
            return;
        }

        refreshSharedData(key);
    });

    if (storageChannel) {
        storageChannel.addEventListener(
            "message",
            event => refreshSharedData(event.data?.key)
        );
    }

}
