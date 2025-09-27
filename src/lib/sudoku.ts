export type Difficulty = "easy" | "medium" | "hard";

const DIGITS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];
const shuffle = <T>(a: T[]) => a.sort(() => Math.random() - 0.5);

const row = (i: number) => Math.floor(i / 9);
const col = (i: number) => i % 9;

function canPlace(board: string[], idx: number, v: string) {
  const r = row(idx),
    c = col(idx);
  // 行
  for (let j = 0; j < 9; j++) if (board[r * 9 + j] === v) return false;
  // 列
  for (let j = 0; j < 9; j++) if (board[j * 9 + c] === v) return false;
  // 宫
  const br = Math.floor(r / 3) * 3,
    bc = Math.floor(c / 3) * 3;
  for (let dr = 0; dr < 3; dr++)
    for (let dc = 0; dc < 3; dc++)
      if (board[(br + dr) * 9 + (bc + dc)] === v) return false;
  return true;
}

function fill(board: string[], idx = 0): boolean {
  if (idx >= 81) return true;
  if (board[idx] !== "") return fill(board, idx + 1);

  for (const d of shuffle([...DIGITS])) {
    if (canPlace(board, idx, d)) {
      board[idx] = d;
      if (fill(board, idx + 1)) return true;
      board[idx] = "";
    }
  }
  return false;
}

export function generateSolved(): string[] {
  const b = Array(81).fill("");
  fill(b, 0);
  return b;
}

export function makePuzzle(diff: Difficulty) {
  const solved = generateSolved();
  const initial = [...solved];

  // 挖空（简单：不保证唯一解，但玩起来OK）
  const holes = { easy: 40, medium: 50, hard: 55 } as const;
  let left = holes[diff];
  for (const i of shuffle(Array.from({ length: 81 }, (_, i) => i))) {
    if (left <= 0) break;
    initial[i] = "";
    left--;
  }

  const given = initial.map((v) => v !== "");
  return { initial, given };
}
