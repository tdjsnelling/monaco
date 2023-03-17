import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import ResponsiveTable from "@monaco/components/ResponsiveTable";
import Driver from "@monaco/components/Driver";

const sortPosition = (a, b) => {
  const [, aLine] = a;
  const [, bLine] = b;
  const aPos = Number(aLine.Position);
  const bPos = Number(bLine.Position);
  return aPos - bPos;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [liveState, setLiveState] = useState({});
  const [updated, setUpdated] = useState(new Date());

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
      if (!retry.current)
        retry.current = window.setTimeout(() => {
          initWebsocket(handleMessage);
        }, 1000);
    });

    ws.addEventListener("error", () => {
      ws.close();
    });

    ws.addEventListener("message", ({ data }) => {
      handleMessage(data);
    });

    socket.current = ws;
  };

  useEffect(() => {
    if (!connected) {
      initWebsocket((data) => {
        try {
          const d = JSON.parse(data);
          setLiveState(d);
          setUpdated(new Date());
        } catch (e) {
          console.error(`could not process message: ${e}`);
        }
      });
    }
  }, []);

  const messageCount =
    Object.values(liveState?.RaceControlMessages?.Messages ?? []).length +
    Object.values(liveState?.SessionData?.StatusSeries ?? []).length;
  useEffect(() => {
    new Audio("/notif.mp3").play();
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
            <img
              src="/flag-light.png"
              alt="Checkered flag icon"
              style={{ width: "24px", marginBottom: "var(--space-4)" }}
            />
            <p style={{ marginBottom: "var(--space-4)" }}>
              <strong>NO CONNECTION</strong>
            </p>
            <button onClick={() => window.location.reload()}>RELOAD</button>
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
            <img
              src="/flag-light.png"
              alt="Checkered flag icon"
              style={{ width: "24px", marginBottom: "var(--space-4)" }}
            />
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
      ? moment
          .utc(
            Math.max(
              moment
                .duration(ExtrapolatedClock.Remaining)
                .subtract(moment().diff(moment(ExtrapolatedClock.Utc)))
                .asMilliseconds(),
              0
            )
          )
          .format("HH:mm:ss")
      : undefined;

  return (
    <>
      <Head>
        <title>
          {SessionInfo
            ? `${SessionInfo.Name} – ${SessionInfo.Meeting.Circuit.ShortName}`
            : "No event"}
        </title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main>
        <>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "var(--space-3)",
              borderBottom: "1px solid var(--colour-border)",
              overflowX: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
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
              }}
            >
              <p style={{ marginRight: "var(--space-4)" }}>
                Data updated: {moment(updated).format("HH:mm:ss.SSS")}
              </p>
              <p style={{ color: "limegreen", marginRight: "var(--space-4)" }}>
                CONNECTED
              </p>
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
            {!!TimingData ? (
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
                        {lines.slice(0, 10).map(([racingNumber, line], pos) => (
                          <Driver
                            key={`timing-data-${racingNumber}`}
                            racingNumber={racingNumber}
                            line={line}
                            lines={lines}
                            pos={pos}
                            DriverList={DriverList}
                            CarData={CarData}
                            TimingAppData={TimingAppData}
                            TimingStats={TimingStats}
                            Position={Position}
                          />
                        ))}
                      </div>
                      <div>
                        {lines
                          .slice(10, 20)
                          .map(([racingNumber, line], pos) => (
                            <Driver
                              key={`timing-data-${racingNumber}`}
                              racingNumber={racingNumber}
                              line={line}
                              lines={lines}
                              pos={pos}
                              DriverList={DriverList}
                              CarData={CarData}
                              TimingAppData={TimingAppData}
                              TimingStats={TimingStats}
                              Position={Position}
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
          cols="2fr 1fr"
          style={{
            borderBottom: "1px solid var(--colour-border)",
          }}
        >
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
                  height: "100px",
                  overflow: "auto",
                  flexGrow: 1,
                }}
              >
                {[
                  ...(Array.isArray(RaceControlMessages.Messages)
                    ? RaceControlMessages.Messages
                    : Object.values(RaceControlMessages.Messages)),
                ]
                  .reverse()
                  .map((event, i) => (
                    <li
                      key={`race-control-${event.Utc}-${i}`}
                      style={{ padding: "var(--space-3)" }}
                    >
                      <span
                        style={{ color: "grey", marginRight: "var(--space-4)" }}
                      >
                        {moment(event.Utc).format("HH:mm:ss")}
                        {event.Lap && ` / Lap ${event.Lap}`}
                      </span>
                      {event.Category === "Flag" && (
                        <span
                          style={{
                            backgroundColor: event.Flag?.toLowerCase(),
                            border: "1px solid var(--colour-border)",
                            borderRadius: "var(--space-1)",
                            padding: "0 var(--space-2)",
                            marginRight: "var(--space-3)",
                          }}
                        >
                          FLAG
                        </span>
                      )}
                      <span>{event.Message.trim()}</span>
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
                <strong>SESSION STATUS MESSAGES</strong>
              </p>
            </div>
            {!!SessionData ? (
              <ul
                style={{
                  listStyle: "none",
                  height: "100px",
                  overflow: "auto",
                  flexGrow: 1,
                }}
              >
                {[
                  ...(Array.isArray(SessionData.StatusSeries)
                    ? SessionData.StatusSeries
                    : Object.values(SessionData.StatusSeries)),
                ]
                  .reverse()
                  .map((event, i) => (
                    <li
                      key={`status-series-${event.Utc}-${i}`}
                      style={{ padding: "var(--space-3)" }}
                    >
                      <span
                        style={{ color: "grey", marginRight: "var(--space-4)" }}
                      >
                        {moment(event.Utc).format("HH:mm:ss")}
                      </span>
                      {Object.entries(event).map(([k, v]) =>
                        k !== "Utc" ? (
                          <span
                            key={`status-series-${event.Utc}-${k}`}
                            style={{ marginRight: "var(--space-4)" }}
                          >
                            {k}: {v}
                          </span>
                        ) : null
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
        </ResponsiveTable>
      </main>
    </>
  );
}
