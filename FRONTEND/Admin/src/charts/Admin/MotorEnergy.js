import React, { useEffect } from "react";
import zingchart from "zingchart/es6";

const MotorEnergy = ({ telemetry }) => {
  useEffect(() => {
    const chartId = "MotorEnergy";

    zingchart.render({
      id: chartId,
      data: {
        type: "gauge",
        globals: {
          fontSize: 20,
        },
        plotarea: {
          marginTop: 40,
        },
        plot: {
          size: "100%",
          valueBox: {
            placement: "center",
            text: "%v kWh",
            fontSize: 30,
            decimals: 2,
            rules: [
              { rule: "%v <= 0.2", text: "%v<br>Very Low" },
              { rule: "%v > 0.2 && %v <= 0.4", text: "%v<br>Low" },
              { rule: "%v > 0.4 && %v <= 0.6", text: "%v<br>Moderate" },
              { rule: "%v > 0.6 && %v <= 0.8", text: "%v<br>High" },
              { rule: "%v > 0.8", text: "%v<br>Critical" },
            ],
          },
          animation: {
            effect: 2,
            method: 5,
            sequence: 1,
            speed: 500,
          },
        },
        scaleR: {
          aperture: 180,
          minValue: 0,
          maxValue: 1,
          step: 0.2,
          labels: ["0", "0.2", "0.4", "0.6", "0.8", "1"],
          center: {
            visible: false,
          },
          tick: {
            visible: true,
            lineColor: "#000",
            lineWidth: 2,
          },
          item: {
            fontSize: 15,
            offsetY: 5,
            fontColor: "#000",
          },
          ring: {
            size: 15,
            rules: [
              { rule: "%v <= 0.2", backgroundColor: "#4CAF50" },
              { rule: "%v > 0.2 && %v <= 0.4", backgroundColor: "#8BC34A" },
              { rule: "%v > 0.4 && %v <= 0.6", backgroundColor: "#FFEB3B" },
              { rule: "%v > 0.6 && %v <= 0.8", backgroundColor: "#FF9800" },
              { rule: "%v > 0.8", backgroundColor: "#F44336" },
            ],
          },
        },
        series: [
          {
            values: [telemetry?.energy_kwh || 0],
            backgroundColor: "black",
            indicator: [8, 1, 10, 10, 0.35],
          },
        ],
      },
      height: 300,
      width: "100%",
    });
  }, [telemetry?.energy_kwh]);

  useEffect(() => {
    const chartId = "MotorEnergy";
    if (telemetry?.energy_kwh !== undefined) {
      zingchart.exec(chartId, "setseriesvalues", {
        values: [telemetry.energy_kwh],
        plotindex: 0,
      });
    }
  }, [telemetry?.energy_kwh]);

  const style = {
    overflow: "hidden",
    height: "200px"
  };

  return <div id="MotorEnergy" style={style}></div>;
};

export default MotorEnergy;
