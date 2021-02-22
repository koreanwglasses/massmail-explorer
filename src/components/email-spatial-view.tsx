import * as React from "react";
import * as d3 from "d3";
import { EmailData } from "../massmail-data";

export function EmailSpatialView({
  data,
  width,
  height,
  selectedWords,
}: {
  data: EmailData[];
  width: number;
  height: number;
  selectedWords: string[];
}) {
  function chart() {
    // Drawing parameters

    /**
     * Radius of each circle
     */
    const radius = 5;
    /**
     * Color of each circle
     */
    const color = "black";

    // Layout functions

    let view: [centerX: number, centerY: number, viewportSize: number] = [
      0,
      0,
      2,
    ];
    const x = (value: number) => (value - view[0]) * (width / view[2]);
    const y = (value: number) => (value - view[1]) * (width / view[2]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const svg = d3.create("svg").attr("viewBox", [0, 0, width, height] as any);

    svg
      .selectAll("circle")
      .data(data)
      .join("circle")
      .attr("cx", (d) => x(d.embedding.x))
      .attr("cy", (d) => y(d.embedding.y))
      .attr("r", radius)
      .attr("fill", color);

    return svg.node();
  }

  const containerRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    const node = chart();
    containerRef.current.appendChild(node);

    return () => node.remove();
  }, []);

  React.useEffect(() => {}, [selectedWords]);

  return <div ref={containerRef}></div>;
}
