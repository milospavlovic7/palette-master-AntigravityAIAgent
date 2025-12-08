# Dokumentacija Projekta: Palette Master

## Sadržaj
1. [Uvod i Pregled Sistema](#uvod-i-pregled-sistema)
2. [Rečnik Pojmova](#rečnik-pojmova)
3. [Arhitektura i Dizajn Paterni](#arhitektura-i-dizajn-paterni)
4. [Opis Fajlova i Struktura](#opis-fajlova-i-struktura)
    - [Root (Koren Projekta)](#root-koren-projekta)
    - [Source (src)](#source-src)
    - [Features (Funkcionalnosti)](#features-funkcionalnosti)
    - [Hooks (Kuke)](#hooks-kuke)
    - [Utils (Pomoćni alati)](#utils-pomoćni-alati)

---

## Uvod i Pregled Sistema

Palette Master je veb aplikacija za naprednu manipulaciju slikama i generisanje paleta boja. Sistem je izgrađen koristeći **React** ekosistem i **Vite** alate za brzo pokretanje i razvoj.

Glavna odlika sistema je odvajanje teških kalkulacija (obrada slike piksel po piksel) od korisničkog interfejsa. Ovo se postiže korišćenjem **Web Workera**. Kada korisnik promeni parametar (npr. kontrast), glavni deo aplikacije šalje podatke "u pozadinu" (workeru), koji obrađuje sliku i vraća rezultat. To omogućava da interfejs ostane brz i fluidan čak i pri teškim operacijama.

### Tok Podataka (Data Flow)
1. **Korisnik** menja parametre preko UI kontrola (slajderi, dugmad).
2. **React State** se ažurira u `MainPage` komponenti.
3. **useImageWorker** hook detektuje promenu i šalje novu konfiguraciju i sliku u `imageWorker.ts`.
4. **Worker** procesira sliku primenjujući efekte redom (Chain of Responsibility).
5. **Worker** vraća obrađenu sliku (ImageData) nazad u `useImageWorker`.
6. **Canvas** komponenta iscrtava novi rezultat na ekranu.

---

## Rečnik Pojmova

Za lakše razumevanje dokumentacije, evo kratkih definicija korišćenih tehnologija:

*   **React**: Biblioteka za pravljenje korisničkih interfejsa. Umesto da pišemo HTML direktno, pravimo "Komponente" (delove koda kao što su Dugme, Slika, Meni) koje se kombinuju u celinu.
*   **Vite**: Alat koji služi za pokretanje projekta. On "pakuje" sav kod tako da pretraživač (browser) može da ga razume. Veoma je brz.
*   **Component (Komponenta)**: Osnovni gradivni blok React aplikacije. To je funkcija koja vraća ono što vidimo na ekranu (npr. `EffectCard` je komponenta koja prikazuje jedan efekat).
*   **State (Stanje)**: Podaci koji se menjaju u aplikaciji (npr. trenutna vrednost slajdera za svetlinu). Kada se `state` promeni, React automatski "osvežava" izgled komponente.
*   **Props**: Način na koji roditeljska komponenta šalje podatke dete-komponenti (kao parametri funkcije).
*   **Hook**: Specijalna funkcija u React-u (počinje sa `use`, npr. `useState`) koja omogućava komponentama da imaju "memoriju" ili da izvršavaju kod kada se nešto promeni.
*   **Web Worker**: Skripta koja radi u pozadini, odvojeno od glavnog programa. Služi za teške zadatke kako aplikacija ne bi "zakočila" dok računa.
*   **Canvas API**: Način za crtanje grafike i slika direktno pomoću koda u pretraživaču.
*   **TypeScript**: Nadogradnja JavaScript-a koja nam omogućava da definišemo tipove podataka (npr. da kažemo "ovo mora biti broj", a ne tekst), što smanjuje greške.

---

## Arhitektura i Dizajn Paterni

U projektu su korišćeni određeni arhitektonski principi i paterni:

1.  **Feature-Based Architecture (Arhitektura zasnovana na funkcionalnostima)**:
    Fajlovi nisu grupisani samo po tipu (sve komponente zajedno), već po funkcionalnosti.
    *   `src/features/effects`: Sve vezano za efekte.
    *   `src/features/palette`: Sve vezano za palete boja.
    Ovo olakšava snalaženje jer je sav kod vezan za jednu stvar na jednom mestu.

2.  **Worker Pattern (Offloading)**:
    Kao što je pomenuto, `imageWorker.ts` je ključan. On implementira mehanizam poruka (`postMessage`) za komunikaciju sa glavnom aplikacijom.

3.  **Custom Hooks Pattern**:
    Logika je izvučena iz komponenti u "Hooks".
    *   Primer: `useImageWorker.ts` sadrži svu komplikovanu logiku komunikacije sa Workerom. Komponenta `MainPage` samo kaže "procesiraj sliku" i ne brine *kako* se to dešava. Ovo je princip **Enkapsulacije**.

4.  **Chain of Responsibility (Lanac Odgovornosti)**:
    U `imageWorker.ts`, efekti se primenjuju sekvencijalno (jedan za drugim). Izlaz iz prvog efekta postaje ulaz za drugi. Ovo omogućava kombinovanje efekata (npr. prvo zamućenje, pa onda pretvaranje u crno-belo).

5.  **Strategy Pattern (Strategija)**:
    U okviru dither efekta, postoji mnogo algoritama (Floyd-Steinberg, Atkinson, itd.). Worker bira odgovarajući algoritam (strategiju) na osnovu korisničkog izbora, ali interfejs za pozivanje ostaje isti.

---

## Opis Fajlova i Struktura

### Root (Koren Projekta)
Ovi fajlovi služe za konfiguraciju samog razvojnog okruženja.

*   `package.json`: "Lična karta" projekta. Sadrži listu svih biblioteka koje projekat koristi i komande za pokretanje.
*   `tsconfig.json`: Podešavanja za TypeScript (pravila pisanja koda).
*   `vite.config.ts`: Podešavanja za Vite (npr. kako se importuju fajlovi, pluginovi).
*   `index.html`: Glavni HTML fajl koji je "ulaz" u aplikaciju. U njemu se nalazi jedan `div` element u koji React "ubacuje" celu aplikaciju.

### Source (src)
Glavni kod aplikacije.

*   `main.tsx`: Tačka ulaska za React. Ovde se React "kači" na `index.html`.
*   `App.tsx`: Glavna komponenta koja obuhvata celu aplikaciju. Trenutno samo prikazuje `MainPage`.
*   `types.ts`: Centralno mesto za definicije tipova podataka (npr. kako izgleda objekat `Effect`, šta sadrži `PixelSortData`). Ovo služi da ceo tim (i kompajler) zna šta se očekuje od podataka.
*   `imageWorker.ts`: **Veoma važan fajl**. Ovo je "mozak" za obradu slike. Sadrži veliku `switch` naredbu koja na osnovu tipa efekta poziva odgovarajuću funkciju iz `utils/effects`. Radi u zasebnom thread-u.
*   `index.css` & `App.css`: Globalni stilovi.

### Features (Funkcionalnosti)
Ovde je srž poslovne logike podeljena po domenima.

#### `src/features/effects`
Sve vezano za vizuelne efekte.
*   `components/EffectCard.tsx`: Komponenta koja prikazuje karticu jednog efekta (naslov, kontrole, dugme za brisanje).
*   `components/EffectChain.tsx`: Lista svih aktivnih efekata. Prikazuje niz `EffectCard` komponenti.
*   `components/EffectMenu.tsx`: Meni za dodavanje novih efekata.
*   `components/controls/...`: Folder sa manjim komponentama za specifične kontrole svakog efekta (npr. `BlurControl`, `DitherControl`). Svaka od njih zna kako da prikaže specifične slajdere za taj efekat.

#### `src/features/palette`
Sve vezano za generisanje i prikaz paleta boja.
*   `components/PaletteDisplay.tsx`: Prikazuje izvučene boje iz slike.
*   `components/PaletteGenerator.tsx`: Logika za izvlačenje boja (koristeći k-means ili slične algoritme) i prikazivanje opcija za sortiranje boja.
*   `components/PaletteLibrary.tsx`: Biblioteka sačuvanih paleta.

#### `src/features/canvas`
*   `components/Canvas.tsx`: (Pretpostavljeno) Komponenta koja sadrži HTML `<canvas>` element gde se slika fizički iscrtava.

#### `src/features/toolbar`
*   `components/Toolbar.tsx`: Glavna traka sa alatima (zoom, pan, upload slike).

### Hooks (Kuke)
Logika koja je odvojena od prikaza.

*   `useImageWorker.ts`: Upravlja komunikacijom sa `imageWorker.ts`. Šalje podatke, čeka odgovor, i vraća URL obrađene slike. Takođe se bavi "debounce" logikom (da ne šaljemo previše zahteva odjednom).
*   `useCanvasInteraction.ts`: Upravlja zumiranjem i pomeranjem (pan) slike na platnu. Računa koordinate miša u odnosu na sliku.
*   `useLayoutResizing.ts`: Omogućava korisniku da menja veličinu panela (npr. da proširi sidebar).
*   `useLocalStorage.ts`: Pomaže da se podaci čuvaju u pretraživaču tako da ostanu tu i kad se osveži stranica.

### Utils (Pomoćni alati)
Čiste funkcije koje rade jednu stvar i nemaju veze sa React-om.

#### `src/utils/effects`
Ovo su matematičke funkcije koje `imageWorker` poziva.
*   `common.ts`: Zajedničke pomoćne funkcije.
*   `dither.ts`: Implementacija raznih algoritama za dither (računanje greške i prenošenje na susedne piksele).
*   `color.ts` / `colorUtils.ts`: Konverzije boja (HEX u RGB, RGB u HSL) i računanje distance između boja.
*   `filters.ts`: Implementacije klasičnih filtera (blur, sharpen, contrast).
*   `transform.ts`: Transformacije slike (resize, pixel sort, glitch).

### Pages
*   `MainPage.tsx`: Glavni ekran aplikacije. Ova komponenta spaja sve ostale (`Toolbar`, `EffectChain`, `Canvas`, `Palette`) u jednu celinu. Ona drži glavni `state` (stanje) aplikacije – koja je slika učitana, koji su efekti aktivni.
