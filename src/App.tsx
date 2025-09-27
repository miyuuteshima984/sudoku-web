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
      const k = r * 9 + j;
      if (k !== i && cells[k] === v) {
        bad.add(i);
        bad.add(k);
      }
    }
    for (let j = 0; j < 9; j++) {
      const k = j * 9 + c;
      if (k !== i && cells[k] === v) {
        bad.add(i);
        bad.add(k);
      }
    }
    const br = Math.floor(r / 3) * 3,
      bc = Math.floor(c / 3) * 3;
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
const apiBase =
  (import.meta as any).env.VITE_API_BASE || "http://localhost:3001";

type Row = { name: string; seconds: number; created_at: string };

export default function App() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [{ initial, given }, setPuzzle] = useState(() => makePuzzle("easy"));
  const [cells, setCells] = useState<string[]>(initial);

  // 计时
  const [time, setTime] = useState(0);
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
    setSubmitted(false);
  };

  const newGame = () => {
    const p = makePuzzle(difficulty);
    setPuzzle(p);
    setCells(p.initial);
    setTime(0);
    setRunning(false);
    setSubmitted(false);
  };

  // ↓↓↓ 分数提交 & 榜单 ↓↓↓
  const [leaderboard, setLeaderboard] = useState<Row[]>([]);
  const [showLB, setShowLB] = useState(false);
  const fetchLeaderboard = async () => {
    const r = await fetch(`${apiBase}/api/leaderboard?limit=20`);
    setLeaderboard(await r.json());
  };
  const submitScore = async () => {
    if (!finished) return;
    const name = (prompt("输入榜单昵称（1-20 字符）：", "guest") || "")
      .trim()
      .slice(0, 20);
    if (!name) return;
    const r = await fetch(`${apiBase}/api/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, seconds: time }),
    });
    if (!r.ok) {
      alert("提交失败，请稍后重试");
      return;
    }
    alert("提交成功！");
    await fetchLeaderboard();
    setShowLB(true);
  };
  // ↑↑↑ 分数提交 & 榜单 ↑↑↑
  useEffect(() => {
    if (!finished || submitted) return; // 未完成或已提交过都不触发
    setSubmitted(true); // 标记只触发一次
    void submitScore(); // 复用你已有的提交函数
  }, [finished, submitted]);

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
        <button
          onClick={submitScore}
          disabled={!finished}
          title={finished ? "" : "完成后才能提交"}
        >
          提交成绩
        </button>
        <button
          onClick={() => {
            fetchLeaderboard();
            setShowLB(true);
          }}
        >
          查看榜单
        </button>
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

      {showLB && (
        <div className="leaderboard">
          <h3>Leaderboard（前 20）</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>昵称</th>
                <th>用时(秒)</th>
                <th>时间</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((r, i) => (
                <tr key={i}>
                  <td>{i + 1}</td>
                  <td>{r.name}</td>
                  <td>{r.seconds}</td>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setShowLB(false)}>关闭</button>
        </div>
      )}
    </div>
  );
}
