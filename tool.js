/* ==========================================
   KIDSBOOK STUDIO
   VORTEX ENGINE v1.0
   ========================================== */

(function () {
  "use strict";

  const Vortex = {
    version: "1.0.0",
    name: "Vortex",

    themes: {
      animals: [
        "Cat", "Dog", "Rabbit", "Lion", "Elephant",
        "Panda", "Fox", "Bear", "Tiger", "Giraffe"
      ],

      space: [
        "Rocket", "Planet", "Astronaut", "Moon",
        "Star", "Satellite", "Comet", "Alien"
      ],

      ocean: [
        "Fish", "Turtle", "Dolphin", "Whale",
        "Octopus", "Seahorse", "Crab", "Jellyfish"
      ],

      garden: [
        "Flower", "Butterfly", "Tree", "Bee",
        "Mushroom", "Sunflower", "Ladybug"
      ],

      vehicles: [
        "Car", "Bus", "Train", "Airplane",
        "Bicycle", "Ship", "Helicopter"
      ],

      dinosaurs: [
        "Tyrannosaurus", "Triceratops",
        "Stegosaurus", "Brachiosaurus"
      ],

      fruits: [
        "Apple", "Banana", "Orange",
        "Strawberry", "Watermelon", "Grape"
      ]
    },

    activities: [
      "coloring",
      "tracing",
      "math",
      "puzzle",
      "counting",
      "drawing"
    ],

    random(max) {
      return Math.floor(Math.random() * max);
    },

    choose(items) {
      if (!Array.isArray(items) || items.length === 0) {
        return null;
      }

      return items[this.random(items.length)];
    },

    getThemes() {
      return Object.keys(this.themes);
    },

    getActivities() {
      return [...this.activities];
    },

    createPage(options = {}) {
      const theme = options.theme || "animals";
      const activity = options.activity || "coloring";

      const objects = this.themes[theme];

      if (!objects) {
        throw new Error("Tema tidak ditemukan: " + theme);
      }

      const object = this.choose(objects);

      return {
        id: this.createId(),
        theme,
        activity,
        object,
        title: activity === "coloring"
          ? "Color the " + object
          : activity === "tracing"
            ? "Trace the " + object
            : "Activity: " + object,
        instruction: this.getInstruction(activity, object),
        createdAt: new Date().toISOString()
      };
    },

    createId() {
      return Date.now().toString(36) +
        Math.random().toString(36).slice(2, 10);
    },

    getInstruction(activity, object) {
      const instructions = {
        coloring: "Color the picture of the " + object + ".",
        tracing: "Trace the word " + object + ".",
        math: "Count the objects and write the answer.",
        puzzle: "Complete the puzzle.",
        counting: "Count the objects carefully.",
        drawing: "Draw your own " + object + "."
      };

      return instructions[activity] ||
        "Complete this activity.";
    },

    generatePages(count = 10, options = {}) {
      const total = Math.max(
        1,
        Math.min(1000, Math.floor(Number(count) || 10))
      );

      const pages = [];

      for (let i = 0; i < total; i++) {
        pages.push(this.createPage(options));
      }

      return pages;
    },

    help(message) {
      const text = String(message || "").toLowerCase();

      if (text.includes("tema")) {
        return "Tema tersedia: " +
          this.getThemes().join(", ") + ".";
      }

      if (text.includes("aktivitas")) {
        return "Aktivitas tersedia: " +
          this.getActivities().join(", ") + ".";
      }

      if (text.includes("halo") || text.includes("hai")) {
        return "Halo! Aku Vortex, asisten KidsBook Studio. Ada yang bisa kubantu?";
      }

      return "Aku Vortex! Aku bisa membantu memilih tema dan aktivitas buku anak.";
    }
  };

  window.KidsBookTools = Vortex;
  window.VortexAssistant = {
    ask: (message) => Vortex.help(message)
  };

})();
