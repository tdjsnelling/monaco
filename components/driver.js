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

const Driver = ({
  racingNumber,
  line,
  pos,
  DriverList,
  CarData,
  TimingAppData,
}) => {
  const driver = DriverList[racingNumber];
  const carData =
    CarData.Entries[CarData.Entries.length - 1].Cars[racingNumber].Channels;

  const rpmPercent = (carData["0"] / 15000) * 100;
  const throttlePercent = Math.min(100, carData["4"]);
  const brakeApplied = carData["5"] > 0;

  const appData = TimingAppData?.Lines[racingNumber];
  let currentStint;
  if (appData?.Stints) {
    currentStint = (
      Array.isArray(appData.Stints)
        ? appData.Stints
        : Object.values(appData.Stints)
    )[appData.Stints.length - 1];
  }

  return (
    <div
      style={{
        padding: "0 var(--space-3)",
        height: "60px",
        borderBottom: "1px solid var(--colour-border)",
        display: "grid",
        gridTemplateColumns:
          "25px 64px 75px 75px 25px 105px 80px 10px 45px 260px",
        gridGap: "var(--space-4)",
        alignItems: "center",
        opacity: line.Retired || line.Stopped ? 0.4 : 1,
      }}
    >
      <span>
        P{line.Position}
        <br />
        {Number(appData.GridPos) >= Number(line.Position) && "+"}
        {Number(appData.GridPos) - Number(line.Position)}
      </span>
      <span
        style={{
          textAlign: "right",
        }}
      >
        <span
          style={{
            color: driver?.TeamColour ? `#${driver.TeamColour}` : undefined,
          }}
        >
          {racingNumber} {driver.Tla}
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
              transition: "width 200ms linear",
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
              transition: "width 200ms linear",
            }}
          />
        </span>
        <span
          style={{
            display: "block",
            width: "100%",
            height: "4px",
            backgroundColor: brakeApplied ? "red" : "var(--colour-border)",
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
            color: line.LastLapTime?.OverallFastest
              ? "magenta"
              : line.LastLapTime?.PersonalFastest
              ? "limegreen"
              : "var(--colour-fg)",
          }}
        >
          {line.LastLapTime?.Value}
        </span>
        <br />
        Bst{" "}
        <span
          style={{
            color: line.BestLapTime?.OverallFastest
              ? "magenta"
              : "var(--colour-fg)",
          }}
        >
          {line.BestLapTime?.Value}
        </span>
      </span>
      <span>
        Gap{" "}
        <span
          style={{
            color: line.IntervalToPositionAhead?.Catching
              ? "limegreen"
              : "var(--colour-fg)",
          }}
        >
          {line.IntervalToPositionAhead?.Value || "—"}
        </span>
        <br />
        Ldr {line.GapToLeader || "—"}
      </span>
      <span>{currentStint?.Compound[0]}</span>
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
        {(Array.isArray(line.Sectors)
          ? line.Sectors
          : Object.values(line.Sectors ?? {})
        ).map((sector, i) => {
          return (
            <span
              key={`timing-data-${racingNumber}-sector-${i}`}
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
                {(Array.isArray(sector.Segments)
                  ? sector.Segments
                  : Object.values(sector.Segments ?? {})
                ).map((segment, j) => (
                  <span
                    key={`timing-data-${racingNumber}-sector-${i}-segment-${j}`}
                    style={{
                      width: "4px",
                      height: "15px",
                      display: "block",
                      marginRight: "var(--space-2)",
                      backgroundColor: getSegmentColour(segment.Status),
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
    </div>
  );
};

export default Driver;
