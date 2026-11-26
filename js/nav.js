import { clamp } from './config.js';

// ステージの部屋サイズ・家具コライダーからA*用2Dグリッドを動的生成
export class NavGrid {
  constructor(room, colliders, cellSize = 0.4, margin = 0.34) {
    this.room = room;
    this.cellSize = cellSize;
    this.cols = Math.floor(room.width / cellSize);
    this.rows = Math.floor(room.depth / cellSize);
    this.walkable = new Uint8Array(this.cols * this.rows);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const { x, z } = this.cellToWorld(c, r);
        let ok = true;
        if (Math.abs(x) > room.halfW - margin || Math.abs(z) > room.halfD - margin) {
          ok = false;
        }
        if (ok) {
          for (const col of colliders) {
            if (col.bottomY > 1.75) continue;
            if (
              x > col.minX - margin &&
              x < col.maxX + margin &&
              z > col.minZ - margin &&
              z < col.maxZ + margin
            ) {
              ok = false;
              break;
            }
          }
        }
        this.walkable[r * this.cols + c] = ok ? 1 : 0;
      }
    }
  }

  worldToCell(x, z) {
    const c = clamp(Math.floor((x + this.room.halfW) / this.cellSize), 0, this.cols - 1);
    const r = clamp(Math.floor((z + this.room.halfD) / this.cellSize), 0, this.rows - 1);
    return { c, r };
  }

  cellToWorld(c, r) {
    return {
      x: -this.room.halfW + (c + 0.5) * this.cellSize,
      z: -this.room.halfD + (r + 0.5) * this.cellSize
    };
  }

  isWalkable(c, r) {
    if (c < 0 || c >= this.cols || r < 0 || r >= this.rows) return false;
    return this.walkable[r * this.cols + c] === 1;
  }

  findNearestWalkable(sc, sr) {
    if (this.isWalkable(sc, sr)) return { c: sc, r: sr };
    let best = null;
    let bestD = Infinity;
    for (let radius = 1; radius <= 8; radius++) {
      for (let dr = -radius; dr <= radius; dr++) {
        for (let dc = -radius; dc <= radius; dc++) {
          const nc = sc + dc;
          const nr = sr + dr;
          if (!this.isWalkable(nc, nr)) continue;
          const d = dc * dc + dr * dr;
          if (d < bestD) {
            bestD = d;
            best = { c: nc, r: nr };
          }
        }
      }
      if (best) return best;
    }
    return { c: sc, r: sr };
  }

  findFlankPoint(tx, tz, fromX, fromZ) {
    const tc = this.worldToCell(tx, tz);
    let best = null;
    let bestScore = Infinity;
    for (let dr = -4; dr <= 4; dr++) {
      for (let dc = -4; dc <= 4; dc++) {
        const nc = tc.c + dc;
        const nr = tc.r + dr;
        if (!this.isWalkable(nc, nr)) continue;
        const p = this.cellToWorld(nc, nr);
        const dTarget = Math.hypot(p.x - tx, p.z - tz);
        const dFrom = Math.hypot(p.x - fromX, p.z - fromZ);
        if (dFrom < 0.7) continue;
        const score = dTarget + dFrom * 0.25;
        if (score < bestScore) {
          bestScore = score;
          best = p;
        }
      }
    }
    if (best) return best;
    const near = this.findNearestWalkable(tc.c, tc.r);
    return this.cellToWorld(near.c, near.r);
  }

  getRandomWalkablePoint() {
    for (let tries = 0; tries < 40; tries++) {
      const c = Math.floor(Math.random() * this.cols);
      const r = Math.floor(Math.random() * this.rows);
      if (this.isWalkable(c, r)) return this.cellToWorld(c, r);
    }
    return { x: 0, z: 0 };
  }

  findPath(sx, sz, tx, tz) {
    const scObj = this.worldToCell(sx, sz);
    const tcObj = this.worldToCell(tx, tz);
    const sCell = this.findNearestWalkable(scObj.c, scObj.r);
    const tCell = this.findNearestWalkable(tcObj.c, tcObj.r);
    const startIdx = sCell.r * this.cols + sCell.c;
    const goalIdx = tCell.r * this.cols + tCell.c;
    if (startIdx === goalIdx) return [this.cellToWorld(tCell.c, tCell.r)];

    const total = this.cols * this.rows;
    const gScore = new Float32Array(total).fill(Infinity);
    const fScore = new Float32Array(total).fill(Infinity);
    const cameFrom = new Int32Array(total).fill(-1);
    const closed = new Uint8Array(total);
    const inOpen = new Uint8Array(total);
    const open = [startIdx];

    gScore[startIdx] = 0;
    fScore[startIdx] = Math.hypot(tCell.c - sCell.c, tCell.r - sCell.r);
    inOpen[startIdx] = 1;

    const dirs = [
      [1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1],
      [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]
    ];

    while (open.length > 0) {
      let bestPos = 0;
      let current = open[0];
      let bestF = fScore[current];
      for (let i = 1; i < open.length; i++) {
        if (fScore[open[i]] < bestF) {
          bestF = fScore[open[i]];
          current = open[i];
          bestPos = i;
        }
      }

      if (current === goalIdx) {
        const path = [];
        let cur = current;
        while (cur !== -1 && cur !== startIdx) {
          const cc = cur % this.cols;
          const cr = Math.floor(cur / this.cols);
          path.push(this.cellToWorld(cc, cr));
          cur = cameFrom[cur];
        }
        path.reverse();
        return path;
      }

      open.splice(bestPos, 1);
      inOpen[current] = 0;
      closed[current] = 1;

      const cc = current % this.cols;
      const cr = Math.floor(current / this.cols);

      for (let d = 0; d < dirs.length; d++) {
        const [dc, dr, cost] = dirs[d];
        const nc = cc + dc;
        const nr = cr + dr;
        if (!this.isWalkable(nc, nr)) continue;
        if (dc !== 0 && dr !== 0) {
          if (!this.isWalkable(cc + dc, cr) || !this.isWalkable(cc, cr + dr)) continue;
        }
        const nIdx = nr * this.cols + nc;
        if (closed[nIdx]) continue;

        const tentativeG = gScore[current] + cost;
        if (tentativeG < gScore[nIdx]) {
          cameFrom[nIdx] = current;
          gScore[nIdx] = tentativeG;
          fScore[nIdx] = tentativeG + Math.hypot(tCell.c - nc, tCell.r - nr);
          if (!inOpen[nIdx]) {
            open.push(nIdx);
            inOpen[nIdx] = 1;
          }
        }
      }
    }
    return [this.cellToWorld(tCell.c, tCell.r)];
  }
}
