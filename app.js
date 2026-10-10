/* =========================================================
   KIDSBOOK STUDIO — APP.JS
   Integrasi: tools.js + KidsBookTools + VortexAssistant
   PDF: jsPDF 2.5.1
   ========================================================= */

"use strict";

(() => {
  const $ = id => document.getElementById(id);

  const state = {
    currentPage: 1,
    totalPages: 0,
    questions: [],
    pagePlans: [],
    isGenerating: false,
    pdfBlob: null,
    pdfUrl: null,
    lastSettings: null
  };

  const THEME_NAMES = {
    animals: "Hewan Lucu",
    space: "Luar Angkasa",
    ocean: "Dunia Laut",
    garden: "Kebun Ajaib",
    vegetables: "Sayuran",
    fruits: "Buah-buahan",
    professions: "Profesi",
    vehicles: "Kendaraan",
    shapes: "Bentuk Geometri",
    dinosaurs: "Dinosaurus",
    food: "Makanan",
    home: "Rumah dan Keluarga",
    weather: "Cuaca dan Alam"
  };

  const THEME_ICONS = {
    animals: "🐻",
    space: "🚀",
    ocean: "🐠",
    garden: "🌻",
    vegetables: "🥕",
    fruits: "🍎",
    professions: "👩‍⚕️",
    vehicles: "🚗",
    shapes: "🔺",
    dinosaurs: "🦖",
    food: "🍞",
    home: "🏠",
    weather: "🌈"
  };

  const ACTIVITY_NAMES = {
    coloring: "Buku Mewarnai",
    tracing: "Latihan Menulis",
    math: "Matematika",
    puzzle: "Teka-teki",
    mixed: "Aktivitas Campuran"
  };

  const ACTIVITY_ICONS = {
    coloring: "🎨",
    tracing: "✏️",
    math: "🔢",
    puzzle: "🧩",
    mixed: "📚"
  };

  const PUZZLES = [
    ["Aku punya empat kaki, tetapi tidak bisa berjalan. Apakah aku?", "Meja"],
    ["Benda apakah yang digunakan untuk melihat waktu?", "Jam"],
    ["Apa yang muncul di langit setelah hujan dan terkena matahari?", "Pelangi"],
    ["Aku bersinar pada malam hari dan terlihat di langit. Apakah aku?", "Bintang"],
    ["Hewan apakah yang suka makan wortel dan memiliki telinga panjang?", "Kelinci"],
    ["Apa yang digunakan untuk menulis di buku?", "Pensil"],
    ["Aku hidup di air dan memiliki sirip. Siapakah aku?", "Ikan"],
    ["Benda apakah yang melindungi kita ketika hujan?", "Payung"],
    ["Aku punya halaman, tetapi bukan rumah. Apakah aku?", "Buku"],
    ["Buah apa yang berwarna kuning dan panjang?", "Pisang"],
    ["Apa yang digunakan untuk membuka pintu terkunci?", "Kunci"],
    ["Hewan apa yang menghasilkan madu?", "Lebah"],
    ["Benda apakah yang digunakan untuk duduk?", "Kursi"],
    ["Apa nama benda yang digunakan untuk menyikat gigi?", "Sikat gigi"],
    ["Hewan apakah yang memiliki belalai panjang?", "Gajah"],
    ["Apa yang kita gunakan untuk melindungi kepala dari panas?", "Topi"],
    ["Benda apakah yang digunakan untuk memotong kertas?", "Gunting"],
    ["Apa nama tempat kita meminjam dan membaca banyak buku?", "Perpustakaan"],
    ["Hewan apakah yang menghasilkan susu?", "Sapi"],
    ["Apa yang digunakan untuk membersihkan lantai?", "Sapu"]
  ];

  const MATH_OPERATIONS = ["+", "-", "×"];

  /* =========================================================
     UTILITAS
     ========================================================= */

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(array) {
    return array[Math.floor(Math.random() * array.length)];
  }

  function safeText(value, fallback = "") {
    return value == null ? fallback : String(value);
  }

  function wrapText(doc, text, maxWidth) {
    return doc.splitTextToSize(String(text), maxWidth);
  }

  function getJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) {
      return window.jspdf.jsPDF;
    }

    throw new Error(
      "jsPDF belum dimuat. Periksa urutan script di index.html."
    );
  }

  function getPageSize(doc) {
    return {
      width: doc.internal.pageSize.getWidth(),
      height: doc.internal.pageSize.getHeight()
    };
  }

  function getMargin(doc) {
    const size = getPageSize(doc);
    return Math.min(15, size.width * 0.055);
  }

  function cleanPreviousPDF() {
    if (state.pdfUrl) {
      URL.revokeObjectURL(state.pdfUrl);
    }

    state.pdfUrl = null;
    state.pdfBlob = null;
  }

  function showToast(message, type = "info") {
    const toast = $("toast");

    if (!toast) {
      console.log(`[${type}] ${message}`);
      return;
    }

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove("hidden");

    clearTimeout(showToast.timer);

    showToast.timer = setTimeout(() => {
      toast.classList.add("hidden");
    }, 3500);
  }

  function setProgress(percent, message) {
    const bar = $("progressBar");
    const text = $("progressText");
    const container = $("progressContainer");

    if (container) {
      container.classList.remove("hidden");
    }

    if (bar) {
      bar.style.width = `${Math.max(0, Math.min(100, percent))}%`;
    }

    if (text) {
      text.textContent = message || `${percent}%`;
    }
  }

  function hideProgress() {
    const container = $("progressContainer");

    if (container) {
      container.classList.add("hidden");
    }
  }

  /* =========================================================
     PENGATURAN
     ========================================================= */

  function getSettings() {
    const type = $("bookType")?.value || "coloring";
    const requestedPages = parseInt($("pageCount")?.value, 10) || 10;

    const themeValue = $("theme")?.value || "animals";
    const theme = THEME_NAMES[themeValue] ? themeValue : "animals";

    const paperSize = $("paperSize")?.value || "a4";
    const age = $("ageGroup")?.value || "6-8";

    let difficulty = parseInt($("difficulty")?.value, 10) || 1;
    difficulty = Math.max(1, Math.min(3, difficulty));

    return {
      title: safeText($("bookTitle")?.value, "Buku Aktivitas Anak"),
      type,
      theme,
      paperSize: paperSize.toLowerCase(),
      pages: Math.max(1, Math.min(1000, requestedPages)),
      age,
      difficulty,
      cover: $("includeCover") ? $("includeCover").checked : true,
      answers: $("includeAnswers") ? $("includeAnswers").checked : true
    };
  }

  function getPageType(settings, pageNumber) {
    if (settings.type !== "mixed") {
      return settings.type;
    }

    const types = ["coloring", "tracing", "math", "puzzle"];
    return types[(pageNumber - 1) % types.length];
  }

  function getPagePlan(settings, pageNumber, bookSet) {
    const tools = window.KidsBookTools;

    if (!tools || typeof tools.createPagePlan !== "function") {
      return null;
    }

    try {
      const planSettings = {
        theme: settings.theme,
        type: getPageType(settings, pageNumber),
        age: settings.age,
        difficulty: settings.difficulty,
        pages: settings.pages
      };

      return tools.createPagePlan(planSettings, pageNumber, bookSet);
    } catch (error) {
      console.warn("Vortex gagal membuat rencana halaman:", error);
      return null;
    }
  }

  /* =========================================================
     GAMBAR DASAR
     ========================================================= */

  function drawPageBorder(doc, margin, width, height) {
    doc.setDrawColor(190, 198, 208);
    doc.setLineWidth(0.5);

    doc.roundedRect(
      margin,
      margin,
      width - margin * 2,
      height - margin * 2,
      3,
      3,
      "S"
    );
  }

  function drawPageHeader(doc, settings, pageNumber, activityType) {
    const { width } = getPageSize(doc);
    const margin = getMargin(doc);

    doc.setTextColor(35, 45, 60);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);

    doc.text(settings.title.slice(0, 70), margin + 2, margin + 8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    const label =
      `${THEME_ICONS[settings.theme] || ""} ` +
      `${THEME_NAMES[settings.theme] || "Aktivitas"} • ` +
      `${ACTIVITY_NAMES[activityType] || activityType}`;

    doc.text(label, margin + 2, margin + 14);

    doc.setDrawColor(200, 205, 215);
    doc.line(
      margin,
      margin + 19,
      width - margin,
      margin + 19
    );

    doc.setFontSize(8);
    doc.text(
      `Halaman ${pageNumber}`,
      width - margin - 2,
      margin + 8,
      { align: "right" }
    );
  }

  function drawFooter(doc, pageNumber) {
    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    doc.setDrawColor(220, 220, 220);
    doc.line(
      margin + 2,
      height - margin - 9,
      width - margin - 2,
      height - margin - 9
    );

    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    doc.text(
      `KidsBook Studio • ${pageNumber}`,
      width / 2,
      height - margin - 4,
      { align: "center" }
    );

    doc.setTextColor(0, 0, 0);
  }

  function drawInstruction(doc, text, x, y, maxWidth) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const lines = wrapText(doc, text, maxWidth);

    doc.text(lines, x, y);

    return lines.length * 5 + 4;
  }

  /* =========================================================
     INTEGRASI ILUSTRASI VORTEX
     ========================================================= */

  function drawIllustration(doc, settings, x, y, width, height, pageNumber) {
    const tools = window.KidsBookTools;

    const plan =
      state.pagePlans[pageNumber - 1] ||
      getPagePlan(settings, pageNumber, new Set());

    if (
      tools &&
      tools.VectorIllustrator &&
      typeof tools.VectorIllustrator.draw === "function"
    ) {
      try {
        const item = plan || {
          theme: settings.theme,
          activity: getPageType(settings, pageNumber)
        };

        tools.VectorIllustrator.draw(
          doc,
          item,
          x,
          y,
          width,
          height,
          pageNumber
        );

        return;
      } catch (error) {
        console.warn("Ilustrasi Vortex gagal:", error);
      }
    }

    // Fallback jika tools.js tidak tersedia.
    drawFallbackIllustration(
      doc,
      settings.theme,
      x,
      y,
      width,
      height,
      pageNumber
    );
  }

  function drawFallbackIllustration(
    doc,
    theme,
    x,
    y,
    width,
    height,
    pageNumber
  ) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const unit = Math.min(width, height) * 0.24;

    doc.setDrawColor(35, 45, 60);
    doc.setLineWidth(1.4);

    if (theme === "space") {
      doc.circle(cx, cy, unit * 0.65, "S");
      doc.ellipse(cx, cy, unit * 1.1, unit * 0.35, "S");
      doc.circle(cx + unit * 0.8, cy - unit * 0.5, unit * 0.12, "S");
      doc.circle(cx - unit * 1.1, cy - unit * 0.9, unit * 0.07, "S");
      doc.circle(cx + unit * 1.1, cy + unit * 0.9, unit * 0.07, "S");
    } else if (theme === "ocean") {
      doc.ellipse(cx, cy, unit * 0.9, unit * 0.55, "S");
      doc.triangle(
        cx - unit * 0.8, cy,
        cx - unit * 1.2, cy - unit * 0.3,
        cx - unit * 1.2, cy + unit * 0.3,
        "S"
      );
      doc.circle(cx + unit * 0.5, cy - unit * 0.1, unit * 0.05, "S");
      doc.arc(cx + unit * 0.1, cy + unit * 0.1, unit * 0.2, 20, 150, "S");
    } else if (theme === "garden" || theme === "fruits") {
      doc.circle(cx, cy, unit * 0.55, "S");
      doc.ellipse(cx + unit * 0.3, cy - unit * 0.6, unit * 0.25, unit * 0.12, "S");
      doc.line(cx, cy - unit * 0.5, cx, cy - unit * 0.9);
      doc.line(cx - unit * 0.8, cy + unit * 0.8, cx + unit * 0.8, cy + unit * 0.8);
    } else if (theme === "vehicles") {
      doc.roundedRect(
        cx - unit,
        cy - unit * 0.2,
        unit * 2,
        unit * 0.7,
        4,
        4,
        "S"
      );
      doc.circle(cx - unit * 0.55, cy + unit * 0.6, unit * 0.2, "S");
      doc.circle(cx + unit * 0.55, cy + unit * 0.6, unit * 0.2, "S");
      doc.line(cx - unit * 0.4, cy - unit * 0.2, cx - unit * 0.15, cy - unit * 0.6);
      doc.line(cx - unit * 0.15, cy - unit * 0.6, cx + unit * 0.4, cy - unit * 0.6);
    } else if (theme === "shapes") {
      doc.circle(cx - unit * 0.65, cy, unit * 0.35, "S");
      doc.rect(cx, cy - unit * 0.35, unit * 0.7, unit * 0.7, "S");
      doc.triangle(
        cx - unit * 0.1, cy + unit * 0.5,
        cx - unit * 0.6, cy + unit * 1.2,
        cx + unit * 0.4, cy + unit * 1.2,
        "S"
      );
    } else if (theme === "dinosaurs") {
      doc.ellipse(cx, cy, unit * 0.9, unit * 0.5, "S");
      doc.circle(cx + unit * 0.75, cy - unit * 0.55, unit * 0.3, "S");
      doc.line(cx - unit * 0.45, cy + unit * 0.3, cx - unit * 0.5, cy + unit * 0.9);
      doc.line(cx + unit * 0.3, cy + unit * 0.3, cx + unit * 0.4, cy + unit * 0.9);
      doc.triangle(
        cx - unit * 0.8, cy,
        cx - unit * 1.35, cy - unit * 0.3,
        cx - unit * 1.1, cy + unit * 0.3,
        "S"
      );
    } else if (theme === "weather") {
      doc.circle(cx - unit * 0.2, cy, unit * 0.35, "S");
      doc.circle(cx + unit * 0.2, cy - unit * 0.15, unit * 0.45, "S");
      doc.circle(cx + unit * 0.55, cy, unit * 0.3, "S");
      doc.line(cx - unit * 0.5, cy + unit * 0.3, cx + unit * 0.8, cy + unit * 0.3);
      doc.line(cx - unit * 0.2, cy + unit * 0.5, cx - unit * 0.3, cy + unit * 0.8);
      doc.line(cx + unit * 0.3, cy + unit * 0.5, cx + unit * 0.2, cy + unit * 0.8);
    } else {
      // Hewan atau tema umum.
      doc.circle(cx, cy, unit * 0.65, "S");
      doc.circle(cx - unit * 0.45, cy - unit * 0.55, unit * 0.22, "S");
      doc.circle(cx + unit * 0.45, cy - unit * 0.55, unit * 0.22, "S");
      doc.circle(cx - unit * 0.2, cy - unit * 0.05, unit * 0.045, "S");
      doc.circle(cx + unit * 0.2, cy - unit * 0.05, unit * 0.045, "S");
      doc.arc(cx, cy + unit * 0.1, unit * 0.2, 20, 150, "S");
    }

    if (pageNumber % 2 === 0) {
      doc.circle(x + width * 0.12, y + height * 0.15, unit * 0.08, "S");
      doc.circle(x + width * 0.87, y + height * 0.22, unit * 0.06, "S");
    }
  }

  /* =========================================================
     HALAMAN SAMPUL
     ========================================================= */

  function drawCover(doc, settings) {
    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    doc.setDrawColor(50, 65, 90);
    doc.setLineWidth(1.4);

    doc.roundedRect(
      margin + 5,
      margin + 5,
      width - (margin + 5) * 2,
      height - (margin + 5) * 2,
      5,
      5,
      "S"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(25);
    doc.setTextColor(35, 45, 60);

    const titleLines = wrapText(
      doc,
      settings.title || "Buku Aktivitas Anak",
      width - margin * 4
    );

    let titleY = height * 0.22;

    doc.text(titleLines, width / 2, titleY, {
      align: "center"
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);

    doc.text(
      ACTIVITY_NAMES[settings.type] || "Buku Aktivitas",
      width / 2,
      titleY + titleLines.length * 11 + 7,
      { align: "center" }
    );

    const illustrationY = height * 0.38;
    const illustrationHeight = height * 0.3;

    drawIllustration(
      doc,
      settings,
      width * 0.2,
      illustrationY,
      width * 0.6,
      illustrationHeight,
      1
    );

    doc.setFontSize(12);

    doc.text(
      `Tema: ${THEME_NAMES[settings.theme] || settings.theme}`,
      width / 2,
      height * 0.77,
      { align: "center" }
    );

    doc.text(
      `Usia: ${settings.age} tahun`,
      width / 2,
      height * 0.81,
      { align: "center" }
    );

    doc.setFontSize(9);

    doc.text(
      "Nama: __________________________",
      width / 2,
      height * 0.88,
      { align: "center" }
    );

    doc.setTextColor(0, 0, 0);
  }

  /* =========================================================
     MEWARNAI
     ========================================================= */

  function drawColoringPage(doc, settings, pageNumber) {
    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    drawPageBorder(doc, margin, width, height);
    drawPageHeader(doc, settings, pageNumber, "coloring");

    const contentTop = margin + 25;
    const contentBottom = height - margin - 18;
    const contentHeight = contentBottom - contentTop;

    drawInstruction(
      doc,
      "Warnai gambar ini sesuai kreativitasmu!",
      margin + 3,
      contentTop + 7,
      width - margin * 2 - 6
    );

    drawIllustration(
      doc,
      settings,
      margin + 7,
      contentTop + 15,
      width - margin * 2 - 14,
      contentHeight - 20,
      pageNumber
    );

    drawFooter(doc, pageNumber);
  }

  /* =========================================================
     LATIHAN MENULIS
     ========================================================= */

  function drawTracingPage(doc, settings, pageNumber) {
    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    drawPageBorder(doc, margin, width, height);
    drawPageHeader(doc, settings, pageNumber, "tracing");

    const plan = state.pagePlans[pageNumber - 1];
    const word = plan?.word ||
      pick([
        "Kucing", "Bunga", "Buku", "Bola", "Rumah",
        "Pisang", "Mobil", "Bintang", "Pelangi", "Ikan"
      ]);

    let y = margin + 34;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    doc.text("Tebalkan kata berikut, lalu tulis kembali!", margin + 5, y);

    y += 25;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(settings.age === "3-5" ? 30 : 25);
    doc.setTextColor(185, 185, 185);

    doc.text(word, width / 2, y, { align: "center" });

    doc.setTextColor(0, 0, 0);

    y += 24;

    const lineGap = settings.age === "3-5" ? 31 : 25;
    const lineCount = Math.max(
      3,
      Math.min(7, Math.floor((height - margin - y - 18) / lineGap))
    );

    doc.setLineWidth(0.4);
    doc.setDrawColor(140, 150, 160);

    for (let i = 0; i < lineCount; i++) {
      const lineY = y + i * lineGap;

      doc.setLineDashPattern([2, 2], 0);
      doc.line(margin + 8, lineY, width - margin - 8, lineY);

      if (settings.age === "3-5") {
        doc.line(margin + 8, lineY + lineGap * 0.45, width - margin - 8, lineY + lineGap * 0.45);
      }
    }

    doc.setLineDashPattern([], 0);

    drawFooter(doc, pageNumber);
  }

  /* =========================================================
     MATEMATIKA
     ========================================================= */

  function createMathQuestion(settings, index, used) {
    const tools = window.KidsBookTools;

    if (
      tools &&
      tools.ActivityEngine &&
      typeof tools.ActivityEngine.makeMathQuestion === "function"
    ) {
      try {
        return tools.ActivityEngine.makeMathQuestion(
          {
            age: settings.age,
            difficulty: settings.difficulty
          },
          index,
          used
        );
      } catch (error) {
        console.warn("Math engine Vortex gagal:", error);
      }
    }

    const ageMax = settings.age === "3-5" ? 10 :
      settings.age === "6-8" ? 20 : 100;

    let a;
    let b;
    let operation;
    let answer;

    for (let attempt = 0; attempt < 100; attempt++) {
      operation = settings.difficulty === 1 || settings.age === "3-5"
        ? pick(["+", "-"])
        : pick(MATH_OPERATIONS);

      if (operation === "+") {
        a = randomInt(0, ageMax);
        b = randomInt(0, ageMax);
        answer = a + b;
      } else if (operation === "-") {
        a = randomInt(0, ageMax);
        b = randomInt(0, a);
        answer = a - b;
      } else {
        const maxFactor = settings.age === "6-8" ? 10 : 12;
        a = randomInt(1, maxFactor);
        b = randomInt(1, maxFactor);
        answer = a * b;
      }

      const question = `${a} ${operation} ${b} = ....`;

      if (!used.has(question)) {
        used.add(question);

        return {
          number: index + 1,
          question,
          answer
        };
      }
    }

    return {
      number: index + 1,
      question: "1 + 1 = ....",
      answer: 2
    };
  }

  function drawMathPage(doc, settings, pageNumber) {
    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    drawPageBorder(doc, margin, width, height);
    drawPageHeader(doc, settings, pageNumber, "math");

    const startY = margin + 31;
    const bottomY = height - margin - 17;
    const gap = (bottomY - startY) / 9;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    doc.text(
      "Selesaikan soal-soal berikut!",
      margin + 4,
      startY
    );

    const questions = [];
    const used = new Set();

    for (let i = 0; i < 8; i++) {
      const q = createMathQuestion(settings, i, used);
      questions.push(q);

      const y = startY + (i + 1) * gap;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(settings.age === "3-5" ? 13 : 11);

      doc.text(`${i + 1}. ${q.question}`, margin + 5, y);

      doc.setDrawColor(130, 140, 150);
      doc.setLineWidth(0.35);

      doc.line(
        width - margin - 32,
        y + 1,
        width - margin - 6,
        y + 1
      );
    }

    state.questions[pageNumber] = {
      type: "math",
      questions
    };

    drawFooter(doc, pageNumber);
  }

  /* =========================================================
     TEKA-TEKI
     ========================================================= */

  function createPuzzleQuestion(index, used) {
    const tools = window.KidsBookTools;

    if (
      tools &&
      tools.ActivityEngine &&
      typeof tools.ActivityEngine.makePuzzleQuestion === "function"
    ) {
      try {
        return tools.ActivityEngine.makePuzzleQuestion(index, used);
      } catch (error) {
        console.warn("Puzzle engine Vortex gagal:", error);
      }
    }

    const available = PUZZLES.filter(item => !used.has(item[0]));
    const selected = pick(available.length ? available : PUZZLES);

    used.add(selected[0]);

    return {
      number: index + 1,
      question: selected[0],
      answer: selected[1]
    };
  }

  function drawPuzzlePage(doc, settings, pageNumber) {
    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    drawPageBorder(doc, margin, width, height);
    drawPageHeader(doc, settings, pageNumber, "puzzle");

    const startY = margin + 31;
    const bottomY = height - margin - 18;
    const usableHeight = bottomY - startY;
    const rowHeight = usableHeight / 5;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    doc.text(
      "Bacalah petunjuk dan tulis jawabanmu!",
      margin + 4,
      startY
    );

    const questions = [];
    const used = new Set();

    for (let i = 0; i < 4; i++) {
      const q = createPuzzleQuestion(i, used);
      questions.push(q);

      const y = startY + 15 + i * rowHeight;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      doc.text(`${i + 1}.`, margin + 5, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      const lines = wrapText(
        doc,
        q.question,
        width - margin * 2 - 22
      );

      doc.text(lines, margin + 13, y);

      const answerY = y + Math.max(10, lines.length * 4.5 + 3);

      doc.setDrawColor(140, 150, 160);
      doc.setLineWidth(0.35);

      doc.line(
        margin + 13,
        answerY,
        width - margin - 7,
        answerY
      );
    }

    state.questions[pageNumber] = {
      type: "puzzle",
      questions
    };

    drawFooter(doc, pageNumber);
  }

  /* =========================================================
     ROUTER HALAMAN
     ========================================================= */

  function drawActivityPage(doc, settings, pageNumber) {
    const type = getPageType(settings, pageNumber);

    if (type === "coloring") {
      drawColoringPage(doc, settings, pageNumber);
    } else if (type === "tracing") {
      drawTracingPage(doc, settings, pageNumber);
    } else if (type === "math") {
      drawMathPage(doc, settings, pageNumber);
    } else if (type === "puzzle") {
      drawPuzzlePage(doc, settings, pageNumber);
    } else {
      drawColoringPage(doc, settings, pageNumber);
    }
  }

  /* =========================================================
     KUNCI JAWABAN
     ========================================================= */

  function drawAnswerPages(doc, settings) {
    if (!settings.answers) return;

    const entries = Object.entries(state.questions)
      .filter(([, data]) => data && data.questions && data.questions.length);

    if (!entries.length) return;

    const { width, height } = getPageSize(doc);
    const margin = getMargin(doc);

    let y = margin + 15;
    let answerPage = 1;

    function newAnswerPage() {
      if (answerPage > 1 || entries.length > 0) {
        doc.addPage();
      }

      answerPage++;

      y = margin + 15;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);
      doc.text("Kunci Jawaban", width / 2, y, { align: "center" });

      y += 12;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      doc.text(
        `Buku: ${settings.title}`,
        margin + 3,
        y
      );

      y += 10;
    }

    newAnswerPage();

    for (const [pageString, data] of entries) {
      const pageNumber = Number(pageString);
      const heading = `Halaman aktivitas ${pageNumber}`;

      if (y > height - margin - 25) {
        newAnswerPage();
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(heading, margin + 3, y);

      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);

      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        const answer = safeText(q.answer, "-");
        const questionText = `${i + 1}. ${answer}`;
        const lines = wrapText(questionText, width - margin * 2 - 8);

        const neededHeight = lines.length * 4.5 + 3;

        if (y + neededHeight > height - margin - 15) {
          newAnswerPage();
        }

        doc.text(lines, margin + 5, y);
        y += neededHeight;
      }

      y += 4;
    }
  }

  /* =========================================================
     PREVIEW
     ========================================================= */

  function updatePreview() {
    const settings = getSettings();

    const title = $("previewTitle");
    const type = $("previewType");
    const theme = $("previewTheme");
    const difficulty = $("previewDifficulty");
    const icon = $("previewIcon");

    if (title) {
      title.textContent = settings.title || "Buku Aktivitas Anak";
    }

    if (type) {
      type.textContent =
        `${ACTIVITY_ICONS[settings.type] || "📚"} ` +
        `${ACTIVITY_NAMES[settings.type] || settings.type}`;
    }

    if (theme) {
      theme.textContent =
        `${THEME_ICONS[settings.theme] || "🎨"} ` +
        `${THEME_NAMES[settings.theme] || settings.theme}`;
    }

    if (difficulty) {
      difficulty.textContent = [
        "Mudah",
        "Menengah",
        "Sulit"
      ][settings.difficulty - 1];
    }

    if (icon) {
      icon.textContent = THEME_ICONS[settings.theme] || "📚";
    }

    const count = $("previewPageCount");

    if (count) {
      count.textContent = `${settings.pages} halaman aktivitas`;
    }

    const agePreview = $("previewAge");

    if (agePreview) {
      agePreview.textContent = `Usia ${settings.age} tahun`;
    }
  }

  /* =========================================================
     GENERATE PDF
     ========================================================= */

  async function generatePDF() {
    if (state.isGenerating) return;

    let doc;

    try {
      const settings = getSettings();

      const JsPDF = getJsPDF();

      state.isGenerating = true;
      state.totalPages = settings.pages;
      state.currentPage = 1;
      state.questions = [];
      state.pagePlans = [];
      state.lastSettings = settings;

      cleanPreviousPDF();

      const button = $("generateBtn");

      if (button) {
        button.disabled = true;
        button.textContent = "Membuat PDF...";
      }

      setProgress(0, "Menyiapkan dokumen...");

      const format = settings.paperSize === "letter"
        ? "letter"
        : settings.paperSize === "a5"
          ? "a5"
          : "a4";

      doc = new JsPDF({
        orientation: "portrait",
        unit: "mm",
        format,
        compress: true
      });

      const bookSet = new Set();

      // Rencanakan semua halaman lebih dulu.
      for (let page = 1; page <= settings.pages; page++) {
        state.pagePlans.push(
          getPagePlan(settings, page, bookSet)
        );
      }

      // PERBAIKAN BUG HALAMAN KOSONG:
      // jsPDF sudah memiliki halaman pertama.
      // Sampul digambar pada halaman pertama, bukan halaman baru.
      if (settings.cover) {
        drawCover(doc, settings);
      }

      for (let page = 1; page <= settings.pages; page++) {
        // Jika ada sampul, setiap aktivitas memakai halaman baru.
        // Tanpa sampul, aktivitas pertama menggunakan halaman awal.
        if (settings.cover || page > 1) {
          doc.addPage();
        }

        drawActivityPage(doc, settings, page);

        const percent = Math.round((page / settings.pages) * 90);

        setProgress(
          percent,
          `Membuat halaman ${page} dari ${settings.pages}...`
        );

        // Beri kesempatan browser memperbarui tampilan.
        if (page % 5 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      setProgress(93, "Menyusun kunci jawaban...");

      drawAnswerPages(doc, settings);

      setProgress(97, "Menyiapkan file PDF...");

      const blob = doc.output("blob");

      state.pdfBlob = blob;
      state.pdfUrl = URL.createObjectURL(blob);

      const downloadButton = $("downloadBtn");

      if (downloadButton) {
        downloadButton.disabled = false;
        downloadButton.onclick = downloadPDF;
      }

      const previewFrame = $("pdfPreview");

      if (previewFrame) {
        previewFrame.src = state.pdfUrl;
      }

      const result = $("resultContainer");

      if (result) {
        result.classList.remove("hidden");
      }

      const pageCountElement = $("resultPageCount");

      if (pageCountElement) {
        pageCountElement.textContent =
          `${settings.pages} halaman aktivitas` +
          `${settings.cover ? " + sampul" : ""}` +
          `${settings.answers && Object.keys(state.questions).length ? " + kunci jawaban" : ""}`;
      }

      setProgress(100, "PDF berhasil dibuat!");

      showToast("PDF berhasil dibuat!", "success");

      setTimeout(hideProgress, 1500);
    } catch (error) {
      console.error("Gagal membuat PDF:", error);

      showToast(
        `Gagal membuat PDF: ${error.message || "Kesalahan tidak diketahui"}`,
        "error"
      );

      hideProgress();
    } finally {
      state.isGenerating = false;

      const button = $("generateBtn");

      if (button) {
        button.disabled = false;
        button.textContent = "Buat PDF";
      }
    }
  }

  function downloadPDF() {
    if (!state.pdfBlob) {
      showToast("Buat PDF terlebih dahulu.", "error");
      return;
    }

    const settings = state.lastSettings || getSettings();

    const filename = (settings.title || "buku-aktivitas")
      .trim()
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80) || "buku-aktivitas";

    const link = document.createElement("a");

    link.href = state.pdfUrl;
    link.download = `${filename}.pdf`;

    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /* =========================================================
     MODE GELAP
     ========================================================= */

  function setupThemeToggle() {
    const button =
      $("themeToggle") ||
      $("darkModeToggle") ||
      $("toggleTheme");

    function applyTheme(dark) {
      document.body.classList.toggle("dark-mode", dark);
      document.documentElement.classList.toggle("dark-mode", dark);

      try {
        localStorage.setItem("kidsbook-dark-mode", dark ? "1" : "0");
      } catch (error) {
        console.warn("Preferensi tema tidak dapat disimpan.", error);
      }

      if (button) {
        button.textContent = dark ? "☀️" : "🌙";
        button.setAttribute(
          "aria-label",
          dark ? "Aktifkan mode terang" : "Aktifkan mode gelap"
        );
      }
    }

    let savedDark = false;

    try {
      savedDark = localStorage.getItem("kidsbook-dark-mode") === "1";
    } catch (error) {
      console.warn("Preferensi tema tidak dapat dibaca.", error);
    }

    applyTheme(savedDark);

    if (button) {
      button.addEventListener("click", () => {
        const isDark =
          document.body.classList.contains("dark-mode");

        applyTheme(!isDark);
      });
    }
  }

  /* =========================================================
     VORTEX STATUS
     ========================================================= */

  function updateVortexStatus() {
    const statusElement = $("vortexStatus");

    if (!statusElement) return;

    const tools = window.KidsBookTools;

    if (!tools || typeof tools.getStatus !== "function") {
      statusElement.textContent =
        "Vortex tidak ditemukan. Periksa tools.js.";
      return;
    }

    try {
      const status = tools.getStatus();

      statusElement.textContent =
        `${status.name || "Vortex"} • ` +
        `${status.mode || "Mode lokal"} • ` +
        `${status.imageMode || "Ilustrasi vektor tersedia"}`;
    } catch (error) {
      console.warn("Status Vortex tidak dapat dibaca:", error);

      statusElement.textContent = "Vortex tersedia dalam mode lokal.";
    }
  }

  /* =========================================================
     EVENT
     ========================================================= */

  function setupEvents() {
    const formIds = [
      "bookTitle",
      "bookType",
      "paperSize",
      "pageCount",
      "ageGroup",
      "theme",
      "difficulty",
      "includeCover",
      "includeAnswers"
    ];

    formIds.forEach(id => {
      const element = $(id);

      if (!element) return;

      element.addEventListener("input", updatePreview);
      element.addEventListener("change", updatePreview);
    });

    const generateButton = $("generateBtn");

    if (generateButton) {
      generateButton.addEventListener("click", event => {
        event.preventDefault();
        generatePDF();
      });
    }

    const downloadButton = $("downloadBtn");

    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.addEventListener("click", event => {
        event.preventDefault();
        downloadPDF();
      });
    }

    const previousButton =
      $("prevPageBtn") ||
      $("previousPageBtn");

    const nextButton = $("nextPageBtn");

    if (previousButton) {
      previousButton.addEventListener("click", () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          updatePageNavigation();
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        if (state.currentPage < state.totalPages) {
          state.currentPage++;
          updatePageNavigation();
        }
      });
    }
  }

  function updatePageNavigation() {
    const pageNumber = $("currentPageNumber");

    if (pageNumber) {
      pageNumber.textContent =
        `${state.currentPage} / ${state.totalPages}`;
    }

    const previousButton =
      $("prevPageBtn") ||
      $("previousPageBtn");

    const nextButton = $("nextPageBtn");

    if (previousButton) {
      previousButton.disabled = state.currentPage <= 1;
    }

    if (nextButton) {
      nextButton.disabled =
        state.currentPage >= state.totalPages;
    }
  }

  /* =========================================================
     INISIALISASI
     ========================================================= */

  function init() {
    setupEvents();
    setupThemeToggle();
    updatePreview();
    updateVortexStatus();

    console.info("[KidsBook Studio] app.js siap.");
    console.info(
      "[KidsBook Studio] Vortex:",
      window.KidsBookTools ? "tersambung" : "tidak ditemukan"
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

})();
