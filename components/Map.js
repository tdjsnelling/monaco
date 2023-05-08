import { useState, useEffect } from "react";
import styled from "styled-components";

const StyledMap = styled.div(
  ({ expanded }) => `
  background-color: var(--colour-bg);
  padding: var(--space-4);
  position: ${expanded ? "fixed" : "relative"};
  top: ${expanded ? "var(--space-4)" : "unset"};
  bottom: ${expanded ? "var(--space-4)" : "unset"};
  left: ${expanded ? "var(--space-4)" : "unset"};
  right: ${expanded ? "var(--space-4)" : "unset"};
  border: ${expanded ? "1px solid var(--colour-border)" : "none"};
  border-radius: 4px;
  user-select: none;
  box-shadow: ${expanded ? "0 0 0 1000px rgba(0, 0, 0, 0.75)" : "none"}
`
);

const space = 1000;

const rad = (deg) => deg * (Math.PI / 180);
const deg = (rad) => rad / (Math.PI / 180);

const rotate = (x, y, a, px, py) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));

  x -= px;
  y -= py;

  const newX = x * c - y * s;
  const newY = y * c + x * s;

  return [newX + px, (newY + py) * -1];
};

const getTrackStatusColour = (status) => {
  switch (status) {
    case "2":
    case "4":
    case "6":
    case "7":
      return "yellow";
    case "5":
      return "red";
    default:
      return "var(--colour-fg)";
  }
};

const sortDriverPosition = (Lines) => (a, b) => {
  const [racingNumberA] = a;
  const [racingNumberB] = b;

  const driverA = Lines[racingNumberA];
  const driverB = Lines[racingNumberB];

  return Number(driverB?.Position) - Number(driverA?.Position);
};

const bearingToCardinal = (bearing) => {
  const cardinalDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return cardinalDirections[Math.floor(bearing / 45) % 8];
};

