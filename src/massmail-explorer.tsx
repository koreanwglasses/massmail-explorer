import { cluster } from "d3";
import * as React from "react";
import { EmailSpatialView } from "./components/email-spatial-view";
import { MassmailData } from "./massmail-data";
import {ColorData} from "./color-data";

export function MassmailExplorer() {
  const [data, setData] = React.useState<MassmailData>();
  const keywordData = data
    ? data.clusters.map(({ label }) => label)
    : undefined;
    

  React.useEffect(() => {
    (async () => {
      const response = await fetch("../data/data.json");
      setData(await response.json());
    })();
  }, []);

  // const [color, setColor] = React.useState<ColorData>();
  // const colorData = color
  //   ? color.name
  //   : undefined;
  
  // React.useEffect(() => {
  //   (async () => {
  //     const response = await fetch("/data/data.json");
  //     setData(await response.json());
  //   })();
  // }, []);

  const [mode, setMode] = React.useState<"ORIGINAL" | "EXPLODED">("ORIGINAL");
  (window as any).setMode = setMode;

  const [[width, height], setSize] = React.useState<[number, number]>([
    window.innerWidth,
    window.innerHeight,
  ]);
  window.addEventListener("resize", () =>
    setSize([window.innerWidth, window.innerHeight])
  );

  const [selectedWords, setSelectedWords] = React.useState<string[]>([]);

  const [hideOutlines, setHideOutlines] = React.useState(false);

  // const Colors = {};
  const Colors = {
    a: "#1edcb0",
    b: "#94dc9e",
    c: "#727c59",
    d: "#cf6951",
    e: "#4d494d",
    f: "#5856c1",
    g: "#3420db",
    h: "#f696a0",
    i: "#9c4646",
    j: "#e38b3a",
    k: "#574142",
    l: "#bc8b80",
    m: "#19aa84",
    black: "#000000",
    blue: "#0000ff",
    brown: "#a52a2a",
    cyan: "#00ffff",
    darkcyan: "#008b8b",
    darkgrey: "#a9a9a9",
    darkgreen: "#006400",
    darkkhaki: "#bdb76b",
    darkmagenta: "#8b008b",
    darkolivegreen: "#556b2f",
    darkorange: "#ff8c00",
    darkorchid: "#9932cc",
    darkred: "#8b0000",
    darksalmon: "#e9967a",
    darkviolet: "#9400d3",
    fuchsia: "#ff00ff",
    gold: "#ffd700",
    green: "#008000",
    indigo: "#4b0082",
    khaki: "#f0e68c",
    lightblue: "#add8e6",
    lightcyan: "#e0ffff",
    lightgreen: "#90ee90",
    lightgrey: "#d3d3d3",
    lightpink: "#ffb6c1",
    lightyellow: "#ffffe0",
    lime: "#00ff00",
    magenta: "#ff00ff",
    maroon: "#800000",
    navy: "#000080",
    olive: "#808000",
    orange: "#ffa500",
    pink: "#ffc0cb",
    purple: "#800080",
    violet: "#800080",
    red: "#ff0000",
    silver: "#c0c0c0",
    white: "#ffffff",
    yellow: "#ffff00"
  };
  

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {data && (
        <EmailSpatialView
          width={width}
          height={height}
          data={data}
          selectedWords={selectedWords}
          mode={mode}
          onData={setData}
          hideOutlines={hideOutlines}
        />
      )}
      <h1>Massmail Explorer</h1>
      <a href={"https://github.com/koreanwglasses/massmail-explorer/"}>Source</a>
      <br />
      <input
        type="button"
        value="Original"
        onClick={() => setMode("ORIGINAL")}
      ></input>
      <br />
      <input
        type="button"
        value="Exploded"
        onClick={() => setMode("EXPLODED")}
      ></input>
      <br />
      <input
        type="checkbox"
        defaultChecked={hideOutlines}
        onClick={(e) => setHideOutlines((e.target as any).checked)}
      ></input>
      Fade Outlines
      <div>
        <h2>Keywords</h2>

        {keywordData &&
          keywordData.map((keyword, i) => (
            <input
              type="button"
              value={keyword}
              key={i}
              style={{
                display: "flex",
                width: 100,
                height: 40,
                justifyContent: "center",
                alignItems: "center",
                borderStyle: "none",
                borderWidth: "4px",
                // borderColor: Colors[Object.keys(Colors)[i]],
                borderColor: "rgba(0, 0, 255, 0.7)",
                borderRadius: "10px",
                marginBottom: "1px",
                backgroundColor:
                  selectedWords.indexOf(keyword) != -1 ? "white" : "rgba(0, 0, 255, 0.7)",
                color: selectedWords.indexOf(keyword) != -1 ? "rgba(0, 0, 255, 0.7)" : "white",
                fontSize: "16px",
                font: "Muli",
                padding: "'30px"
              }}
              onClick={() =>
                setSelectedWords(
                  selectedWords.indexOf(keyword) == -1 ? [keyword] : []
                )
              }
            /> 
          ))}
      </div>
    </div>
  );
}
