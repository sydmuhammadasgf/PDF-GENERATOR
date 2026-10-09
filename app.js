/* =========================================
   KIDSBOOK STUDIO — APP.JS
   Generator buku aktivitas anak ke PDF
   ========================================= */

"use strict";

const $ = (id) => document.getElementById(id);

const state = {
  currentPage: 1,
  totalPages: 20,
  questions: [],
  isGenerating: false,
  pdfBlob: null,
  pdfUrl: null
};

const themeNames = {
  animals: "Hewan Lucu",
  space: "Luar Angkasa",
  ocean: "Dunia Laut",
  garden: "Kebun Ajaib",
  vehicles: "Kendaraan",
  shapes: "Bentuk dan Benda"
};

const activities = {
  coloring: {
    name: "Buku Mewarnai",
    instruction: "Warnai gambar sesuai imajinasimu!"
  },
  tracing: {
    name: "Latihan Menulis",
    instruction: "Ikuti garis dan tuliskan jawabanmu!"
  },
  math: {
    name: "Matematika",
    instruction: "Kerjakan soal berikut dengan teliti!"
  },
  puzzle: {
    name: "Teka-teki",
    instruction: "Amati petunjuk dan temukan jawabannya!"
  },
  mixed: {
    name: "Aktivitas Campuran",
    instruction: "Ayo belajar sambil bermain!"
  }
};

/* =========================================
   UTILITAS
   ========================================= */

