import type { Category, Difficulty } from "@/features/categories/categoryTypes";

type CategorySeed = {
  name: string;
  difficulty: Difficulty;
  description: string;
  examples: string[];
};

const DEFAULT_TIMESTAMP = "2026-01-01T09:00:00.000Z";

function createDefaultCategory(seed: CategorySeed): Category {
  return {
    id: `default-${seed.difficulty}-${seed.name
      .toLocaleLowerCase("pl-PL")
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-|-$/g, "")}`,
    name: seed.name,
    difficulty: seed.difficulty,
    description: seed.description,
    examples: seed.examples,
    isActive: true,
    isDefault: true,
    createdAt: DEFAULT_TIMESTAMP,
    updatedAt: DEFAULT_TIMESTAMP,
  };
}

const seeds: CategorySeed[] = [
  {
    name: "Państwo",
    difficulty: "basic",
    description: "Nazwa istniejącego państwa lub powszechnie uznawanego terytorium.",
    examples: ["Polska", "Portugalia", "Peru"],
  },
  {
    name: "Miasto",
    difficulty: "basic",
    description: "Nazwa miasta, miejscowości lub dużej osady posiadającej własną nazwę.",
    examples: ["Poznań", "Praga", "Paryż"],
  },
  {
    name: "Roślina",
    difficulty: "classic",
    description: "Nazwa rośliny uprawnej, dzikiej, doniczkowej albo ogrodowej.",
    examples: ["Róża", "Paproć", "Pokrzywa"],
  },
  {
    name: "Zwierzę",
    difficulty: "classic",
    description: "Nazwa zwierzęcia domowego, dzikiego, wodnego lub latającego.",
    examples: ["Pingwin", "Puma", "Pszczoła"],
  },
  {
    name: "Imię",
    difficulty: "classic",
    description: "Popularne lub mniej popularne imię nadawane osobom.",
    examples: ["Paweł", "Patrycja", "Piotr"],
  },
  {
    name: "Rzecz",
    difficulty: "classic",
    description: "Nazwany przedmiot, który można wskazać, opisać albo użyć.",
    examples: ["Parasol", "Plecak", "Pilot"],
  },
  {
    name: "Kolor",
    difficulty: "classic",
    description: "Nazwa koloru, odcienia lub barwy stosowanej w codziennym języku.",
    examples: ["Pomarańczowy", "Popielaty", "Perłowy"],
  },
  {
    name: "Marka",
    difficulty: "medium",
    description: "Rozpoznawalna marka, firma albo produkt funkcjonujący pod nazwą marki.",
    examples: ["Pepsi", "Puma", "PlayStation"],
  },
  {
    name: "Telewizja",
    difficulty: "medium",
    description: "Program telewizyjny, serial, kanał telewizyjny albo format znany z ekranu.",
    examples: ["Polsat", "Panorama", "Pytanie na śniadanie"],
  },
  {
    name: "Owoc",
    difficulty: "medium",
    description: "Nazwa jadalnego owocu świeżego, suszonego lub egzotycznego.",
    examples: ["Pomelo", "Porzeczka", "Pigwa"],
  },
  {
    name: "Warzywo",
    difficulty: "medium",
    description: "Warzywo korzeniowe, liściaste, strączkowe lub uprawiane w ogrodzie.",
    examples: ["Papryka", "Pietruszka", "Por"],
  },
  {
    name: "Sport",
    difficulty: "medium",
    description: "Nazwa dyscypliny sportowej albo formy rywalizacji fizycznej.",
    examples: ["Piłka ręczna", "Pływanie", "Podnoszenie ciężarów"],
  },
  {
    name: "Zawód",
    difficulty: "medium",
    description: "Nazwa zawodu, profesji lub pełnionej funkcji zawodowej.",
    examples: ["Piekarz", "Policjant", "Programista"],
  },
  {
    name: "Pojazd",
    difficulty: "medium",
    description: "Środek transportu lądowego, wodnego lub powietrznego.",
    examples: ["Pociąg", "Prom", "Pick-up"],
  },
  {
    name: "Część ciała",
    difficulty: "medium",
    description: "Element ludzkiego lub zwierzęcego ciała, widoczny albo wewnętrzny.",
    examples: ["Palec", "Plecy", "Płuco"],
  },
  {
    name: "Urządzenie elektr.",
    difficulty: "medium",
    description: "Elektroniczne urządzenie używane w domu, pracy albo rozrywce.",
    examples: ["Projektor", "Powerbank", "Pilot"],
  },
  {
    name: "Celebryta",
    difficulty: "medium",
    description: "Osoba powszechnie rozpoznawalna z mediów, kultury lub internetu.",
    examples: ["Paris Hilton", "Popek", "Pedro Pascal"],
  },
  {
    name: "Miejsce",
    difficulty: "medium",
    description: "Nazwane miejsce, lokalizacja albo obszar, który można odwiedzić lub wskazać.",
    examples: ["Plaża", "Park", "Pustynia"],
  },
  {
    name: "Potrawa",
    difficulty: "medium",
    description: "Danie, posiłek lub potrawa znana z kuchni domowej albo restauracyjnej.",
    examples: ["Pierogi", "Pizza", "Pasta carbonara"],
  },
  {
    name: "Narzędzie",
    difficulty: "medium",
    description: "Przyrząd służący do pracy ręcznej, naprawy albo budowy.",
    examples: ["Piła", "Poziomica", "Pędzel"],
  },
  {
    name: "Utwór muzyczny",
    difficulty: "medium",
    description: "Nazwa piosenki, kompozycji, hymnu lub innego utworu muzycznego.",
    examples: ["Perfect", "Paranoid", "Poker Face"],
  },
  {
    name: "Napój",
    difficulty: "medium",
    description: "Dowolny napój przeznaczony do picia, zimny lub gorący, bezalkoholowy albo alkoholowy.",
    examples: ["Herbata", "Kakao", "Lemoniada"],
  },
  {
    name: "Artysta",
    difficulty: "medium",
    description: "Osoba zajmująca się działalnością artystyczną, np. muzyką, malarstwem, rzeźbą, aktorstwem, fotografią, tańcem lub inną dziedziną sztuki.",
    examples: ["Chopin", "Van Gogh", "Rihanna"],
  },
  {
    name: "Słowo po angielsku",
    difficulty: "medium",
    description: "Poprawne słowo w języku angielskim rozpoczynające się na wskazaną literę.",
    examples: ["paper", "planet", "purple"],
  },
  {
    name: "Choroba",
    difficulty: "hard",
    description: "Nazwa choroby, schorzenia lub zaburzenia zdrowotnego.",
    examples: ["Padaczka", "Parkinson", "Przeziębienie"],
  },
  {
    name: "Rasa psa/kota",
    difficulty: "hard",
    description: "Uznana rasa psa lub kota o konkretnej nazwie.",
    examples: ["Pers", "Pudel", "Peterbald"],
  },
  {
    name: "Pierwiastek chem.",
    difficulty: "hard",
    description: "Nazwa pierwiastka chemicznego z układu okresowego.",
    examples: ["Potas", "Pluton", "Praseodym"],
  },
  {
    name: "Emocja/cecha",
    difficulty: "hard",
    description: "Emocja, stan psychiczny albo cecha charakteru osoby lub postaci.",
    examples: ["Pokora", "Pewność siebie", "Porywczość"],
  },
  {
    name: "Gatunek muzyczny",
    difficulty: "hard",
    description: "Nazwa stylu lub gatunku muzycznego rozpoznawanego w kulturze.",
    examples: ["Pop", "Punk", "Progressive rock"],
  },
  {
    name: "Super bohater",
    difficulty: "hard",
    description: "Superbohater z komiksu, filmu, serialu albo gry.",
    examples: ["Punisher", "Professor X", "Power Girl"],
  },
  {
    name: "Element garderoby",
    difficulty: "hard",
    description: "Część ubioru, dodatek do stroju albo odzieżowa warstwa garderoby.",
    examples: ["Płaszcz", "Piżama", "Peleryna"],
  },
  {
    name: "Najdłuższe słowo",
    difficulty: "hard",
    description: "Poprawne słowo po polsku na wskazaną literę; punkt zdobywa najdłuższa prawidłowa odpowiedź w rundzie.",
    examples: ["przeobrażeniowo", "ponaddźwiękowy", "przeciwpożarowy"],
  },
  {
    name: "Ptak",
    difficulty: "hard",
    description: "Nazwa ptaka dzikiego, hodowlanego lub egzotycznego.",
    examples: ["Pelikan", "Pingwin", "Perkoz"],
  },
  {
    name: "Owad",
    difficulty: "hard",
    description: "Nazwa owada spotykanego w przyrodzie lub hodowli.",
    examples: ["Pszczoła", "Pluskwiak", "Pawica"],
  },
  {
    name: "Kosmetyk",
    difficulty: "hard",
    description: "Produkt do pielęgnacji, makijażu lub higieny osobistej.",
    examples: ["Peeling", "Pomadka", "Puder"],
  },
  {
    name: "Film",
    difficulty: "hard",
    description: "Tytuł filmu kinowego, animacji albo znanej produkcji fabularnej.",
    examples: ["Parasite", "Pianista", "Pulp Fiction"],
  },
  {
    name: "Ryba",
    difficulty: "hard",
    description: "Nazwa ryby słodkowodnej, morskiej albo hodowlanej.",
    examples: ["Pstrąg", "Płoć", "Panga"],
  },
  {
    name: "Gra",
    difficulty: "hard",
    description: "Tytuł gry planszowej, karcianej, komputerowej albo terenowej.",
    examples: ["Portal", "Pokemon GO", "Pictionary"],
  },
  {
    name: "Postać",
    difficulty: "hard",
    description: "Fikcyjna postać z filmu, książki, gry, serialu, komiksu, legendy lub mitologii.",
    examples: ["Pinokio", "Pippi", "Predator"],
  },
  {
    name: "Marka samochodu",
    difficulty: "hard",
    description: "Rozpoznawalna marka samochodów osobowych, terenowych lub sportowych.",
    examples: ["Peugeot", "Porsche", "Pontiac"],
  },
  {
    name: "Wydarzenie",
    difficulty: "hard",
    description: "Znane wydarzenie historyczne, społeczne, kulturalne albo sportowe.",
    examples: ["Powstanie Warszawskie", "Pierwszy lot na Księżyc", "Puchar Świata"],
  },
  {
    name: "Kwiat",
    difficulty: "hard",
    description: "Nazwa kwiatu ogrodowego, polnego albo doniczkowego.",
    examples: ["Piwonia", "Pierwiosnek", "Petunia"],
  },
  {
    name: "Stolica",
    difficulty: "hard",
    description: "Stolica istniejącego państwa lub uznawanego terytorium.",
    examples: ["Praga", "Pekin", "Paryż"],
  },
  {
    name: "Rodzaj kamienia",
    difficulty: "advanced",
    description: "Rodzaj skały, kamienia ozdobnego albo materiału skalnego.",
    examples: ["Porfir", "Piaskowiec", "Pumeks"],
  },
  {
    name: "Instrument muzyczny",
    difficulty: "advanced",
    description: "Nazwa instrumentu wykorzystywanego do wykonywania muzyki.",
    examples: ["Puzon", "Pianino", "Perkusja"],
  },
  {
    name: "Przyprawa",
    difficulty: "advanced",
    description: "Przyprawa, zioło lub mieszanka używana do doprawiania potraw.",
    examples: ["Papryka", "Pieprz", "Pietruszka"],
  },
  {
    name: "Drzewo/krzew",
    difficulty: "advanced",
    description: "Nazwa drzewa albo krzewu występującego w naturze lub uprawie.",
    examples: ["Pinia", "Porzeczka", "Pigwowiec"],
  },
  {
    name: "Miejsce zabytkowe",
    difficulty: "advanced",
    description: "Zabytek, historyczne miejsce lub obiekt kojarzony z dziedzictwem kulturowym.",
    examples: ["Partenon", "Pałac Kultury", "Piramidy"],
  },
  {
    name: "Jednostka miary",
    difficulty: "advanced",
    description: "Jednostka używana do pomiaru długości, masy, czasu, temperatury albo innych wielkości.",
    examples: ["Pascal", "Pikometr", "Promil"],
  },
  {
    name: "Medycyna",
    difficulty: "advanced",
    description: "Termin związany z medycyną, leczeniem, diagnostyką, anatomią lub zawodem medycznym.",
    examples: ["Plomba", "Pediatra", "Penicylina"],
  },
  {
    name: "Waluta",
    difficulty: "advanced",
    description: "Nazwa waluty używanej współcześnie albo historycznie w obiegu.",
    examples: ["Peso", "Pula", "Piastr"],
  },
  {
    name: "Mitologia",
    difficulty: "advanced",
    description: "Postać, bóstwo, stworzenie albo pojęcie związane z mitologią.",
    examples: ["Posejdon", "Feniks", "Ptah"],
  },
  {
    name: "Grzyb",
    difficulty: "advanced",
    description: "Nazwa grzyba jadalnego, niejadalnego albo leczniczego.",
    examples: ["Pieczarka", "Podgrzybek", "Purchawka"],
  },
  {
    name: "Zjawisko pogodowe",
    difficulty: "advanced",
    description: "Zjawisko atmosferyczne lub pogodowe obserwowane w przyrodzie.",
    examples: ["Przymrozek", "Piorun", "Pył saharyjski"],
  },
  {
    name: "Kosmos",
    difficulty: "advanced",
    description: "Dowolny obiekt, zjawisko, miejsce, pojęcie lub element związany z przestrzenią kosmiczną i astronomią.",
    examples: ["Asteroida", "Kometa", "Galaktyka"],
  },
   {
    name: "Materiał",
    difficulty: "advanced",
    description: "Surowiec lub tworzywo wykorzystywane do produkcji przedmiotów, ubrań, konstrukcji albo innych elementów.",
    examples: ["Aluminium", "Drewno", "Bawełna"],
  },
   {
    name: "Przestępstwo",
    difficulty: "advanced",
    description: "Czyn zabroniony przez prawo, za który może grozić odpowiedzialność karna.",
    examples: ["Groźby", "Włamanie", "Bigamia"],
  },
];

export const DEFAULT_CATEGORIES = seeds.map(createDefaultCategory);
