const express = require("express");
const router = express.Router();
const htmlToJson = require("html-to-json");

router.get("/:page", (req, res, next) => {
  res.send("Parser " + req.params.page);
});

module.exports = router;
