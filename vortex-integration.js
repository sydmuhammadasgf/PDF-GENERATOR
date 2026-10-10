/* KIDSBOOK STUDIO — VORTEX INTEGRATION PATCH
   Mempertahankan generator lama sebagai cadangan.
*/
(function () {
  'use strict';

  const getTools = () => window.KidsBookTools;
  const bookSet = new Set();
  const usedMathByPage = new Map();
  const usedPuzzleByPage = new Map();

  function settingsForVortex(settings) {
    return {
      ...settings,
      pages: Number(settings.pages) || 20,
      theme: settings.theme || 'animals',
      type: settings.type || 'coloring',
      age: settings.age || '6-8',
      difficulty: Number(settings.difficulty) || 1
    };
  }

  // Menggunakan ilustrator Vortex jika tersedia.
  // Jika gagal, kembali ke ilustrasi lama.
  const oldDrawIllustration = window.drawIllustration;

  window.drawIllustration = function (
    doc,
    settings,
    x,
    y,
    width,
    height,
    pageNumber
  ) {
    const tools = getTools();

    if (
      tools &&
      tools.VectorIllustrator &&
      typeof tools.createPagePlan === 'function'
    ) {
      try {
        const plan = tools.createPagePlan(
          settingsForVortex(settings),
          pageNumber || 1,
          bookSet
        );

        tools.VectorIllustrator.draw(
          doc,
          plan,
          x,
          y,
          width,
          height,
          pageNumber || 1
        );

        return;
      } catch (error) {
        console.warn(
          '[Vortex] Ilustrasi gagal. Menggunakan ilustrasi lama.',
          error
        );
      }
    }

    if (typeof oldDrawIllustration === 'function') {
      return oldDrawIllustration(
        doc,
        settings,
        x,
        y,
        width,
        height,
        pageNumber
      );
    }
  };

  // Menggunakan generator matematika Vortex jika tersedia.
  const oldMath = window.makeMathQuestion;

  window.makeMathQuestion = function (settings, index) {
    const tools = getTools();

    if (tools && tools.ActivityEngine) {
      const page =
        (window.state && window.state.currentPage) || 1;

      if (!usedMathByPage.has(page)) {
        usedMathByPage.set(page, new Set());
      }

      return tools.ActivityEngine.makeMathQuestion(
        settingsForVortex(settings),
        index,
        usedMathByPage.get(page)
      );
    }

    return typeof oldMath === 'function'
      ? oldMath(settings, index)
      : null;
  };

  // Menggunakan bank teka-teki Vortex jika tersedia.
  const oldPuzzle = window.makePuzzleQuestion;

  window.makePuzzleQuestion = function (index) {
    const tools = getTools();

    if (tools && tools.ActivityEngine) {
      const page =
        (window.state && window.state.currentPage) || 1;

      if (!usedPuzzleByPage.has(page)) {
        usedPuzzleByPage.set(page, new Set());
      }

      return tools.ActivityEngine.makePuzzleQuestion(
        index,
        usedPuzzleByPage.get(page)
      );
    }

    return typeof oldPuzzle === 'function'
      ? oldPuzzle(index)
      : null;
  };

  // Alat pemeriksaan integrasi.
  window.KidsBookVortexIntegration = {
    status() {
      const tools = getTools();

      return tools && tools.getStatus
        ? tools.getStatus()
        : {
            mode: 'fallback',
            message: 'tools.js belum termuat'
          };
    },

    resetBookMemory() {
      bookSet.clear();
      usedMathByPage.clear();
      usedPuzzleByPage.clear();
    }
  };

  console.info(
    '[KidsBook Studio] Vortex integration patch loaded.'
  );
})();
