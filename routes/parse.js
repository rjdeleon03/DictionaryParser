const express = require("express");
const router = express.Router();
const request = require("request");
const jsdom = require("jsdom");
const iconv = require("iconv-lite");
const fs = require("fs");

const URL_TEMPLATE =
  "https://sil-philippines-languages.org/online/msm/lexicon/";
const URL_EXT = ".htm";

const ISO_ENCODING = "ISO-8859-1";
let dictEntries = [];
let index = 1;

router.get("/:page", async (req, res, next) => {
  res.send("Hello");
  performParseProcess(URL_TEMPLATE + getFormattedIdx(index) + URL_EXT);
});

module.exports = router;

function getFormattedIdx(number) {
  return ("0" + number).slice(-2);
}

function performParseProcess(url) {
  console.log("Total: " + dictEntries.length);
  if (index > 20) {
    fs.writeFile("dict.json", JSON.stringify(dictEntries), function(err) {
      if (err) throw err;
      console.log("--------- complete ---------");
    });
    return;
  }

  request({ uri: url, encoding: null }, (error, response, body) => {
    var utf8String = iconv.decode(Buffer.from(body), ISO_ENCODING);
    // console.log(utf8String);

    const { JSDOM } = jsdom;
    var dom = new JSDOM(utf8String);
    var children = dom.window.document.body.children;

    let currentWord = null;

    for (var i = 0; i < children.length; i++) {
      let child = children[i];

      if (child.className === "lp_LexEntryPara") {
        if (currentWord !== null) dictEntries.push(currentWord);
        currentWord = processWord(child);
      } else if (child.className === "lp_LexEntryPara2") {
        currentWord.meaningSet.push(processMeaningSet(child));
      }

      if (i + 1 == children.length && currentWord != null) {
        dictEntries.push(currentWord);
      }
    }
    // console.log(dictEntries.length);
    index++;
    performParseProcess(URL_TEMPLATE + getFormattedIdx(index) + URL_EXT);
  });
}

function processWord(item) {
  let word = item.getElementsByClassName("lp_LexEntryName")[0].textContent;

  let itemPos = item.getElementsByClassName("lp_PartOfSpeech")[0];
  let partOfSpeech = typeof itemPos === "undefined" ? "" : itemPos.textContent;

  let itemMeaning = item.getElementsByClassName("lp_Gloss_English")[0];
  let meaning =
    typeof itemMeaning === "undefined" ? "" : itemMeaning.textContent;
  let meaningSet = new MeaningSet(partOfSpeech, meaning);

  return new Entry(
    dictEntries.length + 1,
    word,
    meaningSet,
    processNoteSet(item)
  );
}

function processMeaningSet(item) {
  let itemPos = item.getElementsByClassName("lp_PartOfSpeech")[0];
  let partOfSpeech = typeof itemPos === "undefined" ? "" : itemPos.textContent;

  let itemMeaning = item.getElementsByClassName("lp_Gloss_English")[0];
  let meaning =
    typeof itemMeaning === "undefined" ? "" : itemMeaning.textContent;
  return new MeaningSet(partOfSpeech, meaning);
}

function processNoteSet(item) {
  let noteSetArray = [];
  let itemHeadings = Array.from(item.getElementsByClassName("lp_MiniHeading"));
  itemHeadings.forEach(element => {
    noteSetArray.push(
      new NoteSet(element.textContent, element.nextSibling.textContent)
    );
  });
  return noteSetArray;
}

/**
 * Dictionary entry model
 * @param {*} id
 * @param {*} word
 * @param {*} meaningSet
 * @param {*} noteSet
 */
function Entry(id, word, meaningSet, noteSet) {
  this.id = id;
  this.word = word;
  this.meaningSet = [];
  this.meaningSet.push(meaningSet);
  this.noteSet = noteSet;
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

/**
 * Note set model
 * @param {*} noteHeader
 * @param {*} note
 */
function NoteSet(noteHeader, note) {
  this.noteHeader = noteHeader;
  this.note = note;
}
