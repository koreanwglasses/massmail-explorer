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
    var xn = ctm.e + x*ctm.a + y*ctm.c;
    var yn = ctm.f + x*ctm.b + y*ctm.d;
    return { x: xn, y: yn };
}

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
    const radius = 2;


    /**
     * Color of each circle
     */
    const color = "#888";

    const clusterStrokeWidth = "2px";
    const clusterPadding = 10;

    const clusterLabelOffset = 5;

    // Layout helpers

    let view: [centerX: number, centerY: number, viewportSize: number] = [
      -50, -50, 100,
      // 0,0,2
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

    const labelInput = wrapper.append("input");

    // Helper functions

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
      SVGTextElement,
      ClusterData,
      null,
      undefined
    >[] = [];
    function drawClusterLabels() {
      clusterLabels = data.clusters.map((cluster, i) => {
        const vertices = getClusterPoints(cluster);
        return (
          clusterLabels[i] ||
          clusterG.append("text").datum(cluster).attr("text-anchor", "middle").on("click", function(event, d) {
              labelInput.style("opacity", 100).attr("value", d.label)
          })
        )
          .text(cluster.label)
          .attr(
            "x",
            vertices.length && d3.mean(d3.extent(vertices.map(([x, y]) => x)))
          )
          .attr(
            "y",
            vertices.length &&
              d3.min(vertices.map(([x, y]) => y)) - clusterPadding - clusterLabelOffset
          );
      });
    }

    // Event handlers

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

      d.embedding.x = xInv(event.x);
      d.embedding.y = yInv(event.y); 
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

    // Node properties

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    svg.attr("viewBox", [0, 0, width, height] as any);


    circleG.attr("cursor", "grab");

    tooltip
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("background-color", "white")
      .style("max-width", "200px")
      .style("max-height", "400px")
      .style("overflow", "hidden")
      .style("padding", "5px")
      .style("border", "2px solid black");

    labelInput
      .attr("type", "text")
      .style("opacity", 0)
      .style("position", "absolute")
      
    drawClusterOutlines();

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

    drawClusterLabels();

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

  return (
    <div
      style={{ display: "inline", height: `${height}px`, width: `${width}px` }}
      ref={containerRef}
    ></div>
  );
}
