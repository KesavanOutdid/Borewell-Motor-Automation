import React, { useEffect } from "react";
import zingchart from "zingchart/es6";

const MotorRmsCurrent = () => {
  useEffect(() => {
    const chartId = "MotorRmsCurrent";

    // Initial chart rendering
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
            text: "%v", // Display the current value
            fontSize: 30,
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
            offsetY: 5, // Moves labels upwards
            fontColor: "#000",
          },
          ring: {
            size: 15,
            rules: [
              { rule: "%v <= 20", backgroundColor: "#4CAF50" }, // Green
              { rule: "%v > 20 && %v <= 40", backgroundColor: "#8BC34A" }, // Light Green
              { rule: "%v > 40 && %v <= 60", backgroundColor: "#FFEB3B" }, // Yellow
              { rule: "%v > 60 && %v <= 80", backgroundColor: "#FF9800" }, // Orange
              { rule: "%v > 80", backgroundColor: "#F44336" }, // Red
            ],
          },
        },
        series: [
          {
            values: [58.9], // Initial value
            backgroundColor: "black",
            indicator: [8, 1, 10, 10, 0.35],
          },
        ],
      },
      height: 300,
      width: "100%",
    });

    // Function to update chart value with random number every 2 seconds
    const intervalId = setInterval(() => {
      const newValue = Math.ceil(Math.random() * 100); // Generates a random value between 0 and 100
      zingchart.exec(chartId, "setseriesvalues", {
        values: [newValue], // Update the series values
        plotindex: 0, // Update the first plot
      });
    }, 2000); // Update every 2 seconds

    // Cleanup interval when the component unmounts
    return () => {
      clearInterval(intervalId); // Clear the interval when component is unmounted
    };
  }, []);

  const style = {
    overflow: "hidden",
    height: "200px"
  };
  
  return <div id="MotorRmsCurrent" style={style}></div>;
};

export default MotorRmsCurrent;
