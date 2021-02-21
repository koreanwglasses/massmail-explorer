import * as React from "react";
import { EmailSpatialView } from "./components/email-spatial-view";
import { EmailWithEmbedding } from "./data/email";

export function MassmailExplorer() {
  const [data, setData] = React.useState<EmailWithEmbedding[]>();

  React.useEffect(() => {
    (async () => {
      const response = await fetch("/data/data.json");
      setData(await response.json());
    })();
  }, []);

  return (
    <>
      <h1>Title</h1>
      {data && <EmailSpatialView width={600} height={400} data={data} />}
    </>
  );
}
