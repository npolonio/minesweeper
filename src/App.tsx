import React, { useState } from "react";
import "./App.css";

type Cell = {
  isMine: boolean;
  revealed: boolean;
  flagged: boolean;
  adjacentMines: number;
};

const difficultySettings = {
  easy: { size: 8, mines: 10 },
  medium: { size: 12, mines: 20 },
  hard: { size: 16, mines: 40 },
};

const Minesweeper: React.FC = () => {
  const [screen, setScreen] = useState<"start" | "game" | "over">("start");
  const [board, setBoard] = useState<Cell[][]>([]);
  const [mineCount, setMineCount] = useState(0);
  const [overMessage, setOverMessage] = useState("");
  const [animate, setAnimate] = useState(false);

  const startGame = (size: number, mines: number) => {
    const newBoard = generateBoard(size, mines);
    setBoard(newBoard);
    setMineCount(mines);
    setOverMessage("");
    setScreen("game");
    setAnimate(false);
  };

  const restartGame = () => {
    setScreen("start");
    setBoard([]);
    setMineCount(0);
    setOverMessage("");
    setAnimate(false);
  };

  const backToMenu = () => {
    setScreen("start");
    setBoard([]);
    setMineCount(0);
    setOverMessage("");
    setAnimate(false);
  };

  const generateBoard = (size: number, mines: number): Cell[][] => {
    const board: Cell[][] = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({
        isMine: false,
        revealed: false,
        flagged: false,
        adjacentMines: 0,
      }))
    );

    let placedMines = 0;
    while (placedMines < mines) {
      const row = Math.floor(Math.random() * size);
      const col = Math.floor(Math.random() * size);
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        placedMines++;
      }
    }

    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!board[r][c].isMine) {
          board[r][c].adjacentMines = countAdjacentMines(board, r, c);
        }
      }
    }

    return board;
  };

  const countAdjacentMines = (board: Cell[][], row: number, col: number) => {
    const directions = [
      [-1, -1],
      [-1, 0],
      [-1, 1],
      [0, -1],
      [0, 1],
      [1, -1],
      [1, 0],
      [1, 1],
    ];
    let count = 0;
    directions.forEach(([dr, dc]) => {
      const r = row + dr;
      const c = col + dc;
      if (board[r]?.[c]?.isMine) count++;
    });
    return count;
  };

  const revealCell = (row: number, col: number) => {
    if (board[row][col].revealed || board[row][col].flagged) return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));

    const floodReveal = (r: number, c: number) => {
      if (newBoard[r][c].revealed || newBoard[r][c].flagged) return;
      newBoard[r][c].revealed = true;
      if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
        const directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];
        directions.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (newBoard[nr]?.[nc]) floodReveal(nr, nc);
        });
      }
    };

    if (newBoard[row][col].isMine) {
      newBoard[row][col].revealed = true;
      setBoard(newBoard);
      setOverMessage("Game Over!");
      setScreen("over");
      setAnimate(true);
      return;
    }

    floodReveal(row, col);
    setBoard(newBoard);

    const allSafeRevealed = newBoard
      .flat()
      .every((cell) => cell.isMine || cell.revealed);
    if (allSafeRevealed) {
      setOverMessage("You Win!");
      setScreen("over");
      setAnimate(true);
    }
  };

  const toggleFlag = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();
    if (board[row][col].revealed) return;

    const newBoard = board.map((r) => r.map((c) => ({ ...c })));
    newBoard[row][col].flagged = !newBoard[row][col].flagged;
    setBoard(newBoard);

    const newMineCount = mineCount + (newBoard[row][col].flagged ? -1 : 1);
    setMineCount(newMineCount);
  };

  return (
    <div className={`game-container ${animate ? "animate" : ""}`}>
      {/* Tela Inicial */}
      <div className={`screen ${screen === "start" ? "active" : ""}`}>
        <h1>Minesweeper</h1>
        <p>Select difficulty:</p>
        <button
          className="primary"
          onClick={() =>
            startGame(
              difficultySettings.easy.size,
              difficultySettings.easy.mines
            )
          }
        >
          Easy
        </button>
        <button
          className="primary"
          onClick={() =>
            startGame(
              difficultySettings.medium.size,
              difficultySettings.medium.mines
            )
          }
        >
          Medium
        </button>
        <button
          className="primary"
          onClick={() =>
            startGame(
              difficultySettings.hard.size,
              difficultySettings.hard.mines
            )
          }
        >
          Hard
        </button>
      </div>

      {/* Tela do Jogo */}
      <div className={`screen ${screen === "game" ? "active" : ""}`}>
        <h2>Minesweeper</h2>
        <p>
          Mines: <span id="mineCount">{mineCount}</span>
        </p>
        <div id="board-container">
          <div
            id="board"
            className="board"
            style={{
              gridTemplateColumns: `repeat(${board.length}, 30px)`,
              gridTemplateRows: `repeat(${board.length}, 30px)`,
            }}
          >
            {board.map((row, rIdx) =>
              row.map((cell, cIdx) => (
                <div
                  key={`${rIdx}-${cIdx}`}
                  className={`cell ${cell.revealed ? "revealed" : ""} ${
                    cell.isMine && cell.revealed ? "mine" : ""
                  } ${cell.flagged ? "flag" : ""}`}
                  onClick={() => revealCell(rIdx, cIdx)}
                  onContextMenu={(e) => toggleFlag(e, rIdx, cIdx)}
                >
                  {cell.revealed
                    ? cell.isMine
                      ? "💣"
                      : cell.adjacentMines || ""
                    : cell.flagged
                    ? "🚩"
                    : ""}
                </div>
              ))
            )}
          </div>
        </div>
        <p id="instructions">
          Left-click to reveal a cell.
          <br />
          Right-click to place or remove a flag 🚩.
        </p>
      </div>

      {/* Tela de Game Over */}
      <div className={`screen ${screen === "over" ? "active" : ""}`}>
        <h1 id="overMessage">{overMessage}</h1>
        <button className="primary" onClick={restartGame}>
          Restart
        </button>
        <button onClick={backToMenu}>Menu</button>
      </div>
    </div>
  );
};

export default Minesweeper;
