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
      const response = await fetch("/data/data.json");
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

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      {data && (
        <EmailSpatialView
          width={width}
          height={height}
          data={data}
          selectedWords={[]}
          mode={mode}
          onData={setData}
        />
      )}
      <h1>Massmail Explorer</h1>

      <input type="button" value="Original" onClick={() => setMode("ORIGINAL")}></input>
      <input type="button" value="Exploded" onClick={() => setMode("EXPLODED")}></input>

      <div>
        <h2>Keywords</h2>

        {keywordData &&
          keywordData.map((keyword) => (
            <input
              type="button"
              value={keyword}
              style={{
                display: "flex",
                width: 100,
                height: 50,
                justifyContent: "center",
                alignItems: "center",
              }}
            />
          ))}
      </div>
    </div>
  );
}
