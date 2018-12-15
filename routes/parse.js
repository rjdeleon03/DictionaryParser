const express = require("express");
const router = express.Router();
const request = require("request");
const jsdom = require("jsdom");
const iconv = require("iconv-lite");
const fs = require("fs");

const req_url = "https://sil-philippines-languages.org/online/msm/lexicon/01.htm"

const ISO_ENCODING = "ISO-8859-1";

router.get("/:page", async (req, res, next) => {
  res.send("Hello");
  performParseProcess(req_url);
});

module.exports = router;

function performParseProcess(url) {
  request({ uri: url, encoding: null }, (error, response, body) => {

    var utf8String = iconv.decode(Buffer.from(body), ISO_ENCODING);
    // console.log(utf8String);

    const { JSDOM } = jsdom;
    var dom = new JSDOM(utf8String);
    var children = dom.window.document.body.children;

    let dictEntries = [];
    let currentWord = null;

    for (var i = 0; i < children.length; i++) {
      let child = children[i];

      if (child.className === "lp_LexEntryPara") {
        if (currentWord !== null) dictEntries.push(currentWord);
        currentWord = processWord(child);

      } else if (child.className === "lp_LexEntryPara2") {
        currentWord.meaningSet.push(processMeaningSet(child));
      }

      if (i + 1 == children.length) {
        dictEntries.push(currentWord);
      }
    }

    fs.writeFile("dict.json", JSON.stringify(dictEntries), function (err) {
      if (err) throw err;
      console.log("complete");
    });
    console.log(dictEntries.length);
  })
};

function processWord(item) {
  let word = item.getElementsByClassName("lp_LexEntryName")[0].textContent;

  let itemPos = item.getElementsByClassName("lp_PartOfSpeech")[0];
  let partOfSpeech = (typeof itemPos === "undefined") ? "" : itemPos.textContent;

  let itemMeaning = item.getElementsByClassName("lp_Gloss_English")[0];
  let meaning = (typeof itemMeaning === "undefined") ? "" : itemMeaning.textContent;
  let meaningSet = new MeaningSet(partOfSpeech, meaning);

  let itemNote = item.getElementsByClassName("lp_MiniHeading")[0];
  let note = (typeof itemNote === "undefined") ? "" : itemNote.textContent;

  let itemRw = item.getElementsByClassName("lp_MainCrossRef")[0];
  let relatedWord = (typeof itemRw === "undefined") ? "" : itemRw.textContent;

  return new Entry(0, word, meaningSet, note, relatedWord);
}

function processMeaningSet(item) {
  let itemPos = item.getElementsByClassName("lp_PartOfSpeech")[0];
  let partOfSpeech = (typeof itemPos === "undefined") ? "" : itemPos.textContent;

  let itemMeaning = item.getElementsByClassName("lp_Gloss_English")[0];
  let meaning = (typeof itemMeaning === "undefined") ? "" : itemMeaning.textContent;
  return new MeaningSet(partOfSpeech, meaning);
}

/**
 * Dictionary entry model
 * @param {*} word
 * @param {*} partOfSpeech
 * @param {*} meaning
 * @param {*} note
 * @param {*} relatedWord
 */
function Entry(parentId, word, meaningSet, note, relatedWord) {
  this.parentId = parentId;
  this.word = word;
  this.meaningSet = [];
  this.meaningSet.push(meaningSet);
  this.note = note;
  this.relatedWord = relatedWord;
}

/**
 * Meaning set model
 * @param {*} partOfSpeech 
 * @param {*} meaning 
 */
function MeaningSet(partOfSpeech, meaning) {
  this.partOfSpeech = partOfSpeech;
  this.meaning = meaning;
}

// const express = require("express");
// const fs = require("fs");
// const router = express.Router();
// const htmlToJson = require("html-to-json");
// const unescapeUnicode = require("unescape-unicode")

// const entryTag = "lp_LexEntryPara";
// const MAX_ENTRY_COUNT = 26;

// let currParentId = -1;
// let dictEntries = [];

// router.get("/:page", async (req, res, next) => {
//   res.send("Parser " + req.params.page);

//   performParseProcess(
//     1,
//     "https://sil-philippines-languages.org/online/msm/lexicon/" +
//     getFormattedIdx(1) +
//     ".htm"
//   );
// });

// module.exports = router;

// function getFormattedIdx(number) {
//   return ("0" + number).slice(-2);
// }

// function performParseProcess(idx, url) {
//   console.log(url);
//   var promise = htmlToJson.request(url, {
//     entries: ["p", block => parseEntry(block)]
//   });

//   promise.done(result => {
//     // console.log(result.subEntries.length);
//     dictEntries = dictEntries.concat(result.entries);
//     console.log(
//       idx + " >> " + result.entries.length + " --- " + dictEntries.length
//     );

//     if (idx < MAX_ENTRY_COUNT) {
//       idx++;
//       performParseProcess(
//         idx,
//         "https://sil-philippines-languages.org/online/msm/lexicon/" +
//         getFormattedIdx(idx) +
//         ".htm"
//       );
//     } else {
//       cleanupList();

//       fs.writeFile("dict.json", JSON.stringify(dictEntries), function (err) {
//         if (err) throw err;
//         console.log("complete");
//       });
//     }
//   });
// }

// /**
//  * Parses the given html block
//  * @param {*} block
//  */
// function parseEntry(block) {
//   let entryWord = block.find(".lp_LexEntryName");
//   let parentId = -1;

//   if (block[0].attribs.class === entryTag) {
//     currParentId = entryWord.attr("id");
//   } else {
//     parentId = currParentId;
//   }

//   var word = entryWord.html();
//   var partOfSpeech = block.find(".lp_PartOfSpeech").text();
//   var meaning = block.find(".lp_Gloss_English").text();
//   var note = block.find(".lp_MiniHeading").text();
//   var relatedWord = block.find(".lp_MainCrossRef").html();

//   console.log(word);
//   return new Entry(parentId, word, partOfSpeech, meaning, note, relatedWord);
// }

// /**
//  * Dictionary entry model
//  * @param {*} word
//  * @param {*} partOfSpeech
//  * @param {*} meaning
//  * @param {*} note
//  * @param {*} relatedWord
//  */
// function Entry(parentId, word, partOfSpeech, meaning, note, relatedWord) {
//   this.parentId = parentId;
//   this.word = word;
//   this.partOfSpeech = partOfSpeech;
//   this.meaning = meaning;
//   this.note = note;
//   this.relatedWord = relatedWord;
// }

// function cleanupList() {
//   if (dictEntries) {
//     console.log(dictEntries.length);
//     dictEntries.forEach((entry, idx) => {
//       if (
//         (!entry.word || entry.word.trim().length === 0) &&
//         (!entry.meaning || entry.meaning.trim().length === 0)
//       )
//         dictEntries.splice(idx, 1);
//     });
//     console.log(dictEntries.length);
//   }
// }
