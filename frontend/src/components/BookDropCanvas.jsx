import { useEffect, useRef } from "react";

const CW = 300;
const CH = 280;
const SHELF_Y = 210;
const SHELF_H = 8;
const GRAVITY = 0.20;
const BOUNCE = 0.20;
const STAGGER_DROP = 300;
const REST_DELAY = 2000;
const STAGGER_FALL = 230;
const RESET_DELAY = 500;

const BOOKS = [
    { w: 28, h: 62, color: "#8b5cf6" },
    { w: 30, h: 80, color: "#7c3aed" },
    { w: 26, h: 98, color: "#9333ea" },
    { w: 32, h: 120, color: "#a855f7" },
    { w: 34, h: 132, color: "#7e22ce" },
    { w: 32, h: 108, color: "#6d28d9" },
    { w: 28, h: 84, color: "#9333ea" },
];

const GAP = 5;
const BOOK_LEFT_X = (() => {
    const totalW = BOOKS.reduce((s, b) => s + b.w, 0) + GAP * (BOOKS.length - 1);
    let x = (CW - totalW) / 2;
    return BOOKS.map(b => { const lx = x; x += b.w + GAP; return lx; });
})();
const BOOK_CX = BOOK_LEFT_X.map((lx, i) => lx + BOOKS[i].w / 2);

function drawBook(ctx, cx, cy, w, h, color, angle, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx, cy);
    ctx.rotate(angle);

    const lx = -w / 2;
    const top = -h / 2;
    const R = 3;

    ctx.shadowColor = "rgba(88,28,220,0.28)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(lx, top, w, h, R);
    ctx.fill();
    ctx.shadowColor = "transparent";

    const sheen = ctx.createLinearGradient(lx, 0, lx + w, 0);
    sheen.addColorStop(0, "rgba(255,255,255,0.20)");
    sheen.addColorStop(0.3, "rgba(255,255,255,0.04)");
    sheen.addColorStop(1, "rgba(0,0,0,0.10)");
    ctx.fillStyle = sheen;
    ctx.beginPath();
    ctx.roundRect(lx, top, w, h, R);
    ctx.fill();

    ctx.strokeStyle = "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1;
    [0.17, 0.23].forEach(t => {
        const by = top + h * t;
        ctx.beginPath();
        ctx.moveTo(lx + R, by);
        ctx.lineTo(lx + w - R, by);
        ctx.stroke();
    });

    ctx.restore();
}

