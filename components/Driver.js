import styled from "styled-components";

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

const getTyreColour = (compound) => {
  switch (compound?.toLowerCase()) {
    case "soft":
      return "red";
    case "medium":
      return "yellow";
    case "hard":
      return "var(--colour-fg)";
    case "intermediate":
      return "green";
    case "wet":
      return "blue";
    default:
      return "var(--colour-fg)";
  }
};

const DriverItem = styled.div`
  border-bottom: 1px solid var(--colour-border);
  > div {
    padding: 0 var(--space-3);
    height: 50px;
    display: grid;
    grid-template-columns: 25px 64px 64px 64px 25px 105px 90px 45px 10px 55px auto;
    grid-gap: var(--space-4);
    align-items: center;
  }
`;

const ProgressBar = styled.span`
  display: block;
  width: 100%;
  height: 4px;
  background-color: var(--colour-border);
  margin: var(--space-2) 0;
  > span {
    display: block;
    height: 4px;
    transition: width 200ms linear;
  }
`;

const Driver = ({
  racingNumber,
  line,
  lines,
  pos,
  DriverList,
  CarData,
  TimingAppData,
  TimingStats,
  Position,
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

  let distanceGap;
  if (pos > 0) {
    const positionData =
      Position.Position[Position.Position.length - 1].Entries;
    const driverPosition = positionData[racingNumber];
    const [driverAhead] = lines[pos - 1];
    const driverAheadPosition = positionData[driverAhead];

    if (
      driverPosition.Status === "OnTrack" &&
      driverAheadPosition.Status === "OnTrack"
    ) {
      distanceGap =
        Math.abs(
          Math.sqrt(
            (driverAheadPosition.X - driverPosition.X) ** 2 +
              (driverAheadPosition.Y - driverPosition.Y) ** 2 +
              (driverAheadPosition.Z - driverPosition.Z) ** 2
          )
        ) / 10;
    }
  }

  return (
    <DriverItem>
      <div
        style={{
          opacity: line.KnockedOut || line.Retired || line.Stopped ? 0.5 : 1,
        }}
      >
        <span>
          <span
            style={{
              color:
                TimingStats.Lines[racingNumber]?.PersonalBestLapTime
                  ?.Position === 1
                  ? "magenta"
                  : "var(--colour-fg)",
            }}
          >
            P{line.Position}
          </span>
          <br />
          {!Number.isNaN(Number(appData?.GridPos)) && (
            <span style={{ color: "grey" }}>
              {Number(appData.GridPos) >= Number(line.Position) && "+"}
              {Number(appData.GridPos) - Number(line.Position)}
            </span>
          )}
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
            {racingNumber} {driver?.Tla}
          </span>
          <br />
          {line.KnockedOut
            ? "OUT"
            : line.Retired
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
          {carData["3"].toString()} {carData["0"].toString()}
          <br />
          <ProgressBar>
            <span
              style={{
                width: `${rpmPercent}%`,
                backgroundColor: "cyan",
              }}
            />
          </ProgressBar>
        </span>
        <span>
          {carData["2"].toString()} km/h
          <br />
          <ProgressBar>
            <span
              style={{
                width: `${throttlePercent}%`,
                height: "4px",
                backgroundColor: "limegreen",
              }}
            />
          </ProgressBar>
          <ProgressBar>
            <span
              style={{
                width: brakeApplied ? "100%" : "0%",
                height: "4px",
                backgroundColor: "red",
              }}
            />
          </ProgressBar>
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
        <span>
          Dst
          <br />
          {line.Position > 1 &&
          Number(line.IntervalToPositionAhead?.Value) < 2 &&
          distanceGap
            ? `${distanceGap?.toFixed(1)} M`
            : "—"}
        </span>
        <span style={{ color: getTyreColour(currentStint?.Compound) }}>
          {currentStint?.Compound[0]}
        </span>
        <span>
          Lap {line.NumberOfLaps ?? "—"}
          <br />
          Stp {line.NumberOfPitStops ?? "—"}
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
                  }}
                >
                  {(Array.isArray(sector.Segments)
                    ? sector.Segments
                    : Object.values(sector.Segments ?? {})
                  ).map((segment, j) => (
                    <span
                      key={`timing-data-${racingNumber}-sector-${i}-segment-${j}`}
                      style={{
                        width: "2px",
                        height: "12px",
                        display: "block",
                        marginRight: "var(--space-2)",
                        backgroundColor: getSegmentColour(segment.Status),
                      }}
                    />
                  ))}
                </span>
                {sector.Value && (
                  <span
                    style={{
                      color: sector.OverallFastest
                        ? "magenta"
                        : sector.PersonalFastest
                        ? "limegreen"
                        : "var(--colour-fg)",
                      marginTop: "var(--space-2)",
                      display: "inline-block",
                    }}
                  >
                    {sector.Value}
                  </span>
                )}
              </span>
            );
          })}
        </span>
      </div>
    </DriverItem>
  );
};

export default Driver;
