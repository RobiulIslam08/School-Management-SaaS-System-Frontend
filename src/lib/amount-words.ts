const EN_ONES = [
  "",
  "One",
  "Two",
  "Three",
  "Four",
  "Five",
  "Six",
  "Seven",
  "Eight",
  "Nine",
  "Ten",
  "Eleven",
  "Twelve",
  "Thirteen",
  "Fourteen",
  "Fifteen",
  "Sixteen",
  "Seventeen",
  "Eighteen",
  "Nineteen",
];

const EN_TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

const BN_UNDER_HUNDRED = [
  "শূন্য",
  "এক",
  "দুই",
  "তিন",
  "চার",
  "পাঁচ",
  "ছয়",
  "সাত",
  "আট",
  "নয়",
  "দশ",
  "এগারো",
  "বারো",
  "তেরো",
  "চৌদ্দ",
  "পনেরো",
  "ষোলো",
  "সতেরো",
  "আঠারো",
  "উনিশ",
  "বিশ",
  "একুশ",
  "বাইশ",
  "তেইশ",
  "চব্বিশ",
  "পঁচিশ",
  "ছাব্বিশ",
  "সাতাশ",
  "আটাশ",
  "উনত্রিশ",
  "ত্রিশ",
  "একত্রিশ",
  "বত্রিশ",
  "তেত্রিশ",
  "চৌত্রিশ",
  "পঁয়ত্রিশ",
  "ছত্রিশ",
  "সাঁইত্রিশ",
  "আটত্রিশ",
  "উনচল্লিশ",
  "চল্লিশ",
  "একচল্লিশ",
  "বিয়াল্লিশ",
  "তেতাল্লিশ",
  "চুয়াল্লিশ",
  "পঁয়তাল্লিশ",
  "ছেচল্লিশ",
  "সাতচল্লিশ",
  "আটচল্লিশ",
  "উনপঞ্চাশ",
  "পঞ্চাশ",
  "একান্ন",
  "বাহান্ন",
  "তিপ্পান্ন",
  "চুয়ান্ন",
  "পঞ্চান্ন",
  "ছাপ্পান্ন",
  "সাতান্ন",
  "আটান্ন",
  "উনষাট",
  "ষাট",
  "একষট্টি",
  "বাষট্টি",
  "তেষট্টি",
  "চৌষট্টি",
  "পঁয়ষট্টি",
  "ছেষট্টি",
  "সাতষট্টি",
  "আটষট্টি",
  "উনসত্তর",
  "সত্তর",
  "একাত্তর",
  "বাহাত্তর",
  "তিয়াত্তর",
  "চুয়াত্তর",
  "পঁচাত্তর",
  "ছিয়াত্তর",
  "সাতাত্তর",
  "আটাত্তর",
  "উনআশি",
  "আশি",
  "একাশি",
  "বিরাশি",
  "তিরাশি",
  "চুরাশি",
  "পঁচাশি",
  "ছিয়াশি",
  "সাতাশি",
  "অষ্টআশি",
  "উননব্বই",
  "নব্বই",
  "একানব্বই",
  "বিরানব্বই",
  "তিরানব্বই",
  "চুরানব্বই",
  "পঁচানব্বই",
  "ছিয়ানব্বই",
  "সাতানব্বই",
  "আটানব্বই",
  "নিরানব্বই",
];

function enUnderThousand(n: number): string {
  if (n < 20) return EN_ONES[n] ?? "";
  if (n < 100) {
    const ten = EN_TENS[Math.floor(n / 10)] ?? "";
    const one = n % 10 ? ` ${EN_ONES[n % 10]}` : "";
    return `${ten}${one}`;
  }
  const hundred = EN_ONES[Math.floor(n / 100)] ?? "";
  const rest = n % 100;
  return rest ? `${hundred} Hundred ${enUnderThousand(rest)}` : `${hundred} Hundred`;
}

function enWords(n: number): string {
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const million = Math.floor(n / 1_000_000);
  const thousand = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  if (million) parts.push(`${enUnderThousand(million)} Million`);
  if (thousand) parts.push(`${enUnderThousand(thousand)} Thousand`);
  if (rest) parts.push(enUnderThousand(rest));
  return parts.join(" ");
}

function bnUnderThousand(n: number): string {
  if (n <= 0) return "";
  const hundred = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (hundred) parts.push(`${BN_UNDER_HUNDRED[hundred]}শ`);
  if (rest) parts.push(BN_UNDER_HUNDRED[rest] ?? "");
  return parts.join(" ");
}

function bnWords(n: number): string {
  if (n === 0) return "শূন্য";
  const parts: string[] = [];
  const crore = Math.floor(n / 10_000_000);
  const lakh = Math.floor((n % 10_000_000) / 100_000);
  const thousand = Math.floor((n % 100_000) / 1000);
  const rest = n % 1000;
  if (crore) parts.push(`${bnUnderThousand(crore)} কোটি`);
  if (lakh) parts.push(`${bnUnderThousand(lakh)} লাখ`);
  if (thousand) parts.push(`${bnUnderThousand(thousand)} হাজার`);
  if (rest) parts.push(bnUnderThousand(rest));
  return parts.join(" ");
}

export function amountInWords(amount: number, locale: "bn" | "en"): string {
  const n = Math.max(0, Math.round(Number.isFinite(amount) ? amount : 0));
  if (locale === "bn") return `${bnWords(n)} টাকা মাত্র`;
  return `${enWords(n)} only`;
}
