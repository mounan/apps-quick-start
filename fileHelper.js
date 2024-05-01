const fs = require("fs");
let ejs = require("ejs");
const { v4: uuidv4 } = require("uuid");
const got = require("got");
const Blob = require("node-blob");

const MAX_BODY_SIZE = 5 * 1024 * 1024; // 5mb

async function parseFile(req) {
  const fileContent = await getContent(req.file);

  let isTranslation = false;

  if (req.targetLanguages.length && req.targetLanguages[0].id) {
    isTranslation = true;
  }

  const sourceStrings = [];
  const previewStrings = [];

  let previewIndex = 0;

  if (fileContent[Object.keys(fileContent)[0]]) {
    for (const key in fileContent) {
      if (typeof fileContent[key] !== "string") {
        continue;
      }

      let translations = {};

      if (isTranslation) {
        const languageId = req.targetLanguages[0].id;
        translations = { [languageId]: { text: fileContent[key] } };
      }

      sourceStrings.push({
        identifier: key,
        context: `Some context: \n ${fileContent[key]}`,
        customData: "",
        previewId: previewIndex,
        labels: [],
        isHidden: false,
        text: fileContent[key],
        translations: translations,
      });

      previewStrings[key] = {
        text: fileContent[key],
        id: previewIndex,
      };

      previewIndex++;
    }
  }

  let previewHtml = "";

  try {
    const previewEjs = fs.readFileSync(
      "resources/views/file-preview.ejs",
      "utf8"
    );

    let ejsTemplate = ejs.compile(previewEjs);

    previewHtml = ejsTemplate({
      fileName: req.file.name,
      strings: previewStrings,
    });
  } catch (err) {
    console.error(err);
  }

  if (new Blob([JSON.stringify(sourceStrings)]).size < MAX_BODY_SIZE) {
    return {
      data: {
        strings: sourceStrings,
        preview: Buffer.from(previewHtml).toString("base64"),
      },
    };
  }

  return {
    data: {
      stringsUrl: getDownloadUrl(JSON.stringify(sourceStrings)),
      previewUrl: getDownloadUrl(previewHtml),
    },
  };
}

async function buildFile(req) {
  const fileContent = await getContent(req.file);

  const languageId = req.targetLanguages[0].id;

  const translations = await getStringsForExport(req);

  if (!fileContent[Object.keys(fileContent)[0]]) {
    throw "Nothing to translate";
  }

  for (const key of Object.keys(fileContent)) {
    if (typeof fileContent[key] !== "string") {
      continue;
    }

    fileContent[key] = getTranslation(
      translations,
      key,
      languageId,
      fileContent[key]
    );
  }

  const responseContent = JSON.stringify(fileContent, null, 2);

  if (new Blob([responseContent]).size < MAX_BODY_SIZE) {
    return {
      data: {
        content: Buffer.from(responseContent).toString("base64"),
      },
    };
  }

  return {
    data: {
      contentUrl: getDownloadUrl(responseContent),
    },
  };
}

function getDownloadUrl(fileContents) {
  const tmpFileName = uuidv4();

  fs.writeFileSync("/tmp/" + tmpFileName, fileContents);

  return `${process.env.BASE_URL}/download?file=` + tmpFileName;
}

async function getContent(file) {
  if (file.content) {
    return JSON.parse(Buffer.from(file.content, "base64").toString());
  }

  return (await got(file.contentUrl, { json: true })).body;
}

function getTranslation(
  translations,
  stringId,
  languageId,
  fallbackTranslation
) {
  for (let i = 0; i < translations.length; i++) {
    if (translations[i].identifier === stringId) {
      return translations[i].translations[languageId].text;
    }
  }

  return fallbackTranslation;
}

async function getStringsForExport(req) {
  if (!req.strings && !req.stringsUrl) {
    throw "Bad payload received: No strings found";
  }

  if (req.strings) {
    return req.strings;
  }

  return (await got(req.stringsUrl, { json: true })).body;
}

module.exports = {
  parseFile,
  buildFile,
};
