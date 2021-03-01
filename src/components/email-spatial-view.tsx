import * as React from "react";
import * as d3 from "d3";
import { ClusterData, EmailData, MassmailData } from "../massmail-data";
import { roundedHull } from "../d3/rounded-enclosing-hull";

/**
 * https://stackoverflow.com/a/18561829
 * @param x
 * @param y
 * @param ctm
 */
function getScreenCoords(x: number, y: number, ctm: DOMMatrix) {
  var xn = ctm.e + x * ctm.a + y * ctm.c;
  var yn = ctm.f + x * ctm.b + y * ctm.d;
  return { x: xn, y: yn };
}

export function EmailSpatialView({
  data,
  width,
  height,
  selectedWords = [],
  mode = "OVERLAP",
}: {
  data: MassmailData;
  width: number;
  height: number;
  selectedWords?: string[];
  mode?: "OVERLAP" | "EXPLODED";
}) {
  // Drawing parameters

  /**
   * Radius of each circle
   */
  const radius = 2;

  /**
   * Color of each circle
   */
  const color = "#888";

  const clusterStrokeWidth = "2px";
  const clusterPadding = 10;

  const clusterLabelOffset = 5;

  const view: [centerX: number, centerY: number, viewportSize: number] = [
    -50,
    -50,
    100,
  ];

  // Helper functions

  const x = (value: number) => (value - view[0]) * (width / view[2]);
  const y = (value: number) => (value - view[1]) * (width / view[2]);

  function getClusterPoints(cluster: ClusterData) {
    return data.emails
      .filter((email) => email.clusterId === cluster.id)
      .map(
        (email) =>
          [x(email.embedding.x), y(email.embedding.y)] as [number, number]
      );
  }
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

  // Initialization
  const svgRef = React.useRef<SVGSVGElement>();
  const tooltipRef = React.useRef<HTMLDivElement>();

  const selectionsRef = React.useRef<{
    svg: d3.Selection<SVGElement, unknown, null, undefined>;
    zoomG: d3.Selection<SVGGElement, unknown, null, undefined>;
    clusterG: d3.Selection<SVGGElement, unknown, null, undefined>;
    circleG: d3.Selection<SVGGElement, unknown, null, undefined>;
  }>();

  const init = () => {
    const svg = d3.select(svgRef.current);
    const zoomG = svg.append("g");
    const clusterG = zoomG.append("g");
    const circleG = zoomG.append("g");

    svg.attr("viewBox", [0, 0, width, height] as any);
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

    circleG.attr("cursor", "grab");

    selectionsRef.current = { svg, zoomG, clusterG, circleG };
  };

  const drawEmails = () => {
    const { circleG } = selectionsRef.current;
    const tooltip = d3.select(tooltipRef.current);

    // event handlers
    const circleMouseEnter = (event: MouseEvent, d: EmailData): void => {
      tooltip
        .text(d.content || "(no content)")
        .style("left", `${event.clientX + window.scrollX}px`)
        .style("top", `${event.clientY + window.scrollY}px`)
        .style("opacity", 100);
    };
    const circleMouseMove = (event: MouseEvent, d: EmailData): void => {
      tooltip
        .style("left", `${event.clientX + window.scrollX}px`)
        .style("top", `${event.clientY + window.scrollY}px`);
    };
    const circleMouseLeave = (event: MouseEvent, d: EmailData): void => {
      tooltip.style("opacity", 0);
    };

    const circleDragStart = function (this: Element): void {
      d3.select(this).raise();
      circleG.attr("cursor", "grabbing");
    };
    const circleDragging = function (event: any, d: EmailData) {
      d3.select(this).attr("cx", event.x).attr("cy", event.y);
    };
    const circleDragEnd = function (
      event: { x: number; y: number; sourceEvent: MouseEvent },
      d: EmailData
    ) {
      const path = getClusterPathUnderPointer(event);

      if (path) {
        const cluster = d3.select(path).datum() as ClusterData;
        d.clusterId = cluster.id;
      } else {
        const emailsInOriginalCluster = data.emails.filter(
          (email) => email.clusterId === d.clusterId
        );
        if (emailsInOriginalCluster.length > 1) {
          createSingletonCluster(d);
        }
      }
      drawClusterOutlines();
      drawClusterLabels();
    };

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
  };

  function drawClusterOutlines() {
    const { clusterG } = selectionsRef.current;
    clusterG
      .selectAll("path")
      .data(data.clusters)
      .join("path")
      .style("stroke", color)
      .style("stroke-width", clusterStrokeWidth)
      .style("fill", "transparent")
      .attr("d", (d) => {
        const vertices = getClusterPoints(d);
        const hull = vertices.length < 3 ? vertices : d3.polygonHull(vertices);
        return roundedHull(hull, clusterPadding);
      });
  }

  function drawClusterLabels() {
    const { clusterG } = selectionsRef.current;
    clusterG
      .selectAll("text")
      .data(data.clusters)
      .join("text")
      .attr("text-anchor", "middle")
      .text((d) => d.label)
      .attr("x", (d) => {
        const vertices = getClusterPoints(d);
        return vertices.length
          ? d3.mean(d3.extent(vertices.map(([x, y]) => x)))
          : 0;
      })
      .attr("y", (d) => {
        const vertices = getClusterPoints(d);
        return vertices.length
          ? d3.min(vertices.map(([x, y]) => y)) -
              clusterPadding -
              clusterLabelOffset
          : 0;
      });
  }

  React.useEffect(() => {
    init();
    drawEmails();
    drawClusterOutlines();
    drawClusterLabels();
  }, []);

  return (
    <div
      style={{ display: "inline-block", height: `${height}px`, width: `${width}px` }}
    >
      <svg width={width} height={height} ref={svgRef}></svg>
      <div
        ref={tooltipRef}
        style={{
          opacity: 0,
          position: "absolute",
          pointerEvents: "none",
          backgroundColor: "white",
          maxWidth: "300px",
          maxHeight: "400px",
          overflow: "hidden",
          padding: "5px",
          border: "2px solid black",
        }}
      ></div>
    </div>
  );
}
