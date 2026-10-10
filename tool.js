(function () {
  "use strict";

  const KidsBookTools = {
    version: "2.0.0",

    themes: {
      animals: [
        "Cat", "Dog", "Rabbit", "Lion", "Elephant",
        "Panda", "Fox", "Bear", "Tiger", "Giraffe",
        "Monkey", "Turtle", "Butterfly", "Owl"
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

    createId() {
      return (
        Date.now().toString(36) +
        Math.random().toString(36).slice(2, 9)
      );
    },

    getInstruction(activity, object) {
      const instructions = {
        coloring: `Color the ${object}.`,
        tracing: `Trace the word ${object}.`,
        math: "Solve the math problem.",
        puzzle: "Complete the activity.",
        counting: `Count the ${object}.`,
        drawing: `Draw your own ${object}.`
      };

      return instructions[activity] || "Complete the activity.";
    },

    createPage(options = {}) {
      const theme = options.theme || "animals";
      const activity = options.activity || "coloring";

      const objects = this.themes[theme] || this.themes.animals;
      const object = this.choose(objects);

      return {
        id: this.createId(),
        theme,
        activity,
        object,
        title: `${activity === "coloring" ? "Color" : "Activity"}: ${object}`,
        instruction: this.getInstruction(activity, object),
        createdAt: new Date().toISOString()
      };
    },

    generatePages(count = 10, options = {}) {
      const total = Math.max(
        1,
        Math.min(100, Math.floor(Number(count) || 10))
      );

      return Array.from(
        { length: total },
        () => this.createPage(options)
      );
    },

    createPagePlan(options = {}) {
      return this.createPage(options);
    },

    getStatus() {
      return {
        online: true,
        version: this.version,
        message: "KidsBook Studio siap digunakan."
      };
    },

    help(message = "") {
      return {
        success: true,
        message: message
          ? `Bantuan aktivitas: ${message}`
          : "Pilih tema dan aktivitas untuk membuat buku."
      };
    }
  };

  /*
   * GENERATOR ILUSTRASI VEKTOR
   * Menghasilkan SVG langsung di browser.
   */

  const VectorIllustrator = {
    draw(object = "Cat", options = {}) {
      const safeObject = String(object)
        .replace(/[<>&"']/g, "");

      const color = options.color || "#252b40";

      const svg = `
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="300"
          height="260"
          viewBox="0 0 300 260"
        >
          <rect
            width="300"
            height="260"
            fill="white"
          />

          <g
            fill="white"
            stroke="${color}"
            stroke-width="5"
            stroke-linejoin="round"
          >
            <circle cx="150" cy="125" r="65"/>

            <path d="
              M100 83
              L95 35
              L132 67
              Z
            "/>

            <path d="
              M168 67
              L205 35
              L200 83
              Z
            "/>
          </g>

          <g
            fill="${color}"
            stroke="none"
          >
            <circle cx="128" cy="120" r="6"/>
            <circle cx="172" cy="120" r="6"/>

            <path d="
              M143 137
              Q150 145 157 137
              Z
            "/>
          </g>

          <path
            d="M150 145 Q135 160 125 148"
            fill="none"
            stroke="${color}"
            stroke-width="4"
            stroke-linecap="round"
          />

          <path
            d="M150 145 Q165 160 175 148"
            fill="none"
            stroke="${color}"
            stroke-width="4"
            stroke-linecap="round"
          />

          <text
            x="150"
            y="225"
            text-anchor="middle"
            font-family="Arial, sans-serif"
            font-size="17"
            fill="${color}"
          >${safeObject}</text>
        </svg>
      `;

      return svg;
    },

    async toDataURL(object = "Cat") {
      const svg = this.draw(object);

      return new Promise((resolve, reject) => {
        const blob = new Blob(
          [svg],
          { type: "image/svg+xml;charset=utf-8" }
        );

        const url = URL.createObjectURL(blob);
        const image = new Image();

        image.onload = function () {
          try {
            const canvas = document.createElement("canvas");

            canvas.width = 600;
            canvas.height = 520;

            const context = canvas.getContext("2d");

            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, canvas.width, canvas.height);

            context.drawImage(
              image,
              0,
              0,
              canvas.width,
              canvas.height
            );

            URL.revokeObjectURL(url);

            resolve(canvas.toDataURL("image/png"));
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };

        image.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error("Gagal membuat ilustrasi."));
        };

        image.src = url;
      });
    }
  };

  /*
   * GENERATOR SOAL MATEMATIKA
   */

  const ActivityEngine = {
    makeMathQuestion(difficulty = 1) {
      const level = Math.max(
        1,
        Math.min(3, Number(difficulty) || 1)
      );

      let a;
      let b;
      let answer;
      let symbol;

      if (level === 1) {
        a = 1 + KidsBookTools.random(10);
        b = 1 + KidsBookTools.random(10);

        symbol = "+";
        answer = a + b;
      } else if (level === 2) {
        a = 10 + KidsBookTools.random(40);
        b = 1 + KidsBookTools.random(20);

        symbol = "-";

        if (b > a) {
          [a, b] = [b, a];
        }

        answer = a - b;
      } else {
        a = 2 + KidsBookTools.random(10);
        b = 2 + KidsBookTools.random(10);

        symbol = "×";
        answer = a * b;
      }

      return {
        question: `${a} ${symbol} ${b} = ?`,
        answer,
        options: [
          answer,
          answer + 1,
          Math.max(0, answer - 1),
          answer + 2
        ].sort(() => Math.random() - 0.5)
      };
    },

    makePuzzleQuestion() {
      const questions = [
        {
          question: "What comes next? 1, 2, 3, ...",
          answer: "4"
        },
        {
          question: "Which shape has three sides?",
          answer: "Triangle"
        },
        {
          question: "Which is bigger: 8 or 5?",
          answer: "8"
        },
        {
          question: "How many days are in a week?",
          answer: "7"
        }
      ];

      return {
        ...KidsBookTools.choose(questions)
      };
    }
  };

  window.KidsBookTools = KidsBookTools;
  window.KidsBookTools.VectorIllustrator = VectorIllustrator;
  window.KidsBookTools.ActivityEngine = ActivityEngine;

  window.VectorIllustrator = VectorIllustrator;
  window.ActivityEngine = ActivityEngine;
})();
