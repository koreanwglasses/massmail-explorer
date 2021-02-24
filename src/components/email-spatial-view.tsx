import * as React from "react";
import * as d3 from "d3";
import { ClusterData, EmailData, MassmailData } from "../massmail-data";
import { roundedHull } from "../d3/rounded-enclosing-hull";

export function EmailSpatialView({
  data,
  width,
  height,
  selectedWords,
}: {
  data: MassmailData;
  width: number;
  height: number;
  selectedWords: string[];
}) {
  function chart() {
    // Drawing parameters

    /**
     * Radius of each circle
     */
    const radius = 10;
    /**
     * Color of each circle
     */
    const color = "#888";

    const clusterStrokeWidth = "5px";
    const clusterPadding = 40;

    // Layout helpers

    let view: [centerX: number, centerY: number, viewportSize: number] = [
      0,
      0,
      2,
    ];
    const x = (value: number) => (value - view[0]) * (width / view[2]);
    const xInv = (value: number) => value * (view[2] / width) + view[0];

    const y = (value: number) => (value - view[1]) * (width / view[2]);
    const yInv = (value: number) => value * (view[2] / width) + view[1];

    // Node declarations

    const wrapper = d3.create("div");

    const svg = wrapper.append("svg");
    const zoomG = svg.append("g");
    const clusterG = zoomG.append("g");
    const circleG = zoomG.append("g");

    const tooltip = wrapper.append("div");

    // Drawing functions

    let clusterOutlines: d3.Selection<
      SVGPathElement,
      ClusterData,
      null,
      undefined
    >[] = [];
    function drawClusterOutlines() {
      clusterOutlines = data.clusters.map((cluster, i) => {
        const vertices = data.emails
          .filter((email) => email.clusterId === cluster.id)
          .map(
            (email) =>
              [x(email.embedding.x), y(email.embedding.y)] as [number, number]
          );
        const hull = vertices.length < 3 ? vertices : d3.polygonHull(vertices);
        return (
          clusterOutlines[i] ||
          clusterG
            .append("path")
            .datum(cluster)
            .style("stroke", color)
            .style("stroke-width", clusterStrokeWidth)
            .style("fill", "transparent")
        ).attr("d", roundedHull(hull, clusterPadding));
      });
    }

    let clusterLabels: d3.Selection<
      HTMLInputElement,
      ClusterData,
      null,
      undefined
    >[] = [];
    function drawClusterLabels() {
      clusterLabels = data.clusters.map((cluster, i) => {
        const vertices = data.emails
          .filter((email) => email.clusterId === cluster.id)
          .map(
            (email) =>
              [x(email.embedding.x), y(email.embedding.y)] as [number, number]
          );
        const hull = vertices.length < 3 ? vertices : d3.polygonHull(vertices);
        return (
          clusterLabels[i] || clusterG.append("input").datum(cluster)
        ).style("left", 0);
      });
    }

    // Event handlers

    const circleMouseEnter = (event: MouseEvent, d: EmailData): void => {
      tooltip
        .text(d.content || "(no content)")
        .style("left", `${event.clientX}px`)
        .style("top", `${event.clientY}px`)
        .style("opacity", 100);
    };
    const circleMouseMove = (event: MouseEvent, d: EmailData): void => {
      tooltip
        .style("left", `${event.clientX}px`)
        .style("top", `${event.clientY}px`);
    };
    const circleMouseLeave = (event: MouseEvent, d: EmailData): void => {
      tooltip.style("opacity", 0);
    };

    const circleDragStart = function (this: Element): void {
      d3.select(this).raise();
      circleG.attr("cursor", "grabbing");
    };
    const getClusterPathUnderPointer = function (event: any) {
      const [x, y] = d3.pointer(event);
      return document
        .elementsFromPoint(x, y)
        .find((elem) => elem.tagName === "path");
    };
    function createSingletonCluster(d: EmailData) {
      const cluster = {
        id: Math.random() * Number.MAX_SAFE_INTEGER,
        label: "",
      };
      data.clusters.push(cluster);
      d.clusterId = cluster.id;
    }
    const circleDragging = function (event: any, d: EmailData) {
      d3.select(this).attr("cx", event.x).attr("cy", event.y);
    };
    const circleDragEnd = function (
      event: { x: number; y: number; sourceEvent: MouseEvent },
      d: EmailData
    ) {
      const path = getClusterPathUnderPointer(event);

      d.embedding.x = xInv(event.x);
      d.embedding.y = yInv(event.y);
      if (path) {
        const cluster = d3.select(path).datum() as ClusterData;
        d.clusterId = cluster.id;
      } else {
        createSingletonCluster(d);
      }
      drawClusterOutlines();
    };

    // Node properties

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    svg.attr("viewBox", [0, 0, width, height] as any);

    drawClusterOutlines();

    circleG.attr("cursor", "grab");

    tooltip
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background-color", "white")
      .style("max-width", "100px")
      .style("padding", "5px")
      .style("border", "2px solid black");

    circleG
      .selectAll("circle")
      .data(data.emails)
      .join("circle")
      .attr("cx", (d) => x(d.embedding.x))
      .attr("cy", (d) => y(d.embedding.y))
      .attr("r", radius)
      .attr("fill", color)
      .on("mouseenter", circleMouseEnter)
      .on("mousemove", circleMouseMove)
      .on("mouseleave", circleMouseLeave)
      .call(
        d3
          .drag()
          .on("start", circleDragStart)
          .on("drag", circleDragging)
          .on("end", circleDragEnd) as any
      );

    svg.call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([0.5, 4])
        .on("zoom", ({ transform }) => zoomG.attr("transform", transform))
    );

    return wrapper.node();
  }

  const containerRef = React.useRef<HTMLDivElement>();

  React.useEffect(() => {
    const node = chart();
    containerRef.current.appendChild(node);

    return () => node.remove();
  }, []);

  React.useEffect(() => {}, [selectedWords]);

  return <div style={{ display: "inline" }} ref={containerRef}></div>;
}
