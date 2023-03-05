const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const ws = require("ws");
const zlib = require("zlib");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

const URL = "livetiming.formula1.com/signalr";
const HUB = "Streaming";

const setupStream = async () => {
  const wss = new ws.WebSocketServer({ port: port + 1 });

  const hub = encodeURIComponent(JSON.stringify([{ name: HUB }]));
  const negotiation = await fetch(
    `https://${URL}/negotiate?connectionData=${hub}&clientProtocol=1.5`
  );
  const cookie = negotiation.headers.get("set-cookie");
  const { ConnectionToken } = await negotiation.json();

  if (cookie && ConnectionToken) {
    const socket = new ws(
      `wss://${URL}/signalr/connect?clientProtocol=1.5&transport=webSockets&connectionToken=${encodeURIComponent(
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
      socket.send(
        JSON.stringify({
          H: HUB,
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
      try {
        const parsed = JSON.parse(data.toString());

        if (parsed.R["CarData.z"]) {
          parsed.R.CarData = JSON.parse(
            zlib
              .inflateRawSync(Buffer.from(parsed.R["CarData.z"], "base64"))
              .toString()
          );
        }

        if (parsed.R["Position.z"]) {
          parsed.R.Position = JSON.parse(
            zlib
              .inflateRawSync(Buffer.from(parsed.R["Position.z"], "base64"))
              .toString()
          );
        }

        wss.clients.forEach((s) => {
          if (s.readyState === ws.OPEN) {
            s.send(data);
          }
        });
      } catch (e) {
        console.error(`could not send message: ${e}`);
      }
    });
  }
};

app.prepare().then(async () => {
  await setupStream();
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
