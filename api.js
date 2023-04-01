const getItems = require("./parser");

require("dotenv").config();

const HOST = process.env.HOST;

const login = async () => {
  const url = HOST + "/prod-api/login";

  const USER_NAME = process.env.USER_NAME;
  const PASSWORD = process.env.PASSWORD;

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  const request = new Request(url, {
    method: "POST",
    headers,
    body: `{"username": "${USER_NAME}", "password":"${PASSWORD}"}`,
  });

  let token = "";
  await fetch(request)
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

const resetGetBook = async (token, id) => {
  const url = HOST + "/prod-api/standard/materialResource/reset";

  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: token,
  });

  const request = new Request(url, {
    method: "POST",
    headers,
    body: `{"standardId": ${id}}`,
  });

  await fetch(request)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      console.log("reset", response);
    })
    .catch((error) => {
      console.error(error);
    });
};

const getBook = async (token) => {
  const url = HOST + "/prod-api/standard/materialResource/pending";

  const headers = new Headers({
    Authorization: token,
  });

  const request = new Request(url, {
    headers,
  });

  let bookUrl = "";
  let bookId = -1;
  let result = true;
  await fetch(request)
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
        result = false;
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

  if (result) {
    await downloadBook(token, bookUrl, bookId);
  }

  return result;
};

const downloadBook = async (token, bookUrl, standardId) => {
  await fetch(bookUrl)
    .then((response) => {
      if (response.status === 200) {
        return response.arrayBuffer();
      } else {
        console.log("error", response)
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      getItems(response).then((result) => {
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
        console.log("bb", finalResult);
        saveBook(token, standardId, finalResult);
      });
    })
    .catch((error) => {
      console.error(error);
    });
};

const saveBook = async (token, standardId, content) => {
  const url = HOST + "/prod-api/standard/contentparse/batchadd";

  const headers = new Headers({
    "Content-Type": "application/json",
    Authorization: token,
  });

  const request = new Request(url, {
    method: "POST",
    headers,
    body: `{"standardId": ${standardId}, "contentParseItems": ${JSON.stringify(
      content
    )}}`,
  });

  await fetch(request)
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

const call = async (token) => {
  const url = HOST + "/prod-api/standard/comparison/generateIndex";

  const headers = new Headers({
    Authorization: token,
  });

  const request = new Request(url, {
    headers,
  });

  await fetch(request)
    .then((response) => {
      if (response.status === 200) {
        return response.json();
      } else {
        throw new Error("Something went wrong on API server!");
      }
    })
    .then((response) => {
      console.log("call", response);
    })
    .catch((error) => {
      console.error(error);
    });
};

const run = async () => {
  const token = await login();
  // await resetGetBook(token, 1);
  // return
  let hasMore = true;
  while (hasMore) {
    hasMore = await getBook(token);
  }
  await call(token);
};

// todo scheduler

run();

// downloadBook(
//   "eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6IjJjOTdlODU2LTIyMjItNGZhNi04YjY2LTM2OTZjYmFjOGNiMSJ9.QW7tyq1mFWP3PWjeXK12dxXIhqCiumYmUSyPynN2aMdSgZD0VRevO8WxEwMGnkyzQS-Nm8BWyRWb0gkHNaF59g",
//   HOST + "/prod-api/profile/upload/2023/03/31/信息安全技术+云计算网络入侵防御系统安全技术要求_20230331215705A001.pdf",
//   1
// );
