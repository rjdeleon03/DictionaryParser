const express = require("express");
const fs = require("fs");
const router = express.Router();
const htmlToJson = require("html-to-json");

const subEntryTag = "lp_LexSubEntryPara";
const MAX_ENTRY_COUNT = 26;

let currParentId = -1;
let dictEntries = [];

router.get("/:page", async (req, res, next) => {
  res.send("Parser " + req.params.page);

  performParseProcess(1, "https://sil-philippines-languages.org/online/msm/lexicon/" + getFormattedIdx(1) + ".htm");
});

module.exports = router;

function getFormattedIdx(number) {
  return ("0" + number).slice(-2);
}

function performParseProcess(idx, url) {
  console.log(url);
  var promise = htmlToJson.request(
    url,
    {
      'entries': ['p', (block) => parseEntry(block)]
    }
  );

  promise.done(result => {
    // console.log(result.subEntries.length);
    dictEntries = dictEntries.concat(result.entries);
    console.log(idx + " >> " + result.entries.length + " --- " + dictEntries.length);

    if (idx < MAX_ENTRY_COUNT) {
      idx++;
      performParseProcess(idx, "https://sil-philippines-languages.org/online/msm/lexicon/" + getFormattedIdx(idx) + ".htm");
    } else {
      cleanupList();

      fs.writeFile("dict.json", JSON.stringify(dictEntries), function (err) {
        if (err) throw err;
        console.log('complete');
      });
    }
  });
}

/**
 * Parses the given html block
 * @param {*} block 
 */
function parseEntry(block) {

  let entryName = block.find('.lp_LexEntryName');
  let parentId = -1;

  if (block[0].attribs.class !== subEntryTag) {
    currParentId = entryName.attr('id');
  } else {
    parentId = currParentId;
  }

  var word = entryName.text();
  var partOfSpeech = block.find('.lp_PartOfSpeech').text();
  var meaning = block.find('.lp_Gloss_English').text();
  var note = block.find('.lp_MiniHeading').text();
  var relatedWord = block.find('.lp_MainCrossRef').text();

  if (!word || word.trim().length === 0) return;

  return new Entry(parentId, word, partOfSpeech, meaning, note, relatedWord);
}

/**
 * Dictionary entry model
 * @param {*} word 
 * @param {*} partOfSpeech 
 * @param {*} meaning 
 * @param {*} note 
 * @param {*} relatedWord 
 */
function Entry(parentId, word, partOfSpeech, meaning, note, relatedWord) {
  this.parentId = parentId;
  this.word = word;
  this.partOfSpeech = partOfSpeech;
  this.meaning = meaning;
  this.note = note;
  this.relatedWord = relatedWord;
}

function cleanupList() {
  if (dictEntries) {
    dictEntries.forEach(entry => {
      if (!entry) dictEntries.pop(entry);
    });
  }
}