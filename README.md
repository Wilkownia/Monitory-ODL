# Monitory-ODL
F2 ----> otwiera panel admina !!!

System Digital Signage do wyświetlania zdjęć, stron WWW i komunikatów na monitorach hali produkcyjnej. Panel administratora, harmonogramy i komunikaty pełnoekranowe.
# 🖥️ Monitory ODL

**Monitory ODL** to lokalny system Digital Signage przeznaczony do wyświetlania informacji na monitorach i telewizorach znajdujących się na hali produkcyjnej.

System umożliwia automatyczne prezentowanie zdjęć, stron WWW oraz komunikatów dla pracowników. Zawartością zarządza się z osobnego panelu administratora.

Projekt został zaprojektowany z myślą o dużych ekranach, prostej obsłudze oraz ciągłej pracy.

---

## 🎯 Główne zastosowanie

Monitory ODL może służyć jako cyfrowa tablica informacyjna do prezentowania m.in.:

- informacji produkcyjnych,
- komunikatów organizacyjnych,
- informacji BHP,
- awarii i ostrzeżeń,
- zdjęć i grafik,
- stron internetowych,
- innych informacji przeznaczonych dla pracowników.

System może być wykorzystany nie tylko na hali produkcyjnej, ale również w magazynach, biurach, szkołach, recepcjach i innych miejscach wymagających centralnego ekranu informacyjnego.

---

## ✨ Główne funkcje

### 🖼️ Zdjęcia

System umożliwia:

- dodawanie zdjęć i grafik,
- usuwanie materiałów,
- określanie czasu wyświetlania,
- automatyczne przechodzenie pomiędzy materiałami.

Zdjęcia są częścią automatycznej pętli prezentacji.

---

### 🌐 Strony WWW

Do prezentacji można dodawać strony internetowe.

Dla stron WWW można określić:

- adres strony,
- czas wyświetlania,
- częstotliwość uruchamiania,
- harmonogram aktywności.

Przykład:

> Strona uruchamia się co 30 minut, jest wyświetlana przez 10 minut, a następnie system wraca do normalnej prezentacji.

---

## 🔄 Automatyczna prezentacja

Zdjęcia i strony WWW mogą tworzyć wspólną automatyczną prezentację.

Przykład:

`Zdjęcie 1 → WWW 1 → Zdjęcie 2 → WWW 2 → Zdjęcie 3 → ...`

Po zakończeniu prezentacji system rozpoczyna ją ponownie.

---

## 📢 Komunikaty

System posiada mechanizm komunikatów przeznaczonych do przekazywania ważnych informacji pracownikom.

Komunikat może zawierać:

- tekst,
- zdjęcie,
- czas obowiązywania,
- ustawienia sposobu wyświetlania.

### Dolny pasek

Standardowy komunikat może być wyświetlany na dolnym pasku ekranu bez przerywania aktualnie prezentowanych zdjęć lub stron WWW.

### Komunikat pełnoekranowy

Ważniejsze informacje mogą zostać wyświetlone jako komunikat pełnoekranowy.

Taki komunikat może tymczasowo przerwać normalną prezentację.

Po jego zakończeniu system automatycznie wraca do wcześniejszego trybu pracy.

---

## ⚙️ Panel administratora

Projekt posiada osobny panel administracyjny służący do zarządzania zawartością systemu.

Administrator może między innymi:

- dodawać i usuwać zdjęcia,
- zarządzać stronami WWW,
- ustawiać harmonogramy,
- tworzyć i edytować komunikaty,
- dodawać zdjęcia do komunikatów,
- zarządzać ustawieniami prezentacji.

Panel administratora może znajdować się na osobnym monitorze, dzięki czemu zmiany nie są widoczne na ekranach przeznaczonych dla pracowników.

---

## 🗄️ Przechowywanie danych

System działa lokalnie i nie wymaga zewnętrznej bazy danych.

