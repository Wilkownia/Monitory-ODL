/*
 * Warstwa zapisu danych przeglądarki.
 * Ten plik jest ładowany przed config.js.
 */

/* =========================================================
   LOCAL STORAGE
   ========================================================= */

function loadData(key, fallback) {

    try {

        const value =
            localStorage.getItem(key);

        if (!value) {

            return JSON.parse(
                JSON.stringify(fallback)
            );

        }


        return JSON.parse(
            value
        );

    } catch (e) {

        console.error(e);

        return JSON.parse(
            JSON.stringify(fallback)
        );

    }

}


async function loadDataAsync(key, fallback) {
    return readStorageValue(
        key,
        fallback
    );
}


async function saveData(key, value) {

    const previousWrite = storageWriteQueues.get(key) || Promise.resolve();
    const write = previousWrite
        .catch(() => undefined)
        .then(() => writeStorageValue(key, value));

    storageWriteQueues.set(key, write);

    try {
        await write;
        notifyStorageChange(key);
    } catch (error) {
        console.error("Nie udało się zapisać danych w magazynie.", error);
        throw error;
    } finally {
        if (storageWriteQueues.get(key) === write) {
            storageWriteQueues.delete(key);
        }
    }

}


/* =========================================================
   INDEXEDDB
   ========================================================= */

const IDB_DATABASE_NAME = "ODLDatabase";
const IDB_DATABASE_VERSION = 2;
const IDB_IMAGES_STORE = "images";
const IDB_DATA_STORE = "data";

const storageChannel =
    typeof BroadcastChannel === "function"
        ? new BroadcastChannel("productionBoardStorage")
        : null;

function notifyStorageChange(key) {
    try {
        localStorage.setItem(
            "productionBoardSync",
            JSON.stringify({
                key,
                updatedAt: Date.now()
            })
        );
    } catch (error) {
        console.warn("Nie udało się zapisać znacznika synchronizacji.", error);
    }

    if (storageChannel) {
        storageChannel.postMessage({ key });
    }
}

let idbDatabasePromise = null;
const storageWriteQueues = new Map();

function transactionToPromise(transaction) {

    return new Promise((resolve, reject) => {

        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
            transaction.error || new Error("Transakcja IndexedDB została przerwana.")
        );

    });

}

function cloneJson(value) {

    return JSON.parse(
        JSON.stringify(value)
    );

}

async function readStorageValue(key, fallback) {

    try {

        if (window.indexedDB) {

            const db = await openDatabase();
            const transaction =
                db.transaction(
                    IDB_DATA_STORE,
                    "readonly"
                );

            const store =
                transaction.objectStore(IDB_DATA_STORE);

            const value =
                await requestToPromise(
                    store.get(key)
                );

            if (value && Object.prototype.hasOwnProperty.call(value, "value")) {
                return cloneJson(value.value);
            }

        }

    } catch (error) {
        console.warn("IndexedDB read failed, falling back to localStorage.", error);
    }

    try {

        const raw =
            localStorage.getItem(key);

        if (!raw) {
            return cloneJson(fallback);
        }

        return JSON.parse(raw);

    } catch (error) {
        console.error(error);
        return cloneJson(fallback);
    }

}

async function writeStorageValue(key, value) {

    try {

        if (window.indexedDB) {

            const db = await openDatabase();
            const transaction =
                db.transaction(
                    IDB_DATA_STORE,
                    "readwrite"
                );

            const store =
                transaction.objectStore(IDB_DATA_STORE);

            store.put({
                key,
                value: cloneJson(value),
                updatedAt: Date.now()
            });

            await transactionToPromise(transaction);

            localStorage.removeItem(key);

            return;

        }

    } catch (error) {
        console.warn("IndexedDB write failed, using localStorage fallback.", error);
    }

    try {
        localStorage.setItem(
            key,
            JSON.stringify(value)
        );
    } catch (error) {
        console.error("Nie udało się zapisać danych.", error);
        showToast("Brak miejsca na zapis danych. Usuń część zdjęć.");
        throw error;
    }

}

