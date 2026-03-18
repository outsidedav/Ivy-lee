"use client";

import { useEffect, useRef, useCallback } from "react";
import type p5Type from "p5";

interface FlipClockTimerProps {
  onClose: () => void;
}

export default function FlipClockTimer({ onClose }: FlipClockTimerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const p5Ref = useRef<p5Type | null>(null);

  const sketch = useCallback(
    (p: p5Type) => {
      // Timer state
      let timerState: "setup" | "running" | "done" = "setup";
      let totalSeconds = 20 * 60; // default 20 minutes
      let remainingSeconds = totalSeconds;
      let lastTickMs = 0;
      let doneTime = 0;

      // Flip animation tracking
      let prevDigits = getDigits(remainingSeconds);
      let flipAnimations: {
        index: number;
        fromDigit: number;
        toDigit: number;
        startMs: number;
      }[] = [];
      const FLIP_DURATION = 400;

      // Colors — Rams palette
      const BODY_LIGHT = "#E8E4E0";
      const BODY_MID = "#D4D0CC";
      const CHROME = "#B8B4B0";
      const DARK = "#1A1A1A";
      const ACCENT_ORANGE = "#E85D26";
      const FLAP_BG = "#2A2A2A";
      const DIGIT_WHITE = "#F0F0F0";

      // Layout constants (in 500-unit space)
      const CLOCK_W = 340;
      const CLOCK_H = 180;
      const DISPLAY_X = -145;
      const DISPLAY_Y = -55;
      const DISPLAY_W = 250;
      const DISPLAY_H = 110;
      const DIGIT_W = 52;
      const DIGIT_H = 80;

      function getDigits(seconds: number): number[] {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return [
          Math.floor(m / 10),
          m % 10,
          Math.floor(s / 10),
          s % 10,
        ];
      }

      p.setup = () => {
        const w = Math.min(containerRef.current?.offsetWidth ?? 500, 500);
        const h = Math.min(window.innerHeight - 100, 600);
        p.createCanvas(w, h);
        p.textFont("Inter, sans-serif");
      };

      p.draw = () => {
        const w = p.width;
        const h = p.height;
        const scale = w / 500;

        p.background(250, 248, 246);

        // Timer countdown logic
        if (timerState === "running") {
          if (p.millis() - lastTickMs >= 1000) {
            lastTickMs += 1000;
            remainingSeconds = Math.max(0, remainingSeconds - 1);

            const newDigits = getDigits(remainingSeconds);
            for (let i = 0; i < 4; i++) {
              if (newDigits[i] !== prevDigits[i]) {
                flipAnimations.push({
                  index: i,
                  fromDigit: prevDigits[i],
                  toDigit: newDigits[i],
                  startMs: p.millis(),
                });
              }
            }
            prevDigits = newDigits;

            if (remainingSeconds <= 0) {
              timerState = "done";
              doneTime = p.millis();
            }
          }
        }

        // Auto-close 8 seconds after done
        if (timerState === "done" && p.millis() - doneTime > 8000) {
          onClose();
          return;
        }

        p.push();
        p.translate(w / 2, h * 0.40);
        p.scale(scale);

        drawClockBody(p);
        drawDisplay(p);
        drawSideDial(p);

        p.pop();

        // Controls
        p.push();
        p.translate(w / 2, h * 0.40);
        p.scale(scale);
        drawControls(p);
        p.pop();

        // Bottom text
        p.push();
        p.fill(160);
        p.noStroke();
        p.textAlign(p.CENTER);
        p.textSize(11 * scale);
        if (timerState === "done") {
          p.fill(60);
          p.text("Time's up.", w / 2, h - 36 * scale);
        } else if (timerState === "setup") {
          p.text("Set your time, then start.", w / 2, h - 36 * scale);
        } else {
          p.text("Focus.", w / 2, h - 36 * scale);
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

      function drawClockBody(p: p5Type) {
        // Shadow
        p.noStroke();
        p.fill(0, 10);
        p.rect(-CLOCK_W / 2 - 2, CLOCK_H / 2 + 2, CLOCK_W + 4, 8, 4);

        // Top shell (the characteristic Braun dome/rounded top)
        p.fill(BODY_LIGHT);
        // Main rectangular body
        p.rect(-CLOCK_W / 2, -CLOCK_H / 2 + 20, CLOCK_W, CLOCK_H - 20, 3);
        // Rounded top
        p.rect(-CLOCK_W / 2, -CLOCK_H / 2, CLOCK_W, 40, 12, 12, 0, 0);

        // Subtle border
        p.noFill();
        p.stroke(200);
        p.strokeWeight(0.5);
        p.rect(-CLOCK_W / 2, -CLOCK_H / 2, CLOCK_W, CLOCK_H, 12, 12, 3, 3);
        p.noStroke();

        // Top button
        p.fill(BODY_MID);
        p.rect(-20, -CLOCK_H / 2 - 8, 40, 12, 3, 3, 0, 0);

        // Chrome trim line
        p.fill(CHROME);
        p.rect(-CLOCK_W / 2 + 5, -CLOCK_H / 2 + 18, CLOCK_W - 10, 1.5);

        // Brand
        p.fill(DARK);
        p.textAlign(p.LEFT);
        p.textSize(9);
        p.textStyle(p.BOLD);
        p.text("RAMS", DISPLAY_X + 8, DISPLAY_Y + DISPLAY_H + 16);
        p.textStyle(p.NORMAL);

        // "PHASE 2" label
        p.fill(120);
        p.textAlign(p.RIGHT);
        p.textSize(8);
        p.text("PHASE 2", DISPLAY_X + DISPLAY_W - 8, DISPLAY_Y + DISPLAY_H + 16);
      }

      function drawDisplay(p: p5Type) {
        // Display window background
        p.fill(DARK);
        p.rect(DISPLAY_X, DISPLAY_Y, DISPLAY_W, DISPLAY_H, 4);

        // Transparent cover effect
        p.fill(255, 255, 255, 8);
        p.rect(DISPLAY_X, DISPLAY_Y, DISPLAY_W, DISPLAY_H / 2, 4, 4, 0, 0);

        // Inner shadow
        p.fill(0, 30);
        p.rect(DISPLAY_X + 2, DISPLAY_Y + 2, DISPLAY_W - 4, 6, 2);

        const digits = getDigits(remainingSeconds);
        const startX = DISPLAY_X + 18;
        const digitY = DISPLAY_Y + (DISPLAY_H - DIGIT_H) / 2;

        // Draw each digit
        for (let i = 0; i < 4; i++) {
          let x = startX + i * (DIGIT_W + 6);
          // Add colon gap after second digit
          if (i >= 2) x += 18;

          const flipAnim = flipAnimations.find((f) => f.index === i);
          drawFlipDigit(p, x, digitY, digits[i], flipAnim);
        }

        // Colon
        const colonX = startX + 2 * (DIGIT_W + 6) + 5;
        const colonY = DISPLAY_Y + DISPLAY_H / 2;
        const showColon =
          timerState !== "running" || Math.floor(p.millis() / 500) % 2 === 0;
        if (showColon) {
          p.fill(DIGIT_WHITE);
          p.noStroke();
          p.ellipse(colonX, colonY - 12, 6, 6);
          p.ellipse(colonX, colonY + 12, 6, 6);
        }

        // "Braun" text on display (left side, small)
        p.fill(120);
        p.textAlign(p.LEFT);
        p.textSize(7);
        p.textStyle(p.NORMAL);
        p.text("Braun", DISPLAY_X + 6, DISPLAY_Y + DISPLAY_H - 6);

        // Clean up completed flip animations
        flipAnimations = flipAnimations.filter(
          (f) => p.millis() - f.startMs < FLIP_DURATION
        );
      }

      function drawFlipDigit(
        p: p5Type,
        x: number,
        y: number,
        currentDigit: number,
        flipAnim?: {
          index: number;
          fromDigit: number;
          toDigit: number;
          startMs: number;
        }
      ) {
        const halfH = DIGIT_H / 2;
        const hingeY = y + halfH;

        if (!flipAnim) {
          // Static digit — no animation
          drawFlapHalf(p, x, y, DIGIT_W, halfH, currentDigit, "upper");
          drawFlapHalf(p, x, hingeY + 1, DIGIT_W, halfH, currentDigit, "lower");
          // Hinge line
          p.fill(0, 80);
          p.noStroke();
          p.rect(x, hingeY - 0.5, DIGIT_W, 2);
          return;
        }

        // Animated digit flip
        const elapsed = p.millis() - flipAnim.startMs;
        const rawProgress = Math.min(elapsed / FLIP_DURATION, 1);
        // Ease-in-out
        const progress = (1 - Math.cos(rawProgress * Math.PI)) / 2;

        if (progress < 0.5) {
          // Phase 1: old upper flap falling forward
          // Background: new digit upper half (revealed)
          drawFlapHalf(p, x, y, DIGIT_W, halfH, flipAnim.toDigit, "upper");
          // Background: old digit lower half (still visible)
          drawFlapHalf(p, x, hingeY + 1, DIGIT_W, halfH, flipAnim.fromDigit, "lower");

          // Flipping flap: old upper, scaling down
          const scaleY = Math.cos(progress * Math.PI); // 1 → 0
          p.push();
          p.translate(x + DIGIT_W / 2, hingeY);
          p.scale(1, Math.max(scaleY, 0.02));
          p.translate(-(x + DIGIT_W / 2), -hingeY);
          drawFlapHalf(p, x, y, DIGIT_W, halfH, flipAnim.fromDigit, "upper");
          p.pop();

          // Shadow under flipping flap
          p.fill(0, (1 - scaleY) * 60);
          p.noStroke();
          p.rect(x + 2, hingeY + 1, DIGIT_W - 4, 4 * (1 - scaleY));
        } else {
          // Phase 2: new lower flap falling into place
          // Background: new digit upper half
          drawFlapHalf(p, x, y, DIGIT_W, halfH, flipAnim.toDigit, "upper");
          // Background: old digit lower half (being covered)
          drawFlapHalf(p, x, hingeY + 1, DIGIT_W, halfH, flipAnim.fromDigit, "lower");

          // Flipping flap: new lower, scaling from 0 to 1
          const scaleY = Math.cos((1 - progress) * Math.PI); // 0 → 1
          p.push();
          p.translate(x + DIGIT_W / 2, hingeY);
          p.scale(1, Math.max(Math.abs(scaleY), 0.02));
          p.translate(-(x + DIGIT_W / 2), -hingeY);
          drawFlapHalf(p, x, hingeY + 1, DIGIT_W, halfH, flipAnim.toDigit, "lower");
          p.pop();

          // Shadow
          p.fill(0, Math.abs(scaleY) * 40);
          p.noStroke();
          p.rect(x + 2, hingeY - 4 * Math.abs(scaleY), DIGIT_W - 4, 4 * Math.abs(scaleY));
        }

        // Hinge line
        p.fill(0, 100);
        p.noStroke();
        p.rect(x, hingeY - 0.5, DIGIT_W, 2);
      }

      function drawFlapHalf(
        p: p5Type,
        x: number,
        y: number,
        w: number,
        h: number,
        digit: number,
        half: "upper" | "lower"
      ) {
        // Flap background
        p.fill(FLAP_BG);
        p.noStroke();
        if (half === "upper") {
          p.rect(x, y, w, h, 3, 3, 0, 0);
        } else {
          p.rect(x, y, w, h, 0, 0, 3, 3);
        }

        // Digit text — clip by only drawing in the correct half
        const digitStr = String(digit);
        p.fill(DIGIT_WHITE);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(52);
        p.textStyle(p.BOLD);

        // The full digit center
        const fullCenterY = half === "upper" ? y + h : y;
        // We draw the text at the full center, but the flap naturally clips it
        // since p5 doesn't have clipping, we draw in the flap rect context
        p.push();
        // Create a clipping region by drawing text offset
        const textY = half === "upper" ? y + h - 2 : y - 2;
        // Use drawingContext for proper clipping
        const ctx = (p as unknown as { drawingContext: CanvasRenderingContext2D }).drawingContext;
        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, w, h);
        ctx.clip();
        p.text(digitStr, x + w / 2, fullCenterY);
        ctx.restore();
        p.pop();
      }

      function drawSideDial(p: p5Type) {
        const dx = DISPLAY_X + DISPLAY_W + 12;
        const dy = DISPLAY_Y + 5;
        const dw = 28;
        const dh = DISPLAY_H - 10;

        // Dial background
        p.fill(DARK);
        p.rect(dx, dy, dw, dh, 3);

        // Scale marks
        p.fill(DIGIT_WHITE);
        p.textAlign(p.RIGHT);
        p.textSize(6);
        for (let i = 0; i <= 5; i++) {
          const markY = dy + 10 + i * ((dh - 20) / 5);
          p.stroke(80);
          p.strokeWeight(0.5);
          p.line(dx + 4, markY, dx + 12, markY);
          p.noStroke();
          p.text(String(18 - i), dx + dw - 4, markY + 2);
        }

        // Indicator line (orange accent)
        const indicatorY = dy + dh * 0.3;
        p.stroke(ACCENT_ORANGE);
        p.strokeWeight(1.5);
        p.line(dx + 3, indicatorY, dx + 14, indicatorY);
        p.noStroke();

        // Knob on right
        p.fill(DARK);
        p.ellipse(dx + dw + 8, dy + dh / 2, 16, 20);
        p.fill(50);
        p.ellipse(dx + dw + 8, dy + dh / 2 - 2, 6, 6);
      }

      function drawControls(p: p5Type) {
        if (timerState === "setup") {
          // Time adjustment buttons
          const btnY = CLOCK_H / 2 + 30;
          const btnW = 44;
          const btnH = 26;
          const gap = 8;

          const buttons = [
            { label: "−1h", x: -btnW * 2 - gap * 1.5, delta: -3600 },
            { label: "−1m", x: -btnW - gap * 0.5, delta: -60 },
            { label: "+1m", x: gap * 0.5, delta: 60 },
            { label: "+1h", x: btnW + gap * 1.5, delta: 3600 },
          ];

          for (const btn of buttons) {
            p.fill(CHROME);
            p.noStroke();
            p.rect(btn.x, btnY, btnW, btnH, 4);
            p.fill(DARK);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.textStyle(p.BOLD);
            p.text(btn.label, btn.x + btnW / 2, btnY + btnH / 2);
          }

          // Start button
          const startY = btnY + btnH + 16;
          const startW = 80;
          const startH = 32;
          p.fill(ACCENT_ORANGE);
          p.rect(-startW / 2, startY, startW, startH, 6);
          p.fill(255);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.textStyle(p.BOLD);
          p.text("START", 0, startY + startH / 2);
        } else if (timerState === "running") {
          // End button
          const endY = CLOCK_H / 2 + 30;
          const endW = 80;
          const endH = 32;
          p.fill(CHROME);
          p.noStroke();
          p.rect(-endW / 2, endY, endW, endH, 6);
          p.fill(DARK);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.textStyle(p.BOLD);
          p.text("END", 0, endY + endH / 2);
        } else if (timerState === "done") {
          // Close button
          const closeY = CLOCK_H / 2 + 30;
          const closeW = 80;
          const closeH = 32;
          p.fill(CHROME);
          p.noStroke();
          p.rect(-closeW / 2, closeY, closeW, closeH, 6);
          p.fill(DARK);
          p.textAlign(p.CENTER, p.CENTER);
          p.textSize(12);
          p.textStyle(p.BOLD);
          p.text("CLOSE", 0, closeY + closeH / 2);
        }

        p.textStyle(p.NORMAL);
      }

      p.mousePressed = () => {
        const w = p.width;
        const sc = w / 500;

        // Close button hit test (X at top right)
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

        // Convert mouse to the translated/scaled coordinate system
        const mx = (p.mouseX - w / 2) / sc;
        const my = (p.mouseY - p.height * 0.40) / sc;

        if (timerState === "setup") {
          // Check time adjustment buttons
          const btnY = CLOCK_H / 2 + 30;
          const btnW = 44;
          const btnH = 26;
          const gap = 8;

          const buttons = [
            { x: -btnW * 2 - gap * 1.5, delta: -3600 },
            { x: -btnW - gap * 0.5, delta: -60 },
            { x: gap * 0.5, delta: 60 },
            { x: btnW + gap * 1.5, delta: 3600 },
          ];

          for (const btn of buttons) {
            if (
              mx > btn.x &&
              mx < btn.x + btnW &&
              my > btnY &&
              my < btnY + btnH
            ) {
              const newTotal = totalSeconds + btn.delta;
              if (newTotal >= 60 && newTotal <= 5999) {
                // Trigger flip animations for changing digits
                const oldDigits = getDigits(totalSeconds);
                totalSeconds = newTotal;
                remainingSeconds = newTotal;
                const newDigits = getDigits(totalSeconds);
                for (let i = 0; i < 4; i++) {
                  if (newDigits[i] !== oldDigits[i]) {
                    flipAnimations.push({
                      index: i,
                      fromDigit: oldDigits[i],
                      toDigit: newDigits[i],
                      startMs: p.millis(),
                    });
                  }
                }
                prevDigits = newDigits;
              }
              return;
            }
          }

          // Check start button
          const startY = btnY + btnH + 16;
          const startW = 80;
          const startH = 32;
          if (
            mx > -startW / 2 &&
            mx < startW / 2 &&
            my > startY &&
            my < startY + startH
          ) {
            timerState = "running";
            remainingSeconds = totalSeconds;
            prevDigits = getDigits(remainingSeconds);
            lastTickMs = p.millis();
            return;
          }
        } else if (timerState === "running") {
          // Check end button
          const endY = CLOCK_H / 2 + 30;
          const endW = 80;
          const endH = 32;
          if (
            mx > -endW / 2 &&
            mx < endW / 2 &&
            my > endY &&
            my < endY + endH
          ) {
            onClose();
            return;
          }
        } else if (timerState === "done") {
          // Check close button
          const closeY = CLOCK_H / 2 + 30;
          const closeW = 80;
          const closeH = 32;
          if (
            mx > -closeW / 2 &&
            mx < closeW / 2 &&
            my > closeY &&
            my < closeY + closeH
          ) {
            onClose();
            return;
          }
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
