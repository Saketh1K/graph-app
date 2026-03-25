'use client';

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

interface Node {
  id: string;
  label: string;
  type: string;
  color: string;
  val?: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
  label: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

export default function GraphView() {
  const [data, setData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const fetchGraph = async () => {
      try {
        const res = await fetch('/api/graph');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to fetch graph:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGraph();

    // Handle resizing
    if (containerRef.current) {
      setDimensions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      });
    }

    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight
        });
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-slate-900/50 backdrop-blur-md">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="h-full w-full relative overflow-hidden glass rounded-3xl">
      <div className="absolute top-4 left-4 z-10 flex gap-4 pointer-events-none">
        <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 rounded-full text-xs font-medium border border-blue-500/30">
          <div className="w-2 h-2 rounded-full bg-blue-500" /> Order
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/20 rounded-full text-xs font-medium border border-emerald-500/30">
          <div className="w-2 h-2 rounded-full bg-emerald-500" /> Delivery
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/20 rounded-full text-xs font-medium border border-amber-500/30">
          <div className="w-2 h-2 rounded-full bg-amber-500" /> Billing
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/20 rounded-full text-xs font-medium border border-rose-500/30">
          <div className="w-2 h-2 rounded-full bg-rose-500" /> Journal
        </div>
      </div>

      <ForceGraph2D
        graphData={data}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor="transparent"
        nodeLabel="label"
        nodeColor={(node) => (node as Node).color}
        nodeRelSize={6}
        linkDirectionalArrowLength={3.5}
        linkDirectionalArrowRelPos={1}
        linkCurvature={0.25}
        linkLabel="label"
        linkColor={() => 'rgba(255, 255, 255, 0.1)'}
        nodeCanvasObject={(node, ctx, globalScale) => {
          const n = node as Node;
          const label = n.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Inter`;
          const textWidth = ctx.measureText(label).width;

          ctx.fillStyle = n.color;
          ctx.beginPath();
          ctx.arc(n.x || 0, n.y || 0, 5, 0, 2 * Math.PI, false);
          ctx.fill();

          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(label, n.x || 0, (n.y || 0) + 10);
        }}
        onNodeClick={(node) => {
          console.log('Clicked node', node as Node);
        }}
      />
    </div>
  );
}