async function initializeStorage() {

    try {
        await openDatabase();
    } catch (error) {
        console.error("Nie udało się zainicjalizować bazy IndexedDB.", error);
    }

}

function dataUrlToBlob(dataUrl, fallbackType = "image/jpeg") {

    if (!dataUrl || typeof dataUrl !== "string") {
        return null;
    }

    const match =
        dataUrl.match(/^data:([^;,]+)?(?:;charset=utf-8)?(?:;base64)?,/);

    const mimeType =
        match && match[1]
            ? match[1]
            : fallbackType;

    const base64Index =
        dataUrl.indexOf(",");

    const dataPart =
        base64Index >= 0
            ? dataUrl.slice(base64Index + 1)
            : dataUrl;

    const binary =
        atob(
            dataPart
                .replace(/\s/g, "")
                .replace(/^data:[^;]+;base64,/, "")
                .replace(/^data:.*?,/, "")
        );

    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return new Blob([bytes], { type: mimeType });

}

function normalizeImageRecord(image, index = 0) {

    if (!image || typeof image !== "object") {
        return null;
    }

    const record = { ...image };

    // Adres blob: działa wyłącznie w dokumencie, który go utworzył. Nigdy nie
    // traktujemy go jako trwałego źródła obrazu odczytanego z IndexedDB.
    if (
        typeof record.src === "string" &&
        record.src.startsWith("blob:") &&
        record.blob
    ) {
        record.src = "";
    }

    record.id =
        String(
            record.id ||
            `img_${Date.now()}_${Math.random().toString(16).slice(2)}`
        );

    record.name =
        record.name || "Zdjęcie";

    record.duration =
        Math.max(
            1,
            parseInt(record.duration) || 5
        );

    record.active =
        record.active !== false;

    record.fullscreen =
        Boolean(record.fullscreen);

    record.createdAt =
        record.createdAt || Date.now();

    record.updatedAt =
        record.updatedAt || Date.now();

    record.order =
        typeof record.order === "number"
            ? record.order
            : index;

    if (!record.blob && typeof record.src === "string" && record.src.startsWith("data:")) {

        try {
            record.blob =
                dataUrlToBlob(
                    record.src,
                    record.type || "image/jpeg"
                );
        } catch (error) {
            console.warn("Pominięto uszkodzone zdjęcie.", error);
            record.src = "";
        }

    }

    if (record.blob && !record.type) {
        record.type =
            record.blob.type || "image/jpeg";
    }

    if (!record.src && record.blob) {
        record.src =
            URL.createObjectURL(record.blob);
    }

    if (!record.blob && !record.src) {
        return null;
    }

    return record;

}

function releaseImageObjectUrls(list) {

    if (!Array.isArray(list)) {
        return;
    }

    list.forEach(image => {
        if (
            image &&
            typeof image.src === "string" &&
            image.src.startsWith("blob:")
        ) {
            URL.revokeObjectURL(image.src);
        }
    });

}

function openDatabase() {

    if (idbDatabasePromise) {
        return idbDatabasePromise;
    }

    idbDatabasePromise =
        new Promise((resolve, reject) => {

            const request =
                indexedDB.open(
                    IDB_DATABASE_NAME,
                    IDB_DATABASE_VERSION
                );

            request.onupgradeneeded = event => {

                const db =
                    event.target.result;

                if (!db.objectStoreNames.contains(IDB_DATA_STORE)) {
                    db.createObjectStore(
                        IDB_DATA_STORE,
                        { keyPath: "key" }
                    );
                }

                if (!db.objectStoreNames.contains(IDB_IMAGES_STORE)) {
                    const store =
                        db.createObjectStore(
                            IDB_IMAGES_STORE,
                            { keyPath: "id" }
                        );

                    store.createIndex(
                        "order",
                        "order",
                        { unique: false }
                    );
                }

            };

            request.onsuccess = () => {
                const db = request.result;

                db.onversionchange = () => {
                    db.close();
                    idbDatabasePromise = null;
                };

                resolve(db);
            };

            request.onerror = () => {
                reject(request.error);
            };

            request.onblocked = () => {
                reject(
                    new Error("Aktualizacja bazy jest zablokowana przez inne otwarte okno.")
                );
            };

        }).catch(error => {
            idbDatabasePromise = null;
            throw error;
        });

    return idbDatabasePromise;

}