function getSettings() {
  return {
    title: ($("bookTitle")?.value || "Petualangan Seru Anak").trim(),
    type: $("bookType")?.value || "coloring",
    paper: $("paperSize")?.value || "a4",
    pages: Math.max(
      1,
      Math.min(1000, Number($("pageCount")?.value) || 20)
    ),
    age: $("ageGroup")?.value || "6-8",
    theme: $("theme")?.value || "animals",
    difficulty: Number($("difficulty")?.value || 1),
    cover: $("includeCover")?.checked ?? true,
    answers: $("includeAnswers")?.checked ?? false
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[randomInt(0, array.length - 1)];
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

function getPageType(settings, pageNumber) {
  if (settings.type !== "mixed") {
    return settings.type;
  }

  const types = ["coloring", "tracing", "math", "puzzle"];
  return types[(pageNumber - 1) % types.length];
}

function getPageCount(settings) {
  return settings.pages;
}

/* =========================================
   BANK SOAL MATEMATIKA
   ========================================= */

function makeMathQuestion(settings, index) {
  const age = settings.age;
  const difficulty = settings.difficulty;

  let max = age === "3-5" ? 10 : age === "6-8" ? 50 : 100;
  max *= difficulty;

  let a;
  let b;
  let operator;
  let answer;

  if (difficulty === 1 || age === "3-5") {
    operator = randomChoice(["+", "-"]);

    if (operator === "+") {
      a = randomInt(0, Math.min(10, max));
      b = randomInt(0, Math.min(10, max - a));
      answer = a + b;
    } else {
      a = randomInt(1, Math.min(10, max));
      b = randomInt(0, a);
      answer = a - b;
    }
  } else {
    operator = randomChoice(["+", "-", "×"]);

    if (operator === "+") {
      a = randomInt(1, max);
      b = randomInt(1, max);
      answer = a + b;
    } else if (operator === "-") {
      a = randomInt(1, max);
      b = randomInt(0, a);
      answer = a - b;
    } else {
      const multiplicationLimit = age === "6-8" ? 10 : 12;
      a = randomInt(1, multiplicationLimit);
      b = randomInt(1, multiplicationLimit);
      answer = a * b;
    }
  }

  return {
    number: index + 1,
    question: `${a} ${operator} ${b} = ....`,
    answer
  };
}

function makePuzzleQuestion(index) {
  const puzzles = [
    {
      question: "Aku punya empat kaki, tetapi tidak bisa berjalan. Apakah aku?",
      answer: "Meja"
    },
    {
      question: "Benda apakah yang digunakan untuk melihat waktu?",
      answer: "Jam"
    },
    {
      question: "Apa yang muncul di langit setelah hujan dan terkena matahari?",
      answer: "Pelangi"
    },
    {
      question: "Aku bersinar pada malam hari dan terlihat di langit. Apakah aku?",
      answer: "Bintang"
    },
    {
      question: "Hewan apakah yang suka makan wortel dan memiliki telinga panjang?",
      answer: "Kelinci"
    },
    {
      question: "Apa yang digunakan untuk menulis di buku?",
      answer: "Pensil"
    },
    {
      question: "Aku hidup di air dan memiliki sirip. Siapakah aku?",
      answer: "Ikan"
    },
    {
      question: "Benda apakah yang melindungi kita ketika hujan?",
      answer: "Payung"
    }
  ];

  return {
    number: index + 1,
    ...puzzles[index % puzzles.length]
  };
}

/* =========================================
   ILUSTRASI VEKTOR
   Tidak memerlukan API gambar.
   ========================================= */

function drawIllustration(doc, settings, x, y, width, height, pageNumber) {
  const cx = x + width / 2;
  const cy = y + height / 2;

  doc.setDrawColor(35, 45, 60);
  doc.setLineWidth(1.5);

  const theme = settings.theme;

  if (theme === "space") {
    // Planet
    doc.circle(cx, cy, Math.min(width, height) * 0.19, "S");
    doc.ellipse(
      cx,
      cy,
      width * 0.34,
      height * 0.10,
      "S"
    );

    doc.circle(cx - width * 0.28, cy - height * 0.28, 3, "S");
    doc.circle(cx + width * 0.29, cy + height * 0.25, 2, "S");
    doc.circle(cx + width * 0.20, cy - height * 0.34, 2, "S");

  } else if (theme === "ocean") {
    // Ikan sederhana
    doc.ellipse(cx, cy, width * 0.23, height * 0.15, "S");

    doc.triangle(
      cx - width * 0.23,
      cy,
      cx - width * 0.36,
      cy - height * 0.12,
      cx - width * 0.36,
      cy + height * 0.12,
      "S"
    );

    doc.circle(cx + width * 0.13, cy - height * 0.02, 2, "S");

    doc.arc(
      cx,
      cy + height * 0.35,
      width * 0.10,
      0,
      180,
      "S"
    );

  } else if (theme === "vehicles") {
    // Mobil
    doc.roundedRect(
      cx - width * 0.30,
      cy - height * 0.08,
      width * 0.60,
      height * 0.20,
      5,
      5,
      "S"
    );

    doc.line(
      cx - width * 0.18,
      cy - height * 0.08,
      cx - width * 0.08,
      cy - height * 0.20
    );

    doc.line(
      cx - width * 0.08,
      cy - height * 0.20,
      cx + width * 0.12,
      cy - height * 0.20
    );

    doc.line(
      cx + width * 0.12,
      cy - height * 0.20,
      cx + width * 0.22,
      cy - height * 0.08
    );

    doc.circle(cx - width * 0.18, cy + height * 0.13, 5, "S");
    doc.circle(cx + width * 0.18, cy + height * 0.13, 5, "S");

  } else if (theme === "garden") {
    // Bunga
    const r = Math.min(width, height) * 0.10;

    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 * i) / 6;
      doc.circle(
        cx + Math.cos(angle) * r * 1.3,
        cy + Math.sin(angle) * r * 1.3,
        r,
        "S"
      );
    }

    doc.circle(cx, cy, r, "S");
    doc.line(cx, cy + r, cx, cy + height * 0.28);
    doc.ellipse(
      cx + width * 0.10,
      cy + height * 0.20,
      width * 0.10,
      height * 0.04,
      "S"
    );

  } else if (theme === "shapes") {
    // Bentuk geometri
    doc.circle(cx - width * 0.18, cy, width * 0.10, "S");

    doc.rect(
      cx + width * 0.06,
      cy - height * 0.10,
      width * 0.20,
      width * 0.20,
      "S"
    );

    doc.triangle(
      cx,
      cy + height * 0.30,
      cx - width * 0.13,
      cy + height * 0.50,
      cx + width * 0.13,
      cy + height * 0.50,
      "S"
    );

  } else {
    // Wajah hewan sederhana
    const r = Math.min(width, height) * 0.22;

    doc.circle(cx, cy, r, "S");

    doc.circle(
      cx - r * 0.70,
      cy - r * 0.85,
      r * 0.45,
      "S"
    );

    doc.circle(
      cx + r * 0.70,
      cy - r * 0.85,
      r * 0.45,
      "S"
    );

    doc.circle(cx - r * 0.35, cy - r * 0.10, 2, "S");
    doc.circle(cx + r * 0.35, cy - r * 0.10, 2, "S");

    doc.line(
      cx - r * 0.20,
      cy + r * 0.30,
      cx + r * 0.20,
      cy + r * 0.30
    );
  }

  // Ornamen kecil
  doc.setLineWidth(0.7);
  doc.circle(x + width * 0.12, y + height * 0.15, 3, "S");
  doc.circle(x + width * 0.85, y + height * 0.80, 4, "S");
}

