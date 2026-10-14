const SAFE = BigInt(Number.MAX_SAFE_INTEGER);

export function divRound(numerator, denominator, mode = "half-up") {
  let n = BigInt(numerator);
  let d = BigInt(denominator);
  if (d === 0n) {
    const error = new Error("Sıfıra bölme");
    error.code = "ZERO_DIVISION";
    throw error;
  }
  const negative = n < 0n !== d < 0n;
  if (n < 0n) n = -n;
  if (d < 0n) d = -d;
  const q = n / d;
  const r = n % d;
  let add = 0n;
  if (mode === "down") {
    add = 0n;
  } else if (mode === "half-even") {
    if (r * 2n > d || (r * 2n === d && q % 2n === 1n)) add = 1n;
  } else if (r * 2n >= d) {
    add = 1n;
  }
  let value = q + add;
  if (negative) value = -value;
  if (value > SAFE || value < -SAFE) {
    throw new Error("Tutar çok büyük");
  }
  return Number(value);
}

function failParse() {
  return null;
}

export function parseMoneyToKurus(input) {
  if (input == null) return null;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return parseMoneyToKurus(input.toString());
  }
  let raw = String(input).trim().replace(/\s/g, "").replace(/[₺$€]/g, "");
  if (!raw || raw.startsWith("-")) return null;
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  if (hasComma && hasDot) {
    raw =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (hasComma) {
    raw = raw.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) return failParse();
  const [whole, frac = ""] = raw.split(".");
  const padded = (frac + "000").slice(0, 3);
  let kurus = Number(whole) * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) kurus += 1;
  if (!Number.isSafeInteger(kurus)) return null;
  return kurus;
}

export function parsePercentToBps(input) {
  if (input == null) return null;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return parsePercentToBps(input.toString());
  }
  let raw = String(input).trim().replace("%", "").replace(/\s/g, "");
  if (!raw || raw.startsWith("-")) return null;
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");
  if (hasComma && hasDot) {
    raw =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (hasComma) {
    raw = raw.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;
  const [whole, frac = ""] = raw.split(".");
  const padded = (frac + "000").slice(0, 3);
  let bps = Number(whole) * 100 + Number(padded.slice(0, 2));
  if (Number(padded[2]) >= 5) bps += 1;
  if (!Number.isSafeInteger(bps)) return null;
  return bps;
}

export function parseQuantityToMilli(input) {
  if (input == null) return null;
  if (typeof input === "number") {
    if (!Number.isFinite(input) || input < 0) return null;
    return parseQuantityToMilli(input.toString());
  }
  let raw = String(input).trim().replace(/\s/g, "");
  if (!raw || raw.startsWith("-")) return null;
  if (raw.includes(",") && raw.includes(".")) {
    raw =
      raw.lastIndexOf(",") > raw.lastIndexOf(".")
        ? raw.replace(/\./g, "").replace(",", ".")
        : raw.replace(/,/g, "");
  } else if (raw.includes(",")) {
    raw = raw.replace(",", ".");
  }
  if (!/^\d+(\.\d+)?$/.test(raw)) return null;
  const [whole, frac = ""] = raw.split(".");
  const padded = (frac + "0000").slice(0, 4);
  let milli = Number(whole) * 1000 + Number(padded.slice(0, 3));
  if (Number(padded[3]) >= 5) milli += 1;
  if (!Number.isSafeInteger(milli)) return null;
  return milli;
}

const CURRENCY_SYMBOL = { TRY: "₺", USD: "$", EUR: "€" };

export function formatPlainAmount(kurus) {
  return formatMoney(kurus, "TRY").replace(" ₺", "");
}

export function formatMoney(kurus, currency = "TRY") {
  const value = Number(kurus) || 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 100).toLocaleString("tr-TR");
  const frac = String(abs % 100).padStart(2, "0");
  const symbol = CURRENCY_SYMBOL[currency] || currency;
  return `${negative ? "-" : ""}${whole},${frac} ${symbol}`;
}

export function formatPercent(bps) {
  const value = Number(bps) || 0;
  const negative = value < 0;
  const abs = Math.abs(value);
  const whole = Math.floor(abs / 100).toLocaleString("tr-TR");
  const frac = abs % 100;
  const body = frac === 0 ? whole : `${whole},${String(frac).padStart(2, "0").replace(/0$/, "")}`;
  return `${negative ? "-" : ""}${body}%`;
}

export function formatQuantity(milli) {
  const value = Number(milli) || 0;
  const whole = Math.floor(Math.abs(value) / 1000).toLocaleString("tr-TR");
  const frac = Math.abs(value) % 1000;
  if (frac === 0) return value < 0 ? `-${whole}` : whole;
  const fracText = String(frac).padStart(3, "0").replace(/0+$/, "");
  return `${value < 0 ? "-" : ""}${whole},${fracText}`;
}

export function formatDate(iso) {
  if (!iso) return "—";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month, day] = iso.split("-");
    return `${day}.${month}.${year}`;
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function todayInputValue(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDaysInput(days, date = new Date()) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return todayInputValue(next);
}
