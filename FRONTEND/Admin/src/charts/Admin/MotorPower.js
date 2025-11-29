import React, { useEffect } from "react";
import zingchart from "zingchart/es6";

const MotorPower = ({ telemetry }) => {
  useEffect(() => {
    const chartId = "MotorPower";

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
            text: "%v kW",
            fontSize: 30,
            decimals: 2,
            rules: [
              { rule: "%v <= 2", text: "%v<br>Very Low" },
              { rule: "%v > 2 && %v <= 4", text: "%v<br>Low" },
              { rule: "%v > 4 && %v <= 6", text: "%v<br>Moderate" },
              { rule: "%v > 6 && %v <= 8", text: "%v<br>High" },
              { rule: "%v > 8", text: "%v<br>Critical" },
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
          maxValue: 10,
          step: 2,
          labels: ["0", "2", "4", "6", "8", "10"],
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
              { rule: "%v <= 2", backgroundColor: "#4CAF50" },
              { rule: "%v > 2 && %v <= 4", backgroundColor: "#8BC34A" },
              { rule: "%v > 4 && %v <= 6", backgroundColor: "#FFEB3B" },
              { rule: "%v > 6 && %v <= 8", backgroundColor: "#FF9800" },
              { rule: "%v > 8", backgroundColor: "#F44336" },
            ],
          },
        },
        series: [
          {
            values: [telemetry?.power_kw || 0],
            backgroundColor: "black",
            indicator: [8, 1, 10, 10, 0.35],
          },
        ],
      },
      height: 300,
      width: "100%",
    });
  }, [telemetry?.power_kw]);

  useEffect(() => {
    const chartId = "MotorPower";
    if (telemetry?.power_kw !== undefined) {
      zingchart.exec(chartId, "setseriesvalues", {
        values: [telemetry.power_kw],
        plotindex: 0,
      });
    }
  }, [telemetry?.power_kw]);

  const style = {
    overflow: "hidden",
    height: "200px"
  };

  return <div id="MotorPower" style={style}></div>;
};

export default MotorPower;
