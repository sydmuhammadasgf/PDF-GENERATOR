(function () {
  "use strict";

  function initializeIntegration() {
    const tools = window.KidsBookTools;

    if (!tools) {
      console.warn(
        "KidsBookTools belum tersedia. Periksa urutan script."
      );

      return;
    }

    window.KidsBookVortexIntegration = {
      version: "2.0.0",

      status() {
        return tools.getStatus();
      },

      createPage(options = {}) {
        return tools.createPage(options);
      },

      createPages(count = 10, options = {}) {
        return tools.generatePages(count, options);
      },

      getThemes() {
        return tools.getThemes();
      },

      getActivities() {
        return tools.getActivities();
      }
    };

    document.dispatchEvent(
      new CustomEvent("kidsbook:ready")
    );

    console.log("KidsBook integration siap.");
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeIntegration,
      { once: true }
    );
  } else {
    initializeIntegration();
  }
})();
