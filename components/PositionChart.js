import { XYChart, Curve } from "@visx/visx";
const sortDatumPos = (a, b) => a.datum.pos - b.datum.pos;

const PositionChart = ({ LapSeries, DriverList, TotalLaps }) => {
  const data = Object.values(LapSeries)
    .filter((i) => !!i.RacingNumber)
    .map(({ RacingNumber, LapPosition }) => {
      const driver = DriverList[RacingNumber];
      if (driver)
        return {
          label: `${RacingNumber} ${driver.Tla}`,
          data: LapPosition.map((pos, i) => ({
            lap: i + 1,
            pos: Number(pos),
            colour: `#${driver.TeamColour}`,
          })),
        };
    });

  return (
    <XYChart.XYChart
      height={400}
      xScale={{ type: "linear" }}
      yScale={{ type: "linear" }}
    >
      {data.map((series) => (
        <XYChart.LineSeries
          key={`pos-series-${series.label}`}
          dataKey={series.label}
          data={series.data}
          xAccessor={(d) => d?.lap ?? 0}
          yAccessor={(d) => d?.pos ?? 0}
          colorAccessor={(label) => {
            const [racingNumber] = label.split(" ");
            const driver = DriverList[racingNumber];
            return `#${driver.TeamColour}`;
          }}
          curve={Curve.curveStep}
        />
      ))}
      <XYChart.Axis
        orientation="left"
        label="Position"
        labelProps={{ fill: "var(--colour-fg)" }}
        stroke="var(--colour-fg)"
        tickLabelProps={{ fill: "var(--colour-fg)" }}
      />
      <XYChart.Axis
        orientation="bottom"
        label="Lap"
        labelProps={{ fill: "var(--colour-fg)" }}
        numTicks={TotalLaps}
        stroke="var(--colour-fg)"
        tickLabelProps={{ fill: "var(--colour-fg)" }}
      />
      <XYChart.Tooltip
        renderTooltip={({ tooltipData }) => {
          console.log(tooltipData.datumByKey);
          return (
            <>
              <p style={{ marginBottom: "var(--space-3)" }}>
                <strong>Lap {tooltipData.nearestDatum.datum.lap}</strong>
              </p>
              {Object.values(tooltipData.datumByKey)
                .sort(sortDatumPos)
                .map(({ key, datum }) => (
                  <p
                    key={`pos-tooltip-${key}`}
                    style={{
                      fontWeight:
                        tooltipData.nearestDatum.key === key
                          ? "bold"
                          : "normal",
                    }}
                  >
                    <span
                      style={{
                        color:
                          tooltipData.nearestDatum.key === key
                            ? "var(--colour-fg)"
                            : "grey",
                        width: "3ch",
                        display: "inline-block",
                      }}
                    >
                      P{datum.pos}
                    </span>{" "}
                    <span style={{ color: datum.colour }}>{key}</span>
                  </p>
                ))}
            </>
          );
        }}
        style={{
          position: "absolute",
          backgroundColor: "var(--colour-bg)",
          border: "1px solid var(--colour-border)",
          padding: "var(--space-3)",
        }}
        snapTooltipToDatumX
        snapTooltipToDatumY
        showVerticalCrosshair
        showHorizontalCrosshair
      />
    </XYChart.XYChart>
  );
};

export default PositionChart;
