import styled from "styled-components";

export const speedTrapColumns = "auto repeat(4, 110px)";

const Line = styled.li`
  display: grid;
  grid-template-columns: ${speedTrapColumns};
  align-items: center;
  padding: var(--space-3);
  border-bottom: 1px solid var(--colour-border);

  &:last-child {
    border-bottom: none;
  }
`;

const SpeedTrap = ({ racingNumber, driver, line, statsLine }) => {
  return (
    <Line>
      <span
        title="Driver"
        style={{
          color: driver?.TeamColour ? `#${driver.TeamColour}` : undefined,
        }}
      >
        {racingNumber} {driver?.Tla}
      </span>

      <div>
        <p>
          Lst{" "}
          <span
            style={{
              color: line.Speeds.I1.OverallFastest
                ? "magenta"
                : line.Speeds.I1.PersonalFastest
                ? "limegreen"
                : "var(--colour-fg)",
            }}
          >
            {line.Speeds.I1.Value || "—"} km/h
          </span>
        </p>
        <p>
          Bst <span>{statsLine.BestSpeeds.I1.Value || "—"} km/h</span>
        </p>
      </div>

      <div>
        <p>
          Lst{" "}
          <span
            style={{
              color: line.Speeds.I2.OverallFastest
                ? "magenta"
                : line.Speeds.I2.PersonalFastest
                ? "limegreen"
                : "var(--colour-fg)",
            }}
          >
            {line.Speeds.I2.Value || "—"} km/h
          </span>
        </p>
        <p>
          Bst <span>{statsLine.BestSpeeds.I2.Value || "—"} km/h</span>
        </p>
      </div>

      <div>
        <p>
          Lst{" "}
          <span
            style={{
              color: line.Speeds.FL.OverallFastest
                ? "magenta"
                : line.Speeds.FL.PersonalFastest
                ? "limegreen"
                : "var(--colour-fg)",
            }}
          >
            {line.Speeds.FL.Value || "—"} km/h
          </span>
        </p>
        <p>
          Bst <span>{statsLine.BestSpeeds.FL.Value || "—"} km/h</span>
        </p>
      </div>

      <div>
        <p>
          Lst{" "}
          <span
            style={{
              color: line.Speeds.ST.OverallFastest
                ? "magenta"
                : line.Speeds.ST.PersonalFastest
                ? "limegreen"
                : "var(--colour-fg)",
            }}
          >
            {line.Speeds.ST.Value || "—"} km/h
          </span>
        </p>
        <p>
          Bst <span>{statsLine.BestSpeeds.ST.Value || "—"} km/h</span>
        </p>
      </div>
    </Line>
  );
};

export default SpeedTrap;
