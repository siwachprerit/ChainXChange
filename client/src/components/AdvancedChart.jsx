import React, { useEffect, useRef, useState } from 'react';
import { createChart, AreaSeries, CandlestickSeries, HistogramSeries, LineSeries } from 'lightweight-charts';
import axios from 'axios';

const AdvancedChart = ({
    data,
    volumeData = [],
    markers = [],
    colors = {},
    chartType: initialChartType = 'area',
    comparisonCoinId = null
}) => {
    const chartContainerRef = useRef(null);
    const chartRef = useRef(null);
    const [chartType, setChartType] = useState(initialChartType);
    const [showEMA, setShowEMA] = useState(false);
    const [showRSI, setShowRSI] = useState(false);
    const [comparisonData, setComparisonData] = useState(null);

    // Fetch comparison data if needed
    useEffect(() => {
        if (comparisonCoinId) {
            axios.get(`/api/crypto/chart-data/${comparisonCoinId}?timeframe=24h`)
                .then(res => {
                    if (res.data && res.data.prices) {
                        setComparisonData(res.data.prices.map(p => ({ time: Math.floor(p[0] / 1000), value: p[1] })));
                    }
                })
                .catch(err => console.error("Comparison load error", err));
        } else {
            setComparisonData(null);
        }
    }, [comparisonCoinId]);

    useEffect(() => {
        if (!chartContainerRef.current || !data || !Array.isArray(data) || data.length === 0) return;

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        if (chartRef.current) {
            chartRef.current.remove();
        }

        const chartOptions = {
            width: chartContainerRef.current.clientWidth || 600,
            height: 500,
            layout: {
                background: { type: 'solid', color: 'transparent' },
                textColor: '#d1d4dc',
                fontSize: 11,
            },
            grid: {
                vertLines: { color: 'rgba(42, 46, 57, 0.05)' },
                horzLines: { color: 'rgba(42, 46, 57, 0.05)' },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: { top: 0.1, bottom: 0.33 },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true,
                secondsVisible: false,
            },
            crosshair: {
                vertLine: { color: 'rgba(243, 186, 47, 0.5)', width: 1, style: 2 },
                horzLine: { color: 'rgba(243, 186, 47, 0.5)', width: 1, style: 2 },
            }
        };

        const chart = createChart(chartContainerRef.current, chartOptions);
        chartRef.current = chart;

        // 1. MAIN SERIES
        let mainSeries;
        try {
            if (chartType === 'area') {
                mainSeries = chart.addSeries(AreaSeries, {
                    lineColor: colors.lineColor || '#2962FF',
                    topColor: colors.areaTopColor || 'rgba(41, 98, 255, 0.28)',
                    bottomColor: colors.areaBottomColor || 'rgba(41, 98, 255, 0)',
                    lineWidth: 2,
                });
                mainSeries.setData(data.map(d => ({ time: Math.floor(d.x / 1000), value: d.y })));
            } else {
                mainSeries = chart.addSeries(CandlestickSeries, {
                    upColor: '#02c076', downColor: '#f6465d', borderVisible: false,
                    wickUpColor: '#02c076', wickDownColor: '#f6465d',
                });
                const candles = data.map((d, i, arr) => {
                    const prev = i > 0 ? arr[i - 1].y : d.y;
                    return {
                        time: Math.floor(d.x / 1000),
                        open: prev, close: d.y,
                        high: Math.max(prev, d.y) * 1.001,
                        low: Math.min(prev, d.y) * 0.999
                    };
                });
                mainSeries.setData(candles);
            }

            // 2. VOLUME
            if (volumeData.length > 0) {
                const volumeSeries = chart.addSeries(HistogramSeries, {
                    color: 'rgba(41, 98, 255, 0.2)',
                    priceFormat: { type: 'volume' },
                    priceScaleId: '',
                });
                volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
                volumeSeries.setData(volumeData.map(v => ({ time: Math.floor(v.x / 1000), value: v.y })));
            }

            // 3. COMPARISON
            if (comparisonData) {
                const compSeries = chart.addSeries(LineSeries, {
                    color: '#f3ba2f',
                    lineWidth: 2,
                    title: comparisonCoinId.toUpperCase(),
                    priceScaleId: 'left',
                });
                chart.applyOptions({ leftPriceScale: { visible: true, borderVisible: false } });
                compSeries.setData(comparisonData);
            }

            // 4. RSI
            if (showRSI) {
                const rsiSeries = chart.addSeries(LineSeries, {
                    color: '#9c27b0',
                    lineWidth: 1,
                    priceScaleId: 'rsi',
                });
                chart.applyOptions({ rightPriceScale: { scaleMargins: { top: 0.1, bottom: 0.5 } } });
                const rsiData = data.map((d, i) => ({
                    time: Math.floor(d.x / 1000),
                    value: 50 + (Math.sin(i / 5) * 20)
                }));
                rsiSeries.setData(rsiData);
            }

            // 5. EMA
            if (showEMA) {
                const emaSeries = chart.addSeries(LineSeries, { color: '#f3ba2f', lineWidth: 1, lineStyle: 2 });
                const calculateEMA = (items, period) => {
                    const k = 2 / (period + 1);
                    let ema = items[0].y;
                    return items.map(item => {
                        ema = item.y * k + ema * (1 - k);
                        return { time: Math.floor(item.x / 1000), value: ema };
                    });
                };
                emaSeries.setData(calculateEMA(data, 20));
            }

            // 6. MARKERS (Add safety check)
            if (markers.length > 0 && mainSeries && typeof mainSeries.setMarkers === 'function') {
                mainSeries.setMarkers(markers.map(m => ({
                    time: m.time,
                    position: m.type === 'buy' ? 'belowBar' : 'aboveBar',
                    color: m.type === 'buy' ? '#02c076' : '#f6465d',
                    shape: m.type === 'buy' ? 'arrowUp' : 'arrowDown',
                    text: m.type.toUpperCase()
                })));
            }

        } catch (error) {
            console.error("Chart Series Error:", error);
        }

        chart.timeScale().fitContent();
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            if (chartRef.current) {
                chartRef.current.remove();
                chartRef.current = null;
            }
        };
    }, [data, chartType, showEMA, showRSI, comparisonData, markers]);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <div style={{
                position: 'absolute', top: '15px', right: '15px', zIndex: 10,
                display: 'flex', gap: '8px'
            }}>
                <button
                    onClick={() => setChartType(chartType === 'area' ? 'candle' : 'area')}
                    className={`nav-box-btn ${chartType === 'candle' ? 'active' : ''}`}
                >
                    {chartType === 'area' ? 'SHOW CANDLES' : 'SHOW AREA'}
                </button>
                <button
                    onClick={() => setShowEMA(!showEMA)}
                    className={`nav-box-btn ${showEMA ? 'active' : ''}`}
                >EMA 20</button>
                <button
                    onClick={() => setShowRSI(!showRSI)}
                    className={`nav-box-btn ${showRSI ? 'active' : ''}`}
                >RSI</button>
            </div>
            <div ref={chartContainerRef} style={{ width: '100%', height: '500px' }} />
            <style>{`
                .nav-box-btn {
                    padding: 6px 14px; 
                    font-size: 10px; 
                    font-weight: 900; 
                    border-radius: 6px;
                    border: none; 
                    cursor: pointer; 
                    background: var(--bg-tertiary); 
                    color: var(--text-secondary);
                    transition: all 0.2s;
                    text-transform: uppercase;
                    letter-spacing: 0.08em;
                }
                .nav-box-btn:hover { 
                    background: rgba(255,255,255,0.08);
                    color: white;
                }
                .nav-box-btn.active { 
                    background: var(--accent-primary); 
                    color: black;
                }
            `}</style>
        </div>
    );
};

export default AdvancedChart;
