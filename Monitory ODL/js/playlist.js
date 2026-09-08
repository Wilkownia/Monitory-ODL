/* Lista i rotacja zdjęć. */

function renderImages() {

    const container = document.getElementById("imageList");
    if (!container) return;

    container.innerHTML = "";

    if (!images.length) {
        container.innerHTML = '<div style="color:#777">Brak zdjęć.</div>';
        return;
    }

    images.forEach((image, index) => {
        const card = document.createElement("div");
        card.className = "mediaCard imageCard";
        card.innerHTML = `
            <img class="mediaThumb" alt="">
            <div class="mediaInfo">
                <div class="mediaTitle">${escapeHtml(image.name)}</div>
                <div class="mediaDetails">
                    Czas wyświetlania:
                    <input class="imageDurationInput" type="number" min="1" max="3600" value="${image.duration || 10}" data-index="${index}" style="width:80px">
                    sekund
                    <label class="mediaOption">
                        <input class="imageFullscreenInput" type="checkbox" ${image.fullscreen ? "checked" : ""} data-index="${index}">
                        Pełny ekran
                    </label>
                </div>
            </div>
            <div class="mediaActions">
                <button class="btnSecondary moveImageUpButton" data-index="${index}" type="button">↑</button>
                <button class="btnSecondary moveImageDownButton" data-index="${index}" type="button">↓</button>
                <button class="btnDanger deleteImageButton" data-index="${index}" type="button">USUŃ</button>
            </div>
        `;

        if (isAllowedImageSource(image.src)) {
            card.querySelector(".mediaThumb").src = image.src;
        }

        card.querySelector(".imageDurationInput").addEventListener(
            "change",
            event => changeImage(index, "duration", event.currentTarget.value)
        );
        card.querySelector(".imageFullscreenInput").addEventListener(
            "change",
            event => changeImage(index, "fullscreen", event.currentTarget.checked)
        );
        card.querySelector(".moveImageUpButton").addEventListener(
            "click",
            () => moveImage(index, -1)
        );
        card.querySelector(".moveImageDownButton").addEventListener(
            "click",
            () => moveImage(index, 1)
        );
        card.querySelector(".deleteImageButton").addEventListener(
            "click",
            () => deleteImage(index)
        );

        container.appendChild(card);
    });

}

async function moveImage(index, direction) {

    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;

    const previousImages = images;
    const nextImages = [...images];

    [nextImages[index], nextImages[newIndex]] = [
        nextImages[newIndex],
        nextImages[index]
    ];

    const orderedImages = nextImages.map((image, imageIndex) => ({
        ...image,
        order: imageIndex,
        updatedAt: Date.now()
    }));

    try {
        images = await replaceImagesCollection(orderedImages);
        releaseImageObjectUrls(previousImages);
        renderImages();
    } catch (error) {
        images = previousImages;
        console.error("Nie udało się zapisać kolejności zdjęć.", error);
        renderImages();
        showToast("Nie udało się zapisać kolejności zdjęć.");
    }

}

function rotateImages() {

    if (activeUrlMode || isFullScreenMessageActive || isFullScreenImageActive) return;

    const activeImages = images.filter(
        image => image.active !== false && isAllowedImageSource(image.src)
    );

    const image = document.getElementById("imageDisplay");
    const iframe = document.getElementById("iframeDisplay");

    if (!activeImages.length) {
        image.classList.remove("active");
        iframe.classList.remove("active");
        return;
    }

    iframe.classList.remove("active");
    if (imageIndex >= activeImages.length) imageIndex = 0;

    const currentImage = activeImages[imageIndex];
    const duration = Math.max(1, parseInt(currentImage.duration) || 10);
    imageIndex = (imageIndex + 1) % activeImages.length;

    const wasImageActive = image.classList.contains("active");
    const wasFullScreenImage = isFullScreenImageActive;
    image.classList.remove("active");

    rotationTimer = setTimeout(() => {
        if (activeUrlMode || isFullScreenMessageActive || isFullScreenImageActive) {
            rotationTimer = null;
            return;
        }

        if (!images.some(imageItem => imageItem.id === currentImage.id)) {
            rotationTimer = null;
            rotateImages();
            return;
        }

        image.src = currentImage.src;

        if (currentImage.fullscreen) {
            image.classList.remove("active");
            showFullScreenImage(currentImage.src);
        } else {
            hideFullScreenMessage();
        }

        if (!currentImage.fullscreen) image.classList.add("active");

        rotationTimer = setTimeout(() => {
            rotationTimer = null;
            if (isFullScreenImageActive) hideFullScreenMessage();
            rotateImages();
        }, duration * 1000);
    }, wasFullScreenImage || currentImage.fullscreen ? 0 : wasImageActive ? 700 : 0);

}
