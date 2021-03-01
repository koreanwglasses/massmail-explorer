import * as React from "react";
import * as d3 from "d3";
import { ClusterData, EmailData, MassmailData } from "../massmail-data";
import { roundedHull } from "../d3/rounded-enclosing-hull";
import { cluster, map } from "d3";

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

function memoize<F extends (...args: unknown[]) => unknown>(
  func: F,
  key: (...args: Parameters<F>) => string = (...args: Parameters<F>) =>
    args.reduce((a, b) => `${a},${b}`, "") as string
) {
  const memo = new Map<string, ReturnType<F>>();
  return Object.assign(
    function (...args: Parameters<F>) {
      const k = key(...args);
      if (!memo.has(k)) memo.set(k, func(...args) as ReturnType<F>);
      return memo.get(k);
    },
    {
      invalidate() {
        memo.clear();
      },
    }
  );
}

const transitionName = "email-spatial-view-mode";
export function EmailSpatialView({
  data,
  width,
  height,
  selectedWords = [],
  mode = "ORIGINAL",
  onData = () => {},
}: {
  data: MassmailData;
  width: number;
  height: number;
  selectedWords?: string[];
  mode?: "ORIGINAL" | "EXPLODED";
  onData?: (data: MassmailData) => void;
}) {
  // Drawing parameters

  /**
   * Radius of each circle
   */
  const radius = 4;

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

  const computeEmailPositionRef = React.useRef(
    memoize(
      function computeEmailPosition(
        data: MassmailData,
        email: EmailData,
        mode: "ORIGINAL" | "EXPLODED"
      ): [number, number] {
        const computeClusterBoundingBox = computeClusterBoundingBoxRef.current;

        const x = (value: number) => (value - view[0]) * (width / view[2]);
        const y = (value: number) => (value - view[1]) * (width / view[2]);

        if (mode === "ORIGINAL") {
          return [x(email.embedding.x), y(email.embedding.y)];
        }

        if (mode === "EXPLODED") {
          const clusterIndex = data.clusters.findIndex(
            ({ id }) => id === email.clusterId
          );

          const clusterBoundingBox = computeClusterBoundingBox(
            data,
            data.clusters[clusterIndex],
            "ORIGINAL"
          );

          if (clusterIndex === 0) {
            return [
              -clusterBoundingBox.left + x(email.embedding.x),
              -clusterBoundingBox.top + y(email.embedding.y),
            ];
          }

          const prevClusterBoundingBox = computeClusterBoundingBox(
            data,
            data.clusters[clusterIndex - 1],
            mode
          );

          if (prevClusterBoundingBox.right + clusterBoundingBox.width < 3000) {
            return [
              30 +
                prevClusterBoundingBox.right -
                clusterBoundingBox.left +
                x(email.embedding.x),
              prevClusterBoundingBox.top +
                -clusterBoundingBox.top +
                y(email.embedding.y),
            ];
          } else {
            return [
              -clusterBoundingBox.left + x(email.embedding.x),
              1200 +
                prevClusterBoundingBox.top +
                -clusterBoundingBox.top +
                y(email.embedding.y),
            ];
          }
        }
      },
      (data, email, mode) => `${email.embedding.x},${email.embedding.y},${mode}`
    )
  );
  React.useEffect(() => {
    computeEmailPositionRef.current.invalidate();
  }, [data]);

  const getClusterPointsRef = React.useRef(
    memoize(
      function getClusterPoints(
        data: MassmailData,
        cluster: ClusterData,
        mode: "ORIGINAL" | "EXPLODED"
      ) {
        const computeEmailPosition = computeEmailPositionRef.current;
        return data.emails
          .filter((email) => email.clusterId === cluster.id)
          .map((email) => computeEmailPosition(data, email, mode));
      },
      (data, { id }, mode) => `${id},${mode}`
    )
  );
  React.useEffect(() => {
    getClusterPointsRef.current.invalidate();
  }, [data]);

  const computeClusterBoundingBoxRef = React.useRef(
    memoize(
      function computeClusterBoundingBox(
        data: MassmailData,
        cluster: ClusterData,
        mode: "ORIGINAL" | "EXPLODED"
      ) {
        const getClusterPoints = getClusterPointsRef.current;

        const points = getClusterPoints(data, cluster, mode);
        const [left, right] = d3.extent(points.map(([x, y]) => x));
        const [top, bottom] = d3.extent(points.map(([x, y]) => y));
        const width = right - left;
        const height = bottom - top;

        return { left, right, top, bottom, width, height };
      },
      (data, { id }, mode) => `${id},${mode}`
    )
  );

  function getClusterPathUnderPointer(event: any) {
    const [x, y] = d3.pointer(event);
    return document
      .elementsFromPoint(x, y)
      .find((elem) => elem.tagName === "path");
  }

  function moveEmailToCluster(email: EmailData, cluster: ClusterData) {
    const newData = { ...data, emails: [...data.emails] };
    newData.emails[newData.emails.indexOf(email)] = {
      ...email,
      clusterId: cluster.id,
    };
    return newData;
  }

  function createSingletonCluster(d: EmailData) {
    const cluster = {
      id: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
      label: data.clusters.find(({ id }) => d.clusterId === id).label,
    };

    const newData = {
      ...data,
      clusters: [...data.clusters, cluster],
      emails: [...data.emails],
    };
    newData.emails[newData.emails.indexOf(d)] = { ...d, clusterId: cluster.id };
    return newData;
  }

  // Initialization
  const svgRef = React.useRef<SVGSVGElement>();
  const tooltipRef = React.useRef<HTMLDivElement>();

  const selectionsRef = React.useRef<{
    svg: d3.Selection<SVGElement, unknown, null, undefined>;
    zoomG: d3.Selection<SVGGElement, unknown, null, undefined>;
    clusterG: d3.Selection<SVGGElement, unknown, null, undefined>;
    circleG: d3.Selection<SVGGElement, unknown, null, undefined>;
    labelG: d3.Selection<SVGGElement, unknown, null, undefined>;
  }>();

  function init() {
    const svg = d3.select(svgRef.current);
    const zoomG = svg.append("g");
    const clusterG = zoomG.append("g");
    const circleG = zoomG.append("g");
    const labelG = zoomG.append("g");

    svg.attr("font-family", "sans-serif");

    circleG.attr("cursor", "grab");

    selectionsRef.current = { svg, zoomG, clusterG, circleG, labelG };
  }

  function resize() {
    const { svg, zoomG } = selectionsRef.current;
    svg.attr("viewBox", [0, 0, width, height] as any).call(
      d3
        .zoom()
        .extent([
          [0, 0],
          [width, height],
        ])
        .scaleExtent([0.25, 8])
        .on("zoom", ({ transform }) => zoomG.attr("transform", transform))
    );
  }

  function drawEmails() {
    const { circleG } = selectionsRef.current;
    const tooltip = d3.select(tooltipRef.current);
    const computeEmailPosition = computeEmailPositionRef.current;

    // event handlers
    function circleMouseEnter(event: MouseEvent, d: EmailData): void {
      tooltip
        .text(d.content || "(no content)")
        .style("left", `${event.offsetX}px`)
        .style("top", `${event.offsetY}px`)
        .style("opacity", 100);
    }
    function circleMouseMove(event: MouseEvent, d: EmailData): void {
      tooltip
        .style("left", `${event.offsetX}px`)
        .style("top", `${event.offsetY}px`);
    }
    function circleMouseLeave(event: MouseEvent, d: EmailData): void {
      tooltip.style("opacity", 0);
    }

    function circleDragStart(this: Element): void {
      d3.select(this).raise();
      circleG.attr("cursor", "grabbing");
    }
    function circleDragging(event: any, d: EmailData) {
      d3.select(this).attr("cx", event.x).attr("cy", event.y);
    }
    function circleDragEnd(
      event: { x: number; y: number; sourceEvent: MouseEvent },
      d: EmailData
    ) {
      const path = getClusterPathUnderPointer(event);

      if (path) {
        const cluster = d3.select(path).datum() as ClusterData;
        onData(moveEmailToCluster(d, cluster));
      } else {
        onData(createSingletonCluster(d));
      }

      // drawEmails();
      // drawClusterOutlines();
      // drawClusterLabels();
    }

    circleG
      .selectAll("circle")
      .data(data.emails)
      .join("circle")
      .call((g) =>
        g
          .transition(transitionName)
          .duration(2000)
          .attr("cx", (email) => computeEmailPosition(data, email, mode)[0])
          .attr("cy", (email) => computeEmailPosition(data, email, mode)[1])
          .style("opacity", (email) =>
            !selectedWords.length ||
            selectedWords
              .map((word) => email.content.includes(word))
              .reduce((a, b) => a || b, false)
              ? 1
              : 0.1
          )
      )
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
  }

  function drawClusterOutlines() {
    const { clusterG } = selectionsRef.current;
    const getClusterPoints = getClusterPointsRef.current;

    clusterG
      .selectAll("path")
      .data(data.clusters)
      .join("path")
      .style("stroke", color)
      .style("stroke-width", clusterStrokeWidth)
      .style("fill", "#eee")
      .call((g) =>
        g
          .transition(transitionName)
          .duration(2000)
          .style("opacity", { ORIGINAL: 0.2, EXPLODED: 1 }[mode])
          .attr("d", (cluster) => {
            const vertices = getClusterPoints(data, cluster, mode);
            const hull =
              vertices.length < 3 ? vertices : d3.polygonHull(vertices);
            return roundedHull(hull, clusterPadding);
          })
      );
  }

  function drawClusterLabels() {
    const { labelG } = selectionsRef.current;
    const getClusterPoints = getClusterPointsRef.current;

    labelG
      .selectAll("text")
      .data(data.clusters)
      .join("text")
      .attr("text-anchor", "middle")
      .text((d) => d.label)
      .call((g) =>
        g
          .transition(transitionName)
          .duration(2000)
          .attr("x", (cluster) => {
            const vertices = getClusterPoints(data, cluster, mode);
            return vertices.length
              ? d3.mean(d3.extent(vertices.map(([x, y]) => x)))
              : 0;
          })
          .attr("y", (cluster) => {
            const vertices = getClusterPoints(data, cluster, mode);
            return vertices.length
              ? d3.min(vertices.map(([x, y]) => y)) -
                  clusterPadding -
                  clusterLabelOffset
              : 0;
          })
      );
  }

  React.useEffect(() => {
    init();
    drawEmails();
    drawClusterOutlines();
    drawClusterLabels();

    // compute locations ahead of time
    computeClusterBoundingBoxRef.current(
      data,
      data.clusters[data.clusters.length - 1],
      "EXPLODED"
    );
  }, []);

  React.useEffect(() => {
    resize();
  }, [width, height]);

  React.useEffect(() => {
    drawEmails();
    drawClusterOutlines();
    drawClusterLabels();
  }, [mode, data]);

  return (
    <div
      style={{
        position: "fixed",
        left: 110,
        top: 0,
        height: `${height}px`,
        width: `${width - 110}px`,
      }}
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
