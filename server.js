const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const ws = require("ws");
const zlib = require("zlib");
const fs = require("fs");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const signalrUrl = "livetiming.formula1.com/signalr";
const signalrHub = "Streaming";

const socketFreq = 250;
const retryFreq = 10000;

let state = {};
let messageCount = 0;
let emptyMessageCount = 0;

const deepObjectMerge = (original = {}, modifier) => {
  if (!modifier) return original;
  const copy = { ...original };
  for (const [key, value] of Object.entries(modifier)) {
    const valueIsObject =
      typeof value === "object" && !Array.isArray(value) && value !== null;
    if (valueIsObject && !!Object.keys(value).length) {
      copy[key] = deepObjectMerge(copy[key], value);
    } else {
      copy[key] = value;
    }
  }
  return copy;
};

const parseCompressed = (data) =>
  JSON.parse(zlib.inflateRawSync(Buffer.from(data, "base64")).toString());

const updateState = (data) => {
  try {
    const parsed = JSON.parse(data.toString());

    if (!Object.keys(parsed).length) emptyMessageCount++;
    else emptyMessageCount = 0;

    if (emptyMessageCount > 5 && !dev) {
      state = {};
      messageCount = 0;
    }

    if (Array.isArray(parsed.M)) {
      for (const message of parsed.M) {
        if (message.M === "feed") {
          messageCount++;

          let [field, value] = message.A;

          if (field === "CarData.z" || field === "Position.z") {
            const [parsedField] = field.split(".");
            field = parsedField;
            value = parseCompressed(value);
          }

          state = deepObjectMerge(state, { [field]: value });
        }
      }
    } else if (Object.keys(parsed.R ?? {}).length && parsed.I === "1") {
      messageCount++;

      if (parsed.R["CarData.z"])
        parsed.R["CarData"] = parseCompressed(parsed.R["CarData.z"]);

      if (parsed.R["Position.z"])
        parsed.R["Position"] = parseCompressed(parsed.R["Position.z"]);

      state = deepObjectMerge(state, parsed.R);
    }
  } catch (e) {
    console.error(`could not update data: ${e}`);
  }
};

const setupStream = async (wss) => {
  console.log("connecting to live timing stream...");

  const hub = encodeURIComponent(JSON.stringify([{ name: signalrHub }]));
  const negotiation = await fetch(
    `https://${signalrUrl}/negotiate?connectionData=${hub}&clientProtocol=1.5`
  );
  const cookie =
    negotiation.headers.get("Set-Cookie") ??
    negotiation.headers.get("set-cookie");
  const { ConnectionToken } = await negotiation.json();

  if (cookie && ConnectionToken) {
    console.log("negotiation complete");

    const socket = new ws(
      `wss://${signalrUrl}/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodeURIComponent(
        ConnectionToken
      )}&connectionData=${hub}`,
      [],
      {
        headers: {
          "User-Agent": "BestHTTP",
          "Accept-Encoding": "gzip,identity",
          Cookie: cookie,
        },
      }
    );

    socket.on("open", () => {
      console.log("websocket open");

      state = {};

      socket.send(
        JSON.stringify({
          H: signalrHub,
          M: "Subscribe",
          A: [
            [
              "Heartbeat",
              "CarData.z",
              "Position.z",
              "ExtrapolatedClock",
              "TopThree",
              "RcmSeries",
              "TimingStats",
              "TimingAppData",
              "WeatherData",
              "TrackStatus",
              "DriverList",
              "RaceControlMessages",
              "SessionInfo",
              "SessionData",
              "LapCount",
              "TimingData",
            ],
          ],
          I: 1,
        })
      );
    });

    socket.on("message", (data) => {
      updateState(data);
    });

    socket.on("error", () => {
      console.log("socket error");
      socket.close();
    });

    socket.on("close", () => {
      console.log("socket close");
      state = {};
      messageCount = 0;

      setTimeout(() => {
        setupStream(wss);
      }, retryFreq);
    });
  } else {
    console.log("negotiation failed. is there a live session?");
    state = {};
    messageCount = 0;

    setTimeout(() => {
      setupStream(wss);
    }, retryFreq);
  }
};

app.prepare().then(async () => {
  const wss = new ws.WebSocketServer({ port: port + 1 });

  const active = messageCount > 5 || dev;

  // Assume we have an active session after 5 messages
  setInterval(
    () => {
      wss.clients.forEach((s) => {
        if (s.readyState === ws.OPEN) {
          s.send(active ? JSON.stringify(state) : "{}", {
            binary: false,
          });
        }
      });
    },
    active ? socketFreq : retryFreq
  );

  await setupStream(wss);

  // const testSend = (m, i) => {
  //   setTimeout(() => {
  //     console.log(i);
  //     updateState(
  //       JSON.stringify({
  //         M: [
  //           {
  //             M: "feed",
  //             A: JSON.parse(
  //               m[i]
  //                 .replaceAll("'", '"')
  //                 .replaceAll("True", "true")
  //                 .replaceAll("False", "false")
  //             ),
  //           },
  //         ],
  //       })
  //     );
  //     testSend(m, i + 1);
  //   }, 50);
  // };
  //
  // const testFile = fs.readFileSync("./2021_1_FP3.txt", "utf-8");
  // const testMessages = testFile.split("\n");
  // testSend(testMessages, 0);

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  })
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