Do przechowywania danych wykorzystywane są mechanizmy dostępne w przeglądarce, w tym:

**IndexedDB**

Pozwala to przechowywać konfigurację i materiały bezpośrednio na komputerze obsługującym system.

---

## 🏭 Przykładowa konfiguracja

System może pracować na jednym centralnym komputerze.

Przykładowy układ:

`Komputer → HDMI → konwerter HDMI/LAN → sieć LAN → odbiorniki HDMI → telewizory`

Dzięki temu ten sam system może obsługiwać wiele ekranów znajdujących się w różnych miejscach hali.

---

## 📺 Ekrany

Interfejs został zaprojektowany przede wszystkim z myślą o dużych telewizorach i monitorach.

Priorytetem projektu jest:

- dobra czytelność z dużej odległości,
- duża i czytelna czcionka,
- prosty wygląd,
- automatyczna praca,
- stabilność podczas wielogodzinnego działania.

---

## 🛠️ Technologie

Projekt wykorzystuje:

- HTML5
- CSS3
- JavaScript
- IndexedDB
- LocalStorage
- Web APIs dostępne w nowoczesnych przeglądarkach

Projekt nie wymaga rozbudowanego serwera ani zewnętrznej bazy danych.

---

## 📁 Struktura projektu

Główne moduły aplikacji:

- `storage.js` – obsługa lokalnego przechowywania danych,
- `config.js` – konfiguracja systemu,
- `images.js` – obsługa zdjęć,
- `urls.js` – obsługa stron WWW i harmonogramów,
- `messages.js` – obsługa komunikatów,
- `app.js` – główna logika ekranu prezentacyjnego,
- `admin.js` – obsługa panelu administratora,
- `style.css` – wygląd aplikacji i dostosowanie do dużych ekranów.

Struktura projektu może ulegać zmianom wraz z jego rozwojem.

---

## 🚀 Uruchomienie

1. Pobierz lub sklonuj repozytorium.
2. Umieść projekt w wybranym katalogu.
3. Uruchom aplikację zgodnie z konfiguracją projektu.
4. Otwórz ekran prezentacyjny w przeglądarce.
5. Otwórz panel administratora na ekranie przeznaczonym do zarządzania.
6. Dodaj zdjęcia, strony WWW oraz komunikaty.

> Zalecane jest uruchamianie projektu przez lokalny serwer HTTP zamiast bezpośrednio z `file://`.

---

## 🔐 Bezpieczeństwo

Projekt jest przeznaczony przede wszystkim do pracy w lokalnym, kontrolowanym środowisku.

Przed wykorzystaniem go w sieci publicznej należy przeprowadzić dodatkową analizę bezpieczeństwa.

Nie należy umieszczać w kodzie:

- haseł,
- prywatnych kluczy API,
- tokenów dostępu,
- poufnych adresów sieciowych,
- danych osobowych.

---

## 🚧 Status projektu

**Projekt jest aktywnie rozwijany.**

Funkcje, struktura plików oraz sposób działania mogą się zmieniać wraz z kolejnymi wersjami.

Sugestie, zgłoszenia błędów i propozycje nowych funkcji są mile widziane.

---

## 🤝 Rozwój projektu

Jeżeli masz pomysł na ulepszenie Monitory ODL, możesz:

- zgłosić problem,
- zaproponować nową funkcję,
- przygotować poprawkę,
- utworzyć Pull Request.

Każda pomoc w rozwoju projektu jest mile widziana.

---

## 📜 Licencja

Projekt udostępniany jest na licencji **MIT**.

Możesz korzystać z kodu, modyfikować go i rozwijać zgodnie z warunkami licencji.

---

## 👤 Autor

Projekt **Monitory ODL** powstał jako praktyczny system informacji wizualnej przeznaczony do wykorzystania na hali produkcyjnej.

Projekt rozwijany jest w oparciu o rzeczywiste potrzeby związane z prezentowaniem informacji pracownikom na dużych ekranach.
