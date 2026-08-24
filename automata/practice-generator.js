(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AutomataPracticeGenerator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const PAIRS = [["0", "1"], ["a", "b"]];
  const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
  const cache = new Map();

  function literal(word) {
    return Array.from(word).join(".");
  }

  function alphabetStar(pair) {
    return `{${pair.join(",")}}*`;
  }

  function words(pair, length) {
    let result = [""];
    for (let index = 0; index < length; index += 1) {
      result = result.flatMap((prefix) => pair.map((symbol) => prefix + symbol));
    }
    return result;
  }

  function add(target, difficulty, family, variant, fields) {
    target.push({ id: `${difficulty}-${family}-${variant}`, difficulty, ...fields });
  }

  function easyCatalog() {
    const result = [];
    for (const pair of PAIRS) {
      const [x, y] = pair;
      const star = alphabetStar(pair);
      for (const symbol of pair) {
        add(result, "easy", "single-star", symbol, {
          title: `สัญลักษณ์ ${symbol} กี่ตัวก็ได้`,
          regex: `${symbol}*`,
          hint: `คำว่างต้องผ่าน และทุก transition ที่ใช้เป็น ${symbol}`,
        });
        add(result, "easy", "ends-one", `${pair.join("")}-${symbol}`, {
          title: `ลงท้ายด้วย ${symbol}`,
          regex: `${star}.${symbol}`,
          hint: `สถานะสุดท้ายต้องจำว่าสัญลักษณ์ล่าสุดคือ ${symbol}`,
        });
        add(result, "easy", "starts-one", `${pair.join("")}-${symbol}`, {
          title: `ขึ้นต้นด้วย ${symbol}`,
          regex: `${symbol}.${star}`,
          hint: `ตัดสินจากสัญลักษณ์ตัวแรก แล้ววนรับตัวที่เหลือได้ทั้งสองแบบ`,
        });
      }

      const finiteSets = [
        ["λ", x, y],
        [x, y, x + y],
        ["λ", x + x, y + y],
        [x + y, y + x],
      ];
      finiteSets.forEach((members, index) => add(result, "easy", "finite", `${pair.join("")}-${index}`, {
        title: "ภาษาจำกัดชุดเล็ก",
        set: `{${members.join(", ")}}`,
        hint: "สร้างทางเดินตาม prefix และทำ final เฉพาะจุดที่จบคำในชุด",
      }));

      words(pair, 2).forEach((word) => add(result, "easy", "exact-word", `${pair.join("")}-${word}`, {
        title: `รับเฉพาะคำ ${word}`,
        set: `{${word}}`,
        hint: `มีเส้นทางหลักยาว ${word.length} ตัว และรับเฉพาะเมื่ออ่านครบพอดี`,
      }));
    }
    return result;
  }

  function mediumCatalog() {
    const result = [];
    for (const pair of PAIRS) {
      const [x, y] = pair;
      const star = alphabetStar(pair);
      for (const word of words(pair, 2)) {
        add(result, "medium", "suffix-two", `${pair.join("")}-${word}`, {
          title: `ลงท้ายด้วย ${word}`,
          regex: `${star}.${literal(word)}`,
          hint: `ให้ state จำ suffix ของ ${word} ที่ตรงอยู่ล่าสุด`,
        });
        add(result, "medium", "contains-two", `${pair.join("")}-${word}`, {
          title: `มี ${word} อยู่ข้างใน`,
          regex: `${star}.${literal(word)}.${star}`,
          hint: `เมื่อพบ ${word} ครบแล้ว จะอยู่ใน accepting state ต่อไป`,
        });
        add(result, "medium", "prefix-two", `${pair.join("")}-${word}`, {
          title: `ขึ้นต้นด้วย ${word}`,
          regex: `${literal(word)}.${star}`,
          hint: `ตรวจสองตัวแรกให้ครบก่อน แล้วจึงวนรับสัญลักษณ์ใดก็ได้`,
        });
      }

      [[x, y], [y, x]].forEach(([target, other]) => {
        add(result, "medium", "even-count", `${pair.join("")}-${target}`, {
          title: `จำนวน ${target} เป็นเลขคู่`,
          regex: `${other}*.(${target}.${other}*.${target}.${other}*)*`,
          hint: `ใช้สอง state สลับกันทุกครั้งที่อ่าน ${target} และวนเมื่ออ่าน ${other}`,
        });
        add(result, "medium", "block-choice", `${target}-${other}`, {
          title: `เลือกบล็อก ${target}${other}* หรือ ${other}${other}`,
          set: `{${target}${other}*,${other}${other}}*`,
          hint: `มองแต่ละรอบของดาวเป็นการเลือกหนึ่งบล็อก แล้วกลับมาจุดเริ่มรอบใหม่`,
        });
      });

      const finiteSets = [
        [x + x, x + y, y + x],
        ["λ", x + y + x, y + x + y],
        [x, y + y, x + x + y],
        [y, x + x, y + y + x],
      ];
      finiteSets.forEach((members, index) => add(result, "medium", "finite", `${pair.join("")}-${index}`, {
        title: "ภาษาจำกัดหลายทาง",
        set: `{${members.join(", ")}}`,
        hint: "เริ่มด้วย prefix tree แล้วพิจารณารวม state ที่มีอนาคตเหมือนกัน",
      }));
    }
    return result;
  }

  function hardCatalog() {
    const result = [];
    for (const pair of PAIRS) {
      const [x, y] = pair;
      const star = alphabetStar(pair);
      for (const word of words(pair, 3)) {
        add(result, "hard", "contains-three", `${pair.join("")}-${word}`, {
          title: `มี ${word} อยู่ข้างใน`,
          regex: `${star}.${literal(word)}.${star}`,
          hint: `แต่ละ state จำ prefix ของ ${word} ที่ตรงอยู่ล่าสุด และต้องรองรับส่วนที่ซ้อนกัน`,
        });
        add(result, "hard", "suffix-three", `${pair.join("")}-${word}`, {
          title: `ลงท้ายด้วย ${word}`,
          regex: `${star}.${literal(word)}`,
          hint: `ติดตาม suffix ที่ยาวที่สุดซึ่งยังเป็น prefix ของ ${word}`,
        });
      }

      [[x, y], [y, x]].forEach(([first, second]) => {
        add(result, "hard", "start-end", `${first}-${second}`, {
          title: `ขึ้นต้นด้วย ${first} และลงท้ายด้วย ${second}`,
          regex: `${first}.${star}.${second}`,
          hint: "ต้องจำทั้งการผ่านเงื่อนไขตัวแรกและสัญลักษณ์ล่าสุด",
        });
        add(result, "hard", "paired-run", `${first}-${second}`, {
          title: `ทุกช่วงของ ${first} มาเป็นคู่`,
          set: `{${second},${first}${first}}*`,
          hint: `มองภาษาเป็นบล็อก ${second} หนึ่งตัว หรือ ${first}${first} หนึ่งคู่`,
        });
        add(result, "hard", "must-follow", `${first}-${second}`, {
          title: `ทุก ${first} ต้องตามด้วย ${second}`,
          set: `{${second},${first}${second}}*`,
          hint: `หลังอ่าน ${first} ต้องเข้าสถานะรอ ${second}; อ่านอย่างอื่นไม่ได้จนกว่าจะครบคู่`,
        });
        add(result, "hard", "complex-block-a", `${first}-${second}`, {
          title: "ภาษาจากบล็อกผสมแบบที่หนึ่ง",
          set: `{${first}${second}*,${second}${first}${first}}*`,
          hint: "แยกทางเลือกของแต่ละบล็อก แล้วเชื่อมจุดจบกลับไปจุดเริ่มของรอบ",
        });
        add(result, "hard", "complex-block-b", `${first}-${second}`, {
          title: "ภาษาจากบล็อกผสมแบบที่สอง",
          set: `{${first}${first},${second}*${first}}*`,
          hint: "ระวังบล็อกที่มีดาวอยู่ภายใน และการเริ่มรอบใหม่หลังจบบล็อก",
        });
      });

      const finiteSets = [
        ["λ", x + x, x + y + x, y + y + y],
        [x, y + x, x + y + y, y + x + x + y],
        [y, x + y, y + x + y, x + x + x + y],
        [x + y, y + x, x + y + x, y + x + y + y],
      ];
      finiteSets.forEach((members, index) => add(result, "hard", "finite", `${pair.join("")}-${index}`, {
        title: "ภาษาจำกัดหลายความยาว",
        set: `{${members.join(", ")}}`,
        hint: "สร้าง prefix tree ให้ครบก่อน แล้วค่อยหาคู่ state ที่รับชุด suffix เดียวกัน",
      }));
    }
    return result;
  }

  function createCatalog(difficulty) {
    if (!DIFFICULTIES.has(difficulty)) throw new Error(`Unknown practice difficulty: ${difficulty}`);
    if (!cache.has(difficulty)) {
      const catalog = difficulty === "easy" ? easyCatalog() : difficulty === "medium" ? mediumCatalog() : hardCatalog();
      cache.set(difficulty, catalog);
    }
    return cache.get(difficulty).map((question) => ({ ...question }));
  }

  function secureRandom() {
    const cryptoObject = typeof globalThis !== "undefined" ? globalThis.crypto : null;
    if (cryptoObject && typeof cryptoObject.getRandomValues === "function") {
      const value = new Uint32Array(1);
      cryptoObject.getRandomValues(value);
      return value[0] / 4294967296;
    }
    return Math.random();
  }

  function shuffle(items, random = secureRandom) {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const sample = Number(random());
      const normalized = Number.isFinite(sample) ? Math.max(0, Math.min(0.9999999999999999, sample)) : 0;
      const swapIndex = Math.floor(normalized * (index + 1));
      [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
    }
    return shuffled;
  }

  function drawQuestion(difficulty, previousState = {}, random = secureRandom) {
    const catalog = createCatalog(difficulty);
    const byId = new Map(catalog.map((question) => [question.id, question]));
    const savedState = previousState && typeof previousState === "object" && !Array.isArray(previousState) ? previousState : {};
    const seen = new Set();
    let remaining = Array.isArray(savedState.remaining)
      ? savedState.remaining.filter((id) => byId.has(id) && !seen.has(id) && seen.add(id))
      : [];
    let cycle = Number.isFinite(Number(savedState.cycle)) ? Math.max(0, Number(savedState.cycle)) : 0;
    let newCycle = false;

    if (!remaining.length) {
      remaining = shuffle(catalog.map((question) => question.id), random);
      cycle += 1;
      newCycle = true;
      if (remaining.length > 1 && remaining[0] === savedState.lastId) {
        [remaining[0], remaining[1]] = [remaining[1], remaining[0]];
      }
    }

    const id = remaining.shift();
    return {
      question: { ...byId.get(id) },
      state: { remaining, lastId: id, cycle },
      remaining: remaining.length,
      total: catalog.length,
      cycle,
      newCycle,
    };
  }

  return { createCatalog, drawQuestion, secureRandom, shuffle };
});
