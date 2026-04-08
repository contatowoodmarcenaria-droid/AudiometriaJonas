import { useEffect, useRef } from "react";

interface AudioWavesProps {
  isTyping?: boolean;
  className?: string;
}

export function AudioWaves({ isTyping = false, className = "" }: AudioWavesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const timeRef = useRef(0);
  const typingRef = useRef(isTyping);

  useEffect(() => {
    typingRef.current = isTyping;
  }, [isTyping]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio;
      canvas.height = canvas.offsetHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };
    resize();
    window.addEventListener("resize", resize);

    // Wave config
    const waves = [
      { color: "rgba(79, 70, 229, 0.6)", speed: 0.018, amplitude: 28, frequency: 0.012, offset: 0 },
      { color: "rgba(34, 197, 94, 0.45)", speed: 0.022, amplitude: 20, frequency: 0.018, offset: 2.1 },
      { color: "rgba(99, 102, 241, 0.35)", speed: 0.014, amplitude: 36, frequency: 0.009, offset: 4.2 },
      { color: "rgba(16, 185, 129, 0.3)", speed: 0.026, amplitude: 14, frequency: 0.024, offset: 1.0 },
    ];

    // Audiogram points (simulated hearing threshold curve)
    const audiogramPoints = [
      { freq: 250, threshold: 10 },
      { freq: 500, threshold: 15 },
      { freq: 1000, threshold: 20 },
      { freq: 2000, threshold: 35 },
      { freq: 3000, threshold: 55 },
      { freq: 4000, threshold: 65 },
      { freq: 6000, threshold: 50 },
      { freq: 8000, threshold: 40 },
    ];

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const typingBoost = typingRef.current ? 1.4 : 1.0;
      timeRef.current += 1;

      // Draw waves
      waves.forEach((wave) => {
        ctx.beginPath();
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = 2.5;
        ctx.shadowBlur = 8;
        ctx.shadowColor = wave.color;

        for (let x = 0; x <= W; x += 2) {
          const y =
            H / 2 +
            wave.amplitude *
              typingBoost *
              Math.sin(wave.frequency * x + timeRef.current * wave.speed + wave.offset) *
              Math.sin(timeRef.current * wave.speed * 0.3 + wave.offset);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Draw audiogram-style graph (bottom area)
      const graphH = H * 0.28;
      const graphY = H - graphH - 16;
      const graphX = 24;
      const graphW = W - 48;

      // Grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.07)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = graphY + (graphH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(graphX, y);
        ctx.lineTo(graphX + graphW, y);
        ctx.stroke();
      }

      // Audiogram curve with animation
      const animOffset = Math.sin(timeRef.current * 0.012) * 4;
      ctx.beginPath();
      ctx.strokeStyle = "rgba(34, 197, 94, 0.8)";
      ctx.lineWidth = 2;
      ctx.shadowBlur = 10;
      ctx.shadowColor = "rgba(34, 197, 94, 0.6)";

      audiogramPoints.forEach((pt, i) => {
        const x = graphX + (i / (audiogramPoints.length - 1)) * graphW;
        const normalizedThreshold = (pt.threshold + animOffset) / 80;
        const y = graphY + normalizedThreshold * graphH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Audiogram points (circles)
      audiogramPoints.forEach((pt, i) => {
        const x = graphX + (i / (audiogramPoints.length - 1)) * graphW;
        const normalizedThreshold = (pt.threshold + animOffset) / 80;
        const y = graphY + normalizedThreshold * graphH;

        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(34, 197, 94, 0.9)";
        ctx.shadowBlur = 12;
        ctx.shadowColor = "rgba(34, 197, 94, 0.8)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Frequency labels
      ctx.fillStyle = "rgba(255,255,255,0.35)";
      ctx.font = "10px Inter, sans-serif";
      ctx.textAlign = "center";
      audiogramPoints.forEach((pt, i) => {
        const x = graphX + (i / (audiogramPoints.length - 1)) * graphW;
        ctx.fillText(`${pt.freq >= 1000 ? pt.freq / 1000 + "k" : pt.freq}`, x, H - 6);
      });

      // Glowing particles
      const particleCount = 6;
      for (let p = 0; p < particleCount; p++) {
        const px =
          (W / particleCount) * p +
          Math.sin(timeRef.current * 0.015 + p * 1.2) * 30;
        const py =
          H * 0.3 +
          Math.cos(timeRef.current * 0.01 + p * 0.8) * (H * 0.2);
        const radius = 2 + Math.sin(timeRef.current * 0.02 + p) * 1.5;
        const alpha = 0.3 + Math.sin(timeRef.current * 0.025 + p * 0.5) * 0.2;

        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.shadowBlur = 15;
        ctx.shadowColor = "rgba(99, 102, 241, 0.5)";
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`w-full h-full ${className}`}
      style={{ display: "block" }}
    />
  );
}
