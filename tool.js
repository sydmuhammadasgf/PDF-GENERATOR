(function () {
  "use strict";

  const KidsBookTools = {
    version: "3.0.0",

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
      shapes: [
        "Circle", "Square", "Triangle",
        "Rectangle", "Star", "Heart"
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
      "drawing",
      "mixed"
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
        math: "Solve the math problems.",
        puzzle: "Complete the puzzle.",
        counting: `Count the ${object}.`,
        drawing: `Draw your own ${object}.`,
        mixed: "Complete this activity."
      };

      return instructions[activity] || "Complete the activity.";
    },

    createPage(options = {}) {
      const theme = this.themes[options.theme]
        ? options.theme
        : "animals";

      const activity = options.activity || "coloring";
      const object = this.choose(this.themes[theme]);

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
        Math.min(1000, Math.floor(Number(count) || 10))
      );

      return Array.from(
        { length: total },
        () => this.createPage(options)
      );
    },

    createPagePlan(options = {}, pageNumber = 1, bookSet = []) {
      /*
       * Mendukung pemanggilan:
       * createPagePlan(options, pageNumber, bookSet)
       *
       * serta format sederhana:
       * createPagePlan(options)
       */

      const settings = options || {};
      const activity = settings.activity || "coloring";
      const page = this.createPage({
        theme: settings.theme,
        activity
      });

      return {
        ...page,
        pageNumber: Number(pageNumber) || 1,
        age: settings.age || "3-5",
        difficulty: Number(settings.difficulty) || 1,
        paperSize: settings.paperSize || "a4",
        bookSet: Array.isArray(bookSet) ? bookSet : []
      };
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
   * ILUSTRASI SVG
   */

  const VectorIllustrator = {
    draw(object = "Cat", options = {}) {
      const safeObject = String(object).replace(
        /[<>&"']/g,
        ""
      );

      const color = /^#[0-9a-f]{3,8}$/i.test(
        options.color || ""
      )
        ? options.color
        : "#252b40";

      return `
        <svg xmlns="http://www.w3.org/2000/svg"
          width="300" height="260" viewBox="0 0 300 260">

          <rect width="300" height="260" fill="white"/>

          <g fill="white" stroke="${color}"
             stroke-width="5" stroke-linejoin="round">

            <circle cx="150" cy="125" r="65"/>

            <path d="M100 83 L95 35 L132 67 Z"/>

            <path d="M168 67 L205 35 L200 83 Z"/>
          </g>

          <g fill="${color}">
            <circle cx="128" cy="120" r="6"/>
            <circle cx="172" cy="120" r="6"/>
            <path d="M143 137 Q150 145 157 137 Z"/>
          </g>

          <path d="M150 145 Q135 160 125 148"
            fill="none" stroke="${color}"
            stroke-width="4" stroke-linecap="round"/>

          <path d="M150 145 Q165 160 175 148"
            fill="none" stroke="${color}"
            stroke-width="4" stroke-linecap="round"/>

          <text x="150" y="225" text-anchor="middle"
            font-family="Arial,sans-serif" font-size="17"
            fill="${color}">${safeObject}</text>
        </svg>
      `;
    },

    async toDataURL(object = "Cat", options = {}) {
      const svg = this.draw(object, options);

      return new Promise((resolve, reject) => {
        const blob = new Blob([svg], {
          type: "image/svg+xml;charset=utf-8"
        });

        const url = URL.createObjectURL(blob);
        const img = new Image();

        img.onload = function () {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = 600;
            canvas.height = 520;

            const ctx = canvas.getContext("2d");

            if (!ctx) {
              throw new Error("Canvas tidak tersedia.");
            }

            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, 600, 520);
            ctx.drawImage(img, 0, 0, 600, 520);

            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/png"));
          } catch (error) {
            URL.revokeObjectURL(url);
            reject(error);
          }
        };

        img.onerror = function () {
          URL.revokeObjectURL(url);
          reject(new Error("Gagal membuat ilustrasi."));
        };

        img.src = url;
      });
    }
  };

  /*
   * GENERATOR SOAL
   */

  const ActivityEngine = {
    makeMathQuestion(settings = {}, index = 0, used = []) {
      /*
       * Mendukung:
       * makeMathQuestion(1)
       * makeMathQuestion({ age: "6-8", difficulty: 2 }, 0, [])
       */

      if (typeof settings === "number") {
        settings = { difficulty: settings };
      }

      const difficulty = Math.max(
        1,
        Math.min(3, Number(settings.difficulty) || 1)
      );

      const usedQuestions = Array.isArray(used) ? used : [];

      let a;
      let b;
      let answer;
      let symbol;

      if (difficulty === 1) {
        a = 1 + KidsBookTools.random(10);
        b = 1 + KidsBookTools.random(10);
        symbol = "+";
        answer = a + b;
      } else if (difficulty === 2) {
        a = 10 + KidsBookTools.random(40);
        b = 1 + KidsBookTools.random(20);

        if (b > a) {
          [a, b] = [b, a];
        }

        symbol = "-";
        answer = a - b;
      } else {
        a = 2 + KidsBookTools.random(10);
        b = 2 + KidsBookTools.random(10);
        symbol = "×";
        answer = a * b;
      }

      const question = `${a} ${symbol} ${b} = ?`;

      /*
       * Hindari mengulang soal yang sama
       * jika memungkinkan.
       */
      if (usedQuestions.includes(question)) {
        for (let i = 0; i < 8 && usedQuestions.includes(
          `${a} ${symbol} ${b} = ?`
        ); i++) {
          if (difficulty === 1) {
            a = 1 + KidsBookTools.random(10);
            b = 1 + KidsBookTools.random(10);
            answer = a + b;
            symbol = "+";
          } else if (difficulty === 2) {
            a = 10 + KidsBookTools.random(40);
            b = 1 + KidsBookTools.random(20);
            if (b > a) [a, b] = [b, a];
            answer = a - b;
            symbol = "-";
          } else {
            a = 2 + KidsBookTools.random(10);
            b = 2 + KidsBookTools.random(10);
            answer = a * b;
            symbol = "×";
          }
        }
      }

      const finalQuestion = `${a} ${symbol} ${b} = ?`;

      const choices = new Set([answer]);

      while (choices.size < 4) {
        const offset = 1 + KidsBookTools.random(5);
        const candidate = KidsBookTools.random(2)
          ? answer + offset
          : Math.max(0, answer - offset);

        choices.add(candidate);
      }

      return {
        question: finalQuestion,
        answer,
        options: [...choices].sort(() => Math.random() - 0.5),
        index
      };
    },

    makePuzzleQuestion(index = 0, used = []) {
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
        },
        {
          question: "What comes next? 2, 4, 6, ...",
          answer: "8"
        },
        {
          question: "Which shape has four equal sides?",
          answer: "Square"
        }
      ];

      const alreadyUsed = Array.isArray(used) ? used : [];

      const available = questions.filter(
        item => !alreadyUsed.includes(item.question)
      );

      const selected = KidsBookTools.choose(
        available.length ? available : questions
      );

      return {
        ...selected,
        index
      };
    }
  };

  window.KidsBookTools = KidsBookTools;
  window.KidsBookTools.VectorIllustrator = VectorIllustrator;
  window.KidsBookTools.ActivityEngine = ActivityEngine;

  window.VectorIllustrator = VectorIllustrator;
  window.ActivityEngine = ActivityEngine;
})();
