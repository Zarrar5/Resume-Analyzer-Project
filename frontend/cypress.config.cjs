const { defineConfig } = require("cypress");

module.exports = defineConfig({
  e2e: {
    baseUrl: "http://localhost:5173", // Set the correct base URL
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
  },
});

