import { loadVersionedValue, saveVersionedValue } from "@/lib/storage";

describe("storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("zapisuje i odczytuje dane wersjonowane", () => {
    saveVersionedValue("pm.test", { answer: 42 });

    expect(loadVersionedValue("pm.test", { answer: 0 })).toEqual({ answer: 42 });
  });

  it("wraca do danych domyślnych przy uszkodzonym json", () => {
    window.localStorage.setItem("pm.broken", "{broken");

    expect(loadVersionedValue("pm.broken", { answer: 7 })).toEqual({ answer: 7 });
  });
});
