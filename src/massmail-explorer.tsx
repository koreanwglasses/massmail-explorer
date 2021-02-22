import * as React from "react";
import { EmailSpatialView } from "./components/email-spatial-view";
import { MassmailData } from "./massmail-data";

export function MassmailExplorer() {
  const [data, setData] = React.useState<MassmailData>();
  const keywordData = ["a", "b", "c"];

  React.useEffect(() => {
    (async () => {
      const response = await fetch("/data/data.json");
      setData(await response.json());
    })();
  }, []);

  return (
    <>
      <h1>Title</h1>
      {keywordData.map((keyword) => (
        <input type="button" value={keyword} style={{ width: "100px" }} />
      ))}
      {data && (
        <EmailSpatialView
          width={600}
          height={400}
          data={data.emails}
          selectedWords={[]}
        />
      )}
    </>
  );
}
