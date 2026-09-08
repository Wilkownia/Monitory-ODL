/*
 * Dodawanie, edycja i usuwanie zdjęć.
 * Zdjęcia przechowywane są w IndexedDB.
 */

/* =========================================================
   ZDJĘCIA - DODAWANIE
   ========================================================= */

function optimizeImageDataUrl(source) {

    return new Promise(resolve => {

        const image = new Image();

        image.onload = () => {

            const maxDimension = 1920;
            const scale = Math.min(
                1,
                maxDimension / Math.max(image.naturalWidth, image.naturalHeight)
            );
            const canvas = document.createElement("canvas");

            canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
            canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
            canvas.getContext("2d").drawImage(
                image,
                0,
                0,
                canvas.width,
                canvas.height
            );

            resolve(canvas.toDataURL("image/jpeg", 0.82));

        };

        image.onerror = () => resolve(source);
        image.src = source;

    });

}

async function addImages(event) {

    const files =
        Array.from(
            event.target.files
        );


    if (!files.length) {
        return;
    }


    const validFiles =
        files.filter(
            file =>
                file.type.startsWith("image/")
        );

    if (!validFiles.length) {
        return;
    }

    const defaultTime =
        clamp(
            parseInt(
                document.getElementById(
                    "defaultImageTime"
                ).value
            ) || 5,
            1,
            3600
        );

    try {

        const newImages = [];
        const highestOrder = images.reduce(
            (highest, image) => Math.max(highest, Number(image.order) || 0),
            -1
        );

        for (const file of validFiles) {

            const reader =
                new FileReader();

            const dataUrl =
                await new Promise((resolve, reject) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => reject(reader.error);
                    reader.readAsDataURL(file);
                });

            const imageSource =
                await optimizeImageDataUrl(dataUrl);

            const imageBlob =
                dataUrlToBlob(imageSource, "image/jpeg");

            const record = {
                id: crypto.randomUUID(),
                name: file.name,
                src: "",
                blob: imageBlob,
                type: imageBlob?.type || "image/jpeg",
                size: file.size,
                duration: defaultTime,
                active: true,
                fullscreen: false,
                order: highestOrder + newImages.length + 1,
                createdAt: Date.now(),
                updatedAt: Date.now()
            };

            const savedRecord =
                await saveImageRecord(record);

            if (savedRecord) {
                newImages.push(savedRecord);
            }

        }

        images =
            [...images, ...newImages];

        renderImages();

        showToast(
            "Zdjęcia dodane"
        );

    } catch (error) {
        await Promise.allSettled(
            newImages.map(image => deleteImageRecord(image.id))
        );

        console.error("Nie udało się zapisać zdjęć do IndexedDB.", error);
        showToast("Nie udało się zapisać zdjęć.");
    }

    event.target.value = "";

}

/* =========================================================
   ZMIANA CZASU ZDJĘCIA
   ========================================================= */

async function changeImage(
    index,
    property,
    value
) {

    if (!images[index]) {
        return;
    }


    const previousImage = { ...images[index] };
    const nextImage = { ...images[index] };

    if (property === "duration") {

        nextImage.duration =
            clamp(
                parseInt(value) || 10,
                1,
                3600
            );

    }


    if (property === "fullscreen") {

        nextImage.fullscreen =
            Boolean(value);

    }

    nextImage.updatedAt =
        Date.now();

    try {
        const savedImage = await saveImageRecord(nextImage);
        images[index] = savedImage;

        if (
            typeof previousImage.src === "string" &&
            previousImage.src.startsWith("blob:") &&
            previousImage.src !== savedImage.src
        ) {
            URL.revokeObjectURL(previousImage.src);
        }

        renderImages();
    } catch (error) {
        images[index] = previousImage;
        console.error("Nie udało się zaktualizować zdjęcia.", error);
        renderImages();
        showToast("Nie udało się zaktualizować zdjęcia.");
    }

}

/* =========================================================
   USUWANIE ZDJĘCIA
   ========================================================= */

async function deleteImage(index) {

    if (
        !images[index]
    ) {
        return;
    }

    if (
        !confirm(
            `Usunąć zdjęcie "${images[index].name}"?`
        )
    ) {

        return;

    }

    const removed = images[index];
    const previousImages = images;
    const nextImages = images
        .filter((_, imageIndex) => imageIndex !== index)
        .map((image, imageIndex) => ({
            ...image,
            order: imageIndex,
            updatedAt: Date.now()
        }));

    try {
        const savedImages = await replaceImagesCollection(nextImages);
        images = savedImages;

        releaseImageObjectUrls(
            previousImages.filter((_, imageIndex) => imageIndex !== index)
        );

        if (
            typeof removed.src === "string" &&
            removed.src.startsWith("blob:")
        ) {
            URL.revokeObjectURL(removed.src);
        }

        renderImages();
    } catch (error) {
        console.error("Nie udało się usunąć zdjęcia z IndexedDB.", error);
        showToast("Nie udało się usunąć zdjęcia.");
        return;
    }

    if (
        imageIndex >= images.length
    ) {

        imageIndex = 0;

    }

}