/* =========================================
   KONTEN HALAMAN PDF
   ========================================= */

function drawPageHeader(doc, settings, pageNumber, pageWidth) {
  doc.setTextColor(40, 50, 65);
  doc.setDrawColor(190, 200, 210);
  doc.setLineWidth(0.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);

  doc.text("KIDSBOOK STUDIO", 15, 13);
  doc.text("AKTIVITAS ANAK", pageWidth - 15, 13, {
    align: "right"
  });

  doc.line(15, 17, pageWidth - 15, 17);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Nama: __________________________", 15, 25);

  doc.text(`Halaman ${pageNumber}`, pageWidth - 15, 25, {
    align: "right"
  });
}

function drawCover(doc, settings, pageWidth, pageHeight) {
  doc.setDrawColor(50, 70, 100);
  doc.setLineWidth(2);

  doc.roundedRect(
    12,
    12,
    pageWidth - 24,
    pageHeight - 24,
    6,
    6,
    "S"
  );

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(45, 65, 95);

  doc.text("KIDSBOOK STUDIO", pageWidth / 2, 35, {
    align: "center"
  });

  doc.setFontSize(25);

  const titleLines = doc.splitTextToSize(
    settings.title || "Petualangan Seru Anak",
    pageWidth - 35
  );

  doc.text(titleLines, pageWidth / 2, pageHeight * 0.25, {
    align: "center"
  });

  drawIllustration(
    doc,
    settings,
    pageWidth * 0.18,
    pageHeight * 0.36,
    pageWidth * 0.64,
    pageHeight * 0.32,
    1
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);

  doc.text(
    activities[settings.type]?.name || "Buku Aktivitas",
    pageWidth / 2,
    pageHeight * 0.78,
    { align: "center" }
  );

  doc.setFontSize(11);

  doc.text(
    `Usia ${settings.age} tahun`,
    pageWidth / 2,
    pageHeight * 0.83,
    { align: "center" }
  );

  doc.setFontSize(10);

  doc.text(
    "Belajar, berkreasi, dan bermain!",
    pageWidth / 2,
    pageHeight * 0.89,
    { align: "center" }
  );
}

