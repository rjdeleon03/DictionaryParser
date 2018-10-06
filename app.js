const express = require("express");
const bodyParser = require("body-parser");
const parseRoute = require("./routes/parse");

// Create express app
const app = express();

/*
 * Body parser setup
 */
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

/*
 * Use routes
 */
app.use("/parse", parseRoute);

app.get("/", (req, res, next) => {
  res.send("Hello");
});

module.exports = app;
