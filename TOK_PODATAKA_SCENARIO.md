# Detaljan Tok Podataka: Scenario Dithering Efekta

Ovaj dokument detaljno opisuje tehnički tok podataka kroz sistem za jedan konkretan scenario: **Korisnik učitava sliku, dodaje "Dithering" efekat i menja parametar "Strength"**.

Opis je podeljen na logičke korake, od interakcije korisnika do reakcije sistema.

---

## 1. Inicijalizacija Aplikacije (`Startup`)
Pre nego što korisnik uradi bilo šta, aplikacija priprema teren.

1.  **Pokretanje React-a**: `MainPage` komponenta se montira.
2.  **Inicijalizacija Workera**:
    -   Poziva se hook `useImageWorker`.
    -   Linija `workerRef.current = new ImageWorker()` kreira novu nit (thread) u pozadini.
    -   Glavna aplikacija i Worker uspostavljaju "kanal" za komunikaciju preko `postMessage` sistema.
3.  **Default State**:
    -   `sourceImage` je `null`.
    -   `effects` niz je prazan `[]`.

---

## 2. Korisnik Dodaje Sliku (`Image Upload`)

**Akcija**: Korisnik klikne na "Upload Image" ili prevuče sliku u zonu.

**Tehnički Tok**:
1.  **Detekcija Fajla**: `ImageUpload.tsx` detektuje `drop` event ili `change` event na input polju.
2.  **Čitanje Podataka**:
    -   Browser koristi `FileReader` API da pročita fajl.
    -   Slika se konvertuje u `Image` objekat da bi se dobile dimenzije.
3.  **Ažuriranje Stanja (MainPage)**:
    -   Poziva se `setSourceImage(imageObject)`.
    -   React detektuje promenu stanja i ponovo iscrtava (re-render) komponente, ali pošto još nema efekata, slika se šalje "sirova" u Worker ili prikazuje direktno ako je optimizacija tako podešena.
4.  **Prvo Slanje Workeru**:
    -   `useImageWorker` hook detektuje da `imageData` nije null.
    -   Šalje poruku Workeru: `{ id: "uuid...", imageData: <pikseli>, effects: [] }`.
    -   Worker vraća sliku nepromenjenu (jer je niz efekata prazan), da bi se pripremio buffer.

---

## 3. Dodavanje Dithering Efekta

**Akcija**: Korisnik otvara meni "Add Effect" i bira "Dithering".

**Tehnički Tok**:
1.  **UI Interakcija**: `EffectMenu.tsx` okida funkciju `onAddEffect('dither')`.
2.  **Kreiranje Objekta Efekta**:
    -   U `MainPage.tsx` se kreira novi JS objekat koji predstavlja ovaj efekat:
        ```javascript
        {
          id: "unique-id-123",
          type: "dither",
          isEnabled: true,
          data: {
            method: "floyd-steinberg", // default
            strength: 50,
            // ...ostali parametri
          }
        }
        ```
3.  **Ažuriranje Niza Efekata**:
    -   Ovaj objekat se dodaje u glavni `effects` niz (Redux-style update, ali koristeći `useState`).
    -   `setEffects([...currentEffects, newEffect])`.

---

## 4. Promena Parametra (Reakcija Sistema)

**Akcija**: React detektuje da se `effects` niz promenio. Ovo je okidač za glavnu akciju.

**Tehnički Tok ("The Loop")**:
1.  **Hook Detekcija**: `useImageWorker.ts` ima `useEffect` ili `useCallback` koji prati promene u `effects` nizu.
2.  **Priprema Zahteva (Smart Throttle)**:
    -   Sistem koristi optimizovani "Throttle" mehanizam umesto klasičnog debounce-a.
    -   Ako je Worker slobodan, zahtev se šalje **odmah** (bez čekanja).
    -   Ako je Worker zauzet prethodnom obradom, novi zahtev se pamti kao "sledeći na redu". Čim worker završi trenutni posao, odmah uzima najnoviji zapamćeni zahtev. Ovo osigurava maksimalnu brzinu odziva bez gušenja sistema.
3.  **Slanje Poruke (Main Thread -> Worker)**:
    -   Poziva se `worker.postMessage()`.
    -   **Payload**: Šalju se *samo* podaci o efektima i instrukcija. Originalna slika (pikseli) se obično ne šalje svaki put ponovo ako je Worker već ima keširanu, ili se koristi `Transferable Objects` za brži prenos memorije.
    -   Poruka: "Primeni ove efekte na trenutnu sliku".

---

## 5. Procesiranje u Workeru (`imageWorker.ts`)

Ovo je srce sistema gde se dešava magija, bez kočenja interfejsa.

1.  **Prijem Poruke**: `self.onmessage` event handler se aktivira.
2.  **Priprema Buffera**:
    -   Worker uzima originalne piksele (Uint8ClampedArray).
    -   Kreira `Float32Array` (radni buffer) za precizno računanje boja bez zaokruživanja.
3.  **Izvršavanje Efekata (Petlja)**:
    -   Worker prolazi kroz niz `effects`.
    -   Nailazi na naš **Dither** efekat.
4.  **Pozivanje Algoritma**:
    -   Ulazi u `switch` case za `'dither'`.
    -   Poziva funkciju `applyFloydSteinberg` (iz `utils/effects/dither.ts`).
5.  **Matematika (Dithering)**:
    -   Algoritam prolazi piksel po piksel (od gore-levo ka dole-desno).
    -   Za svaki piksel nalazi "najbližu boju" iz palete (npr. crna ili bela).
    -   Računa **Grešku kvantizacije** (razlika između stare i nove boje).
    -   Tu grešku "gura" na susedne piksele (desno, dole-levo, dole, dole-desno) prema Floyd-Steinberg matrici (7/16, 3/16, 5/16, 1/16).
6.  **Finalizacija**:
    -   Kada se svi efekti završe, podaci se vraćaju iz `Float32` u `Uint8` format (0-255).
7.  **Slanje Rezultata (Worker -> Main Thread)**:
    -   Worker šalje `postMessage` nazad sa `resultImageData`.

---

## 6. Prikaz Rezultata (`Render`)

**povratak u Glavni Thread**.

1.  **Prijem Odgovora**: `workerRef.current.onmessage` u `useImageWorker` se aktivira.
2.  **Kreiranje URL-a**:
    -   React ne može direktno da prikaže `ImageData` u `<img>` tagu.
    -   Kreira se privremeni `<canvas>` u memoriji.
    -   Na njega se "lepe" pikseli.
    -   Poziva se `canvas.toDataURL()` da se dobije string (npr. `data:image/png;base64...`).
3.  **Setovanje Stanja**:
    -   `setProcessedImageUrl(url)` se poziva.
4.  **Ažuriranje UI-a**:
    -   Glavna komponenta (`Canvas.tsx` ili slično) dobija novi URL.
    -   HTML `<img src={processedImageUrl} />` se osvežava.
    -   Korisnik vidi "izditerovanu" sliku.

---

## Sažetak Arhitekture u ovom Scenariju

| Korak | Komponenta | Odgovornost |
| :--- | :--- | :--- |
| **Input** | `EffectCard` | Skuplja podatke od korisnika (slajderi). |
| **State** | `MainPage` | Čuva "Istinu" o trenutnom stanju aplikacije. |
| **Bridge** | `useImageWorker` | Prenosi podatke između React sveta i Workera. |
| **Compute** | `imageWorker` | Radi tešku matematiku u pozadini. |
| **Display** | `Canvas` | Prikazuje finalnu sliku korisniku. |