function drawColoringPage(doc, settings, pageWidth, pageHeight, pageNumber) {
  drawPageHeader(doc, settings, pageNumber, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  doc.text(
    "Ayo Mewarnai!",
    pageWidth / 2,
    42,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    `Tema: ${themeNames[settings.theme] || "Hewan Lucu"}`,
    pageWidth / 2,
    51,
    { align: "center" }
  );

  const margin = 20;

  drawIllustration(
    doc,
    settings,
    margin,
    65,
    pageWidth - margin * 2,
    pageHeight * 0.52,
    pageNumber
  );

  doc.setFontSize(11);

  doc.text(
    "Gunakan warna favoritmu!",
    pageWidth / 2,
    pageHeight * 0.75,
    { align: "center" }
  );

  doc.setDrawColor(180, 190, 200);

  doc.roundedRect(
    margin,
    pageHeight * 0.80,
    pageWidth - margin * 2,
    pageHeight * 0.10,
    3,
    3,
    "S"
  );

  doc.setFontSize(10);

  doc.text(
    "Warna yang saya pilih:",
    margin + 5,
    pageHeight * 0.84
  );

  doc.line(
    margin + 5,
    pageHeight * 0.87,
    pageWidth - margin - 5,
    pageHeight * 0.87
  );
}

function drawTracingPage(doc, settings, pageWidth, pageHeight, pageNumber) {
  drawPageHeader(doc, settings, pageNumber, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  doc.text(
    "Ayo Berlatih Menulis!",
    pageWidth / 2,
    43,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    "Tebalkan huruf atau kata berikut.",
    pageWidth / 2,
    53,
    { align: "center" }
  );

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const letter = letters[(pageNumber - 1) % letters.length];

  doc.setTextColor(210, 210, 210);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(65);

  doc.text(
    letter,
    pageWidth / 2,
    pageHeight * 0.34,
    { align: "center" }
  );

  doc.setTextColor(50, 60, 75);
  doc.setFontSize(13);

  doc.text(
    `Huruf ${letter}`,
    pageWidth / 2,
    pageHeight * 0.43,
    { align: "center" }
  );

  for (let i = 0; i < 5; i++) {
    const y = pageHeight * 0.52 + i * 18;

    doc.setDrawColor(180, 190, 200);
    doc.setLineDashPattern([2, 2], 0);

    doc.line(20, y, pageWidth - 20, y);

    doc.setLineDashPattern([], 0);
  }

  doc.setFontSize(11);

  doc.text(
    "Tuliskan hurufmu dengan rapi.",
    pageWidth / 2,
    pageHeight * 0.82,
    { align: "center" }
  );
}

function drawMathPage(doc, settings, pageWidth, pageHeight, pageNumber) {
  drawPageHeader(doc, settings, pageNumber, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  doc.text(
    "Ayo Berhitung!",
    pageWidth / 2,
    43,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    "Kerjakan soal berikut.",
    pageWidth / 2,
    53,
    { align: "center" }
  );

  const questions = [];

  for (let i = 0; i < 8; i++) {
    questions.push(makeMathQuestion(settings, i));
  }

  state.questions[pageNumber] = questions;

  const startY = 75;
  const gap = Math.min(24, (pageHeight - 110) / questions.length);

  doc.setFontSize(14);

  questions.forEach((q, index) => {
    const y = startY + index * gap;

    doc.text(`${index + 1}.  ${q.question}`, 22, y);

    doc.setDrawColor(180, 190, 200);
    doc.line(pageWidth - 48, y + 2, pageWidth - 22, y + 2);
  });

  doc.setFontSize(10);

  doc.text(
    "Periksa kembali jawabanmu!",
    pageWidth / 2,
    pageHeight - 22,
    { align: "center" }
  );
}

function drawPuzzlePage(doc, settings, pageWidth, pageHeight, pageNumber) {
  drawPageHeader(doc, settings, pageNumber, pageWidth);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);

  doc.text(
    "Teka-teki Seru!",
    pageWidth / 2,
    43,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);

  doc.text(
    "Baca pertanyaan dan tuliskan jawabanmu.",
    pageWidth / 2,
    53,
    { align: "center" }
  );

  const puzzles = [];

  for (let i = 0; i < 4; i++) {
    puzzles.push(makePuzzleQuestion(pageNumber + i));
  }

  state.questions[pageNumber] = puzzles;

  let y = 82;

  puzzles.forEach((puzzle, index) => {
    const lines = doc.splitTextToSize(
      `${index + 1}. ${puzzle.question}`,
      pageWidth - 45
    );

    doc.text(lines, 22, y);

    y += lines.length * 6 + 10;

    doc.setDrawColor(180, 190, 200);
    doc.line(22, y, pageWidth - 22, y);

    y += 23;
  });
}

/* =========================================
   KUNCI JAWABAN
   ========================================= */

function drawAnswerPages(doc, settings, pageWidth, pageHeight) {
  if (!settings.answers || settings.type === "coloring" ||
      settings.type === "tracing") {
    return;
  }

  const answerEntries = Object.entries(state.questions);

  if (answerEntries.length === 0) {
    return;
  }

  doc.addPage();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);

  doc.text(
    "KUNCI JAWABAN",
    pageWidth / 2,
    25,
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  let y = 40;

  for (const [pageNumber, items] of answerEntries) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 25;
    }

    doc.setFont("helvetica", "bold");

    doc.text(`Halaman aktivitas ${pageNumber}`, 15, y);

    doc.setFont("helvetica", "normal");

    y += 7;

    items.forEach((item, index) => {
      const answer = item.answer;

      const text = answer !== undefined
        ? `${index + 1}. ${answer}`
        : `${index + 1}. ${item.question} — ${item.answer}`;

      doc.text(text, 20, y);

      y += 6;

      if (y > pageHeight - 20) {
        doc.addPage();
        y = 25;
      }
    });

    y += 5;
  }
}

