import { useState, useEffect } from "react";

const space = 400;

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

  const minX = hasData ? Math.min(...data.x) - space : undefined;
  const minY = hasData ? Math.min(...data.y) - space : undefined;
  const widthX = hasData
    ? Math.max(...data.x) - Math.min(...data.x) + space * 2
    : undefined;
  const widthY = hasData
    ? Math.max(...data.y) - Math.min(...data.y) + space * 2
    : undefined;

  const stroke = (widthX + widthY) / 200;

  return hasData ? (
    <div style={{ padding: "var(--space-4)" }}>
      <svg
        viewBox={`${minX} ${minY} ${widthX} ${widthY}`}
        width="100%"
        height="600px"
      >
        <path
          stroke="var(--colour-fg)"
          strokeWidth={stroke}
          strokeLinejoin="round"
          fill="transparent"
          d={`M0,0 ${data.x.map((x, i) => `L${x},${data.y[i]}`).join(" ")}`}
        />
        {Object.entries(Position.Entries ?? {}).map(([racingNumber, pos]) => {
          const driver = DriverList[racingNumber];
          const timingData = TimingData.Lines[racingNumber];
          const onTrack =
            pos.Status === "OnTrack" &&
            !timingData.KnockedOut &&
            !timingData.Retired &&
            !timingData.Stopped;
          return (
            <g key={`pos-${racingNumber}`} opacity={onTrack ? 1 : 0.5}>
              <circle
                cx={pos.X}
                cy={pos.Y}
                r={(stroke * 2) / (onTrack ? 1 : 2)}
                fill={`#${driver.TeamColour}`}
              />
              <text
                x={pos.X + stroke * 2 + 100}
                y={pos.Y + (stroke * 2) / 1.25}
                fill={`#${driver.TeamColour}`}
                fontSize={stroke * 4}
              >
                {driver.Tla}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  ) : null;
};

export default Map;
