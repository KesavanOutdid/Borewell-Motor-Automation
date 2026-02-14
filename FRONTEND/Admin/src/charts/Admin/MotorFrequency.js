import React, { useEffect } from "react";
import zingchart from "zingchart/es6";

const MotorFrequency = ({ telemetry }) => {
  useEffect(() => {
    const chartId = "MotorFrequency";

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
            text: "%v HZ",
            fontSize: 30,
            decimals: 2,
            rules: [
              { rule: "%v <= 20", text: "%v<br>Very Low" },
              { rule: "%v > 20 && %v <= 40", text: "%v<br>Low" },
              { rule: "%v > 40 && %v <= 60", text: "%v<br>Moderate" },
              { rule: "%v > 60 && %v <= 80", text: "%v<br>High" },
              { rule: "%v > 80", text: "%v<br>Critical" },
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
          maxValue: 100,
          step: 20,
          labels: ["0", "20", "40", "60", "80", "100"],
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
              { rule: "%v <= 20", backgroundColor: "#4CAF50" },
              { rule: "%v > 20 && %v <= 40", backgroundColor: "#8BC34A" },
              { rule: "%v > 40 && %v <= 60", backgroundColor: "#FFEB3B" },
              { rule: "%v > 60 && %v <= 80", backgroundColor: "#FF9800" },
              { rule: "%v > 80", backgroundColor: "#F44336" },
            ],
          },
        },
        series: [
          {
            values: [telemetry?.motor_frequency_hz || 0],
            backgroundColor: "black",
            indicator: [8, 1, 10, 10, 0.35],
          },
        ],
      },
      height: 300,
      width: "100%",
    });
  }, [telemetry?.motor_frequency_hz]);

  useEffect(() => {
    const chartId = "MotorFrequency";
    if (telemetry?.motor_frequency_hz !== undefined) {
      zingchart.exec(chartId, "setseriesvalues", {
        values: [telemetry.motor_frequency_hz],
        plotindex: 0,
      });
    }
  }, [telemetry?.motor_frequency_hz]);

  const style = {
    overflow: "hidden",
    height: "200px"
  };

  return <div id="MotorFrequency" style={style}></div>;
};

export default MotorFrequency;