/* =========================================
   PRATINJAU WEBSITE
   ========================================= */

function updatePreview() {
  const settings = getSettings();

  state.totalPages = getPageCount(settings);

  state.currentPage = Math.min(
    Math.max(1, state.currentPage),
    state.totalPages
  );

  const pageType = getPageType(settings, state.currentPage);

  if ($("previewTitle")) {
    $("previewTitle").textContent =
      state.currentPage === 1 && settings.cover
        ? settings.title
        : activities[pageType]?.name || settings.title;
  }

  if ($("previewInstruction")) {
    $("previewInstruction").textContent =
      activities[pageType]?.instruction || "";
  }

  if ($("previewCounter")) {
    $("previewCounter").textContent =
      `${state.currentPage} / ${state.totalPages}`;
  }

  if ($("previewPageNo")) {
    $("previewPageNo").textContent = state.currentPage;
  }

  if ($("paperLabel")) {
    $("paperLabel").textContent = settings.paper.toUpperCase();
  }

  if ($("previewIllustration")) {
    const icons = {
      animals: "🐻 🐰 🐱",
      space: "🚀 🪐 ⭐",
      ocean: "🐠 🐙 🐬",
      garden: "🌷 🌻 🦋",
      vehicles: "🚗 🚂 🚀",
      shapes: "○ △ □ ◇"
    };

    $("previewIllustration").textContent =
      icons[settings.theme] || "🐻 ✿ ☁";
  }

  const difficultyNames = {
    1: "Mudah",
    2: "Sedang",
    3: "Menantang"
  };

  if ($("difficultyValue")) {
    $("difficultyValue").textContent =
      difficultyNames[settings.difficulty] || "Mudah";
  }

  // Penyesuaian pratinjau untuk A4, A5, dan Letter
  const preview = $("pagePreview");

  if (preview) {
    preview.style.aspectRatio =
      settings.paper === "a5"
        ? "148 / 210"
        : settings.paper === "letter"
          ? "8.5 / 11"
          : "210 / 297";
  }
}

/* =========================================
   PROGRESS
   ========================================= */

function setProgress(percent, message) {
  if ($("progressWrap")) {
    $("progressWrap").classList.remove("hidden");
  }

  if ($("progressPercent")) {
    $("progressPercent").textContent = `${percent}%`;
  }

  if ($("progressText")) {
    $("progressText").textContent = message;
  }

  if ($("progressBar")) {
    $("progressBar").style.width = `${percent}%`;
  }
}

function showToast(message) {
  const toast = $("toast");

  if (!toast) {
    alert(message);
    return;
  }

  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

/* =========================================
   GENERATOR PDF
   ========================================= */

function getPaperFormat(paper) {
  if (paper === "a5") return "a5";
  if (paper === "letter") return "letter";
  return "a4";
}

function drawActivityPage(doc, settings, pageNumber) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const type = getPageType(settings, pageNumber);

  if (type === "coloring") {
    drawColoringPage(doc, settings, pageWidth, pageHeight, pageNumber);
  } else if (type === "tracing") {
    drawTracingPage(doc, settings, pageWidth, pageHeight, pageNumber);
  } else if (type === "math") {
    drawMathPage(doc, settings, pageWidth, pageHeight, pageNumber);
  } else if (type === "puzzle") {
    drawPuzzlePage(doc, settings, pageWidth, pageHeight, pageNumber);
  }
}

