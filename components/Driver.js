import styled from "styled-components";

const drsEnabledValues = [10, 12, 14];

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

const gridCols = "21px 64px 64px 64px 21px 90px 80px 52px 45px auto";

const DriverItem = styled.div`
  border-bottom: 1px solid var(--colour-border);
  > div {
    padding: 0 var(--space-3);
    height: 46px;
    display: grid;
    grid-template-columns: ${gridCols};
    grid-gap: var(--space-4);
    align-items: center;
    //border-left: 5px solid ${({ teamColour }) => teamColour};
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
    transition: width 100ms linear;
  }
`;

export const TableHeader = () => (
  <div
    style={{
      padding: "var(--space-2) var(--space-3)",
      backgroundColor: "var(--colour-offset)",
      borderTop: "1px solid var(--colour-border)",
      display: "grid",
      gridTemplateColumns: gridCols,
      gridGap: "var(--space-4)",
    }}
  >
    <p>POS</p>
    <p style={{ textAlign: "right" }}>DRIVER</p>
    <p>GEAR/RPM</p>
    <p>SPD/PDL</p>
    <p>DRS</p>
    <p>TIME</p>
    <p>GAP</p>
    <p>TYRE</p>
    <p>INFO</p>
    <p>SECTORS</p>
  </div>
);

const Driver = ({
  racingNumber,
  line,
  DriverList,
  CarData,
  TimingAppData,
  TimingStats,
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
    const stints = Object.values(appData.Stints);
    currentStint = stints[stints.length - 1];
  }

  const lineStats = Object.values(line.Stats ?? {});

  return (
    <DriverItem
      teamColour={driver?.TeamColour ? `#${driver.TeamColour}` : undefined}
    >
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
              color:
                line.LastLapTime?.Value && line.LastLapTime?.OverallFastest
                  ? "magenta"
                  : line.LastLapTime?.Value && line.LastLapTime?.PersonalFastest
                  ? "limegreen"
                  : "var(--colour-fg)",
            }}
          >
            {line.LastLapTime?.Value || "—"}
          </span>
          <br />
          Bst{" "}
          <span
            style={{
              color:
                line.BestLapTime?.Value &&
                (line.BestLapTime?.OverallFastest ||
                  TimingStats.Lines[racingNumber]?.PersonalBestLapTime
                    ?.Position === 1)
                  ? "magenta"
                  : "var(--colour-fg)",
            }}
          >
            {line.BestLapTime?.Value || "—"}
          </span>
        </span>
        <span>
          Int{" "}
          <span
            style={{
              color: line.IntervalToPositionAhead?.Catching
                ? "limegreen"
                : "var(--colour-fg)",
            }}
          >
            {line.IntervalToPositionAhead?.Value ||
              lineStats?.[lineStats?.length - 1]?.TimeDifftoPositionAhead ||
              "—"}
          </span>
          <br />
          Ldr{" "}
          {line.GapToLeader ||
            lineStats?.[lineStats?.length - 1]?.TimeDiffToFastest ||
            "—"}
        </span>
        <span>
          Cmp{" "}
          <span style={{ color: getTyreColour(currentStint?.Compound) }}>
            {currentStint?.Compound[0] ?? "—"}
          </span>
          <br />
          Age {currentStint?.TotalLaps}
          {currentStint?.New === "false" && "*"}
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
                        : "yellow",
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
