const fetch = require("node-fetch");
require("dotenv").config();
const getItems = require("./parser");

const HOST = process.env.HOST;

const login = async () => {
  const url = HOST + "/prod-api/login";
  let token = "";
  await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      username: process.env.USER_NAME,
      password: process.env.PASSWORD,
    }),
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      token = response.token;
    })
    .catch((error) => {
      console.error(error);
    });
  return token;
};

const getBook = async (token) => {
  const url = HOST + "/prod-api/standard/materialResource/pending";

  let bookUrl = "";
  let bookId = -1;
  let hasBook = true;
  await fetch(url, {
    headers: { Authorization: token },
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      if (!response.data) {
        console.log("no more");
        hasBook = false;
      } else {
        let {
          data: { id, path },
        } = response;
        bookUrl = path;
        bookId = id;
      }
    })
    .catch((error) => {
      console.error(error);
    });

  if (hasBook) {
    await downloadBook(token, bookUrl, bookId);
  }

  return hasBook;
};

const downloadBook = async (token, bookUrl, standardId) => {
  await fetch(bookUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.arrayBuffer();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      getItems(response)
        .then((result) => {
          const filterResult = result.filter(({ title, content }) => {
            return title.split(" ").length > 1 && content.length > 0;
          });
          const finalResult = filterResult.map(({ title, content }) => {
            const [a, ...b] = title.split(" ");
            return {
              sn: a,
              title: b.join(" "),
              content: content.join(""), // need to add \n?
            };
          });
          saveBook(token, standardId, finalResult);
        })
        .catch((error) => {
          console.error(error);
        });
    })
    .catch((error) => {
      console.error(error);
    });
};

const saveBook = async (token, standardId, content) => {
  const url = HOST + "/prod-api/standard/contentparse/batchadd";

  await fetch(url, {
    method: "post",
    body: JSON.stringify({
      standardId,
      contentParseItems: content,
    }),
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
    },
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      console.log("saveBook", response);
    })
    .catch((error) => {
      console.error(error);
    });
};

const updateCache = async (token) => {
  const url = HOST + "/prod-api/standard/comparison/generateIndex";
  await fetch(url, {
    headers: { Authorization: token },
  })
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      console.log("updateCache", response);
    })
    .catch((error) => {
      console.error(error);
    });
};

module.exports = {
  login,
  getBook,
  updateCache,
};

//http://39.101.73.250:8069/prod-api/profile/upload/2023/04/03/信息安全技术+办公信息系统安全基本技术要求_20230403012010A012.pdf
// downloadBook(
//   "eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjJjOTdlODU2LTIyMjItNGZhNi04YjY2LTM2OTZjYmFjOGNiMSJ9.QW7tyq1mFWP3PWjeXK12dxXIhqCiumYmUSyPynN2aMdSgZD0VRevO8WxEwMGnkyzQS-Nm8BWyRWb0gkHNaF59g",
//   HOST + "/prod-api/profile/upload/2023/03/31/信息安全技术+云计算网络入侵防御系统安全技术要求_20230331215705A001.pdf",
//   1
// );

// const resetGetBook = async (token, id) => {
//   const url = HOST + "/prod-api/standard/materialResource/reset";

//   const headers = new Headers({
//     "Content-Type": "application/json",
//     Authorization: token,
//   });

//   const request = new Request(url, {
//     method: "POST",
//     headers,
//     body: `{"standardId": ${id}}`,
//   });

//   await fetch(request)
//     .then((response) => {
//       if (response.status === 200) {
//         return response.json();
//       } else {
//         throw new Error("Something went wrong on API server!");
//       }
//     })
//     .then((response) => {
//       console.log("reset", response);
//     })
//     .catch((error) => {
//       console.error(error);
//     });
// };
