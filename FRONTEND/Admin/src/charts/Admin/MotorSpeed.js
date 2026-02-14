import React, { useEffect } from "react";
import zingchart from "zingchart/es6";

const MotorSpeed = ({ telemetry }) => {
  useEffect(() => {
    const chartId = "MotorSpeed";

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
            text: "%v RPM",
            fontSize: 30,
            decimals: 2,
            rules: [
              { rule: "%v <= 750", text: "%v<br>Very Low" },
              { rule: "%v > 750 && %v <= 1500", text: "%v<br>Low" },
              { rule: "%v > 1500 && %v <= 2250", text: "%v<br>Moderate" },
              { rule: "%v > 2250 && %v <= 3000", text: "%v<br>High" },
              { rule: "%v > 3000", text: "%v<br>Critical" },
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
          maxValue: 3600,
          step: 720,
          labels: ["0", "720", "1440", "2160", "2880", "3600"],
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
              { rule: "%v <= 750", backgroundColor: "#4CAF50" },
              { rule: "%v > 750 && %v <= 1500", backgroundColor: "#8BC34A" },
              { rule: "%v > 1500 && %v <= 2250", backgroundColor: "#FFEB3B" },
              { rule: "%v > 2250 && %v <= 3000", backgroundColor: "#FF9800" },
              { rule: "%v > 3000", backgroundColor: "#F44336" },
            ],
          },
        },
        series: [
          {
            values: [telemetry?.motor_rpm || 0],
            backgroundColor: "black",
            indicator: [8, 1, 10, 10, 0.35],
          },
        ],
      },
      height: 300,
      width: "100%",
    });
  }, [telemetry?.motor_rpm]);

  useEffect(() => {
    const chartId = "MotorSpeed";
    if (telemetry?.motor_rpm !== undefined) {
      zingchart.exec(chartId, "setseriesvalues", {
        values: [telemetry.motor_rpm],
        plotindex: 0,
      });
    }
  }, [telemetry?.motor_rpm]);

  const style = {
    overflow: "hidden",
    height: "200px"
  };

  return <div id="MotorSpeed" style={style}></div>;
};

export default MotorSpeed;
