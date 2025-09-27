import { useEffect, useMemo, useState } from "react";
import "./App.css";
import { makePuzzle, type Difficulty } from "./lib/sudoku";

function getConflicts(cells: string[]) {
  const bad = new Set<number>();
  for (let i = 0; i < 81; i++) {
    const v = cells[i];
    if (!v) continue;
    const r = Math.floor(i / 9),
      c = i % 9;
    for (let j = 0; j < 9; j++) {
      // 行
      const k = r * 9 + j;
      if (k !== i && cells[k] === v) {
        bad.add(i);
        bad.add(k);
      }
    }
    for (let j = 0; j < 9; j++) {
      // 列
      const k = j * 9 + c;
      if (k !== i && cells[k] === v) {
        bad.add(i);
        bad.add(k);
      }
    }
    const br = Math.floor(r / 3) * 3,
      bc = Math.floor(c / 3) * 3; // 宫
    for (let dr = 0; dr < 3; dr++)
      for (let dc = 0; dc < 3; dc++) {
        const k = (br + dr) * 9 + (bc + dc);
        if (k !== i && cells[k] === v) {
          bad.add(i);
          bad.add(k);
        }
      }
  }
  return bad;
}

const fmt = (s: number) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(
    2,
    "0"
  )}`;

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [{ initial, given }, setPuzzle] = useState(() => makePuzzle("easy"));
  const [cells, setCells] = useState<string[]>(initial);

  // 计时
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setTime((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, [running]);
  useEffect(() => {
    if (!running && cells.some((v, i) => !given[i] && v)) setRunning(true);
  }, [cells, given, running]);

  const conflicts = useMemo(() => getConflicts(cells), [cells]);
  const finished = conflicts.size === 0 && cells.every((v) => v !== "");
  useEffect(() => {
    if (finished && running) setRunning(false);
  }, [finished, running]);

  const onChange = (i: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^1-9]/g, "").slice(0, 1);
    setCells((prev) => {
      const next = [...prev];
      next[i] = v;
      return next;
    });
  };

  const clearFills = () =>
    setCells((prev) => prev.map((v, i) => (given[i] ? v : "")));

  const resetAll = () => {
    setCells(initial);
    setTime(0);
    setRunning(false);
  };

  const newGame = () => {
    const p = makePuzzle(difficulty);
    setPuzzle(p);
    setCells(p.initial);
    setTime(0);
    setRunning(false);
  };

  const status = finished ? "已完成" : conflicts.size ? "有冲突" : "进行中";

  return (
    <div className="app">
      <h1>Sudoku Sandbox</h1>

      <div className="status">
        ⏱ {fmt(time)} ・ 难度：
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value as Difficulty)}
        >
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
        ・ 状态：{status}
      </div>

      <div className="toolbar">
        <button onClick={newGame}>新建题目</button>
        <button onClick={clearFills}>清空填写</button>
        <button onClick={resetAll}>重置题目</button>
      </div>

      <div className="grid">
        {cells.map((val, i) => (
          <input
            key={i}
            className={`cell ${given[i] ? "given" : ""} ${
              conflicts.has(i) ? "error" : ""
            }`}
            value={val}
            onChange={onChange(i)}
            readOnly={given[i]}
            inputMode="numeric"
            maxLength={1}
          />
        ))}
      </div>
    </div>
  );
}
