import * as React from "react";
import { EmailSpatialView } from "./components/email-spatial-view";

export function MassmailExplorer() {
  // TODO: retrieve real data, pass it forward to appropriate components
  const data = [
    { embedding: { x: 0.6, y: 0.1 } },
    { embedding: { x: 0.8, y: 0.2 } },
    { embedding: { x: 0.2, y: 0.5 } }
  ];

  return (
    <>
      <h1>Title</h1>
      <EmailSpatialView width={600} height={400} data={data} />
    </>
  );
}