const Map = ({
  circuit,
  Position,
  DriverList,
  TimingData,
  TrackStatus,
  WindDirection,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState({});
  const [[minX, minY, widthX, widthY], setBounds] = useState([
    undefined,
    undefined,
    undefined,
    undefined,
  ]);
  const [stroke, setStroke] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(`/api/map?circuit=${circuit}`, {
        headers: {
          "User-Agent": "tdjsnelling/monaco",
        },
      });
      if (res.status === 200) {
        const rawData = await res.json();

        const px = (Math.max(...rawData.x) - Math.min(...rawData.x)) / 2;
        const py = (Math.max(...rawData.y) - Math.min(...rawData.y)) / 2;

        rawData.transformedPoints = rawData.x.map((x, i) =>
          rotate(x, rawData.y[i], rawData.rotation, px, py)
        );

        const cMinX =
          Math.min(...rawData.transformedPoints.map(([x]) => x)) - space;
        const cMinY =
          Math.min(...rawData.transformedPoints.map(([, y]) => y)) - space;
        const cWidthX =
          Math.max(...rawData.transformedPoints.map(([x]) => x)) -
          cMinX +
          space * 2;
        const cWidthY =
          Math.max(...rawData.transformedPoints.map(([, y]) => y)) -
          cMinY +
          space * 2;

        setBounds([cMinX, cMinY, cWidthX, cWidthY]);

        const cStroke = (cWidthX + cWidthY) / 225;
        setStroke(cStroke);

        rawData.corners = rawData.corners.map((corner) => {
          const transformedCorner = rotate(
            corner.trackPosition.x,
            corner.trackPosition.y,
            rawData.rotation,
            px,
            py
          );

          const transformedLabel = rotate(
            corner.trackPosition.x + 4 * cStroke * Math.cos(rad(corner.angle)),
            corner.trackPosition.y + 4 * cStroke * Math.sin(rad(corner.angle)),
            rawData.rotation,
            px,
            py
          );

          return { ...corner, transformedCorner, transformedLabel };
        });

        rawData.startAngle = deg(
          Math.atan(
            (rawData.transformedPoints[3][1] -
              rawData.transformedPoints[0][1]) /
              (rawData.transformedPoints[3][0] -
                rawData.transformedPoints[0][0])
          )
        );

        setData(rawData);
      }
    };
    fetchData();
  }, [circuit]);

  const hasData = !!Object.keys(data).length;

  return hasData ? (
    <StyledMap expanded={expanded}>
      <p
        style={{
          color: getTrackStatusColour(TrackStatus.Status),
          position: "absolute",
          top: "var(--space-4)",
          left: "var(--space-4)",
        }}
      >
        Status: {TrackStatus.Message}
      </p>
      <p
        style={{
          color: getTrackStatusColour(TrackStatus.Status),
          position: "absolute",
          top: "calc(var(--space-4) + 20px)",
          left: "var(--space-4)",
        }}
      >
        N
        <span
          style={{
            display: "inline-block",
            marginLeft: "var(--space-2)",
            transform: `rotate(${-data.rotation}deg)`,
          }}
        >
          ↑
        </span>
      </p>
      <p
        style={{
          color: getTrackStatusColour(TrackStatus.Status),
          position: "absolute",
          top: "calc(var(--space-4) + 40px)",
          left: "var(--space-4)",
        }}
      >
        Wind {bearingToCardinal(Number(WindDirection))}
        <span
          style={{
            display: "inline-block",
            marginLeft: "var(--space-2)",
            transform: `rotate(${(WindDirection - data.rotation) % 360}deg)`,
          }}
        >
          ↑
        </span>
      </p>
      <button
        onClick={() => setExpanded((e) => !e)}
        style={{
          position: "absolute",
          top: "var(--space-3)",
          right: "var(--space-3)",
        }}
      >
        {expanded ? "↓" : "↑"}
      </button>
      <svg
        viewBox={`${minX} ${minY} ${widthX} ${widthY}`}
        width="100%"
        height={expanded ? "100%" : "500px"}
      >
        <path
          stroke={getTrackStatusColour(TrackStatus.Status)}
          strokeWidth={stroke}
          strokeLinejoin="round"
          fill="transparent"
          d={`M${data.transformedPoints[0][0]},${
            data.transformedPoints[0][1]
          } ${data.transformedPoints.map(([x, y]) => `L${x},${y}`).join(" ")}`}
        />
        <rect
          x={data.transformedPoints[0][0]}
          y={data.transformedPoints[0][1]}
          width={stroke * 4}
          height={stroke}
          fill="red"
          stroke="var(--colour-bg)"
          strokeWidth={stroke / 2}
          transform={`translate(${stroke * -2} ${(stroke * -1) / 2}) rotate(${
            data.startAngle + 90
          }, ${data.transformedPoints[0][0] + stroke * 2}, ${
            data.transformedPoints[0][1] + stroke / 2
          })`}
        />
        {Object.entries(Position.Entries ?? {})
          .sort(sortDriverPosition(TimingData.Lines))
          .map(([racingNumber, pos]) => {
            const driver = DriverList[racingNumber];
            const timingData = TimingData.Lines[racingNumber];
            const onTrack =
              pos.Status === "OnTrack" &&
              (timingData ? !timingData.InPit : true);
            const out =
              timingData?.KnockedOut ||
              timingData?.Retired ||
              timingData?.Stopped;
            const [rx, ry] = rotate(
              pos.X,
              pos.Y,
              data.rotation,
              (Math.max(...data.x) - Math.min(...data.x)) / 2,
              (Math.max(...data.y) - Math.min(...data.y)) / 2
            );
            const fontSize = stroke * 3;
            return driver && !out ? (
              <g key={`pos-${racingNumber}`} opacity={onTrack ? 1 : 0.5}>
                <circle
                  cx={rx}
                  cy={ry}
                  r={stroke * (onTrack ? 1.25 : 0.75)}
                  fill={
                    driver?.TeamColour
                      ? `#${driver.TeamColour}`
                      : "var(--colour-fg)"
                  }
                  stroke="var(--colour-bg)"
                  strokeWidth={fontSize / 10}
                  style={{ transition: "1s linear" }}
                />
                <text
                  x={0}
                  y={0}
                  fill={
                    driver?.TeamColour
                      ? `#${driver.TeamColour}`
                      : "var(--colour-fg)"
                  }
                  fontSize={fontSize}
                  fontWeight="bold"
                  stroke="var(--colour-bg)"
                  strokeWidth={fontSize / 20}
                  style={{
                    transform: `translate(${rx + stroke * 1.5}px, ${
                      ry + stroke
                    }px)`,
                    transition: "1s linear",
                  }}
                >
                  {driver.Tla}
                </text>
              </g>
            ) : null;
          })}
        {data.corners.map((corner) => {
          let string = `${corner.number}`;
          if (corner.letter) string = string + corner.letter;

          const fontSize = stroke * 2;

          const [cornerX, cornerY] = corner.transformedCorner;
          const [labelX, labelY] = corner.transformedLabel;

          const lineX = labelX + fontSize * (string.length * 0.25);
          const lineY = labelY - (labelY > cornerY ? fontSize * 0.7 : 0);

          return (
            <g key={`corner-${corner.number}}`}>
              <text
                x={labelX}
                y={labelY}
                fontSize={fontSize}
                fontWeight="bold"
                fill="red"
                stroke="var(--colour-bg)"
                strokeWidth={fontSize / 40}
              >
                {string}
              </text>
              <path
                stroke="red"
                strokeWidth={stroke / 2}
                opacity={0.25}
                d={`M${cornerX},${cornerY} L${lineX},${lineY}`}
              />
            </g>
          );
        })}
      </svg>
    </StyledMap>
  ) : null;
};

export default Map;
