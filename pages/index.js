import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import moment from "moment";
import mock from "../mock.json";

const sortPosition = (a, b) => {
  const aPos = Number(a.Position);
  const bPos = Number(b.Position);
  return aPos - bPos;
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [liveState, setLiveState] = useState(mock.R);

  const socket = useRef();
  const retry = useRef();

  const initWebsocket = (handleMessage) => {
    if (retry.current) {
      clearTimeout(retry.current);
      retry.current = undefined;
    }

    const ws = new WebSocket("ws://localhost:3001");

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
      handleMessage(ws, data);
    });

    socket.current = ws;
  };

  useEffect(() => {
    if (!connected) {
      initWebsocket((ws, data) => {
        const { I, R } = JSON.parse(data);
        if (I === "1") {
          //setLiveState(R);
          console.log(R);
        }
      });
    }
  });

  const {
    Heartbeat,
    SessionInfo,
    TrackStatus,
    ExtrapolatedClock,
    WeatherData,
    DriverList,
    SessionData,
    RaceControlMessages,
    TimingData,
    TimingAppData,
  } = liveState;

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
        {!connected ? (
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
            <p style={{ marginBottom: "var(--space-4)" }}>no connection</p>
            <button onClick={() => window.location.reload()}>reload</button>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "var(--space-3)",
                borderBottom: "1px solid var(--colour-border)",
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
                      {SessionInfo.Meeting.OfficialName},{" "}
                      {SessionInfo.Meeting.Circuit.ShortName}
                    </p>
                    <p style={{ marginRight: "var(--space-4)" }}>
                      Session {SessionInfo.Name}
                    </p>
                  </>
                )}
                {!!TrackStatus && (
                  <p style={{ marginRight: "var(--space-4)" }}>
                    Status {TrackStatus.Message}
                  </p>
                )}
                {!!ExtrapolatedClock && (
                  <p style={{ marginRight: "var(--space-4)" }}>
                    Remaining {ExtrapolatedClock.Remaining}
                  </p>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                }}
              >
                <p style={{ marginRight: "var(--space-4)" }}>
                  Updated {moment(Heartbeat.Utc).format("HH:mm:ss")}
                </p>
                <p style={{ color: "green" }}>CONNECTED</p>
              </div>
            </div>

            {!!WeatherData && (
              <div
                style={{
                  display: "flex",
                  padding: "var(--space-3)",
                  borderBottom: "1px solid var(--colour-border)",
                }}
              >
                {Object.entries(WeatherData).map(([k, v]) =>
                  k !== "_kf" ? (
                    <p
                      key={`weather-${k}`}
                      style={{ marginRight: "var(--space-4)" }}
                    >
                      {k} {v}
                    </p>
                  ) : null
                )}
              </div>
            )}
          </>
        )}

        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--colour-border)",
          }}
        >
          {!!DriverList && (
            <div
              style={{
                width: "100%",
                borderRight: "1px solid var(--colour-border)",
              }}
            >
              <div
                style={{
                  padding: "var(--space-3)",
                  backgroundColor: "var(--colour-offset)",
                }}
              >
                <p>Entries</p>
              </div>
              <ul
                style={{ listStyle: "none", height: "200px", overflow: "auto" }}
              >
                {Object.values(DriverList).map((driver) =>
                  driver.RacingNumber ? (
                    <li
                      key={`driver-${driver.RacingNumber}`}
                      style={{ padding: "var(--space-3)" }}
                    >
                      {driver.RacingNumber} {driver.FullName} ({driver.Tla}){" "}
                      <span style={{ color: `#${driver.TeamColour}` }}>
                        {driver.TeamName}
                      </span>
                    </li>
                  ) : null
                )}
              </ul>
            </div>
          )}

          {!!SessionData && (
            <div
              style={{
                width: "100%",
                borderRight: "1px solid var(--colour-border)",
              }}
            >
              <div
                style={{
                  padding: "var(--space-3)",
                  backgroundColor: "var(--colour-offset)",
                }}
              >
                <p>Session status messages</p>
              </div>
              <ul
                style={{ listStyle: "none", height: "200px", overflow: "auto" }}
              >
                {[...SessionData.StatusSeries].reverse().map((event) => (
                  <li
                    key={`status-series-${event.Utc}`}
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
                          {k} {v}
                        </span>
                      ) : null
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!!RaceControlMessages && (
            <div
              style={{
                width: "100%",
                borderRight: "1px solid var(--colour-border)",
              }}
            >
              <div
                style={{
                  padding: "var(--space-3)",
                  backgroundColor: "var(--colour-offset)",
                }}
              >
                <p>Race control messages</p>
              </div>
              <ul
                style={{ listStyle: "none", height: "200px", overflow: "auto" }}
              >
                {[...RaceControlMessages.Messages].reverse().map((event) => (
                  <li
                    key={`race-control-${event.Utc}`}
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
                          key={`race-control-${event.Utc}-${k}`}
                          style={{ marginRight: "var(--space-4)" }}
                        >
                          {k} {v}
                        </span>
                      ) : null
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div
          style={{
            borderBottom: "1px solid var(--colour-border)",
          }}
        >
          <div
            style={{
              padding: "var(--space-3)",
              backgroundColor: "var(--colour-offset)",
            }}
          >
            <p>Timing data</p>
          </div>
          <ul style={{ listStyle: "none", height: "300px", overflow: "auto" }}>
            {!!TimingData &&
              Object.values(TimingData.Lines)
                .sort(sortPosition)
                .map((line, pos) => {
                  const driver = DriverList[line.RacingNumber];

                  let bestLapTire;
                  if (SessionInfo.Name === "Qualifying") {
                    const bestLapNumber = line.BestLapTime.Lap;
                    const validStints = TimingAppData.Lines[
                      line.RacingNumber
                    ].Stints.filter((s) => s.LapNumber < bestLapNumber);
                    bestLapTire = validStints[validStints.length - 1]?.Compound;
                  }

                  return (
                    <li
                      key={`timing-data-${line.RacingNumber}`}
                      style={{
                        padding: "var(--space-3)",
                        display: "grid",
                        gridTemplateColumns: "repeat(15, 100px)",
                        gridGap: "var(--space-4)",
                      }}
                    >
                      <span>{line.Position}</span>
                      <span style={{ color: `#${driver.TeamColour}` }}>
                        {line.RacingNumber} {driver.Tla}
                      </span>
                      {SessionInfo.Name === "Qualifying" && (
                        <>
                          <span>{line.BestLapTime.Value}</span>
                          {line.Sectors.map((sector, i) => (
                            <span
                              key={`timing-data-${line.RacingNumber}-sector-${i}`}
                              style={{
                                color: sector.OverallFastest
                                  ? "magenta"
                                  : sector.PersonalFastest
                                  ? "limegreen"
                                  : "var(--colour-fg)",
                              }}
                            >
                              {sector.Value || sector.PreviousValue}{" "}
                              {pos > 0 && (
                                <>
                                  {!!line.Stats[i].TimeDiffToFastest && (
                                    <>
                                      <br />
                                      <span style={{ color: "grey" }}>
                                        P1 {line.Stats[i].TimeDiffToFastest}
                                      </span>
                                    </>
                                  )}
                                  {!!line.Stats[i].TimeDifftoPositionAhead && (
                                    <>
                                      <br />
                                      <span style={{ color: "grey" }}>
                                        P{pos}{" "}
                                        {line.Stats[i].TimeDifftoPositionAhead}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </span>
                          ))}
                          <span>{bestLapTire}</span>
                          <span>
                            {line.PitOut
                              ? "OUT LAP"
                              : line.InPit
                              ? "IN PIT"
                              : "—"}
                          </span>
                          <span>{line.KnockedOut ? "OUT" : "—"}</span>
                        </>
                      )}
                      <span>Laps {line.NumberOfLaps}</span>
                      <span>Stops {line.NumberOfPitStops}</span>
                    </li>
                  );
                })}
          </ul>
        </div>
      </main>
    </>
  );
}