// Shelf drawn as an opaque block — anything drawn before this is masked
function drawShelf(ctx) {
    // glow below
    const glow = ctx.createLinearGradient(0, SHELF_Y + SHELF_H, 0, SHELF_Y + 50);
    glow.addColorStop(0, "rgba(147,51,234,0.22)");
    glow.addColorStop(1, "rgba(147,51,234,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, SHELF_Y + SHELF_H, CW, 42);

    // plank
    const plank = ctx.createLinearGradient(0, SHELF_Y, 0, SHELF_Y + SHELF_H);
    plank.addColorStop(0, "#9333ea");
    plank.addColorStop(1, "#5b21b6");
    ctx.fillStyle = plank;
    ctx.fillRect(0, SHELF_Y, CW, SHELF_H);

    // top shine
    ctx.strokeStyle = "rgba(216,180,254,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, SHELF_Y);
    ctx.lineTo(CW, SHELF_Y);
    ctx.stroke();
}

export default function BookDropCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");

        let animId = null;
        let restTimer = null;
        let resetTimer = null;
        let cancelled = false;

        function startLoop() {
            if (animId !== null) { cancelAnimationFrame(animId); animId = null; }
            clearTimeout(restTimer);
            clearTimeout(resetTimer);

            const states = BOOKS.map((b, i) => ({
                top: -(b.h + 30),
                vy: 0,
                squish: 1,
                squishVel: 0,
                cx: BOOK_CX[i],
                cy: 0,
                angle: 0,
                rotVel: 0,
                vx: 0,
                fallVy: 0,
                alpha: 1,
                phase: "waiting",
            }));

            let loopPhase = "dropping";
            const t0 = performance.now();

            function tick(now) {
                if (cancelled) return;
                const elapsed = now - t0;

                ctx.clearRect(0, 0, CW, CH);

                // ── 1. draw shelf first (background layer) ──────────────────
                // Only draw the shelf background during drop phase so books
                // land ON TOP of shelf normally
                if (loopPhase !== "falling" && loopPhase !== "done") {
                    drawShelf(ctx);
                }

                // ── 2. draw all books ────────────────────────────────────────
                let anyActive = false;

                states.forEach((s, i) => {
                    const b = BOOKS[i];

                    if (s.phase === "waiting") {
                        if (elapsed >= i * STAGGER_DROP) s.phase = "dropping";
                        else { anyActive = true; return; }
                    }

                    // DROP FROM ABOVE
                    if (s.phase === "dropping") {
                        s.vy += GRAVITY;
                        s.top += s.vy;
                        s.squish += s.squishVel;
                        s.squishVel += (1 - s.squish) * 0.28;
                        s.squishVel *= 0.58;

                        if (s.top + b.h >= SHELF_Y) {
                            s.top = SHELF_Y - b.h;
                            const impact = Math.abs(s.vy);
                            s.vy = -(s.vy * BOUNCE);
                            if (impact > 2.5) {
                                s.squish = 1 - impact * 0.022;
                                s.squishVel = impact * 0.018;
                            }
                            if (Math.abs(s.vy) < 0.9) {
                                s.vy = 0; s.squish = 1; s.squishVel = 0;
                                s.phase = "resting";
                                s.cy = SHELF_Y - b.h / 2;
                            }
                        }

                        const drawH = b.h * s.squish;
                        const drawCY = s.top + (b.h - drawH) + drawH / 2;
                        drawBook(ctx, BOOK_CX[i], drawCY, b.w, drawH, b.color, 0, 1);
                        anyActive = true;
                        return;
                    }

                    if (s.phase === "resting") {
                        drawBook(ctx, s.cx, s.cy, b.w, b.h, b.color, 0, 1);
                        return;
                    }

                    // FALL OFF — same satisfying tumble+drift+fade as before
                    if (s.phase === "falling") {
                        s.fallVy += GRAVITY * 1.1;
                        s.cy += s.fallVy;
                        s.cx += s.vx;
                        s.angle += s.rotVel;
                        s.rotVel *= 1.025;

                        const fadeStart = SHELF_Y + 30;
                        const fadeEnd = CH + b.h;
                        if (s.cy > fadeStart) {
                            s.alpha = Math.max(0, 1 - (s.cy - fadeStart) / (fadeEnd - fadeStart));
                        }

                        if (s.cy - b.h / 2 > CH + 20) { s.phase = "gone"; return; }

                        drawBook(ctx, s.cx, s.cy, b.w, b.h, b.color, s.angle, s.alpha);
                        anyActive = true;
                    }
                });

                // ── 3. draw shelf ON TOP during fall — books go BEHIND table ─
                if (loopPhase === "falling" || loopPhase === "done") {
                    drawShelf(ctx);
                }

                // ── phase transitions ────────────────────────────────────────
                const allResting = !anyActive && states.every(
                    s => s.phase === "resting" || s.phase === "gone"
                );

                if (loopPhase === "dropping" && allResting) {
                    loopPhase = "resting";
                    restTimer = setTimeout(() => {
                        if (cancelled) return;
                        loopPhase = "falling";
                        states.forEach((s, i) => {
                            setTimeout(() => {
                                if (cancelled) return;
                                s.phase = "falling";
                                s.fallVy = 1.2;
                                const centre = CW / 2;
                                const dir = s.cx < centre ? -1 : 1;
                                s.vx = dir * (0.3 + Math.random() * 0.5);
                                s.rotVel = dir * (0.012 + Math.random() * 0.018);
                                s.alpha = 1;
                            }, i * STAGGER_FALL);
                        });
                    }, REST_DELAY);
                }

                if (loopPhase === "falling" && states.every(s => s.phase === "gone")) {
                    loopPhase = "done";
                    resetTimer = setTimeout(() => {
                        if (!cancelled) startLoop();
                    }, RESET_DELAY);
                    return;
                }

                animId = requestAnimationFrame(tick);
            }

            animId = requestAnimationFrame(tick);
        }

        startLoop();

        return () => {
            cancelled = true;
            if (animId !== null) cancelAnimationFrame(animId);
            clearTimeout(restTimer);
            clearTimeout(resetTimer);
        };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <canvas
                ref={canvasRef}
                width={CW}
                height={CH}
                style={{ display: "block" }}
                aria-label="Loading…"
            />
            <span className="text-4xl font-bold tracking-wide text-purple-500">LibAI</span>
            <div className="h-6 w-8"></div>
        </div>
    );
}