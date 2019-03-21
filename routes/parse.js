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

let miniHeadingSet = new Set();

module.exports = router;

function getFormattedIdx(number) {
  return ("0" + number).slice(-2);
}

function performParseProcess(url) {
  // console.log(dictEntries.length);
  if (index > 26) {
    fs.writeFile("dict.json", JSON.stringify(dictEntries), function(err) {
      if (err) throw err;
      console.log("--------- complete ---------");
      miniHeadingSet.forEach(item => {
        // console.log(item);
      });
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

  let itemNoteItems = Array.from(item.getElementsByClassName("lp_MiniHeading"));
  itemNoteItems.forEach(element => {
    miniHeadingSet.add(element.textContent);
    console.log(element.textContent);
  });

  let itemNote = item.getElementsByClassName("lp_MiniHeading")[0];
  let note = typeof itemNote === "undefined" ? "" : itemNote.textContent;

  let itemRw = item.getElementsByClassName("lp_MainCrossRef")[0];
  let subItemRw = item.getElementsByClassName("lp_CrossRef")[0];
  let relatedWord =
    typeof itemRw === "undefined"
      ? typeof subItemRw === "undefined"
        ? ""
        : subItemRw.textContent
      : itemRw.textContent;

  return new Entry(word, meaningSet, note, relatedWord);
}

function processMeaningSet(item) {
  let itemPos = item.getElementsByClassName("lp_PartOfSpeech")[0];
  let partOfSpeech = typeof itemPos === "undefined" ? "" : itemPos.textContent;

  let itemMeaning = item.getElementsByClassName("lp_Gloss_English")[0];
  let meaning =
    typeof itemMeaning === "undefined" ? "" : itemMeaning.textContent;
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
function Entry(word, meaningSet, note, relatedWord) {
  this.word = word;
  this.meaningSet = [];
  this.meaningSet.push(meaningSet);
  this.note = note;
  this.relatedWord = relatedWord;
  // this.note = [];
  // this.noteSet.push(noteSet);
  // this.relatedWord = relatedWord;
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
 * @param {*} relatedWord
 */
function NoteSet(noteHeader, note, relatedWord) {
  this.noteHeader = noteHeader;
  this.note = note;
  this.relatedWord = relatedWord;
}
