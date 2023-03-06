import { useState, useRef, useEffect } from "react";
import Head from "next/head";
import moment from "moment";

const sortPosition = (a, b) => {
  const aPos = Number(a.Position);
  const bPos = Number(b.Position);
  return aPos - bPos;
};

const drsEnabledValues = [8, 10, 12, 14];

// one of 2048, 2064, 2051, 2049
const getSegmentColour = (status) => {
  switch (status) {
    case 2048:
      return "yellow";
    case 2049:
      return "limegreen";
    case 2051:
      return "magenta";
    case 2064:
      return "blue";
    default:
      return "var(--colour-offset)";
  }
};

export default function Home() {
  const [connected, setConnected] = useState(false);
  const [liveState, setLiveState] = useState({});

  const socket = useRef();
  const retry = useRef();

  const initWebsocket = (handleMessage) => {
    if (retry.current) {
      clearTimeout(retry.current);
      retry.current = undefined;
    }

    const ws = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);

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
        try {
          const d = JSON.parse(data);
          setLiveState(d);
        } catch (e) {}
      });
    }
  });

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
            <p style={{ marginBottom: "var(--space-4)" }}>
              <strong>NO SESSION</strong>
            </p>
            <p>Come back later when there is a live session</p>
          </div>
        </main>
      </>
    );

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
      <main
        style={{ height: "100vh", display: "flex", flexDirection: "column" }}
      >
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
              {!!ExtrapolatedClock && (
                <p style={{ marginRight: "var(--space-4)" }}>
                  Remaining: {ExtrapolatedClock.Remaining}
                </p>
              )}
            </div>
            <div
              style={{
                display: "flex",
              }}
            >
              <p style={{ marginRight: "var(--space-4)" }}>
                Data updated: {moment(Heartbeat.Utc).format("HH:mm:ss")}
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
              padding: "var(--space-3)",
              backgroundColor: "var(--colour-offset)",
            }}
          >
            <p>
              <strong>LIVE TIMING DATA</strong>
            </p>
          </div>
          <ul
            style={{
              listStyle: "none",
              columns: 2,
              columnGap: "0px",
              overflow: "auto",
            }}
          >
            {!!TimingData &&
              Object.values(TimingData.Lines)
                .sort(sortPosition)
                .map((line, pos) => {
                  const driver = DriverList[line.RacingNumber];
                  const carData =
                    CarData.Entries[CarData.Entries.length - 1].Cars[
                      line.RacingNumber
                    ].Channels;

                  const rpmPercent = (carData["0"] / 15000) * 100;
                  const throttlePercent = Math.min(100, carData["4"]);
                  const brakeApplied = carData["5"] > 0;

                  const appData = TimingAppData.Lines[line.RacingNumber];
                  const currentStint =
                    appData.Stints[appData.Stints.length - 1];

                  return (
                    <li
                      key={`timing-data-${line.RacingNumber}`}
                      style={{
                        padding: "var(--space-3)",
                        borderBottom: "1px solid var(--colour-border)",
                        borderLeft:
                          pos > 9
                            ? "1px solid var(--colour-border)"
                            : undefined,
                        display: "grid",
                        gridTemplateColumns:
                          "25px 48px 75px 75px 25px 105px 80px 10px 45px 260px repeat(10, 75px)",
                        gridGap: "var(--space-4)",
                        alignItems: "center",
                        opacity: line.Retired || line.Stopped ? 0.4 : 1,
                      }}
                    >
                      <span>
                        P{line.Position}
                        <br />
                        {Number(appData.GridPos) >= Number(line.Position) &&
                          "+"}
                        {Number(appData.GridPos) - Number(line.Position)}
                      </span>
                      <span
                        style={{
                          textAlign: "right",
                        }}
                      >
                        <span style={{ color: `#${driver.TeamColour}` }}>
                          {line.RacingNumber} {driver.Tla}
                        </span>
                        <br />
                        {line.Retired
                          ? "RETIRED"
                          : line.Stopped
                          ? "STOPPED"
                          : line.InPit
                          ? "PIT"
                          : line.PitOut
                          ? "PIT OUT"
                          : null}
                      </span>
                      <span>
                        {carData["0"].toString()}
                        <br />
                        <span
                          style={{
                            display: "block",
                            width: "100%",
                            height: "4px",
                            backgroundColor: "var(--colour-border)",
                            margin: "var(--space-2) 0",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: `${rpmPercent}%`,
                              height: "4px",
                              backgroundColor: "cyan",
                            }}
                          />
                        </span>
                        Gear {carData["3"].toString()}
                      </span>
                      <span>
                        {carData["2"].toString()} km/h
                        <br />
                        <span
                          style={{
                            display: "block",
                            width: "100%",
                            height: "4px",
                            backgroundColor: "var(--colour-border)",
                            margin: "var(--space-2) 0",
                          }}
                        >
                          <span
                            style={{
                              display: "block",
                              width: `${throttlePercent}%`,
                              height: "4px",
                              backgroundColor: "limegreen",
                            }}
                          />
                        </span>
                        <span
                          style={{
                            display: "block",
                            width: "100%",
                            height: "4px",
                            backgroundColor: brakeApplied
                              ? "red"
                              : "var(--colour-border)",
                            margin: "var(--space-2) 0",
                          }}
                        />
                      </span>
                      <span
                        style={{
                          color: drsEnabledValues.includes(carData["45"])
                            ? "limegreen"
                            : "grey",
                        }}
                      >
                        DRS
                      </span>
                      <span>
                        Lst{" "}
                        <span
                          style={{
                            color: line.LastLapTime.OverallFastest
                              ? "magenta"
                              : line.LastLapTime.PersonalFastest
                              ? "limegreen"
                              : "var(--colour-fg)",
                          }}
                        >
                          {line.LastLapTime.Value}
                        </span>
                        <br />
                        Bst{" "}
                        <span
                          style={{
                            color: line.LastLapTime.OverallFastest
                              ? "magenta"
                              : "var(--colour-fg)",
                          }}
                        >
                          {line.BestLapTime.Value}
                        </span>
                      </span>
                      <span>
                        Gap{" "}
                        <span
                          style={{
                            color: line.IntervalToPositionAhead.Catching
                              ? "limegreen"
                              : "var(--colour-fg)",
                          }}
                        >
                          {line.IntervalToPositionAhead.Value || "—"}
                        </span>
                        <br />
                        Ldr {line.GapToLeader || "—"}
                      </span>
                      <span>{currentStint.Compound[0]}</span>
                      {/*{SessionInfo.Name === "Qualifying" && (*/}
                      {/*  <>*/}
                      {/*    <span>*/}
                      {/*      {line.BestLapTime.Value}*/}
                      {/*      {pos > 0 ? (*/}
                      {/*        <>*/}
                      {/*          {!!line.Stats[line.Stats.length - 1]*/}
                      {/*            .TimeDiffToFastest && (*/}
                      {/*            <>*/}
                      {/*              <br />*/}
                      {/*              <span style={{ color: "grey" }}>*/}
                      {/*                P1{" "}*/}
                      {/*                {*/}
                      {/*                  line.Stats[line.Stats.length - 1]*/}
                      {/*                    .TimeDiffToFastest*/}
                      {/*                }*/}
                      {/*              </span>*/}
                      {/*            </>*/}
                      {/*          )}*/}
                      {/*          {!!line.Stats[line.Stats.length - 1]*/}
                      {/*            .TimeDifftoPositionAhead && (*/}
                      {/*            <>*/}
                      {/*              <br />*/}
                      {/*              <span style={{ color: "grey" }}>*/}
                      {/*                P{pos}{" "}*/}
                      {/*                {*/}
                      {/*                  line.Stats[line.Stats.length - 1]*/}
                      {/*                    .TimeDifftoPositionAhead*/}
                      {/*                }*/}
                      {/*              </span>*/}
                      {/*            </>*/}
                      {/*          )}*/}
                      {/*        </>*/}
                      {/*      ) : (*/}
                      {/*        <>*/}
                      {/*          <br />*/}
                      {/*          <span style={{ color: "grey" }}>—</span>*/}
                      {/*          <br />*/}
                      {/*          <span style={{ color: "grey" }}>—</span>*/}
                      {/*        </>*/}
                      {/*      )}*/}
                      {/*    </span>*/}
                      {/*    {line.Sectors.map((sector, i) => (*/}
                      {/*      <span*/}
                      {/*        key={`timing-data-${line.RacingNumber}-sector-${i}`}*/}
                      {/*        style={{*/}
                      {/*          color: sector.OverallFastest*/}
                      {/*            ? "magenta"*/}
                      {/*            : sector.PersonalFastest*/}
                      {/*            ? "limegreen"*/}
                      {/*            : "var(--colour-fg)",*/}
                      {/*        }}*/}
                      {/*      >*/}
                      {/*        S{i + 1} {sector.Value || sector.PreviousValue}*/}
                      {/*      </span>*/}
                      {/*    ))}*/}
                      {/*    <span>*/}
                      {/*      {line.PitOut*/}
                      {/*        ? "OUT LAP"*/}
                      {/*        : line.InPit*/}
                      {/*        ? "IN PIT"*/}
                      {/*        : "—"}*/}
                      {/*    </span>*/}
                      {/*    <span>{line.KnockedOut ? "OUT" : "—"}</span>*/}
                      {/*  </>*/}
                      {/*)}*/}
                      <span>
                        Lap {line.NumberOfLaps}
                        <br />
                        Stp {line.NumberOfPitStops}
                      </span>
                      <span style={{ display: "flex" }}>
                        {line.Sectors.map((sector, i) => {
                          return (
                            <span
                              key={`timing-data-${line.RacingNumber}-sector-${i}`}
                              style={{
                                marginRight: "var(--space-4)",
                              }}
                            >
                              <span
                                style={{
                                  display: "flex",
                                  marginBottom: "var(--space-2)",
                                }}
                              >
                                {sector.Segments.map((segment, j) => (
                                  <span
                                    key={`timing-data-${line.RacingNumber}-sector-${i}-segment-${j}`}
                                    style={{
                                      width: "4px",
                                      height: "15px",
                                      display: "block",
                                      marginRight: "var(--space-2)",
                                      backgroundColor: getSegmentColour(
                                        segment.Status
                                      ),
                                    }}
                                  />
                                ))}
                              </span>
                              <span
                                style={{
                                  color: sector.OverallFastest
                                    ? "magenta"
                                    : sector.PersonalFastest
                                    ? "limegreen"
                                    : "var(--colour-fg)",
                                }}
                              >
                                {sector.Value}
                              </span>
                            </span>
                          );
                        })}
                      </span>
                    </li>
                  );
                })}
          </ul>
        </div>

        <div
          style={{
            display: "flex",
            flexGrow: 1,
          }}
        >
          {!!SessionData && (
            <div
              style={{
                width: "100%",
                borderRight: "1px solid var(--colour-border)",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "var(--space-3)",
                  backgroundColor: "var(--colour-offset)",
                }}
              >
                <p>
                  <strong>SESSION STATUS MESSAGES</strong>
                </p>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  height: "100px",
                  overflow: "auto",
                  flexGrow: 1,
                }}
              >
                {[...SessionData.StatusSeries].reverse().map((event, i) => (
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
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  padding: "var(--space-3)",
                  backgroundColor: "var(--colour-offset)",
                }}
              >
                <p>
                  <strong>RACE CONTROL MESSAGES</strong>
                </p>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  height: "100px",
                  overflow: "auto",
                  flexGrow: 1,
                }}
              >
                {[...RaceControlMessages.Messages].reverse().map((event, i) => (
                  <li
                    key={`race-control-${event.Utc}-${i}`}
                    style={{ padding: "var(--space-3)" }}
                  >
                    <span
                      style={{ color: "grey", marginRight: "var(--space-4)" }}
                    >
                      {moment(event.Utc).format("HH:mm:ss")}
                    </span>
                    <span>{event.Message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
