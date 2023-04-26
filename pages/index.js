import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import ResponsiveTable from "@monaco/components/ResponsiveTable";
import Driver, { TableHeader } from "@monaco/components/Driver";
import Radio from "@monaco/components/Radio";
import Map from "@monaco/components/Map";
import Input from "@monaco/components/Input";

const f1Url = "https://livetiming.formula1.com";

const sortPosition = (a, b) => {
  const [, aLine] = a;
  const [, bLine] = b;
  const aPos = Number(aLine.Position);
  const bPos = Number(bLine.Position);
  return aPos - bPos;
};

const sortUtc = (a, b) => {
  const aDate = new Date(a.Utc);
  const bDate = new Date(b.Utc);
  if (aDate < bDate) return 1;
  if (aDate > bDate) return -1;
  return 0;
};

const getFlagColour = (flag) => {
  switch (flag?.toLowerCase()) {
    case "green":
      return { bg: "green" };
    case "yellow":
    case "double yellow":
      return { bg: "yellow", fg: "var(--colour-bg)" };
    case "red":
      return { bg: "red" };
    case "blue":
      return { bg: "blue" };
    default:
      return { bg: "transparent" };
  }
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [liveState, setLiveState] = useState({});
  const [updated, setUpdated] = useState(new Date());
  const [delayMs, setDelayMs] = useState(0);
  const [delayTarget, setDelayTarget] = useState(0);
  const [blocking, setBlocking] = useState(false);
  const [triggerConnection, setTriggerConnection] = useState(0);
  const [triggerTick, setTriggerTick] = useState(0);

  const socket = useRef();
  const retry = useRef();

  const initWebsocket = (handleMessage) => {
    if (retry.current) {
      clearTimeout(retry.current);
      retry.current = undefined;
    }

    const wsUrl =
      `${window.location.protocol.replace("http", "ws")}//` +
      window.location.hostname +
      (window.location.port ? `:${window.location.port}` : "") +
      "/ws";

    const ws = new WebSocket(wsUrl);

    ws.addEventListener("open", () => {
      setConnected(true);
    });

    ws.addEventListener("close", () => {
      setConnected(false);
      setBlocking((isBlocking) => {
        if (!retry.current && !isBlocking)
          retry.current = window.setTimeout(() => {
            initWebsocket(handleMessage);
          }, 1000);
      });
    });

    ws.addEventListener("error", () => {
      ws.close();
    });

    ws.addEventListener("message", ({ data }) => {
      setTimeout(() => {
        handleMessage(data);
      }, delayMs);
    });

    socket.current = ws;
  };

  useEffect(() => {
    setLiveState({});
    setBlocking(false);
    initWebsocket((data) => {
      try {
        const d = JSON.parse(data);
        setLiveState(d);
        setUpdated(new Date());
      } catch (e) {
        console.error(`could not process message: ${e}`);
      }
    });
  }, [triggerConnection]);

  useEffect(() => {
    if (blocking) {
      socket.current?.close();
      setTimeout(() => {
        setTriggerConnection((n) => n + 1);
      }, 100);
    }
  }, [blocking]);

  useEffect(() => {
    let interval;
    if (Date.now() < delayTarget) {
      interval = setInterval(() => {
        setTriggerTick((n) => n + 1);
        if (Date.now() >= delayTarget) clearInterval(interval);
      }, 250);
    }
  }, [delayTarget]);

  const messageCount =
    Object.values(liveState?.RaceControlMessages?.Messages ?? []).length +
    Object.values(liveState?.SessionData?.StatusSeries ?? []).length +
    Object.values(liveState?.TeamRadio?.Captures ?? []).length;
  useEffect(() => {
    if (messageCount > 0) new Audio("/notif.mp3").play();
  }, [messageCount]);

  if (!connected)
    return (
      <>
        <Head>
          <title>No connection</title>
        </Head>
        <main>
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ marginBottom: "var(--space-4)" }}>
              <strong>NO CONNECTION</strong>
            </p>
            <button onClick={() => window.location.reload()}>RELOAD</button>
          </div>
        </main>
      </>
    );

  if (Date.now() < delayTarget)
    return (
      <>
        <Head>
          <title>Syncing</title>
        </Head>
        <main>
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ marginBottom: "var(--space-4)" }}>
              <strong>SYNCING...</strong>
            </p>
            <p>{(delayTarget - Date.now()) / 1000} sec</p>
          </div>
        </main>
      </>
    );

  const {
    Heartbeat,
    SessionInfo,
    TrackStatus,
    LapCount,
    ExtrapolatedClock,
    WeatherData,
    DriverList,
    SessionData,
    RaceControlMessages,
    TimingData,
    TimingAppData,
    TimingStats,
    CarData,
    Position,
    TeamRadio,
  } = liveState;

  if (!Heartbeat)
    return (
      <>
        <Head>
          <title>No session</title>
        </Head>
        <main>
          <div
            style={{
              width: "100vw",
              height: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <p style={{ marginBottom: "var(--space-4)" }}>
              <strong>NO SESSION</strong>
            </p>
            <p>Come back later when there is a live session</p>
          </div>
        </main>
      </>
    );

  const extrapolatedTimeRemaining =
    ExtrapolatedClock.Utc && ExtrapolatedClock.Remaining
      ? ExtrapolatedClock.Extrapolating
        ? moment
            .utc(
              Math.max(
                moment
                  .duration(ExtrapolatedClock.Remaining)
                  .subtract(moment().diff(moment(ExtrapolatedClock.Utc)))
                  .asMilliseconds() + delayMs,
                0
              )
            )
            .format("HH:mm:ss")
        : ExtrapolatedClock.Remaining
      : undefined;

  return (
    <>
      <Head>
        <title>
          {SessionInfo.Meeting.Circuit.ShortName}: {SessionInfo.Name}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "var(--space-3)",
              borderBottom: "1px solid var(--colour-border)",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              {!!SessionInfo && (
                <>
                  <p style={{ marginRight: "var(--space-4)" }}>
                    <strong>{SessionInfo.Meeting.OfficialName}</strong>,{" "}
                    {SessionInfo.Meeting.Circuit.ShortName},{" "}
                    {SessionInfo.Meeting.Country.Name}
                  </p>
                  <p style={{ marginRight: "var(--space-4)" }}>
                    Session: {SessionInfo.Name}
                  </p>
                </>
              )}
              {!!TrackStatus && (
                <p style={{ marginRight: "var(--space-4)" }}>
                  Status: {TrackStatus.Message}
                </p>
              )}
              {!!LapCount && (
                <p style={{ marginRight: "var(--space-4)" }}>
                  Lap: {LapCount.CurrentLap}/{LapCount.TotalLaps}
                </p>
              )}
              {!!extrapolatedTimeRemaining && (
                <p style={{ marginRight: "var(--space-4)" }}>
                  Remaining: {extrapolatedTimeRemaining}
                </p>
              )}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <p style={{ marginRight: "var(--space-4)" }}>
                Data updated: {moment(updated).format("HH:mm:ss.SSS")}
              </p>
              <p style={{ color: "limegreen", marginRight: "var(--space-4)" }}>
                CONNECTED
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const form = new FormData(e.target);
                  const delayMsValue = Number(form.get("delayMs"));
                  setBlocking(true);
                  setDelayMs(delayMsValue);
                  setDelayTarget(Date.now() + delayMsValue);
                }}
                style={{ display: "flex", alignItems: "center" }}
              >
                <p style={{ marginRight: "var(--space-2)" }}>Delay</p>
                <Input
                  type="number"
                  name="delayMs"
                  defaultValue={delayMs}
                  style={{ width: "75px", marginRight: "var(--space-2)" }}
                />
                <p style={{ marginRight: "var(--space-4)" }}>ms</p>
              </form>
              <a
                href="https://github.com/tdjsnelling/monaco"
                target="_blank"
                style={{ color: "grey" }}
              >
                tdjsnelling/monaco
              </a>
            </div>
          </div>

          {!!WeatherData && (
            <div
              style={{
                display: "flex",
                padding: "var(--space-3)",
                borderBottom: "1px solid var(--colour-border)",
                overflowX: "auto",
              }}
            >
              <p style={{ marginRight: "var(--space-4)" }}>
                <strong>WEATHER</strong>
              </p>
              {Object.entries(WeatherData).map(([k, v]) =>
                k !== "_kf" ? (
                  <p
                    key={`weather-${k}`}
                    style={{ marginRight: "var(--space-4)" }}
                  >
                    {k}: {v}
                  </p>
                ) : null
              )}
            </div>
          )}
        </>

        <div>
          <div
            style={{
              padding: "var(--space-2) var(--space-3)",
              backgroundColor: "var(--colour-offset)",
            }}
          >
            <p>
              <strong>LIVE TIMING DATA</strong>
            </p>
          </div>
          <ResponsiveTable
            style={{
              gridTemplateColumns: !TimingData ? "1fr" : undefined,
            }}
          >
            {!!TimingData && !!CarData ? (
              <>
                {(() => {
                  const lines = Object.entries(TimingData.Lines).sort(
                    sortPosition
                  );
                  return (
                    <>
                      <div
                        style={{
                          borderRight: "1px solid var(--colour-border)",
                        }}
                      >
                        <TableHeader />
                        {lines.slice(0, 10).map(([racingNumber, line]) => (
                          <Driver
                            key={`timing-data-${racingNumber}`}
                            racingNumber={racingNumber}
                            line={line}
                            DriverList={DriverList}
                            CarData={CarData}
                            TimingAppData={TimingAppData}
                            TimingStats={TimingStats}
                          />
                        ))}
                      </div>
                      <div>
                        <TableHeader />
                        {lines
                          .slice(10, 20)
                          .map(([racingNumber, line], pos) => (
                            <Driver
                              key={`timing-data-${racingNumber}`}
                              racingNumber={racingNumber}
                              line={line}
                              DriverList={DriverList}
                              CarData={CarData}
                              TimingAppData={TimingAppData}
                              TimingStats={TimingStats}
                            />
                          ))}
                      </div>
                    </>
                  );
                })()}
              </>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <p>NO DATA YET</p>
              </div>
            )}
          </ResponsiveTable>
        </div>

        <ResponsiveTable
          cols="2fr 2fr 1fr"
          style={{
            borderBottom: "1px solid var(--colour-border)",
          }}
        >
          <div style={{ borderRight: "1px solid var(--colour-border)" }}>
            <div
              style={{
                padding: "var(--space-2) var(--space-3)",
                backgroundColor: "var(--colour-offset)",
              }}
            >
              <p>
                <strong>TRACK</strong>
              </p>
            </div>
            {!!Position ? (
              <Map
                circuit={SessionInfo.Meeting.Circuit.Key}
                Position={Position.Position[Position.Position.length - 1]}
                DriverList={DriverList}
                TimingData={TimingData}
                TrackStatus={TrackStatus}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "400px",
                }}
              >
                <p>NO DATA YET</p>
              </div>
            )}
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              borderRight: "1px solid var(--colour-border)",
            }}
          >
            <div
              style={{
                padding: "var(--space-2) var(--space-3)",
                backgroundColor: "var(--colour-offset)",
              }}
            >
              <p>
                <strong>RACE CONTROL MESSAGES</strong>
              </p>
            </div>
            {!!RaceControlMessages ? (
              <ul
                style={{
                  listStyle: "none",
                  height: "200px",
                  overflow: "auto",
                  flexGrow: 1,
                }}
              >
                {[
                  ...Object.values(RaceControlMessages.Messages),
                  ...Object.values(SessionData.StatusSeries),
                ]
                  .sort(sortUtc)
                  .map((event, i) => (
                    <li
                      key={`race-control-${event.Utc}-${i}`}
                      style={{ padding: "var(--space-3)", display: "flex" }}
                    >
                      <span
                        style={{
                          color: "grey",
                          whiteSpace: "nowrap",
                          marginRight: "var(--space-4)",
                        }}
                      >
                        {moment(event.Utc).format("HH:mm:ss")}
                        {event.Lap && ` / Lap ${event.Lap}`}
                      </span>
                      {event.Category === "Flag" && (
                        <span
                          style={{
                            backgroundColor: getFlagColour(event.Flag).bg,
                            color:
                              getFlagColour(event.Flag).fg ??
                              "var(--colour-fg)",
                            border: "1px solid var(--colour-border)",
                            borderRadius: "var(--space-1)",
                            padding: "0 var(--space-2)",
                            marginRight: "var(--space-3)",
                          }}
                        >
                          FLAG
                        </span>
                      )}
                      {event.Message && <span>{event.Message.trim()}</span>}
                      {event.TrackStatus && (
                        <span>TrackStatus: {event.TrackStatus}</span>
                      )}
                      {event.SessionStatus && (
                        <span>SessionStatus: {event.SessionStatus}</span>
                      )}
                    </li>
                  ))}
              </ul>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <p>NO DATA YET</p>
              </div>
            )}
          </div>

          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "var(--space-2) var(--space-3)",
                backgroundColor: "var(--colour-offset)",
              }}
            >
              <p>
                <strong>TEAM RADIO</strong>
              </p>
            </div>
            {!!TeamRadio ? (
              <ul
                style={{
                  listStyle: "none",
                  height: "200px",
                  overflow: "auto",
                  flexGrow: 1,
                }}
              >
                {[...Object.values(TeamRadio.Captures).sort(sortUtc)].map(
                  (radio, i) => {
                    const driver = DriverList[radio.RacingNumber];
                    return (
                      <Radio
                        key={`team-radio-${radio.Utc}-${i}`}
                        radio={radio}
                        path={`${f1Url}/static/${SessionInfo.Path}${radio.Path}`}
                        driver={driver}
                      />
                    );
                  }
                )}
              </ul>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                }}
              >
                <p>NO DATA YET</p>
              </div>
            )}
          </div>
        </ResponsiveTable>
      </main>
    </>
  );
}