async function generatePDF() {
  if (state.isGenerating) return;

  if (!window.jspdf || !window.jspdf.jsPDF) {
    showToast("Library PDF belum termuat. Periksa koneksi internet.");
    return;
  }

  const settings = getSettings();

  if (!settings.title) {
    showToast("Masukkan judul buku terlebih dahulu.");
    $("bookTitle")?.focus();
    return;
  }

  state.isGenerating = true;
  state.questions = [];

  if ($("generateBtn")) {
    $("generateBtn").disabled = true;
    $("generateBtn").textContent = "Sedang Membuat PDF...";
  }

  if ($("resultBox")) {
    $("resultBox").classList.add("hidden");
  }

  if ($("progressWrap")) {
    $("progressWrap").classList.remove("hidden");
  }

  try {
    const { jsPDF } = window.jspdf;

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: getPaperFormat(settings.paper),
      compress: true
    });

    const total = settings.pages;
    const batchSize = 10;

    for (let start = 1; start <= total; start += batchSize) {
      const end = Math.min(total, start + batchSize - 1);

      for (let page = start; page <= end; page++) {
        if (page > 1 || settings.cover) {
          doc.addPage();
        }

        if (page === 1 && settings.cover) {
          const width = doc.internal.pageSize.getWidth();
          const height = doc.internal.pageSize.getHeight();

          drawCover(doc, settings, width, height);
        } else {
          drawActivityPage(doc, settings, page);
        }
      }

      const percent = Math.round((end / total) * 100);

      setProgress(
        percent,
        `Membuat halaman ${end} dari ${total}...`
      );

      // Beri browser waktu agar tetap responsif
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    drawAnswerPages(
      doc,
      settings,
      doc.internal.pageSize.getWidth(),
      doc.internal.pageSize.getHeight()
    );

    setProgress(100, "Menyiapkan file PDF...");

    const blob = doc.output("blob");

    if (state.pdfUrl) {
      URL.revokeObjectURL(state.pdfUrl);
    }

    state.pdfBlob = blob;
    state.pdfUrl = URL.createObjectURL(blob);

    const fileName = settings.title
      .replace(/[\\/:*?"<>|]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 80) || "kidsbook";

    const downloadBtn = $("downloadBtn");

    if (downloadBtn) {
      downloadBtn.onclick = () => {
        const link = document.createElement("a");

        link.href = state.pdfUrl;
        link.download = `${fileName}.pdf`;

        document.body.appendChild(link);
        link.click();
        link.remove();
      };
    }

    if ($("resultText")) {
      $("resultText").textContent =
        `Buku selesai dibuat: ${total} halaman aktivitas` +
        `${settings.cover ? " dan sampul" : ""}.`;
    }

    if ($("resultBox")) {
      $("resultBox").classList.remove("hidden");
    }

    showToast("PDF berhasil dibuat!");

    setProgress(100, "Selesai! PDF siap diunduh.");

  } catch (error) {
    console.error("Kesalahan generator PDF:", error);

    showToast(
      "PDF gagal dibuat. Coba kurangi jumlah halaman."
    );

    setProgress(0, "Terjadi kesalahan saat membuat PDF.");

  } finally {
    state.isGenerating = false;

    if ($("generateBtn")) {
      $("generateBtn").disabled = false;
      $("generateBtn").innerHTML =
        '✦ Buat Buku PDF <span>↗</span>';
    }
  }
}

/* =========================================
   EVENT LISTENER
   ========================================= */

function setupEvents() {
  const settingIds = [
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

  settingIds.forEach((id) => {
    const element = $(id);

    if (!element) return;

    element.addEventListener("input", updatePreview);
    element.addEventListener("change", updatePreview);
  });

  $("generateBtn")?.addEventListener("click", generatePDF);

  $("prevBtn")?.addEventListener("click", () => {
    state.currentPage = Math.max(1, state.currentPage - 1);
    updatePreview();
  });

  $("nextBtn")?.addEventListener("click", () => {
    state.currentPage = Math.min(
      state.totalPages,
      state.currentPage + 1
    );

    updatePreview();
  });

  $("themeBtn")?.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const isLight = document.body.classList.contains("light-mode");

    localStorage.setItem(
      "kidsbook-theme",
      isLight ? "light" : "dark"
    );
  });
}

/* =========================================
   MULAI APLIKASI
   ========================================= */

function initKidsBookStudio() {
  const savedTheme = localStorage.getItem("kidsbook-theme");

  if (savedTheme === "light") {
    document.body.classList.add("light-mode");
  }

  setupEvents();
  updatePreview();

  console.log("KidsBook Studio siap digunakan.");
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initKidsBookStudio
  );
} else {
  initKidsBookStudio();
    }
