const { scraper } = require("./lib/scraper.js");

const app = function() {
    Promise.resolve(scraper());
}

app();