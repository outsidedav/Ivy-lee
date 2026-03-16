"use client";

import { useEffect, useRef, useCallback } from "react";
import type p5Type from "p5";

interface EspressoAnimationProps {
  onClose: () => void;
}

export default function EspressoAnimation({ onClose }: EspressoAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5Type | null>(null);

  const sketch = useCallback(
    (p: p5Type) => {
      let isExtracting = false;
      let extractionStarted = false;
      let droplets: { x: number; y: number; speed: number; alpha: number }[] =
        [];
      let gaugeAngle = -2.35;
      let cupLevel = 0;
      let steamParticles: {
        x: number;
        y: number;
        vx: number;
        vy: number;
        alpha: number;
        size: number;
      }[] = [];
      let startTime = 0;
      let extractionComplete = false;
      let windingDown = false;
      let windDownStart = 0;
      const WIND_DOWN_MS = 2500; // 2.5 seconds to wind down
      let cremaRipple = 0;
      const AUTO_CLOSE_MS = 5 * 60 * 1000;

      // Colors — Rams palette
      const BODY_LIGHT = "#E8E4E0";
      const BODY_MID = "#D4D0CC";
      const FACEPLATE = "#F0EEEB";
      const CHROME = "#B8B4B0";
      const DARK = "#1A1A1A";
      const COFFEE = "#3D2216";
      const CREMA = "#C4956A";
      const CUP_WHITE = "#FAFAFA";
      const ACCENT_ORANGE = "#E85D26";

      p.setup = () => {
        const w = Math.min(containerRef.current?.offsetWidth ?? 500, 500);
        const h = Math.min(window.innerHeight - 100, 600);
        p.createCanvas(w, h);
        p.textFont("Inter, sans-serif");
        startTime = p.millis();
      };

      p.draw = () => {
        const w = p.width;
        const h = p.height;
        const scale = w / 500;

        p.background(250, 248, 246);

        // Auto-close after 5 minutes
        if (p.millis() - startTime > AUTO_CLOSE_MS) {
          onClose();
          return;
        }

        p.push();
        p.translate(w / 2, h * 0.42);
        p.scale(scale);

        drawMachine(p);
        drawGauge(p);
        drawGroupHead(p);
        drawPortafilter(p);

        if (isExtracting && !windingDown && !extractionComplete) {
          // Active extraction — full pressure, dripping
          updateExtraction(p);
          gaugeAngle = p.lerp(gaugeAngle, 0.78, 0.03);
        } else if (windingDown) {
          // Wind-down phase — pressure drops, drips slow and stop
          const elapsed = p.millis() - windDownStart;
          const progress = Math.min(elapsed / WIND_DOWN_MS, 1);

          // Ease gauge back down
          gaugeAngle = p.lerp(gaugeAngle, -2.35, 0.02 + progress * 0.04);

          // Slow drips in the first half, then stop
          if (progress < 0.5 && p.frameCount % (6 + Math.floor(progress * 20)) === 0) {
            droplets.push({
              x: -5.5 + p.random(-1, 1),
              y: 34,
              speed: p.random(2, 3),
              alpha: 255 * (1 - progress),
            });
            droplets.push({
              x: 5.5 + p.random(-1, 1),
              y: 34,
              speed: p.random(2, 3),
              alpha: 255 * (1 - progress),
            });
          }

          // Keep drawing remaining droplets
          drawRemainingDroplets(p);

          // Transition to complete when wind-down finishes and all droplets gone
          if (progress >= 1 && droplets.length === 0) {
            windingDown = false;
            isExtracting = false;
            extractionComplete = true;
          }
        } else if (!extractionComplete) {
          // Idle — gauge at rest
          gaugeAngle = p.lerp(gaugeAngle, -2.35, 0.06);
        } else {
          // Extraction complete — gauge settles at rest
          gaugeAngle = p.lerp(gaugeAngle, -2.35, 0.02);
        }

        drawCup(p);

        // Steam fades in smoothly after extraction complete
        if (extractionComplete) {
          drawSteam(p);
        }

        p.pop();

        // Bottom text
        p.push();
        p.fill(180);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(11 * scale);
        if (extractionComplete) {
          p.fill(60);
          p.text("Enjoy your break.", w / 2, h - 40 * scale);
        } else if (windingDown) {
          p.text("Finishing up...", w / 2, h - 40 * scale);
        } else if (isExtracting) {
          p.text("Pulling shot...", w / 2, h - 40 * scale);
        } else if (!extractionStarted) {
          p.text("TAP TO PULL A SHOT", w / 2, h - 40 * scale);
        }
        p.pop();

        // Close button — top right
        p.push();
        p.noFill();
        p.stroke(200);
        p.strokeWeight(1.5);
        const bx = w - 32;
        const by = 24;
        p.line(bx - 6, by - 6, bx + 6, by + 6);
        p.line(bx + 6, by - 6, bx - 6, by + 6);
        p.pop();
      };

      function drawMachine(p: p5Type) {
        // Shadow
        p.noStroke();
        p.fill(0, 8);
        p.rect(-158, 168, 316, 8, 4);

        // Main body
        p.fill(BODY_LIGHT);
        p.rect(-155, -165, 310, 330, 4);

        // Faceplate (upper)
        p.fill(FACEPLATE);
        p.rect(-155, -165, 310, 140, 4, 4, 0, 0);

        // Subtle border
        p.noFill();
        p.stroke(200);
        p.strokeWeight(0.5);
        p.rect(-155, -165, 310, 330, 4);
        p.noStroke();

        // Drip tray
        p.fill(CHROME);
        p.rect(-130, 145, 260, 8, 2);
        p.fill(BODY_MID);
        p.rect(-140, 153, 280, 12, 2);

        // Brand label
        p.fill(DARK);
        p.textAlign(p.LEFT);
        p.textSize(13);
        p.textStyle(p.BOLD);
        p.text("RAMS", -130, -120);
        p.textSize(9);
        p.textStyle(p.NORMAL);
        p.fill(120);
        p.text("SK 4", -130, -108);

        // "ESPRESSO" label
        p.textAlign(p.RIGHT);
        p.textSize(9);
        p.fill(120);
        p.text("ESPRESSO", 130, -120);

        // Knobs
        drawKnob(p, -95, -50, "POWER");
        drawKnob(p, -35, -50, "");
        drawKnob(p, 25, -50, "BREW");
        drawKnob(p, 95, -50, "STEAM");

        // Power indicator
        if (isExtracting || extractionComplete) {
          p.fill(ACCENT_ORANGE);
          p.ellipse(60, -58, 5, 5);
        }

        // Water reservoir (top)
        p.fill(255, 255, 255, 40);
        p.stroke(200);
        p.strokeWeight(0.5);
        p.rect(60, -210, 70, 45, 3);
        p.noStroke();
        // Water level
        p.fill(220, 235, 245, 60);
        p.rect(62, -195, 66, 28, 0, 0, 2, 2);
      }

      function drawKnob(
        p: p5Type,
        x: number,
        y: number,
        label: string
      ) {
        // Knob shadow
        p.fill(0, 15);
        p.ellipse(x, y + 2, 28, 28);
        // Knob body
        p.fill(DARK);
        p.ellipse(x, y, 26, 26);
        // Highlight
        p.fill(60);
        p.ellipse(x - 3, y - 3, 8, 8);
        // Label
        if (label) {
          p.fill(160);
          p.textAlign(p.CENTER);
          p.textSize(7);
          p.text(label, x, y - 22);
        }
      }

      function drawGauge(p: p5Type) {
        p.push();
        p.translate(0, -95);

        // Chrome ring
        p.fill(CHROME);
        p.ellipse(0, 0, 55, 55);

        // Face
        p.fill(255);
        p.ellipse(0, 0, 48, 48);

        // Tick marks
        p.stroke(80);
        p.strokeWeight(0.7);
        for (let i = 0; i < 12; i++) {
          const r = p.map(i, 0, 11, -2.35, 2.35);
          const inner = i % 3 === 0 ? 16 : 18;
          p.line(
            p.cos(r) * inner,
            p.sin(r) * inner,
            p.cos(r) * 21,
            p.sin(r) * 21
          );
        }

        // BAR label
        p.noStroke();
        p.fill(150);
        p.textAlign(p.CENTER);
        p.textSize(5);
        p.text("BAR", 0, 10);

        // Needle
        p.push();
        p.rotate(gaugeAngle);
        p.stroke(200, 30, 0);
        p.strokeWeight(1.5);
        p.line(0, 4, 0, -20);
        p.pop();

        // Center pin
        p.noStroke();
        p.fill(80);
        p.ellipse(0, 0, 4, 4);
        p.pop();
      }

      function drawGroupHead(p: p5Type) {
        // Brushed metal group head
        p.fill(CHROME);
        p.rect(-35, -20, 70, 18, 2);
        // Shower screen
        p.fill(160);
        p.ellipse(0, 2, 30, 6);
      }

      function drawPortafilter(p: p5Type) {
        // Basket
        p.fill(55);
        p.rect(-30, -2, 60, 22, 0, 0, 8, 8);

        // Handle bar
        p.fill(DARK);
        p.noStroke();
        p.rect(28, 3, 80, 14, 0, 7, 7, 0);

        // Handle grip end
        p.fill(30);
        p.ellipse(112, 10, 14, 22);

        // Double spouts
        p.fill(CHROME);
        p.rect(-8, 20, 5, 14, 0, 0, 2, 2);
        p.rect(3, 20, 5, 14, 0, 0, 2, 2);
      }

      function drawCup(p: p5Type) {
        p.push();
        p.translate(0, 128);

        // Handle
        p.noFill();
        p.stroke(220);
        p.strokeWeight(6);
        p.arc(42, -5, 22, 32, -p.HALF_PI, p.HALF_PI);
        p.noStroke();

        // Cup body — tapered
        p.fill(CUP_WHITE);
        p.beginShape();
        p.vertex(-35, -30);
        p.vertex(-30, 10);
        p.vertex(-25, 16);
        p.vertex(25, 16);
        p.vertex(30, 10);
        p.vertex(35, -30);
        p.endShape(p.CLOSE);

        // Rim highlight
        p.fill(255);
        p.ellipse(0, -30, 70, 18);

        // Interior shadow
        p.fill(240);
        p.ellipse(0, -30, 66, 15);

        // Coffee liquid
        if (cupLevel > 0) {
          const surfaceY = p.map(
            Math.min(cupLevel, 20),
            0,
            20,
            -5,
            -28
          );
          const surfaceW = p.map(
            Math.min(cupLevel, 20),
            0,
            20,
            40,
            64
          );

          // Crema layer
          p.fill(CREMA);
          p.ellipse(0, surfaceY, surfaceW, 12);

          // Crema ripple on drop impact
          if (isExtracting && cremaRipple > 0) {
            p.noFill();
            p.stroke(255, 255, 255, cremaRipple * 80);
            p.strokeWeight(0.5);
            p.ellipse(0, surfaceY, surfaceW * 0.5, 6);
            p.noStroke();
            cremaRipple *= 0.95;
          }

          // Dark coffee underneath
          if (cupLevel > 5) {
            p.fill(COFFEE);
            const innerY = surfaceY + 3;
            const innerW = surfaceW - 8;
            p.ellipse(0, innerY, innerW, 8);
          }
        }

        p.pop();
      }

      function drawSteam(p: p5Type) {
        // Add new steam particles
        if (p.frameCount % 4 === 0) {
          steamParticles.push({
            x: p.random(-10, 10),
            y: 98,
            vx: p.random(-0.3, 0.3),
            vy: p.random(-1.5, -0.8),
            alpha: 60,
            size: p.random(4, 8),
          });
        }

        p.noStroke();
        for (let i = steamParticles.length - 1; i >= 0; i--) {
          const s = steamParticles[i];
          p.fill(200, 200, 200, s.alpha);
          p.ellipse(s.x, s.y, s.size, s.size);
          s.x += s.vx + p.sin(p.frameCount * 0.05 + i) * 0.3;
          s.y += s.vy;
          s.alpha -= 0.6;
          s.size += 0.05;
          if (s.alpha <= 0) {
            steamParticles.splice(i, 1);
          }
        }
      }

      function updateExtraction(p: p5Type) {
        // Add droplets from double spouts
        if (p.frameCount % 3 === 0) {
          droplets.push({
            x: -5.5 + p.random(-1, 1),
            y: 34,
            speed: p.random(3, 5),
            alpha: 255,
          });
          droplets.push({
            x: 5.5 + p.random(-1, 1),
            y: 34,
            speed: p.random(3, 5),
            alpha: 255,
          });
        }

        // Draw and update droplets
        drawRemainingDroplets(p);

        // When cup is full, start the wind-down phase
        if (cupLevel >= 20 && !windingDown) {
          windingDown = true;
          windDownStart = p.millis();
        }
      }

      function drawRemainingDroplets(p: p5Type) {
        p.noStroke();
        for (let i = droplets.length - 1; i >= 0; i--) {
          const d = droplets[i];
          p.fill(60, 32, 18, d.alpha);
          p.ellipse(d.x, d.y, 2.5, 5);
          d.y += d.speed;
          d.speed += 0.2; // gravity
          d.alpha -= windingDown ? 3 : 0; // fade during wind-down

          if (d.y > 108 || d.alpha <= 0) {
            droplets.splice(i, 1);
            if (d.y > 108 && cupLevel < 20) {
              cupLevel += 0.06;
              cremaRipple = 1;
            }
          }
        }
      }

      p.mousePressed = () => {
        const w = p.width;

        // Close button hit test
        const bx = w - 32;
        const by = 24;
        if (
          p.mouseX > bx - 15 &&
          p.mouseX < bx + 15 &&
          p.mouseY > by - 15 &&
          p.mouseY < by + 15
        ) {
          onClose();
          return;
        }

        // Toggle extraction
        if (!extractionComplete && !isExtracting) {
          isExtracting = true;
          extractionStarted = true;
        }
      };

      p.windowResized = () => {
        const w = Math.min(containerRef.current?.offsetWidth ?? 500, 500);
        const h = Math.min(window.innerHeight - 100, 600);
        p.resizeCanvas(w, h);
      };
    },
    [onClose]
  );

  useEffect(() => {
    let instance: p5Type | null = null;

    async function initP5() {
      const p5Module = (await import("p5")).default;
      if (containerRef.current) {
        instance = new p5Module(sketch, containerRef.current);
        p5Ref.current = instance;
      }
    }

    initP5();

    // Auto-close safety net
    const timer = setTimeout(onClose, 5 * 60 * 1000);

    return () => {
      clearTimeout(timer);
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
    };
  }, [sketch, onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F6] flex items-center justify-center">
      <div ref={containerRef} className="w-full max-w-[500px]" />
    </div>
  );
}
