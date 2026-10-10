(function () {
  "use strict";

  // =====================================================
  // KIDSBOOK STUDIO
  // Versi perbaikan: 4.0.0
  // Tidak membutuhkan API berbayar.
  // =====================================================

  const $ = (id) => document.getElementById(id);

  const state = {
    currentPage: 1,
    totalPages: 0,
    questions: {},
    pagePlans: [],
    isGenerating: false,
    pdfBlob: null,
    pdfUrl: null,
    lastSettings: null,
    originalButtonHTML: null
  };

  const THEME_NAMES = {
    animals: "Hewan Lucu",
    space: "Luar Angkasa",
    ocean: "Dunia Laut",
    garden: "Kebun Ajaib",
    vehicles: "Kendaraan",
    shapes: "Bentuk dan Benda",
    dinosaurs: "Dinosaurus",
    fruits: "Buah-buahan"
  };

  const ACTIVITY_NAMES = {
    coloring: "Mewarnai",
    tracing: "Menebalkan Garis",
    math: "Matematika",
    puzzle: "Puzzle",
    counting: "Berhitung",
    drawing: "Menggambar",
    mixed: "Campuran"
  };

  const THEME_OBJECTS = {
    animals: ["Kucing", "Kelinci", "Kupu-kupu", "Ikan", "Kura-kura"],
    space: ["Roket", "Bintang", "Planet", "Bulan", "Astronaut"],
    ocean: ["Ikan", "Gurita", "Paus", "Kura-kura", "Kerang"],
    garden: ["Bunga", "Pohon", "Kupu-kupu", "Matahari", "Jamur"],
    vehicles: ["Mobil", "Bus", "Pesawat", "Kereta", "Kapal"],
    shapes: ["Lingkaran", "Segitiga", "Persegi", "Bintang", "Hati"],
    dinosaurs: ["Dinosaurus", "Telur Dinosaurus", "Gunung", "Pohon"],
    fruits: ["Apel", "Pisang", "Jeruk", "Semangka", "Stroberi"]
  };

  const EMOJI_THEMES = {
    animals: ["🐱", "🐰", "🦋", "🐟", "🐢"],
    space: ["🚀", "⭐", "🪐", "🌙", "👨‍🚀"],
    ocean: ["🐠", "🐙", "🐳", "🐢", "🐚"],
    garden: ["🌻", "🌳", "🦋", "☀️", "🍄"],
    vehicles: ["🚗", "🚌", "✈️", "🚂", "🚢"],
    shapes: ["⚪", "🔺", "🟦", "⭐", "❤️"],
    dinosaurs: ["🦕", "🥚", "🌋", "🌴"],
    fruits: ["🍎", "🍌", "🍊", "🍉", "🍓"]
  };

  const MATH_QUESTIONS = [
    { a: 1, b: 2, op: "+", answer: 3 },
    { a: 2, b: 3, op: "+", answer: 5 },
    { a: 4, b: 1, op: "+", answer: 5 },
    { a: 5, b: 2, op: "+", answer: 7 },
    { a: 6, b: 3, op: "+", answer: 9 },
    { a: 8, b: 1, op: "-", answer: 7 },
    { a: 7, b: 2, op: "-", answer: 5 },
    { a: 9, b: 4, op: "-", answer: 5 },
    { a: 10, b: 3, op: "-", answer: 7 },
    { a: 6, b: 2, op: "-", answer: 4 },
    { a: 2, b: 2, op: "×", answer: 4 },
    { a: 3, b: 2, op: "×", answer: 6 },
    { a: 4, b: 2, op: "×", answer: 8 },
    { a: 5, b: 2, op: "×", answer: 10 }
  ];

  const PUZZLES = [
    {
      question: "Hewan apa yang suka makan wortel?",
      answer: "Kelinci"
    },
    {
      question: "Benda apa yang bersinar pada malam hari?",
      answer: "Bintang"
    },
    {
      question: "Buah apa yang berwarna kuning dan panjang?",
      answer: "Pisang"
    },
    {
      question: "Kendaraan apa yang terbang di langit?",
      answer: "Pesawat"
    },
    {
      question: "Hewan laut apa yang memiliki delapan lengan?",
      answer: "Gurita"
    },
    {
      question: "Apa yang kita gunakan saat hujan?",
      answer: "Payung"
    },
    {
      question: "Apa yang tumbuh dari biji?",
      answer: "Tanaman"
    },
    {
      question: "Berapa jumlah sisi sebuah segitiga?",
      answer: "Tiga"
    },
    {
      question: "Benda apa yang menunjukkan waktu?",
      answer: "Jam"
    },
    {
      question: "Hewan apa yang menghasilkan susu?",
      answer: "Sapi"
    }
  ];

  // =====================================================
  // PENGATURAN
  // =====================================================

  function getSettings() {
    const title = $("bookTitle")?.value.trim() || "Buku Aktivitas Anak";

    return {
      title: title,
      type: $("bookType")?.value || "coloring",
      theme: $("theme")?.value || "animals",
      paperSize: $("paperSize")?.value || "a4",
      pages: Math.max(
        1,
        Math.min(1000, parseInt($("pageCount")?.value, 10) || 20)
      ),
      age: $("ageGroup")?.value || "3-5",
      difficulty: Math.max(
        1,
        Math.min(3, parseInt($("difficulty")?.value, 10) || 1)
      ),
      cover: $("includeCover")?.checked ?? true,
      answers: $("includeAnswers")?.checked ?? false
    };
  }

  function getPageType(settings, pageNumber) {
    if (settings.type !== "mixed") {
      return settings.type;
    }

    const types = ["coloring", "tracing", "math", "puzzle"];

    return types[(pageNumber - 1) % types.length];
  }

  function getObject(settings, pageNumber) {
    const objects = THEME_OBJECTS[settings.theme] || THEME_OBJECTS.animals;

    return objects[(pageNumber - 1) % objects.length];
  }

  function getEmoji(settings, pageNumber) {
    const emojis = EMOJI_THEMES[settings.theme] || EMOJI_THEMES.animals;

    return emojis[(pageNumber - 1) % emojis.length];
  }

  // =====================================================
  // PESAN DAN PROGRES
  // =====================================================

  let toastTimer = null;

  function showToast(message, duration = 3000) {
    const toast = $("toast");

    if (!toast) {
      console.log(message);
      return;
    }

    toast.textContent = message;
    toast.classList.add("show");

    clearTimeout(toastTimer);

    toastTimer = setTimeout(() => {
      toast.classList.remove("show");
    }, duration);
  }

  function setProgress(percent, message) {
    const wrap = $("progressWrap");
    const bar = $("progressBar");
    const text = $("progressText");
    const percentage = $("progressPercent");
    const note = $("progressNote");

    if (wrap) {
      wrap.hidden = false;
      wrap.style.display = "";
    }

    const value = Math.max(0, Math.min(100, percent));

    if (bar) {
      bar.style.width = value + "%";
      bar.setAttribute("aria-valuenow", String(value));
    }

    if (text) {
      text.textContent = message || "Sedang memproses...";
    }

    if (percentage) {
      percentage.textContent = Math.round(value) + "%";
    }

    if (note) {
      note.textContent = message || "";
    }
  }

  function hideProgress() {
    const wrap = $("progressWrap");

    if (wrap) {
      wrap.hidden = true;
      wrap.style.display = "none";
    }
  }

  function showResult(message) {
    const box = $("resultBox");
    const text = $("resultText");

    if (box) {
      box.hidden = false;
      box.style.display = "";
    }

    if (text) {
      text.textContent = message;
    }
  }

  // =====================================================
  // UTILITAS PDF
  // =====================================================

  function getJsPDF() {
    if (window.jspdf && window.jspdf.jsPDF) {
      return window.jspdf.jsPDF;
    }

    if (window.jsPDF) {
      return window.jsPDF;
    }

    throw new Error(
      "Library jsPDF belum tersedia. Periksa koneksi internet dan script CDN."
    );
  }

  function createPDF(settings) {
    const jsPDF = getJsPDF();

    const format = settings.paperSize.toLowerCase() === "letter"
      ? "letter"
      : "a4";

    return new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: format,
      compress: true
    });
  }

  function getDimensions(doc) {
    return {
      width: doc.internal.pageSize.getWidth(),
      height: doc.internal.pageSize.getHeight(),
      margin: 12
    };
  }

  function setInk(doc, gray = 0) {
    doc.setDrawColor(gray, gray, gray);
    doc.setTextColor(gray, gray, gray);
  }

  function safeText(doc, text, x, y, options = {}) {
    doc.text(String(text ?? ""), x, y, options);
  }

  function getWrappedText(doc, text, maxWidth) {
    return doc.splitTextToSize(String(text ?? ""), maxWidth);
  }

  // =====================================================
  // ILUSTRASI VEKTOR PDF
  // Menggunakan bentuk jsPDF agar tidak bergantung pada
  // fungsi SVG yang tidak kompatibel dengan versi tools.js.
  // =====================================================

  function drawStar(doc, cx, cy, outerRadius, innerRadius) {
    const points = [];

    for (let i = 0; i < 10; i++) {
      const angle = -Math.PI / 2 + (Math.PI * i) / 5;
      const radius = i % 2 === 0 ? outerRadius : innerRadius;

      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius
      });
    }

    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];

      doc.line(
        points[i].x,
        points[i].y,
        next.x,
        next.y
      );
    }
  }

  function drawObject(doc, settings, x, y, width, height, pageNumber) {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const size = Math.min(width, height);
    const r = size * 0.24;
    const object = getObject(settings, pageNumber);
    const theme = settings.theme;

    doc.setDrawColor(35, 35, 35);
    doc.setLineWidth(0.9);

    if (theme === "space") {
      // Roket
      doc.ellipse(cx, cy, r * 0.55, r * 1.1, "S");
      doc.triangle(
        cx - r * 0.55, cy - r * 0.65,
        cx + r * 0.55, cy - r * 0.65,
        cx, cy - r * 1.5,
        "S"
      );

      doc.circle(cx, cy - r * 0.15, r * 0.22, "S");

      doc.line(cx - r * 0.45, cy + r * 0.35, cx - r * 0.9, cy + r * 0.8);
      doc.line(cx + r * 0.45, cy + r * 0.35, cx + r * 0.9, cy + r * 0.8);

      doc.line(cx - r * 0.2, cy + r * 1.05, cx, cy + r * 1.45);
      doc.line(cx + r * 0.2, cy + r * 1.05, cx, cy + r * 1.45);

      drawStar(doc, cx - r * 1.4, cy - r, r * 0.35, r * 0.15);
      drawStar(doc, cx + r * 1.3, cy + r * 0.8, r * 0.3, r * 0.12);

    } else if (theme === "ocean") {
      // Ikan
      doc.ellipse(cx, cy, r * 1.1, r * 0.65, "S");

      doc.triangle(
        cx - r * 0.9, cy,
        cx - r * 1.6, cy - r * 0.5,
        cx - r * 1.6, cy + r * 0.5,
        "S"
      );

      doc.circle(cx + r * 0.55, cy - r * 0.12, r * 0.07, "S");

      doc.line(cx + r * 0.1, cy + r * 0.1, cx + r * 0.5, cy + r * 0.35);
      doc.line(cx + r * 0.5, cy + r * 0.35, cx + r * 0.1, cy + r * 0.55);

      doc.circle(cx - r * 0.2, cy + r, r * 0.08, "S");
      doc.circle(cx + r * 0.25, cy + r * 1.25, r * 0.06, "S");

    } else if (theme === "vehicles") {
      // Mobil
      doc.roundedRect(
        cx - r * 1.3,
        cy - r * 0.15,
        r * 2.6,
        r * 0.8,
        2,
        2,
        "S"
      );

      doc.line(cx - r * 0.8, cy - r * 0.15, cx - r * 0.35, cy - r * 0.8);
      doc.line(cx - r * 0.35, cy - r * 0.8, cx + r * 0.55, cy - r * 0.8);
      doc.line(cx + r * 0.55, cy - r * 0.8, cx + r * 0.95, cy - r * 0.15);

      doc.circle(cx - r * 0.75, cy + r * 0.7, r * 0.24, "S");
      doc.circle(cx + r * 0.75, cy + r * 0.7, r * 0.24, "S");

    } else if (theme === "garden") {
      // Bunga
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI * 2 * i) / 6;

        doc.circle(
          cx + Math.cos(angle) * r * 0.7,
          cy + Math.sin(angle) * r * 0.7,
          r * 0.35,
          "S"
        );
      }

      doc.circle(cx, cy, r * 0.38, "S");
      doc.line(cx, cy + r, cx, cy + r * 2);

      doc.line(cx, cy + r * 1.5, cx - r * 0.6, cy + r * 1.15);
      doc.line(cx - r * 0.6, cy + r * 1.15, cx - r * 0.1, cy + r * 1.8);

      doc.line(cx, cy + r * 1.6, cx + r * 0.6, cy + r * 1.25);
      doc.line(cx + r * 0.6, cy + r * 1.25, cx + r * 0.15, cy + r * 1.9);

    } else if (theme === "shapes") {
      // Bentuk geometris
      doc.circle(cx - r * 0.6, cy - r * 0.3, r * 0.55, "S");

      doc.triangle(
        cx + r * 0.2, cy - r * 0.8,
        cx + r * 1.2, cy + r * 0.8,
        cx - r * 0.5, cy + r * 0.8,
        "S"
      );

      doc.rect(cx - r * 0.4, cy + r * 1.1, r * 0.8, r * 0.8, "S");

    } else if (theme === "fruits") {
      // Apel
      doc.ellipse(cx, cy, r * 0.9, r * 0.95, "S");
      doc.line(cx, cy - r * 0.9, cx + r * 0.15, cy - r * 1.4);

      doc.ellipse(
        cx + r * 0.42,
        cy - r * 1.3,
        r * 0.35,
        r * 0.15,
        "S"
      );

      doc.line(cx - r * 0.15, cy - r * 0.3, cx - r * 0.15, cy + r * 0.3);

    } else if (theme === "dinosaurs") {
      // Dinosaurus sederhana
      doc.ellipse(cx, cy + r * 0.3, r * 1.0, r * 0.65, "S");

      doc.circle(cx + r * 0.85, cy - r * 0.45, r * 0.38, "S");

      doc.line(cx - r * 0.5, cy + r * 0.75, cx - r * 0.6, cy + r * 1.2);
      doc.line(cx + r * 0.35, cy + r * 0.75, cx + r * 0.45, cy + r * 1.2);

      doc.line(cx - r * 0.9, cy + r * 0.3, cx - r * 1.5, cy + r * 0.05);

      doc.circle(cx + r * 0.95, cy - r * 0.52, r * 0.045, "F");

    } else {
      // Hewan lucu: kepala, telinga, mata, mulut
      doc.circle(cx, cy, r, "S");

      doc.circle(cx - r * 0.7, cy - r * 0.75, r * 0.38, "S");
      doc.circle(cx + r * 0.7, cy - r * 0.75, r * 0.38, "S");

      doc.circle(cx - r * 0.33, cy - r * 0.1, r * 0.06, "F");
      doc.circle(cx + r * 0.33, cy - r * 0.1, r * 0.06, "F");

      doc.line(cx - r * 0.12, cy + r * 0.2, cx + r * 0.12, cy + r * 0.2);
      doc.line(cx, cy + r * 0.2, cx, cy + r * 0.38);
      doc.line(cx, cy + r * 0.38, cx - r * 0.18, cy + r * 0.47);
      doc.line(cx, cy + r * 0.38, cx + r * 0.18, cy + r * 0.47);

      doc.line(cx - r * 0.85, cy + r * 0.2, cx - r * 1.35, cy + r * 0.1);
      doc.line(cx - r * 0.85, cy + r * 0.35, cx - r * 1.35, cy + r * 0.4);

      doc.line(cx + r * 0.85, cy + r * 0.2, cx + r * 1.35, cy + r * 0.1);
      doc.line(cx + r * 0.85, cy + r * 0.35, cx + r * 1.35, cy + r * 0.4);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);

    safeText(
      doc,
      object,
      cx,
      y + height - 3,
      { align: "center" }
    );

    doc.setTextColor(0, 0, 0);
  }

  function drawPageHeader(doc, settings, pageNumber, activityName) {
    const d = getDimensions(doc);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);

    safeText(doc, settings.title, d.margin, 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    safeText(
      doc,
      activityName,
      d.width - d.margin,
      13,
      { align: "right" }
    );

    doc.setDrawColor(160, 160, 160);
    doc.line(d.margin, 17, d.width - d.margin, 17);
  }

  function drawPageFooter(doc, pageNumber) {
    const d = getDimensions(doc);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    doc.setDrawColor(190, 190, 190);
    doc.line(
      d.margin,
      d.height - 12,
      d.width - d.margin,
      d.height - 12
    );

    safeText(
      doc,
      "Halaman " + pageNumber,
      d.width / 2,
      d.height - 6,
      { align: "center" }
    );
  }

  // =====================================================
  // HALAMAN SAMPUL
  // =====================================================

  function drawCover(doc, settings) {
    const d = getDimensions(doc);
    const cx = d.width / 2;

    doc.setDrawColor(60, 60, 60);
    doc.setLineWidth(1.1);

    doc.roundedRect(
      12,
      12,
      d.width - 24,
      d.height - 24,
      5,
      5,
      "S"
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(25);

    const titleLines = getWrappedText(
      doc,
      settings.title,
      d.width - 40
    );

    let titleY = 42;

    titleLines.forEach((line) => {
      safeText(doc, line, cx, titleY, { align: "center" });
      titleY += 11;
    });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(13);

    safeText(
      doc,
      "BUKU AKTIVITAS ANAK",
      cx,
      titleY + 4,
      { align: "center" }
    );

    drawObject(
      doc,
      settings,
      cx - 45,
      titleY + 20,
      90,
      95,
      1
    );

    doc.setFontSize(12);

    safeText(
      doc,
      "Tema: " + (THEME_NAMES[settings.theme] || settings.theme),
      cx,
      d.height - 45,
      { align: "center" }
    );

    safeText(
      doc,
      "Usia: " + settings.age + " tahun",
      cx,
      d.height - 36,
      { align: "center" }
    );

    safeText(
      doc,
      "Selamat belajar dan berkreasi!",
      cx,
      d.height - 25,
      { align: "center" }
    );
  }

  // =====================================================
  // SOAL
  // =====================================================

  function createMathQuestion(index, settings) {
    const difficulty = settings.difficulty || 1;
    const age = settings.age || "3-5";

    if (window.ActivityEngine &&
        typeof window.ActivityEngine.makeMathQuestion === "function") {
      try {
        const result = window.ActivityEngine.makeMathQuestion(
          { difficulty: difficulty, age: age },
          index,
          []
        );

        if (result && result.question != null) {
          return {
            question: String(result.question),
            answer: String(result.answer ?? ""),
            options: result.options || []
          };
        }
      } catch (error) {
        console.warn("Menggunakan soal matematika lokal.", error);
      }
    }

    let pool = MATH_QUESTIONS;

    if (difficulty === 2) {
      pool = MATH_QUESTIONS.filter((q) => q.a <= 10 && q.b <= 5);
    }

    if (difficulty === 3) {
      const a = 10 + (index % 10);
      const b = 2 + (index % 8);
      const useAddition = index % 2 === 0;

      return {
        question: useAddition
          ? a + " + " + b + " = ..."
          : a + " - " + b + " = ...",
        answer: String(useAddition ? a + b : a - b)
      };
    }

    const q = pool[index % pool.length];

    return {
      question: q.a + " " + q.op + " " + q.b + " = ...",
      answer: String(q.answer)
    };
  }

  function createPuzzleQuestion(index) {
    if (window.ActivityEngine &&
        typeof window.ActivityEngine.makePuzzleQuestion === "function") {
      try {
        const result = window.ActivityEngine.makePuzzleQuestion(index, []);

        if (result && result.question != null) {
          return {
            question: String(result.question),
            answer: String(result.answer ?? "")
          };
        }
      } catch (error) {
        console.warn("Menggunakan puzzle lokal.", error);
      }
    }

    const puzzle = PUZZLES[index % PUZZLES.length];

    return {
      question: puzzle.question,
      answer: puzzle.answer
    };
  }

  // =====================================================
  // HALAMAN MEWARNAI
  // =====================================================

  function drawColoringPage(doc, settings, pageNumber) {
    const d = getDimensions(doc);

    drawPageHeader(
      doc,
      settings,
      pageNumber,
      "Aktivitas Mewarnai"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    safeText(
      doc,
      "Warnailah gambar berikut sesuai kreativitasmu!",
      d.width / 2,
      28,
      { align: "center" }
    );

    doc.setDrawColor(210, 210, 210);

    doc.roundedRect(
      18,
      35,
      d.width - 36,
      d.height - 63,
      3,
      3,
      "S"
    );

    drawObject(
      doc,
      settings,
      28,
      48,
      d.width - 56,
      d.height - 100,
      pageNumber
    );

    drawPageFooter(doc, pageNumber);
  }

  // =====================================================
  // HALAMAN MENEBALKAN GARIS
  // =====================================================

  function drawTracingPage(doc, settings, pageNumber) {
    const d = getDimensions(doc);

    drawPageHeader(
      doc,
      settings,
      pageNumber,
      "Menebalkan Garis"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    safeText(
      doc,
      "Ikuti garis putus-putus menggunakan pensil!",
      d.width / 2,
      28,
      { align: "center" }
    );

    const cx = d.width / 2;
    const startY = 48;

    doc.setDrawColor(110, 110, 110);
    doc.setLineWidth(1);

    if (typeof doc.setLineDashPattern === "function") {
      doc.setLineDashPattern([3, 3], 0);
    }

    // Garis lurus
    for (let i = 0; i < 5; i++) {
      const y = startY + i * 18;

      doc.line(30, y, d.width - 30, y);
    }

    // Bentuk sederhana
    doc.circle(cx, startY + 125, 28, "S");

    doc.rect(
      cx - 28,
      startY + 170,
      56,
      48,
      "S"
    );

    doc.triangle(
      cx,
      startY + 235,
      cx - 32,
      startY + 290,
      cx + 32,
      startY + 290,
      "S"
    );

    if (typeof doc.setLineDashPattern === "function") {
      doc.setLineDashPattern([], 0);
    }

    drawPageFooter(doc, pageNumber);
  }

  // =====================================================
  // HALAMAN MATEMATIKA
  // =====================================================

  function drawMathPage(doc, settings, pageNumber) {
    const d = getDimensions(doc);

    drawPageHeader(
      doc,
      settings,
      pageNumber,
      "Matematika"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    safeText(
      doc,
      "Selesaikan soal-soal berikut!",
      d.margin,
      29
    );

    const questions = [];

    const top = 40;
    const rowHeight = Math.min(
      25,
      (d.height - 65) / 8
    );

    for (let i = 0; i < 8; i++) {
      const q = createMathQuestion(
        (pageNumber - 1) * 8 + i,
        settings
      );

      questions.push(q);

      const y = top + i * rowHeight;

      doc.setDrawColor(200, 200, 200);

      doc.roundedRect(
        d.margin,
        y,
        d.width - d.margin * 2,
        rowHeight - 3,
        2,
        2,
        "S"
      );

      doc.setFont("helvetica", "normal");
      doc.setFontSize(13);

      safeText(
        doc,
        (i + 1) + ". " + q.question,
        d.margin + 5,
        y + 10
      );

      doc.line(
        d.width - d.margin - 35,
        y + 13,
        d.width - d.margin - 5,
        y + 13
      );
    }

    state.questions[pageNumber] = {
      type: "math",
      questions: questions
    };

    drawPageFooter(doc, pageNumber);
  }

  // =====================================================
  // HALAMAN PUZZLE
  // =====================================================

  function drawPuzzlePage(doc, settings, pageNumber) {
    const d = getDimensions(doc);

    drawPageHeader(
      doc,
      settings,
      pageNumber,
      "Puzzle dan Tebak-tebakan"
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);

    safeText(
      doc,
      "Bacalah pertanyaan dan tulis jawabanmu!",
      d.margin,
      29
    );

    const questions = [];
    const top = 39;
    const rowHeight = Math.min(
      48,
      (d.height - 65) / 5
    );

    for (let i = 0; i < 5; i++) {
      const q = createPuzzleQuestion(
        (pageNumber - 1) * 5 + i
      );

      questions.push(q);

      const y = top + i * rowHeight;

      doc.setDrawColor(200, 200, 200);

      doc.roundedRect(
        d.margin,
        y,
        d.width - d.margin * 2,
        rowHeight - 3,
        2,
        2,
        "S"
      );

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      const questionLines = getWrappedText(
        doc,
        (i + 1) + ". " + q.question,
        d.width - d.margin * 2 - 10
      );

      questionLines.forEach((line, lineIndex) => {
        safeText(
          doc,
          line,
          d.margin + 5,
          y + 8 + lineIndex * 5
        );
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      safeText(
        doc,
        "Jawaban: __________________________",
        d.margin + 5,
        y + rowHeight - 10
      );
    }

    state.questions[pageNumber] = {
      type: "puzzle",
      questions: questions
    };

    drawPageFooter(doc, pageNumber);
  }

  // =====================================================
  // HALAMAN CAMPURAN
  // =====================================================

  function drawActivityPage(doc, settings, pageNumber) {
    const type = getPageType(settings, pageNumber);

    if (type === "tracing") {
      drawTracingPage(doc, settings, pageNumber);
    } else if (type === "math" || type === "counting") {
      drawMathPage(doc, settings, pageNumber);
    } else if (type === "puzzle") {
      drawPuzzlePage(doc, settings, pageNumber);
    } else {
      drawColoringPage(doc, settings, pageNumber);
    }
  }

  // =====================================================
  // KUNCI JAWABAN
  // =====================================================

  function drawAnswerPages(doc, settings) {
    const d = getDimensions(doc);
    const entries = [];

    Object.keys(state.questions).forEach((pageKey) => {
      const data = state.questions[pageKey];

      if (!data || !Array.isArray(data.questions)) {
        return;
      }

      data.questions.forEach((q, index) => {
        entries.push({
          page: Number(pageKey),
          index: index + 1,
          question: q.question,
          answer: q.answer
        });
      });
    });

    if (entries.length === 0) {
      return;
    }

    doc.addPage();

    let y = 25;

    function drawAnswerHeader() {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(17);

      safeText(
        doc,
        "Kunci Jawaban",
        d.width / 2,
        15,
        { align: "center" }
      );

      doc.setDrawColor(170, 170, 170);
      doc.line(12, 19, d.width - 12, 19);
    }

    drawAnswerHeader();

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    entries.forEach((entry) => {
      const text =
        "Halaman " + entry.page +
        " — Soal " + entry.index +
        ": " + entry.answer;

      const lines = getWrappedText(
        doc,
        text,
        d.width - 28
      );

      const neededHeight = lines.length * 5 + 5;

      if (y + neededHeight > d.height - 18) {
        doc.addPage();
        y = 25;
        drawAnswerHeader();

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
      }

      lines.forEach((line) => {
        safeText(doc, line, 14, y);
        y += 5;
      });

      y += 3;
    });
  }

  // =====================================================
  // RENCANA HALAMAN
  // =====================================================

  function buildPagePlans(settings) {
    const plans = [];

    for (let page = 1; page <= settings.pages; page++) {
      const activity = getPageType(settings, page);

      let plan = {
        pageNumber: page,
        theme: settings.theme,
        activity: activity,
        type: activity,
        object: getObject(settings, page),
        age: settings.age,
        difficulty: settings.difficulty
      };

      if (
        window.KidsBookTools &&
        typeof window.KidsBookTools.createPagePlan === "function"
      ) {
        try {
          const generated = window.KidsBookTools.createPagePlan(
            {
              theme: settings.theme,
              activity: activity,
              type: activity,
              age: settings.age,
              difficulty: settings.difficulty,
              pages: settings.pages
            },
            page,
            plans
          );

          if (generated && typeof generated === "object") {
            plan = Object.assign({}, plan, generated, {
              pageNumber: page,
              activity: activity,
              type: activity
            });
          }
        } catch (error) {
          console.warn(
            "Rencana halaman menggunakan pengaturan lokal.",
            error
          );
        }
      }

      plans.push(plan);
    }

    return plans;
  }

  // =====================================================
  // GENERATOR PDF
  // =====================================================

  async function generatePDF() {
    if (state.isGenerating) {
      return;
    }

    const settings = getSettings();
    const button = $("generateBtn");

    state.isGenerating = true;
    state.lastSettings = settings;
    state.currentPage = 1;
    state.totalPages = settings.pages;
    state.questions = {};
    state.pagePlans = [];

    if (button) {
      state.originalButtonHTML = button.innerHTML;
      button.disabled = true;
      button.textContent = "Membuat PDF...";
    }

    if ($("downloadBtn")) {
      $("downloadBtn").disabled = true;
    }

    setProgress(0, "Menyiapkan buku aktivitas...");

    try {
      const doc = createPDF(settings);

      state.pagePlans = buildPagePlans(settings);

      // Sampul
      if (settings.cover) {
        drawCover(doc, settings);
      }

      // Halaman aktivitas
      for (let page = 1; page <= settings.pages; page++) {
        if (settings.cover || page > 1) {
          doc.addPage();
        }

        drawActivityPage(doc, settings, page);

        const percent = Math.round(
          (page / settings.pages) * 85
        );

        setProgress(
          percent,
          "Membuat halaman " + page + " dari " + settings.pages
        );

        // Memberi kesempatan browser memperbarui tampilan,
        // terutama pada HP dengan memori terbatas.
        if (page % 5 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }

      if (settings.answers) {
        setProgress(90, "Menyusun kunci jawaban...");
        drawAnswerPages(doc, settings);
      }

      setProgress(96, "Menyimpan dokumen PDF...");

      const blob = doc.output("blob");

      if (!(blob instanceof Blob) || blob.size === 0) {
        throw new Error("PDF kosong. Silakan coba lagi.");
      }

      if (state.pdfUrl) {
        URL.revokeObjectURL(state.pdfUrl);
      }

      state.pdfBlob = blob;
      state.pdfUrl = URL.createObjectURL(blob);

      setProgress(100, "PDF berhasil dibuat!");

      updatePreview();
      updatePageNavigation();

      if ($("downloadBtn")) {
        $("downloadBtn").disabled = false;
      }

      showResult(
        "Berhasil! Buku \"" + settings.title +
        "\" sudah dibuat. " +
        settings.pages + " halaman aktivitas" +
        (settings.cover ? " + sampul" : "") +
        (settings.answers ? " + kunci jawaban" : "") +
        ". Ukuran file: " + formatBytes(blob.size) + "."
      );

      showToast("PDF berhasil dibuat! 🎉");

      setTimeout(hideProgress, 1800);

    } catch (error) {
      console.error("Gagal membuat PDF:", error);

      hideProgress();

      showResult(
        "PDF gagal dibuat: " +
        (error && error.message ? error.message : "Kesalahan tidak diketahui") +
        ". Periksa koneksi internet, lalu coba lagi."
      );

      showToast("Gagal membuat PDF. Periksa pesan hasil.");

    } finally {
      state.isGenerating = false;

      if (button) {
        button.disabled = false;

        if (state.originalButtonHTML !== null) {
          button.innerHTML = state.originalButtonHTML;
        } else {
          button.textContent = "Buat PDF";
        }
      }
    }
  }

  function formatBytes(bytes) {
    if (bytes < 1024) {
      return bytes + " B";
    }

    if (bytes < 1024 * 1024) {
      return (bytes / 1024).toFixed(1) + " KB";
    }

    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  // =====================================================
  // DOWNLOAD PDF
  // =====================================================

  function downloadPDF() {
    if (!state.pdfBlob) {
      showToast("Buat PDF terlebih dahulu.");
      return;
    }

    const settings = state.lastSettings || getSettings();

    const safeName = settings.title
      .replace(/[\\/:*?"<>|]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 80) || "buku-aktivitas-anak";

    const url = state.pdfUrl || URL.createObjectURL(state.pdfBlob);
    const link = document.createElement("a");

    link.href = url;
    link.download = safeName + ".pdf";

    document.body.appendChild(link);
    link.click();
    link.remove();

    showToast("Unduhan PDF dimulai.");

    // Jangan revoke URL langsung karena beberapa browser HP
    // memerlukan waktu untuk mulai mengunduh file.
  }

  // =====================================================
  // PREVIEW
  // =====================================================

  function updatePreview() {
    const settings = getSettings();
    const page = Math.max(
      1,
      Math.min(state.currentPage, settings.pages)
    );

    state.currentPage = page;

    const activity = getPageType(settings, page);
    const object = getObject(settings, page);
    const emoji = getEmoji(settings, page);

    const previewTitle = $("previewTitle");
    const previewInstruction = $("previewInstruction");
    const previewIllustration = $("previewIllustration");
    const previewPageNo = $("previewPageNo");
    const previewCounter = $("previewCounter");
    const paperLabel = $("paperLabel");
    const difficultyValue = $("difficultyValue");

    if (previewTitle) {
      previewTitle.textContent = settings.title;
    }

    if (previewInstruction) {
      const instructions = {
        coloring: "Warnai gambar sesuai kreativitasmu!",
        tracing: "Ikuti garis dan bentuk dengan pensil!",
        math: "Selesaikan soal matematika berikut!",
        counting: "Hitung dan tuliskan jawabannya!",
        puzzle: "Bacalah pertanyaan dan temukan jawabannya!",
        drawing: "Gambarlah sesuai imajinasimu!",
        mixed: "Ayo belajar sambil bermain!"
      };

      previewInstruction.textContent =
        instructions[activity] || instructions.coloring;
    }

    if (previewIllustration) {
      previewIllustration.textContent = emoji;
      previewIllustration.setAttribute("aria-label", object);

      previewIllustration.style.fontSize = "clamp(48px, 12vw, 100px)";
      previewIllustration.style.textAlign = "center";
      previewIllustration.style.display = "flex";
      previewIllustration.style.alignItems = "center";
      previewIllustration.style.justifyContent = "center";
      previewIllustration.style.minHeight = "140px";
    }

    if (previewPageNo) {
      previewPageNo.textContent = String(page);
    }

    if (previewCounter) {
      previewCounter.textContent =
        page + " / " + settings.pages;
    }

    if (paperLabel) {
      paperLabel.textContent =
        settings.paperSize.toUpperCase();
    }

    if (difficultyValue) {
      difficultyValue.textContent =
        String(settings.difficulty);
    }

    // Perbarui label tambahan hanya jika elemen memang ada.
    if ($("previewType")) {
      $("previewType").textContent =
        ACTIVITY_NAMES[activity] || activity;
    }

    if ($("previewTheme")) {
      $("previewTheme").textContent =
        THEME_NAMES[settings.theme] || settings.theme;
    }

    if ($("previewDifficulty")) {
      $("previewDifficulty").textContent =
        String(settings.difficulty);
    }

    if ($("previewIcon")) {
      $("previewIcon").textContent = emoji;
    }

    if ($("previewPageCount")) {
      $("previewPageCount").textContent =
        String(settings.pages);
    }

    if ($("previewAge")) {
      $("previewAge").textContent = settings.age;
    }

    updatePageNavigation();
  }

  function updatePageNavigation() {
    const settings = getSettings();

    const previous = $("prevPageBtn");
    const next = $("nextPageBtn");

    state.totalPages = settings.pages;

    if (previous) {
      previous.disabled = state.currentPage <= 1;
    }

    if (next) {
      next.disabled = state.currentPage >= settings.pages;
    }
  }

  function changePreviewPage(direction) {
    const settings = getSettings();

    state.currentPage = Math.max(
      1,
      Math.min(
        settings.pages,
        state.currentPage + direction
      )
    );

    updatePreview();
  }

  // =====================================================
  // MODE TERANG / GELAP
  // =====================================================

  function applyTheme(dark) {
    document.body.classList.toggle("light-theme", !dark);

    const button = $("themeToggle");

    if (!button) {
      return;
    }

    const icon = button.querySelector(".theme-icon");
    const label = button.querySelector(".theme-label");

    if (icon) {
      icon.textContent = dark ? "☀️" : "🌙";
    }

    if (label) {
      label.textContent = dark ? "Mode Terang" : "Mode Gelap";
    }

    button.setAttribute(
      "aria-label",
      dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"
    );

    button.setAttribute(
      "title",
      dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"
    );
  }

  function setupThemeToggle() {
    let dark = true;

    try {
      const saved = localStorage.getItem("kidsbook-dark-mode");

      if (saved === "0") {
        dark = false;
      } else if (saved === "1") {
        dark = true;
      }
    } catch (error) {
      console.warn("Preferensi tema tidak dapat dibaca.");
    }

    applyTheme(dark);

    const button = $("themeToggle");

    if (!button) {
      return;
    }

    button.addEventListener("click", () => {
      dark = !dark;
      applyTheme(dark);

      try {
        localStorage.setItem(
          "kidsbook-dark-mode",
          dark ? "1" : "0"
        );
      } catch (error) {
        console.warn("Preferensi tema tidak dapat disimpan.");
      }
    });
  }

  // =====================================================
  // INTEGRASI
  // =====================================================

  function updateVortexStatus() {
    const statusElement = $("vortexStatus");

    if (!statusElement) {
      return;
    }

    const integration = window.KidsBookVortexIntegration;

    if (integration) {
      statusElement.textContent = "Siap";
    } else {
      statusElement.textContent = "Mode lokal";
    }
  }

  // =====================================================
  // EVENT LISTENERS
  // =====================================================

  function setupEvents() {
    const form = $("settingsForm");

    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        generatePDF();
      });
    }

    const generateButton = $("generateBtn");

    if (generateButton) {
      generateButton.addEventListener("click", (event) => {
        if (
          generateButton.tagName === "BUTTON" &&
          generateButton.type === "submit" &&
          form
        ) {
          return;
        }

        event.preventDefault();
        generatePDF();
      });
    }

    const downloadButton = $("downloadBtn");

    if (downloadButton) {
      downloadButton.addEventListener("click", downloadPDF);
    }

    const previousButton = $("prevPageBtn");

    if (previousButton) {
      previousButton.addEventListener("click", () => {
        changePreviewPage(-1);
      });
    }

    const nextButton = $("nextPageBtn");

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        changePreviewPage(1);
      });
    }

    [
      "bookTitle",
      "bookType",
      "paperSize",
      "pageCount",
      "ageGroup",
      "theme",
      "difficulty",
      "includeCover",
      "includeAnswers"
    ].forEach((id) => {
      const element = $(id);

      if (!element) {
        return;
      }

      element.addEventListener("input", () => {
        if (id === "pageCount") {
          const settings = getSettings();

          state.currentPage = Math.min(
            state.currentPage,
            settings.pages
          );
        }

        updatePreview();
      });

      element.addEventListener("change", updatePreview);
    });

    const difficulty = $("difficulty");

    if (difficulty) {
      difficulty.addEventListener("input", () => {
        const output = $("difficultyValue");

        if (output) {
          output.textContent = difficulty.value;
        }
      });
    }
  }

  // =====================================================
  // MULAI APLIKASI
  // =====================================================

  function init() {
    setupEvents();
    setupThemeToggle();
    updatePreview();
    updateVortexStatus();

    if ($("downloadBtn")) {
      $("downloadBtn").disabled = true;
    }

    hideProgress();

    console.log("KidsBook Studio 4.0.0 siap.");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, {
      once: true
    });
  } else {
    init();
  }

})();
