import { cluster } from "d3";
import * as React from "react";
import { EmailSpatialView } from "./components/email-spatial-view";
import { MassmailData } from "./massmail-data";

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
                height: 50,
                justifyContent: "center",
                alignItems: "center",
                borderStyle: "solid",
                borderWidth: "2px",
                borderColor: "black",
                borderRadius: "0px",
                marginBottom: "1px",
                backgroundColor:
                  selectedWords.indexOf(keyword) == -1 ? "white" : "black",
                color: selectedWords.indexOf(keyword) == -1 ? "black" : "white",
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
