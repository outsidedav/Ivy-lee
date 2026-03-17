"use client";

import { useEffect, useRef, useCallback } from "react";
import type p5Type from "p5";

interface LoadingAnimationProps {
  onClose: () => void;
}

export default function LoadingAnimation({ onClose }: LoadingAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5Type | null>(null);

  const sketch = useCallback(
    (p: p5Type) => {
      let startTime = 0;

      // Colors — Rams palette (matching EspressoAnimation)
      const BODY_LIGHT = "#E8E4E0";
      const BODY_MID = "#D4D0CC";
      const FACEPLATE = "#F0EEEB";
      const CHROME = "#B8B4B0";
      const DARK = "#1A1A1A";
      const TAPE_BROWN = "#3D2216";

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

        p.push();
        p.translate(w / 2, h * 0.42);
        p.scale(scale);

        drawPlayer(p);
        drawCassette(p);
        drawReels(p);
        drawTransportButtons(p);
        drawVUMeter(p);

        p.pop();

        // Bottom text
        p.push();
        p.fill(160);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(11 * scale);
        p.text("Loading your tasks...", w / 2, h - 40 * scale);
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

      function drawPlayer(p: p5Type) {
        // Shadow
        p.noStroke();
        p.fill(0, 8);
        p.rect(-170, 168, 340, 8, 4);

        // Main body
        p.fill(BODY_LIGHT);
        p.rect(-165, -155, 330, 320, 6);

        // Top panel
        p.fill(FACEPLATE);
        p.rect(-165, -155, 330, 60, 6, 6, 0, 0);

        // Subtle border
        p.noFill();
        p.stroke(200);
        p.strokeWeight(0.5);
        p.rect(-165, -155, 330, 320, 6);
        p.noStroke();

        // Brand label
        p.fill(DARK);
        p.textAlign(p.LEFT);
        p.textSize(13);
        p.textStyle(p.BOLD);
        p.text("RAMS", -140, -120);
        p.textSize(9);
        p.textStyle(p.NORMAL);
        p.fill(120);
        p.text("SK 4", -140, -108);

        // "CASSETTE" label
        p.textAlign(p.RIGHT);
        p.textSize(9);
        p.fill(120);
        p.text("CASSETTE", 140, -120);

        // Bottom tray
        p.fill(CHROME);
        p.rect(-140, 145, 280, 8, 2);
        p.fill(BODY_MID);
        p.rect(-150, 153, 300, 12, 2);
      }

      function drawCassette(p: p5Type) {
        // Cassette body
        p.fill(BODY_MID);
        p.rect(-120, -70, 240, 150, 8);

        // Inner label area
        p.fill(255, 255, 255, 180);
        p.rect(-100, -55, 200, 65, 4);

        // Label lines
        p.stroke(220);
        p.strokeWeight(0.5);
        for (let y = -42; y <= 0; y += 10) {
          p.line(-85, y, 85, y);
        }
        p.noStroke();

        // "LOADING" text on label
        p.fill(DARK);
        p.textAlign(p.CENTER);
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.text("LOADING", 0, -22);

        p.textStyle(p.NORMAL);
        p.textSize(7);
        p.fill(140);
        p.text("IVY LEE METHOD — SIDE A", 0, -6);

        // Tape window
        p.fill(45, 35, 30);
        p.rect(-70, 20, 140, 45, 4);

        // Tape window inner chrome border
        p.noFill();
        p.stroke(80);
        p.strokeWeight(0.5);
        p.rect(-68, 22, 136, 41, 3);
        p.noStroke();

        // Tape path (between reels)
        p.fill(TAPE_BROWN);
        p.rect(-58, 36, 116, 3, 1);

        // Guide rollers
        p.fill(CHROME);
        p.ellipse(-45, 37, 6, 6);
        p.ellipse(45, 37, 6, 6);

        // Small guide pins
        p.fill(100);
        p.ellipse(-25, 55, 4, 4);
        p.ellipse(0, 55, 4, 4);
        p.ellipse(25, 55, 4, 4);

        // Screw holes on cassette
        p.fill(160);
        p.ellipse(-100, -55, 6, 6);
        p.ellipse(100, -55, 6, 6);
        p.ellipse(-100, 70, 6, 6);
        p.ellipse(100, 70, 6, 6);
        p.fill(140);
        p.ellipse(-100, -55, 3, 3);
        p.ellipse(100, -55, 3, 3);
        p.ellipse(-100, 70, 3, 3);
        p.ellipse(100, 70, 3, 3);
      }

      function drawReels(p: p5Type) {
        const time = p.millis() / 1000;

        // Left reel (supply — spins slightly faster)
        drawReel(p, -35, 37, time * 2.5);

        // Right reel (take-up)
        drawReel(p, 35, 37, time * 2.0);
      }

      function drawReel(p: p5Type, x: number, y: number, angle: number) {
        p.push();
        p.translate(x, y);

        // Reel body
        p.fill(65, 55, 50);
        p.ellipse(0, 0, 32, 32);

        // Inner ring
        p.fill(80, 70, 60);
        p.ellipse(0, 0, 24, 24);

        // Hub
        p.fill(CHROME);
        p.ellipse(0, 0, 12, 12);

        // Hub center
        p.fill(100);
        p.ellipse(0, 0, 6, 6);

        // Spinning spokes
        p.rotate(angle);
        p.stroke(CHROME);
        p.strokeWeight(1.5);
        for (let i = 0; i < 3; i++) {
          const a = (i * p.TWO_PI) / 3;
          p.line(0, 0, p.cos(a) * 10, p.sin(a) * 10);
        }
        p.noStroke();

        // Tape on reel (wound tape)
        p.noFill();
        p.stroke(TAPE_BROWN);
        p.strokeWeight(2);
        p.arc(0, 0, 20, 20, angle, angle + p.PI * 1.5);
        p.noStroke();

        p.pop();
      }

      function drawTransportButtons(p: p5Type) {
        const y = 115;
        const btnSize = 20;
        const spacing = 38;
        const startX = -spacing * 2;

        // Rewind ◀◀
        drawTransportBtn(p, startX, y, btnSize);
        p.fill(FACEPLATE);
        p.triangle(startX - 4, y, startX + 3, y - 4, startX + 3, y + 4);
        p.triangle(startX - 8, y, startX - 1, y - 4, startX - 1, y + 4);

        // Play ▶ (highlighted)
        drawTransportBtn(p, startX + spacing, y, btnSize);
        p.fill("#E85D26");
        p.triangle(
          startX + spacing - 3,
          y - 5,
          startX + spacing - 3,
          y + 5,
          startX + spacing + 5,
          y
        );

        // Fast forward ▶▶
        drawTransportBtn(p, startX + spacing * 2, y, btnSize);
        p.fill(FACEPLATE);
        p.triangle(startX + spacing * 2 - 3, y - 4, startX + spacing * 2 - 3, y + 4, startX + spacing * 2 + 4, y);
        p.triangle(startX + spacing * 2 + 1, y - 4, startX + spacing * 2 + 1, y + 4, startX + spacing * 2 + 8, y);

        // Stop ■
        drawTransportBtn(p, startX + spacing * 3, y, btnSize);
        p.fill(FACEPLATE);
        p.rect(startX + spacing * 3 - 4, y - 4, 8, 8);

        // Eject ⏏
        drawTransportBtn(p, startX + spacing * 4, y, btnSize);
        p.fill(FACEPLATE);
        p.triangle(
          startX + spacing * 4 - 5,
          y + 1,
          startX + spacing * 4 + 5,
          y + 1,
          startX + spacing * 4,
          y - 4
        );
        p.rect(startX + spacing * 4 - 5, y + 3, 10, 2);
      }

      function drawTransportBtn(
        p: p5Type,
        x: number,
        y: number,
        size: number
      ) {
        // Button shadow
        p.fill(0, 15);
        p.ellipse(x, y + 1, size, size);
        // Button body
        p.fill(DARK);
        p.ellipse(x, y, size - 1, size - 1);
        // Highlight
        p.fill(60);
        p.ellipse(x - 2, y - 2, 5, 5);
      }

      function drawVUMeter(p: p5Type) {
        // Small VU meter on top panel
        p.push();
        p.translate(0, -130);

        // Meter background
        p.fill(255);
        p.rect(-30, -8, 60, 16, 3);

        // Border
        p.noFill();
        p.stroke(CHROME);
        p.strokeWeight(0.5);
        p.rect(-30, -8, 60, 16, 3);
        p.noStroke();

        // Animated level bars
        const time = p.millis() / 200;
        const numBars = 12;
        for (let i = 0; i < numBars; i++) {
          const level = p.noise(time + i * 0.3) * numBars;
          if (i < level) {
            if (i >= 10) {
              p.fill(200, 50, 30); // Red zone
            } else if (i >= 8) {
              p.fill(200, 150, 30); // Yellow zone
            } else {
              p.fill(100, 100, 100); // Normal
            }
            p.rect(-26 + i * 4.5, -4, 3, 8, 1);
          } else {
            p.fill(230);
            p.rect(-26 + i * 4.5, -4, 3, 8, 1);
          }
        }

        // VU label
        p.fill(160);
        p.textSize(5);
        p.textAlign(p.LEFT);
        p.text("VU", -28, 16);

        p.pop();
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

    return () => {
      if (p5Ref.current) {
        p5Ref.current.remove();
        p5Ref.current = null;
      }
    };
  }, [sketch]);

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF8F6] flex items-center justify-center">
      <div ref={containerRef} className="w-full max-w-[500px]" />
    </div>
  );
}
