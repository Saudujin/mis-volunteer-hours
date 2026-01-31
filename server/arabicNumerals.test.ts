import { describe, expect, it } from "vitest";

// Convert Arabic numerals to English
function convertArabicToEnglish(str: string): string {
  const arabicNumerals = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  let result = str;
  arabicNumerals.forEach((arabic, index) => {
    result = result.replace(new RegExp(arabic, "g"), index.toString());
  });
  return result;
}

describe("Arabic to English numeral conversion", () => {
  it("converts Arabic numerals to English", () => {
    expect(convertArabicToEnglish("٤٤٥١٠١٤١٣")).toBe("445101413");
  });

  it("keeps English numerals unchanged", () => {
    expect(convertArabicToEnglish("445101413")).toBe("445101413");
  });

  it("handles mixed Arabic and English numerals", () => {
    expect(convertArabicToEnglish("٤٤5101٤١٣")).toBe("445101413");
  });

  it("handles empty string", () => {
    expect(convertArabicToEnglish("")).toBe("");
  });

  it("handles string with no numerals", () => {
    expect(convertArabicToEnglish("سعود")).toBe("سعود");
  });

  it("converts all Arabic digits correctly", () => {
    expect(convertArabicToEnglish("٠١٢٣٤٥٦٧٨٩")).toBe("0123456789");
  });
});
