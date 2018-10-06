const express = require("express");
const router = express.Router();
const htmlToJson = require("html-to-json");

router.get("/:page", (req, res, next) => {
  var promise = htmlToJson.request(
    "https://sil-philippines-languages.org/online/msm/lexicon/01.htm",
    {
      function() {}
    }
  );
  res.send("Parser " + req.params.page);

  promise.done(result => {
    console.log(result);
  });
});

module.exports = router;
