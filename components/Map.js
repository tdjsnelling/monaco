import { useState, useEffect, useMemo } from "react";
import styled from "styled-components";

const StyledMap = styled.div`
  padding: var(--space-4);
`;

const space = 800;

const rad = (deg) => deg * (Math.PI / 180);

const rotate = (x, y, a, px, py) => {
  const c = Math.cos(rad(a));
  const s = Math.sin(rad(a));

  x -= px;
  y -= py;

  const newX = x * c - y * s;
  const newY = y * c + x * s;

  return [newX + px, (newY + py) * -1];
};

const Map = ({ circuit, Position, DriverList, TimingData }) => {
  const [data, setData] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch(
        `https://api.multiviewer.app/api/v1/circuits/${circuit}/${new Date().getFullYear()}`,
        {
          headers: {
            "User-Agent": "tdjsnelling/monaco",
          },
        }
      );
      if (res.status === 200) {
        setData(await res.json());
      }
    };
    fetchData();
  }, [circuit]);

  const hasData = !!Object.keys(data).length;

  const rotatedPoints = useMemo(() => {
    if (!hasData) return "";
    return data.x.map((x, i) =>
      rotate(
        x,
        data.y[i],
        data.rotation,
        (Math.max(...data.x) - Math.min(...data.x)) / 2,
        (Math.max(...data.y) - Math.min(...data.y)) / 2
      )
    );
  }, [hasData]);

  const minX = hasData
    ? Math.min(...rotatedPoints.map(([x]) => x)) - space
    : undefined;
  const minY = hasData
    ? Math.min(...rotatedPoints.map(([, y]) => y)) - space
    : undefined;
  const widthX = hasData
    ? Math.max(...rotatedPoints.map(([x]) => x)) - minX + space * 2
    : undefined;
  const widthY = hasData
    ? Math.max(...rotatedPoints.map(([, y]) => y)) - minY + space * 2
    : undefined;

  const stroke = (widthX + widthY) / 200;

  return hasData ? (
    <StyledMap>
      <svg
        viewBox={`${minX} ${minY} ${widthX} ${widthY}`}
        width="100%"
        height="500px"
      >
        <path
          stroke="var(--colour-fg)"
          strokeWidth={stroke}
          strokeLinejoin="round"
          fill="transparent"
          d={`M${rotatedPoints[0][0]},${rotatedPoints[0][1]} ${rotatedPoints
            .map(([x, y]) => `L${x},${y}`)
            .join(" ")}`}
        />
        {Object.entries(Position.Entries ?? {}).map(([racingNumber, pos]) => {
          const driver = DriverList[racingNumber];
          const timingData = TimingData.Lines[racingNumber];
          const onTrack =
            pos.Status === "OnTrack" &&
            !timingData.KnockedOut &&
            !timingData.Retired &&
            !timingData.Stopped;
          const [rx, ry] = rotate(
            pos.X,
            pos.Y,
            data.rotation,
            (Math.max(...data.x) - Math.min(...data.x)) / 2,
            (Math.max(...data.y) - Math.min(...data.y)) / 2
          );
          return (
            <g key={`pos-${racingNumber}`} opacity={onTrack ? 1 : 0.5}>
              <circle
                cx={rx}
                cy={ry}
                r={(stroke * 2) / (onTrack ? 1 : 2)}
                fill={`#${driver.TeamColour}`}
                style={{ transition: "200ms linear" }}
              />
              <text
                x={rx + stroke * 2 + 50}
                y={ry + (stroke * 2) / 1.25}
                fill={`#${driver.TeamColour}`}
                fontSize={stroke * 4}
                style={{ transition: "200ms linear" }}
              >
                {driver.Tla}
              </text>
            </g>
          );
        })}
        {data.corners.map((corner) => {
          const [cornerX, cornerY] = rotate(
            corner.trackPosition.x,
            corner.trackPosition.y,
            data.rotation,
            (Math.max(...data.x) - Math.min(...data.x)) / 2,
            (Math.max(...data.y) - Math.min(...data.y)) / 2
          );

          const [textX, textY] = rotate(
            corner.trackPosition.x + stroke * 5 * Math.cos(rad(corner.angle)),
            corner.trackPosition.y + stroke * 5 * Math.sin(rad(corner.angle)),
            data.rotation,
            (Math.max(...data.x) - Math.min(...data.x)) / 2,
            (Math.max(...data.y) - Math.min(...data.y)) / 2
          );

          let string = `${corner.number}`;
          if (corner.letter) string = string + corner.letter;

          const fontSize = stroke * 2.5;

          const lineX = textX + fontSize * (string.length * 0.25);
          const lineY = textY - (textY > cornerY ? fontSize * 0.7 : 0);

          return (
            <g key={`corner-${corner.number}}`}>
              <text
                x={textX}
                y={textY}
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
