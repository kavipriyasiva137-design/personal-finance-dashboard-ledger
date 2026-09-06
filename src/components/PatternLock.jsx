import React, { useState, useRef, useCallback, useEffect } from 'react';

const GRID_SIZE = 3;
const NODES = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);

export default function PatternLock({ onPatternComplete, mode = 'verify', title }) {
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPoint, setCurrentPoint] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const containerRef = useRef(null);
  const nodeRefs = useRef([]);

  const getNodeCenter = useCallback((index) => {
    const node = nodeRefs.current[index];
    const container = containerRef.current;
    if (!node || !container) return { x: 0, y: 0 };
    const nodeRect = node.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    return {
      x: nodeRect.left - containerRect.left + nodeRect.width / 2,
      y: nodeRect.top - containerRect.top + nodeRect.height / 2,
    };
  }, []);

  const getNodeFromPoint = useCallback((clientX, clientY) => {
    for (let i = 0; i < NODES.length; i++) {
      const node = nodeRefs.current[i];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const distance = Math.sqrt((clientX - cx) ** 2 + (clientY - cy) ** 2);
      if (distance < 30) return i;
    }
    return -1;
  }, []);

  const handleStart = useCallback((clientX, clientY) => {
    const nodeIndex = getNodeFromPoint(clientX, clientY);
    if (nodeIndex >= 0) {
      setSelectedNodes([nodeIndex]);
      setIsDrawing(true);
      setError('');
      setSuccess(false);
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        setCurrentPoint({ x: clientX - rect.left, y: clientY - rect.top });
      }
    }
  }, [getNodeFromPoint]);

  const handleMove = useCallback((clientX, clientY) => {
    if (!isDrawing) return;
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      setCurrentPoint({ x: clientX - rect.left, y: clientY - rect.top });
    }
    const nodeIndex = getNodeFromPoint(clientX, clientY);
    if (nodeIndex >= 0 && !selectedNodes.includes(nodeIndex)) {
      setSelectedNodes(prev => [...prev, nodeIndex]);
    }
  }, [isDrawing, getNodeFromPoint, selectedNodes]);

  const handleEnd = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    setCurrentPoint(null);
    if (selectedNodes.length >= 4) {
      const patternStr = selectedNodes.join('-');
      onPatternComplete(patternStr, (isValid) => {
        if (isValid) {
          setSuccess(true);
          setError('');
        } else {
          setError(mode === 'verify' ? 'Incorrect pattern. Try again.' : 'Patterns do not match. Try again.');
          setTimeout(() => setSelectedNodes([]), 600);
        }
      });
    } else {
      setError('Connect at least 4 dots.');
      setTimeout(() => setSelectedNodes([]), 600);
    }
  }, [isDrawing, selectedNodes, onPatternComplete, mode]);

  // Mouse events
  const onMouseDown = (e) => { e.preventDefault(); handleStart(e.clientX, e.clientY); };
  const onMouseMove = (e) => { e.preventDefault(); handleMove(e.clientX, e.clientY); };
  const onMouseUp = () => handleEnd();

  // Touch events
  const onTouchStart = (e) => { const t = e.touches[0]; handleStart(t.clientX, t.clientY); };
  const onTouchMove = (e) => { e.preventDefault(); const t = e.touches[0]; handleMove(t.clientX, t.clientY); };
  const onTouchEnd = () => handleEnd();

  useEffect(() => {
    const handleGlobalUp = () => { if (isDrawing) handleEnd(); };
    window.addEventListener('mouseup', handleGlobalUp);
    window.addEventListener('touchend', handleGlobalUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalUp);
      window.removeEventListener('touchend', handleGlobalUp);
    };
  }, [isDrawing, handleEnd]);

  const lineColor = error ? '#ef4444' : success ? '#22c55e' : '#818cf8';

  return (
    <div className="pattern-lock-wrapper">
      {title && <p className="pattern-lock-title">{title}</p>}
      <div
        className="pattern-lock-grid"
        ref={containerRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* SVG Lines */}
        <svg className="pattern-lock-svg">
          {selectedNodes.map((node, i) => {
            if (i === 0) return null;
            const from = getNodeCenter(selectedNodes[i - 1]);
            const to = getNodeCenter(node);
            return (
              <line
                key={`line-${i}`}
                x1={from.x} y1={from.y}
                x2={to.x} y2={to.y}
                stroke={lineColor}
                strokeWidth="4"
                strokeLinecap="round"
                style={{ filter: `drop-shadow(0 0 6px ${lineColor})` }}
              />
            );
          })}
          {/* Active drawing line */}
          {isDrawing && currentPoint && selectedNodes.length > 0 && (
            <line
              x1={getNodeCenter(selectedNodes[selectedNodes.length - 1]).x}
              y1={getNodeCenter(selectedNodes[selectedNodes.length - 1]).y}
              x2={currentPoint.x}
              y2={currentPoint.y}
              stroke={lineColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray="8 4"
              opacity="0.7"
            />
          )}
        </svg>

        {/* Nodes */}
        {NODES.map((node) => {
          const isSelected = selectedNodes.includes(node);
          const isFirst = selectedNodes[0] === node;
          return (
            <div
              key={node}
              ref={el => nodeRefs.current[node] = el}
              className={`pattern-node ${isSelected ? 'selected' : ''} ${isFirst ? 'first' : ''} ${error ? 'error' : ''} ${success ? 'success' : ''}`}
            >
              <div className="pattern-node-inner" />
            </div>
          );
        })}
      </div>

      {error && <p className="pattern-lock-error">{error}</p>}
      {success && <p className="pattern-lock-success">Pattern verified ✓</p>}

      {selectedNodes.length > 0 && !isDrawing && !success && (
        <button
          className="pattern-lock-retry-btn"
          onClick={() => { setSelectedNodes([]); setError(''); }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
