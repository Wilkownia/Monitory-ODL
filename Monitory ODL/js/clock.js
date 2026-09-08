/*
 * Zegar, data i numer tygodnia wyświetlane na ekranie powitalnym.
 */

/* =========================================================
   ZEGAR
   ========================================================= */

function updateClock() {

    const now =
        new Date();


    updateWelcomeScreen(
        now
    );


    document.getElementById(
        "clockBox"
    ).textContent =
        now.toLocaleTimeString(
            "pl-PL",
            {
                hour: "2-digit",
                minute: "2-digit"
            }
        );

}



function updateWelcomeScreen(now) {

    const weekdayText =
        now.toLocaleDateString(
            "pl-PL",
            { weekday: "long" }
        ).toUpperCase();

    const dateNumberText =
        now.toLocaleDateString(
            "pl-PL",
            { day: "numeric", month: "long" }
        ).toUpperCase();


    document.getElementById(
        "welcomeWeekday"
    ).textContent =
        weekdayText;

    document.getElementById(
        "welcomeDateNumber"
    ).textContent =
        dateNumberText;

    document.getElementById(
        "welcomeYear"
    ).textContent =
        now.getFullYear();

}


