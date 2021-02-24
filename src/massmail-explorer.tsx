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
      const response = await fetch("/data/data.json");
      setData(await response.json());
    })();
  }, []);

  return (
    <>
      <h1>Title</h1>

      <div style={{ display: "inline-block" }}>
        <h2>Keyword Section</h2>
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
      {data && (
        <EmailSpatialView
          width={600}
          height={400}
          data={data}
          selectedWords={[]}
        />
      )}
    </>
  );
}
