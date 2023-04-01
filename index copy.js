const pdfjs = require("pdfjs-dist/legacy/build/pdf.js");

async function getInfo(src) {
  const doc = await pdfjs.getDocument(src).promise; // note the use of the property promise
  const page = await doc.getPage(2); // assume page 2 start to have header and foooter
  const content = await page.getTextContent();

  const contentStr = content.items.reduce((acc, item) => {
    return acc + item.str + (item.hasEOL ? "|" : "");
  }, "");

  const contentInLines = contentStr.split("|");

  const footer =
    contentInLines.length > 0 ? contentInLines[contentInLines.length - 1] : "";
  const header =
    contentInLines.length > 1 ? contentInLines[contentInLines.length - 2] : "";
  console.log("a===aaaa", contentInLines, "fo", footer, "header", header);
  return { header, footer, doc };
}

async function getContent(src) {
  const doc = await pdfjs.getDocument(src).promise; // note the use of the property promise
  console.log(
    "leon",
    await doc.getOptionalContentConfig(),
    "a",
    await doc.getPermissions(),
    "b",
    doc.allXfaHtml
  );
  const pageContent = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pageContent.push(...content.items);
  }
  return pageContent;
}

async function getItems(src) {
  // Perform checks

  const { header, footer, doc } = await getInfo(src);

  const content = await getContent(src);
  console.log("aaaddd", header, footer,);
  /**
   * Expect content.items to have the following structure
   * [{
   *  str: '1',
   *  dir: 'ltr',
   *  width: 4.7715440000000005,
   *  height: 9.106,
   *  transform: [ 9.106, 0, 0, 9.106, 53.396, 663.101 ],
   *  fontName: 'g_d0_f2'
   * }, ...]
   */
  const contentStr = content.reduce((acc, item) => {
    return acc + item.str + (item.hasEOL ? "|" : "");
  }, "");

  const contentInLines = contentStr.split("|");

  console.log("a===!!", contentInLines);

  const result = [];
  let obj = { content: [] };
  contentInLines.map((line) => {

    // console.log('sdsfsdfsdf', line)

    line = line.replace(header, '').replace(footer, '')

    // console.log('sdsfsdfs====df', obj["content"])
    // if (
    //   line.startsWith(header) &&
    //   obj["content"][obj.content.length - 1] &&
    //   obj["content"][obj.content.length - 1].match(/^\d+$/g)
    // ) {
    //   console.log('sdsfsdfs====df', line)
    //   obj["content"].pop();
    // } else {
    //   if (!line.startsWith(footer)) {
        // if (line.match(/^\d+$|^[\d\.]+$|^[\d\.]+\s+[^\d]*$/g)) {
        if (line.match(/^\d+$|^[\d\.]+$|^[\d\.]+\s+/g)) {
          result.push(obj);
          obj = {};//Object.assign({}, obj);
          obj["title"] = line;
          obj["content"] = [];
        } else {
          obj["content"].push(line);
        }
    //   }
    // }
  });
  console.log("res", result);


  result.forEach((item, idx) => {
    if(item.content.length > 0 && item.content[0] === '') {
      const [a, ...b] = item.content;
      console.log('!!!!', b)
      result[idx - 1].content.push(...b)
      result.splice(idx, 1);
    }
  })

  console.log("res", result);
  // you can do the following on content.items
  return content.map((item) => item.str);
  // This is a new array of strings from the str property
  // Expected output: ['1', '06/02/2013', '$1,500.00', 'job 1, check 1', 'yes', 'deposit',...]
}

getItems("1.pdf");
