"use client";

import React, { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import { alpha } from '@mui/material/styles';

function getSvgPathFromPoints(points) {
  if (points.length === 0) return '';
  
  const d = points.reduce((acc, point, i, a) => {
    if (i === 0) return `M ${point.x},${point.y}`;
    const cp = {
      x: (a[i - 1].x + point.x) / 2,
      y: (a[i - 1].y + point.y) / 2
    };
    return `${acc} Q ${a[i - 1].x},${a[i - 1].y} ${cp.x},${cp.y}`;
  }, '');
  
  return d + ` L ${points[points.length - 1].x},${points[points.length - 1].y}`;
}

export default function DocbookCircleToEditOverlay({ active, onCancel, onSelectionFound, editorRef }) {
  const [points, setPoints] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (!active) {
      setPoints([]);
      setIsDrawing(false);
      setIsClosing(false);
    }
  }, [active]);

  if (!active && !isClosing) return null;

  const handlePointerDown = (e) => {
    if (isClosing) return;
    setIsDrawing(true);
    setPoints([{ x: e.clientX, y: e.clientY }]);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing || isClosing) return;
    // Throttle slightly for performance if needed, but for smooth curves all points are good.
    setPoints(prev => [...prev, { x: e.clientX, y: e.clientY }]);
  };

  const handlePointerUp = (e) => {
    if (!isDrawing || isClosing) return;
    setIsDrawing(false);
    setIsClosing(true);
    e.currentTarget.releasePointerCapture(e.pointerId);

    if (points.length < 5) {
      // Too brief/small to be a circle.
      setTimeout(() => {
        setIsClosing(false);
        onCancel?.();
      }, 300);
      return;
    }

    // Calculate Bounding Box of the drawn path
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));

    let selectionMade = false;

    // Find text nodes inside this bounding box
    if (editorRef && editorRef.current) {
      const editor = editorRef.current;
      const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT, null, false);
      let node;
      const nodesInBox = [];

      while ((node = walker.nextNode())) {
        // Skip empty or purely whitespace nodes
        if (!node.nodeValue.trim()) continue;

        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = range.getClientRects();
        let intersects = false;
        for (let i = 0; i < rects.length; i++) {
          const r = rects[i];
          if (r.right > minX && r.left < maxX && r.bottom > minY && r.top < maxY) {
            intersects = true;
            break;
          }
        }
        if (intersects) {
          nodesInBox.push(node);
        }
      }

      if (nodesInBox.length > 0) {
        const sel = window.getSelection();
        sel.removeAllRanges();
        const newRange = document.createRange();
        
        // Set start to the first node and end to the last node found
        const firstNode = nodesInBox[0];
        const lastNode = nodesInBox[nodesInBox.length - 1];

        // Get exact string boundaries to ensure selection looks good
        newRange.setStart(firstNode, 0);
        newRange.setEnd(lastNode, lastNode.textContent.length);
        sel.addRange(newRange);
        selectionMade = true;
      }
    }

    // Disperse animation timeout
    setTimeout(() => {
      setIsClosing(false);
      if (selectionMade) {
        onSelectionFound?.();
      } else {
        onCancel?.();
      }
    }, 450);
  };

  return (
    <Box
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      sx={{
        position: 'fixed',
        inset: 0,
        zIndex: 2500,
        cursor: 'crosshair',
        touchAction: 'none',
        background: isDrawing || isClosing ? 'rgba(0,0,0,0.05)' : 'rgba(0,0,0,0)',
        transition: 'background 0.3s ease',
        opacity: isClosing ? 0 : 1,
      }}
    >
      {/* SVG Canvas for Drawing */}
      <svg
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      >
        <defs>
          <linearGradient id="samsungGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#8A2387" />
            <stop offset="50%" stopColor="#E94057" />
            <stop offset="100%" stopColor="#F27121" />
          </linearGradient>
          <filter id="samsungGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {points.length > 1 && (
          <path
            d={getSvgPathFromPoints(points)}
            fill="none"
            stroke="url(#samsungGlowGradient)"
            strokeWidth={isClosing ? 12 : 5}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#samsungGlowFilter)"
            style={{
              transition: 'stroke-width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        )}
      </svg>

      {!isDrawing && !isClosing && points.length === 0 && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(145deg, rgba(255,255,255,0.9), rgba(250,250,255,0.9))',
            padding: '12px 24px',
            borderRadius: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            pointerEvents: 'none',
            animation: 'pulseHint 2s infinite',
            '@keyframes pulseHint': {
              '0%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
              '50%': { transform: 'translate(-50%, -50%) scale(1.05)', opacity: 1 },
              '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: 0.8 },
            }
          }}
        >
          <Box sx={{ fontSize: 15, fontWeight: 700, color: '#333', textAlign: 'center' }}>
            Draw a circle over text to select
          </Box>
        </Box>
      )}
    </Box>
  );
}