function requestToPromise(request) {

    return new Promise((resolve, reject) => {

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };

    });

}

async function initDatabase() {

    const db = await openDatabase();

    if (!db) {
        return;
    }

    await migrateLegacyImages();

}

async function migrateLegacyImages() {

    try {

        const legacyImages =
            loadData(
                "productionBoardImages",
                []
            );

        if (!legacyImages.length) {
            return;
        }

        await saveImagesCollection(legacyImages);

        localStorage.removeItem("productionBoardImages");

    } catch (error) {
        console.error("Nie udało się migracja zdjęć do IndexedDB.", error);
    }

}

async function saveImagesCollection(list) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                IDB_IMAGES_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(IDB_IMAGES_STORE);

        const normalized =
            (Array.isArray(list) ? list : [])
                .map((item, index) => normalizeImageRecord(item, index))
                .filter(Boolean);

        normalized.forEach(item => {
            const storedItem = { ...item };

            if (
                typeof storedItem.src === "string" &&
                storedItem.src.startsWith("blob:")
            ) {
                storedItem.src = "";
            }

            store.put(storedItem);
        });

        transaction.oncomplete = () => {
            resolve(normalized);
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };

    });

}

async function replaceImagesCollection(list) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                IDB_IMAGES_STORE,
                "readwrite"
            );

        const store = transaction.objectStore(IDB_IMAGES_STORE);
        const normalized =
            (Array.isArray(list) ? list : [])
                .map((item, index) => normalizeImageRecord(item, index))
                .filter(Boolean)
                .map((item, index) => ({
                    ...item,
                    order: index
                }));

        store.clear();

        normalized.forEach(item => {
            const storedItem = { ...item };

            if (
                typeof storedItem.src === "string" &&
                storedItem.src.startsWith("blob:")
            ) {
                storedItem.src = "";
            }

            store.put(storedItem);
        });

        transaction.oncomplete = () => {
            notifyStorageChange("productionBoardImages");
            resolve(normalized);
        };

        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
            transaction.error || new Error("Aktualizacja kolekcji obrazów została przerwana.")
        );

    });

}

async function loadImagesCollection() {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                IDB_IMAGES_STORE,
                "readonly"
            );

        const store =
            transaction.objectStore(IDB_IMAGES_STORE);

        const request =
            store.getAll();

        request.onsuccess = () => {

            const items =
                (request.result || [])
                    .map((image, index) => normalizeImageRecord(image, index))
                    .filter(Boolean)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

            resolve(items);

        };

        request.onerror = () => {
            reject(request.error);
        };

    });

}

async function saveImageRecord(image) {

    const record =
        normalizeImageRecord(image);

    if (!record) {
        return null;
    }

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                IDB_IMAGES_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(IDB_IMAGES_STORE);

        const storedRecord = { ...record };

        if (
            typeof storedRecord.src === "string" &&
            storedRecord.src.startsWith("blob:")
        ) {
            storedRecord.src = "";
        }

        store.put(storedRecord);

        transaction.oncomplete = () => {
            notifyStorageChange("productionBoardImages");
            resolve(record);
        };

        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
            transaction.error || new Error("Zapis obrazu został przerwany.")
        );

    });

}

async function deleteImageRecord(id) {

    const db = await openDatabase();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction(
                IDB_IMAGES_STORE,
                "readwrite"
            );

        const store =
            transaction.objectStore(IDB_IMAGES_STORE);

        store.delete(String(id));

        transaction.oncomplete = () => {
            notifyStorageChange("productionBoardImages");
            resolve(true);
        };

        transaction.onerror = () => reject(transaction.error);
        transaction.onabort = () => reject(
            transaction.error || new Error("Usuwanie obrazu zostało przerwane.")
        );

    });

}

