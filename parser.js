const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

async function getInfo(src) {
  const doc = await pdfjs.getDocument(src).promise; // note the use of the property promise
  const page = await doc.getPage(3); // assume page  start to have header and foooter
  const content = await page.getTextContent();
  const contentStr = content.items.reduce((acc, item) => {
    return acc + item.str + (item.hasEOL ? "|" : "");
  }, "");
  const contentInLines = contentStr.split("|");
  const footer =
    contentInLines.length > 0 ? contentInLines[contentInLines.length - 1] : "";
  const header =
    contentInLines.length > 1 ? contentInLines[contentInLines.length - 2] : "";
  console.log("getInfo", contentInLines, "footer", footer, "header", header);
  return { header, footer, doc };
}

async function getContent(src) {
  const doc = await pdfjs.getDocument(src).promise; // note the use of the property promise
  const pageContent = [];
  let startIndex = 1;
  for (let i = 3; i < doc.numPages; i++) {
    // do not process the last page
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const idx = content.items.findIndex((i) => i.str === "范围");
    if (idx > -1 && content.items[idx + 1].hasEOL) {
      startIndex = i;
      break;
    }
  }
  for (let i = startIndex; i < doc.numPages; i++) {
    // do not process the last page
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    if (content.items[0].str.startsWith("附录")) {
      break;
    }
    pageContent.push(...content.items);
  }
  return pageContent;
}

module.exports = async function getItems(src) {
  const { header, footer, doc } = await getInfo(src);
  const content = await getContent(src);
  const contentStr = content.reduce((acc, item) => {
    return acc + item.str + (item.hasEOL ? "|" : "");
  }, "");
  const contentInLines = contentStr.split("|");
  const result = [];
  let obj = { title: "", content: [] };
  contentInLines.map((line) => {
    line = line.replace(header, "").replace(footer, "");
    if (line.match(/^\d+$|^[\d\.]+$|^[\d\.]+\s+/g)) {
      result.push(obj);
      obj = {};
      obj["title"] = line;
      obj["content"] = [];
    } else {
      obj["content"].push(line);
    }
  });
  result.forEach((item, idx) => {
    if (item.content.length > 0 && item.content[0] === "") {
      const [a, ...b] = item.content;
      result[idx - 1].content.push(...b);
      result.splice(idx, 1);
    }
  });
  console.log("res", result);
  return result;
};
