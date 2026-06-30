import React, { useEffect, useRef, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries } from 'lightweight-charts';
import { calculateSMA, calculateEMA } from '../utils/indicators';
import { LayoutGrid } from 'lucide-react';

export default function ChartContainer({
  candles,
  activeSymbol,
  activeTimeframe,
  activeTool,
  setActiveTool,
  drawings,
  setDrawings,
  magnetMode,
  drawModeLock,
  lockDrawings,
  hideDrawings,
  onOpenSettings
}) {
  const chartContainerRef = useRef(null);
  const canvasRef = useRef(null);

  // References for chart objects
  const chartRef = useRef(null);
  
  // References for series objects
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const smaSeriesRef = useRef({ 9: null, 20: null, 50: null });
  const emaSeriesRef = useRef({ 9: null, 21: null, 50: null });

  // UI States for Indicators
  const [activeIndicators, setActiveIndicators] = useState({
    sma9: false,
    sma20: false,
    sma50: false,
    ema9: false,
    ema21: false,
    ema50: false,
    volume: true,
  });

  // Drawing states
  const drawingStartRef = useRef(null);
  const currentDragPointRef = useRef(null);
  const activeDragDrawingRef = useRef(null);

  const [isDrawing, setIsDrawing] = useState(false);
  const [selectedDrawingId, setSelectedDrawingId] = useState(null);
  const [dragTarget, setDragTarget] = useState(null);

  // ==========================================
  // 1. Initialize Chart Containers
  // ==========================================
  useEffect(() => {
    if (!chartContainerRef.current) return;

    // Create Main Chart
    const mainChart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#131722' },
        textColor: '#d1d4dc',
      },
      grid: {
        vertLines: { color: '#2a2e39' },
        horzLines: { color: '#2a2e39' },
      },
      crosshair: {
        mode: 1, // Normal crosshair
        vertLine: { color: 'rgba(117, 134, 150, 0.4)', style: 3 },
        horzLine: { color: 'rgba(117, 134, 150, 0.4)', style: 3 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: true,
        secondsVisible: false,
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
      },
    });

    chartRef.current = mainChart;

    // Add Candlestick Series
    const candlesSeries = mainChart.addSeries(CandlestickSeries, {
      upColor: '#26a69a',
      downColor: '#ef5350',
      borderVisible: false,
      wickUpColor: '#26a69a',
      wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candlesSeries;

    // Add Volume Histogram Series
    const volumeSeries = mainChart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: '', // overlay pane
    });
    volumeSeriesRef.current = volumeSeries;

    // Configure volume pane bounds
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.75, // volume sits in bottom 25% of chart
        bottom: 0,
      },
    });

    // Sync charts dimensions on container resizes
    const handleResize = () => {
      if (!chartContainerRef.current) return;
      const parent = chartContainerRef.current.parentElement;
      if (!parent) return;

      const totalHeight = parent.clientHeight;
      const indicatorsHeader = parent.querySelector('.chart-canvas-header');
      const headerHeight = indicatorsHeader ? indicatorsHeader.clientHeight : 0;
      
      const chartHeight = totalHeight - headerHeight;
      mainChart.resize(parent.clientWidth, Math.max(150, chartHeight));
      
      drawCanvas();
    };

    window.addEventListener('resize', handleResize);
    // Trigger initial resizing calculations
    setTimeout(handleResize, 120);

    return () => {
      window.removeEventListener('resize', handleResize);
      mainChart.remove();
    };
  }, []);

  // Bind mouse selection and double-clicks to the chart container when in cursor mode
  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const handleContainerMouseDown = (e) => {
      if (activeTool !== 'cursor' || lockDrawings) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const chart = chartRef.current;
      const series = candleSeriesRef.current;
      if (!chart || !series) return;

      const logical = chart.timeScale().coordinateToLogical(x);
      const price = series.coordinateToPrice(y);
      if (logical === null || price === null) return;

      // 1. Check if clicked on a selected endpoint handle first
      const handlePoint = getHandleTarget(x, y);
      if (handlePoint) {
        const selectedDrawing = drawings.find(d => d.id === selectedDrawingId);
        if (selectedDrawing) {
          activeDragDrawingRef.current = JSON.parse(JSON.stringify(selectedDrawing));
          setDragTarget({
            drawingId: selectedDrawingId,
            point: handlePoint,
          });
        }
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // 2. Check if clicked near a line to drag the whole line
      const clickedDrawing = findDrawingAtCoordinate(x, y);
      if (clickedDrawing) {
        setSelectedDrawingId(clickedDrawing.id);
        activeDragDrawingRef.current = JSON.parse(JSON.stringify(clickedDrawing));
        
        if (clickedDrawing.type === 'horizontal') {
          setDragTarget({
            drawingId: clickedDrawing.id,
            point: 'yPrice',
            initialMousePrice: price,
            initialYPrice: clickedDrawing.yPrice
          });
        } else {
          setDragTarget({
            drawingId: clickedDrawing.id,
            point: 'line',
            initialMousePrice: price,
            initialMouseLogical: logical,
            initialP1: { ...clickedDrawing.p1 },
            initialP2: { ...clickedDrawing.p2 }
          });
        }
        
        e.stopPropagation();
        e.preventDefault();
      } else {
        setSelectedDrawingId(null);
      }
    };

    const handleContainerDblClick = (e) => {
      if (activeTool !== 'cursor' || lockDrawings) return;
      
      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const clickedDrawing = findDrawingAtCoordinate(x, y);
      if (clickedDrawing && onOpenSettings) {
        onOpenSettings(clickedDrawing);
      }
    };

    // Use capture phase (true) for mousedown to intercept grab clicks before Lightweight Charts pans the chart
    container.addEventListener('mousedown', handleContainerMouseDown, true);
    container.addEventListener('dblclick', handleContainerDblClick);

    return () => {
      container.removeEventListener('mousedown', handleContainerMouseDown, true);
      container.removeEventListener('dblclick', handleContainerDblClick);
    };
  }, [activeTool, drawings, activeSymbol, lockDrawings, selectedDrawingId, onOpenSettings]);

  // Bind mouse move and release listeners while grabbing
  useEffect(() => {
    if (!dragTarget) return;

    const handleWindowMouseMove = (e) => {
      const container = chartContainerRef.current;
      if (!container || !chartRef.current || !candleSeriesRef.current || !activeDragDrawingRef.current) return;

      const rect = container.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const chart = chartRef.current;
      const series = candleSeriesRef.current;

      const logical = chart.timeScale().coordinateToLogical(x);
      const price = series.coordinateToPrice(y);
      if (logical === null || price === null) return;

      // Magnet Snap if active
      let finalPrice = price;
      let finalLogical = logical;
      if (magnetMode) {
        const snap = getMagnetSnappedPrice(x, y);
        if (snap) {
          finalPrice = snap.price;
        }
      }

      const d = activeDragDrawingRef.current;

      if (d.type === 'horizontal') {
        d.yPrice = finalPrice;
      } else if (dragTarget.point === 'p1') {
        d.p1.price = finalPrice;
        d.p1.logical = Math.round(finalLogical);
      } else if (dragTarget.point === 'p2') {
        d.p2.price = finalPrice;
        d.p2.logical = Math.round(finalLogical);
      } else if (dragTarget.point === 'line') {
        const dPrice = price - dragTarget.initialMousePrice;
        const dLogical = Math.round(logical - dragTarget.initialMouseLogical);

        d.p1.price = dragTarget.initialP1.price + dPrice;
        d.p1.logical = dragTarget.initialP1.logical + dLogical;
        d.p2.price = dragTarget.initialP2.price + dPrice;
        d.p2.logical = dragTarget.initialP2.logical + dLogical;
      }

      // Repaint canvas synchronously for 0ms lag
      drawCanvas();
    };

    const handleWindowMouseUp = () => {
      if (activeDragDrawingRef.current) {
        const committed = activeDragDrawingRef.current;
        setDrawings(prev => prev.map(item => item.id === committed.id ? committed : item));
        activeDragDrawingRef.current = null;
      }
      setDragTarget(null);
    };

    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [dragTarget, magnetMode]);

  // Update Series Data
  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current) return;

    candleSeriesRef.current.setData(candles);

    // Format volume histogram data
    const volumeData = candles.map((item) => ({
      time: item.time,
      value: item.volume,
      color: item.close >= item.open ? 'rgba(34, 197, 94, 0.25)' : 'rgba(239, 68, 68, 0.25)',
    }));
    volumeSeriesRef.current.setData(volumeData);

    const chart = chartRef.current;

    // SMA 9
    if (activeIndicators.sma9) {
      if (!smaSeriesRef.current[9]) {
        smaSeriesRef.current[9] = chart.addSeries(LineSeries, { color: '#0052ff', lineWidth: 1.5, title: 'SMA 9' });
      }
      smaSeriesRef.current[9].setData(calculateSMA(candles, 9));
    } else if (smaSeriesRef.current[9]) {
      chart.removeSeries(smaSeriesRef.current[9]);
      smaSeriesRef.current[9] = null;
    }

    // SMA 20
    if (activeIndicators.sma20) {
      if (!smaSeriesRef.current[20]) {
        smaSeriesRef.current[20] = chart.addSeries(LineSeries, { color: '#22c55e', lineWidth: 1.5, title: 'SMA 20' });
      }
      smaSeriesRef.current[20].setData(calculateSMA(candles, 20));
    } else if (smaSeriesRef.current[20]) {
      chart.removeSeries(smaSeriesRef.current[20]);
      smaSeriesRef.current[20] = null;
    }

    // SMA 50
    if (activeIndicators.sma50) {
      if (!smaSeriesRef.current[50]) {
        smaSeriesRef.current[50] = chart.addSeries(LineSeries, { color: '#06b6d4', lineWidth: 1.5, title: 'SMA 50' });
      }
      smaSeriesRef.current[50].setData(calculateSMA(candles, 50));
    } else if (smaSeriesRef.current[50]) {
      chart.removeSeries(smaSeriesRef.current[50]);
      smaSeriesRef.current[50] = null;
    }

    // EMA 9
    if (activeIndicators.ema9) {
      if (!emaSeriesRef.current[9]) {
        emaSeriesRef.current[9] = chart.addSeries(LineSeries, { color: '#e91e63', lineWidth: 1.5, title: 'EMA 9' });
      }
      emaSeriesRef.current[9].setData(calculateEMA(candles, 9));
    } else if (emaSeriesRef.current[9]) {
      chart.removeSeries(emaSeriesRef.current[9]);
      emaSeriesRef.current[9] = null;
    }

    // EMA 21
    if (activeIndicators.ema21) {
      if (!emaSeriesRef.current[21]) {
        emaSeriesRef.current[21] = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1.5, title: 'EMA 21' });
      }
      emaSeriesRef.current[21].setData(calculateEMA(candles, 21));
    } else if (emaSeriesRef.current[21]) {
      chart.removeSeries(emaSeriesRef.current[21]);
      emaSeriesRef.current[21] = null;
    }

    // EMA 50
    if (activeIndicators.ema50) {
      if (!emaSeriesRef.current[50]) {
        emaSeriesRef.current[50] = chart.addSeries(LineSeries, { color: '#9c27b0', lineWidth: 1.5, title: 'EMA 50' });
      }
      emaSeriesRef.current[50].setData(calculateEMA(candles, 50));
    } else if (emaSeriesRef.current[50]) {
      chart.removeSeries(emaSeriesRef.current[50]);
      emaSeriesRef.current[50] = null;
    }

    drawCanvas();
  }, [candles, activeIndicators]);

  // Redraw canvas overlay synchronously on chart scroll / zoom / timescale changes
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;

    const handleScroll = () => {
      drawCanvas();
    };

    chart.timeScale().subscribeVisibleLogicalRangeChange(handleScroll);
    
    try {
      chart.priceScale('right').subscribeVisiblePriceRangeChange(handleScroll);
    } catch (e) {
      console.warn("Price scale subscription failed:", e);
    }

    // Force initial redraw
    drawCanvas();

    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.timeScale().unsubscribeVisibleLogicalRangeChange(handleScroll);
          chartRef.current.priceScale('right').unsubscribeVisiblePriceRangeChange(handleScroll);
        } catch (e) {}
      }
    };
  }, [drawings, activeSymbol, activeTimeframe, activeTool, isDrawing, hideDrawings, selectedDrawingId]);

  // ==========================================
  // 3. Canvas Layer & Drawing Calculations
  // ==========================================
  const drawArrow = (ctx, fromX, fromY, toX, toY) => {
    const headLength = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);
    
    ctx.fillStyle = ctx.strokeStyle;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    ctx.fill();
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !chartRef.current || !candleSeriesRef.current) return;
    const ctx = canvas.getContext('2d');

    if (hideDrawings) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    // Match dimensions to container client bounds
    const container = chartContainerRef.current;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw saved drawings
    drawings.forEach((savedDrawing) => {
      if (savedDrawing.symbol !== activeSymbol) return;

      // Use real-time ref coordinates if this drawing is currently being dragged to avoid React render delays
      let drawing = savedDrawing;
      if (activeDragDrawingRef.current && activeDragDrawingRef.current.id === savedDrawing.id) {
        drawing = activeDragDrawingRef.current;
      }

      const settings = drawing.settings || { lineColor: '#38bdf8', lineWidth: 1.5, lineStyle: 'solid' };
      
      // Timeframe visibility filters
      const getTfCategory = (tf) => {
        if (!tf) return 'minutes';
        const lower = tf.toLowerCase();
        if (lower.endsWith('s')) return 'seconds';
        if (lower.endsWith('m')) return 'minutes';
        if (lower.endsWith('h')) return 'hours';
        if (lower.endsWith('d')) return 'days';
        return 'minutes';
      };
      
      const tfCategory = getTfCategory(activeTimeframe);
      const tfVisibility = settings.visibility || { seconds: true, minutes: true, hours: true, days: true };
      if (!tfVisibility[tfCategory]) {
        return; // Skip rendering on this timeframe category
      }

      const color = settings.lineColor || '#38bdf8';
      const width = settings.lineWidth || 1.5;
      const isSelected = drawing.id === selectedDrawingId;

      ctx.strokeStyle = isSelected ? '#ffffff' : color;
      ctx.lineWidth = width;

      // Handle Solid, Dashed, or Dotted lines
      if (settings.lineStyle === 'dashed') {
        ctx.setLineDash([6, 6]);
      } else if (settings.lineStyle === 'dotted') {
        ctx.setLineDash([2, 4]);
      } else {
        ctx.setLineDash([]);
      }

      if (drawing.type === 'horizontal') {
        const y = series.priceToCoordinate(drawing.yPrice);
        if (y === null || y < 0 || y > canvas.height) return;

        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Label flag on axis
        if (settings.priceLabels !== false || isSelected) {
          ctx.fillStyle = isSelected ? '#38bdf8' : '#1e293b';
          ctx.fillRect(canvas.width - 80, y - 9, 80, 18);
          ctx.fillStyle = '#ffffff';
          ctx.font = '10px JetBrains Mono, sans-serif';
          ctx.fillText(`$${drawing.yPrice.toFixed(2)}`, canvas.width - 70, y + 4);
        }
      } 
      
      else if (drawing.type === 'trendline' || drawing.type === 'fibonacci' || drawing.type === 'pattern' || drawing.type === 'brush') {
        const x1 = drawing.p1.logical !== undefined
          ? chart.timeScale().logicalToCoordinate(drawing.p1.logical)
          : chart.timeScale().timeToCoordinate(drawing.p1.time);
        const y1 = series.priceToCoordinate(drawing.p1.price);
        const x2 = drawing.p2.logical !== undefined
          ? chart.timeScale().logicalToCoordinate(drawing.p2.logical)
          : chart.timeScale().timeToCoordinate(drawing.p2.time);
        const y2 = series.priceToCoordinate(drawing.p2.price);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return;

        // Render trendline / pattern line
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.setLineDash([]);

        // Left / Right Arrowheads
        if (settings.leftArrow) {
          drawArrow(ctx, x2, y2, x1, y1);
        }
        if (settings.rightArrow) {
          drawArrow(ctx, x1, y1, x2, y2);
        }

        // Show Mid-Point
        if (settings.middlePoint) {
          const mx = (x1 + x2) / 2;
          const my = (y1 + y2) / 2;
          ctx.fillStyle = isSelected ? '#ffffff' : color;
          ctx.beginPath();
          ctx.arc(mx, my, 3.5, 0, 2 * Math.PI);
          ctx.fill();
        }

        // Price Labels on scale
        if (settings.priceLabels) {
          ctx.fillStyle = color;
          ctx.font = '10px JetBrains Mono, sans-serif';
          
          // Draw label p1
          ctx.fillRect(canvas.width - 70, y1 - 9, 70, 18);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`$${drawing.p1.price.toFixed(2)}`, canvas.width - 65, y1 + 4);
          
          // Draw label p2
          ctx.fillStyle = color;
          ctx.fillRect(canvas.width - 70, y2 - 9, 70, 18);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(`$${drawing.p2.price.toFixed(2)}`, canvas.width - 65, y2 + 4);
        }

        // Selection handles
        if (isSelected) {
          ctx.fillStyle = '#ffffff';
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.5;
          ctx.beginPath(); ctx.arc(x1, y1, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
          ctx.beginPath(); ctx.arc(x2, y2, 5, 0, 2 * Math.PI); ctx.fill(); ctx.stroke();
        }

        // Render Text Annotation
        if (settings.text?.enabled && settings.text?.content) {
          const fontColor = settings.text.color || '#ffffff';
          const fontSize = settings.text.fontSize || 12;
          const isBold = settings.text.bold ? 'bold' : '';
          const isItalic = settings.text.italic ? 'italic' : '';
          
          ctx.fillStyle = fontColor;
          ctx.font = `${isItalic} ${isBold} ${fontSize}px Inter, sans-serif`;
          
          let tx = (x1 + x2) / 2;
          let ty = (y1 + y2) / 2 - 12; // place above line
          
          if (settings.text.alignment === 'left') {
            tx = x1 + 10;
          } else if (settings.text.alignment === 'right') {
            tx = x2 - 80;
          }
          
          ctx.fillText(settings.text.content, tx, ty);
        }

        // Render Stats Label Box
        const stats = settings.stats || {};
        const showStats = stats.alwaysShow || isSelected;
        
        if (showStats && (stats.priceRange || stats.percentChange || stats.barsRange || stats.dateTimeRange || stats.angle)) {
          const priceDiff = drawing.p2.price - drawing.p1.price;
          const percentChange = ((drawing.p2.price - drawing.p1.price) / drawing.p1.price) * 100;
          const barsRange = Math.abs(drawing.p2.logical - drawing.p1.logical);
          const angleDeg = Math.round(Math.atan2(-(y2 - y1), x2 - x1) * 180 / Math.PI);

          const lines = [];
          if (stats.priceRange) lines.push(`Price: $${priceDiff.toFixed(2)}`);
          if (stats.percentChange) lines.push(`Change: ${percentChange.toFixed(2)}%`);
          if (stats.barsRange) lines.push(`Bars: ${barsRange}`);
          if (stats.angle) lines.push(`Angle: ${angleDeg}°`);

          if (lines.length > 0) {
            ctx.font = '10px Inter, sans-serif';
            const boxWidth = 120;
            const boxHeight = lines.length * 15 + 10;
            
            const mx = (x1 + x2) / 2;
            let my = (y1 + y2) / 2;

            if (settings.statsPosition === 'top') {
              my = my - boxHeight - 15;
            } else if (settings.statsPosition === 'bottom') {
              my = my + 15;
            } else {
              my = my - boxHeight / 2;
            }

            // Draw dark stats glass panel box
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.roundRect(mx - boxWidth / 2, my, boxWidth, boxHeight, 6);
            ctx.fill();
            ctx.stroke();

            // Draw stats text lines
            ctx.fillStyle = '#ffffff';
            lines.forEach((line, index) => {
              ctx.fillText(line, mx - boxWidth / 2 + 10, my + 15 + index * 15);
            });
          }
        }
      }
    });

    // Draw active drawing in progress
    if (isDrawing && drawingStartRef.current && currentDragPointRef.current) {
      const x1 = drawingStartRef.current.logical !== undefined
        ? chart.timeScale().logicalToCoordinate(drawingStartRef.current.logical)
        : chart.timeScale().timeToCoordinate(drawingStartRef.current.time);
      const y1 = series.priceToCoordinate(drawingStartRef.current.price);
      const x2 = currentDragPointRef.current.x;
      const y2 = currentDragPointRef.current.y;

      if (x1 === null || y1 === null) return;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      
      ctx.setLineDash([]);
    }
  };

  // ==========================================
  // 4. Mouse Snapping & Interactivity
  // ==========================================
  const findDrawingAtCoordinate = (x, y) => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return null;

    const threshold = 12; // pixels distance limit
    let closestDrawing = null;
    let minDistance = threshold;

    drawings.forEach((drawing) => {
      if (drawing.symbol !== activeSymbol) return;

      if (drawing.type === 'horizontal') {
        const lineY = series.priceToCoordinate(drawing.yPrice);
        if (lineY === null) return;
        const dy = Math.abs(y - lineY);
        if (dy < minDistance) {
          minDistance = dy;
          closestDrawing = drawing;
        }
      } 
      
      else {
        const x1 = drawing.p1.logical !== undefined
          ? chart.timeScale().logicalToCoordinate(drawing.p1.logical)
          : chart.timeScale().timeToCoordinate(drawing.p1.time);
        const y1 = series.priceToCoordinate(drawing.p1.price);
        const x2 = drawing.p2.logical !== undefined
          ? chart.timeScale().logicalToCoordinate(drawing.p2.logical)
          : chart.timeScale().timeToCoordinate(drawing.p2.time);
        const y2 = series.priceToCoordinate(drawing.p2.price);

        if (x1 === null || y1 === null || x2 === null || y2 === null) return;

        // Vector math: distance to segment
        const A = x - x1;
        const B = y - y1;
        const C = x2 - x1;
        const D = y2 - y1;

        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        if (lenSq !== 0) param = dot / lenSq;

        let xx, yy;
        if (param < 0) {
          xx = x1;
          yy = y1;
        } else if (param > 1) {
          xx = x2;
          yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }

        const dx = x - xx;
        const dy = y - yy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < minDistance) {
          minDistance = dist;
          closestDrawing = drawing;
        }
      }
    });

    return closestDrawing;
  };

  const getHandleTarget = (x, y) => {
    if (!selectedDrawingId || !chartRef.current || !candleSeriesRef.current) return null;
    const drawing = drawings.find(d => d.id === selectedDrawingId);
    if (!drawing || drawing.symbol !== activeSymbol) return null;
    if (drawing.type === 'horizontal') return null;

    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    const x1 = drawing.p1.logical !== undefined
      ? chart.timeScale().logicalToCoordinate(drawing.p1.logical)
      : chart.timeScale().timeToCoordinate(drawing.p1.time);
    const y1 = series.priceToCoordinate(drawing.p1.price);
    const x2 = drawing.p2.logical !== undefined
      ? chart.timeScale().logicalToCoordinate(drawing.p2.logical)
      : chart.timeScale().timeToCoordinate(drawing.p2.time);
    const y2 = series.priceToCoordinate(drawing.p2.price);

    if (x1 === null || y1 === null || x2 === null || y2 === null) return null;

    const dist1 = Math.sqrt((x - x1) ** 2 + (y - y1) ** 2);
    const dist2 = Math.sqrt((x - x2) ** 2 + (y - y2) ** 2);

    if (dist1 < 10) return 'p1';
    if (dist2 < 10) return 'p2';
    return null;
  };

  const getMagnetSnappedPrice = (x, y) => {
    if (!magnetMode || candles.length === 0 || !chartRef.current || !candleSeriesRef.current) {
      return null;
    }
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    
    const logical = chart.timeScale().coordinateToLogical(x);
    if (logical === null) return null;
    
    const index = Math.round(logical);
    if (index < 0 || index >= candles.length) return null;
    
    const candle = candles[index];
    if (!candle) return null;
    
    const yOpen = series.priceToCoordinate(candle.open);
    const yHigh = series.priceToCoordinate(candle.high);
    const yLow = series.priceToCoordinate(candle.low);
    const yClose = series.priceToCoordinate(candle.close);
    
    if (yOpen === null || yHigh === null || yLow === null || yClose === null) return null;
    
    const points = [
      { price: candle.open, y: yOpen },
      { price: candle.high, y: yHigh },
      { price: candle.low, y: yLow },
      { price: candle.close, y: yClose }
    ];
    
    let closest = points[0];
    let minDist = Math.abs(y - points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(y - points[i].y);
      if (dist < minDist) {
        minDist = dist;
        closest = points[i];
      }
    }
    
    return { price: closest.price, y: closest.y };
  };

  const handleMouseDown = (e) => {
    if (lockDrawings) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return;

    // 1. Crosshair selection check
    if (activeTool === 'cursor') {
      const clickedDrawing = findDrawingAtCoordinate(x, y);
      if (clickedDrawing) {
        setSelectedDrawingId(clickedDrawing.id);
      } else {
        setSelectedDrawingId(null);
      }
      return;
    }

    const logical = chart.timeScale().coordinateToLogical(x);
    const price = series.coordinateToPrice(y);
    if (logical === null || price === null) return;

    // Eraser Tool logic
    if (activeTool === 'eraser') {
      eraseDrawingAtCoordinate(x, y);
      return;
    }

    // Determine snapping prices
    let clickPrice = price;
    let clickY = y;
    if (magnetMode) {
      const snap = getMagnetSnappedPrice(x, y);
      if (snap) {
        clickPrice = snap.price;
        clickY = snap.y;
      }
    }

    // Add Horizontal Line immediately
    if (activeTool === 'horizontal') {
      const newDrawing = {
        id: Date.now(),
        type: 'horizontal',
        symbol: activeSymbol,
        yPrice: clickPrice,
        settings: { lineColor: '#38bdf8', lineWidth: 2, lineStyle: 'solid' }
      };
      setDrawings([...drawings, newDrawing]);
      if (!drawModeLock) {
        setActiveTool('cursor');
      }
      return;
    }

    // Trendline or Fibonacci
    drawingStartRef.current = { logical, price: clickPrice };
    currentDragPointRef.current = { x, y: clickY };
    setIsDrawing(true);
    drawCanvas();
  };

  const handleMouseMove = (e) => {
    if (!isDrawing || !canvasRef.current || !drawingStartRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x1 = drawingStartRef.current.logical !== undefined
      ? chartRef.current.timeScale().logicalToCoordinate(drawingStartRef.current.logical)
      : chartRef.current.timeScale().timeToCoordinate(drawingStartRef.current.time);
    const y1 = candleSeriesRef.current.priceToCoordinate(drawingStartRef.current.price);

    let x2 = e.clientX - rect.left;
    let y2 = e.clientY - rect.top;

    // Multi-angle 45 degree Shift-Key lock
    if (e.shiftKey && x1 !== null && y1 !== null) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      x2 = x1 + dist * Math.cos(snappedAngle);
      y2 = y1 + dist * Math.sin(snappedAngle);
    } else {
      // Normal magnet snap
      if (magnetMode) {
        const snap = getMagnetSnappedPrice(x2, y2);
        if (snap) {
          y2 = snap.y;
        }
      }
    }

    currentDragPointRef.current = { x: x2, y: y2 };
    drawCanvas();
  };

  const handleMouseUp = (e) => {
    if (lockDrawings) return;
    if (!isDrawing || !drawingStartRef.current || !canvasRef.current || !chartRef.current || !candleSeriesRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x1 = drawingStartRef.current.logical !== undefined
      ? chartRef.current.timeScale().logicalToCoordinate(drawingStartRef.current.logical)
      : chartRef.current.timeScale().timeToCoordinate(drawingStartRef.current.time);
    const y1 = candleSeriesRef.current.priceToCoordinate(drawingStartRef.current.price);

    let x2 = e.clientX - rect.left;
    let y2 = e.clientY - rect.top;

    // Apply Shift key lock at end of drag
    if (e.shiftKey && x1 !== null && y1 !== null) {
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);
      
      const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);
      x2 = x1 + dist * Math.cos(snappedAngle);
      y2 = y1 + dist * Math.sin(snappedAngle);
    } else {
      if (magnetMode) {
        const snap = getMagnetSnappedPrice(x2, y2);
        if (snap) {
          y2 = snap.y;
        }
      }
    }

    const chart = chartRef.current;
    const series = candleSeriesRef.current;

    const logical = chart.timeScale().coordinateToLogical(x2);
    const price = series.coordinateToPrice(y2);

    if (logical !== null && price !== null) {
      const newDrawing = {
        id: Date.now(),
        type: activeTool,
        symbol: activeSymbol,
        p1: drawingStartRef.current,
        p2: { logical, price },
        settings: { lineColor: '#38bdf8', lineWidth: 2, lineStyle: 'solid' }
      };
      setDrawings([...drawings, newDrawing]);
      setSelectedDrawingId(newDrawing.id);
    }

    setIsDrawing(false);
    drawingStartRef.current = null;
    currentDragPointRef.current = null;
    if (!drawModeLock) {
      setActiveTool('cursor');
    }
  };

  const handleDoubleClick = (e) => {
    if (lockDrawings) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clickedDrawing = findDrawingAtCoordinate(x, y);
    if (clickedDrawing && onOpenSettings) {
      onOpenSettings(clickedDrawing);
    }
  };

  // Erases closest drawing line clicked
  const eraseDrawingAtCoordinate = (x, y) => {
    const chart = chartRef.current;
    const series = candleSeriesRef.current;
    if (!chart || !series) return;

    const clickedDrawing = findDrawingAtCoordinate(x, y);
    if (clickedDrawing) {
      setDrawings(drawings.filter(d => d.id !== clickedDrawing.id));
      setSelectedDrawingId(null);
    }
  };

  const toggleIndicator = (name) => {
    setActiveIndicators((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <div className="chart-container-root" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', flex: 1, position: 'relative' }}>
      
      {/* Overlays Indicator Toggles header bar */}
      <div className="chart-canvas-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)' }}>
        
        <div className="indicators-controls" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="control-label" style={{ fontSize: 10, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', marginRight: 6 }}>
            <LayoutGrid size={14} style={{ marginRight: 6 }} /> Overlays
          </span>
          <button
            className={`control-btn ${activeIndicators.sma9 ? 'active' : ''}`}
            onClick={() => toggleIndicator('sma9')}
          >
            SMA 9
          </button>
          <button
            className={`control-btn ${activeIndicators.sma20 ? 'active' : ''}`}
            onClick={() => toggleIndicator('sma20')}
          >
            SMA 20
          </button>
          <button
            className={`control-btn ${activeIndicators.sma50 ? 'active' : ''}`}
            onClick={() => toggleIndicator('sma50')}
          >
            SMA 50
          </button>
          <button
            className={`control-btn ${activeIndicators.ema9 ? 'active' : ''}`}
            onClick={() => toggleIndicator('ema9')}
          >
            EMA 9
          </button>
          <button
            className={`control-btn ${activeIndicators.ema21 ? 'active' : ''}`}
            onClick={() => toggleIndicator('ema21')}
          >
            EMA 21
          </button>
          <button
            className={`control-btn ${activeIndicators.ema50 ? 'active' : ''}`}
            onClick={() => toggleIndicator('ema50')}
          >
            EMA 50
          </button>
          <button
            className={`control-btn ${activeIndicators.volume ? 'active' : ''}`}
            onClick={() => toggleIndicator('volume')}
          >
            Volume
          </button>
        </div>

      </div>

      {/* Main Drawing Canvas overlay Stack */}
      <div className="chart-canvas-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        <div 
          ref={chartContainerRef} 
          className="chart-pane main-pane"
          style={{ width: '100%', flex: 1 }}
        />

        {/* Dynamic Canvas drawing overlay */}
        <canvas
          ref={canvasRef}
          className="drawing-overlay-canvas"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: activeTool === 'cursor' ? 'none' : 'auto',
            zIndex: 10,
            cursor: activeTool === 'cursor' ? 'default' : 'crosshair',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onDoubleClick={handleDoubleClick}
        />

      </div>
    </div>
  );
}
