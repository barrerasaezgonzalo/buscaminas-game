"use client";

import { useState, useEffect } from "react";

type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
};

type Difficulty = "facil" | "medio" | "dificil";

const DIFFICULTIES = {
  facil: { rows: 8, cols: 8, mines: 10 },
  medio: { rows: 12, cols: 12, mines: 25 },
  dificil: { rows: 16, cols: 16, mines: 40 },
};

export default function Buscaminas() {
  const [difficulty, setDifficulty] = useState<Difficulty>("facil");
  const [board, setBoard] = useState<CellState[][]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [flagCount, setFlagCount] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [firstClick, setFirstClick] = useState(true);

  const config = DIFFICULTIES[difficulty];

  useEffect(() => {
    initializeBoard();
  }, [difficulty]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !gameOver && !gameWon) {
      interval = setInterval(() => {
        setTimeElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, gameOver, gameWon]);

  const initializeBoard = () => {
    const newBoard: CellState[][] = [];
    for (let i = 0; i < config.rows; i++) {
      const row: CellState[] = [];
      for (let j = 0; j < config.cols; j++) {
        row.push({
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          neighborMines: 0,
        });
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
    setGameOver(false);
    setGameWon(false);
    setFlagCount(0);
    setTimeElapsed(0);
    setIsPlaying(false);
    setFirstClick(true);
  };

  const countNeighborMines = (
    board: CellState[][],
    row: number,
    col: number,
  ): number => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (
          newRow >= 0 &&
          newRow < config.rows &&
          newCol >= 0 &&
          newCol < config.cols &&
          board[newRow][newCol].isMine
        ) {
          count++;
        }
      }
    }
    return count;
  };

  const revealCell = (row: number, col: number) => {
    if (gameOver || gameWon || board[row][col].isFlagged) return;

    let newBoard = board.map((r) => r.map((cell) => ({ ...cell })));

    if (firstClick) {
      // Colocar minas primero
      let minesPlaced = 0;
      while (minesPlaced < config.mines) {
        const mRow = Math.floor(Math.random() * config.rows);
        const mCol = Math.floor(Math.random() * config.cols);

        // No colocar mina en la primera celda clickeada ni en sus vecinos
        const isExcluded =
          Math.abs(mRow - row) <= 1 && Math.abs(mCol - col) <= 1;

        if (!newBoard[mRow][mCol].isMine && !isExcluded) {
          newBoard[mRow][mCol].isMine = true;
          minesPlaced++;
        }
      }

      // Calcular números de minas vecinas
      for (let i = 0; i < config.rows; i++) {
        for (let j = 0; j < config.cols; j++) {
          if (!newBoard[i][j].isMine) {
            newBoard[i][j].neighborMines = countNeighborMines(newBoard, i, j);
          }
        }
      }

      setFirstClick(false);
      setIsPlaying(true);
    }

    if (newBoard[row][col].isMine) {
      // Game Over
      revealAllMines(newBoard);
      setBoard(newBoard);
      setGameOver(true);
      setIsPlaying(false);
      return;
    }

    revealCellRecursive(newBoard, row, col);
    setBoard(newBoard);
    checkWin(newBoard);
  };

  const revealCellRecursive = (
    board: CellState[][],
    row: number,
    col: number,
  ) => {
    if (
      row < 0 ||
      row >= config.rows ||
      col < 0 ||
      col >= config.cols ||
      board[row][col].isRevealed ||
      board[row][col].isFlagged
    ) {
      return;
    }

    board[row][col].isRevealed = true;

    if (board[row][col].neighborMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          revealCellRecursive(board, row + i, col + j);
        }
      }
    }
  };

  const revealAllMines = (board: CellState[][]) => {
    for (let i = 0; i < config.rows; i++) {
      for (let j = 0; j < config.cols; j++) {
        if (board[i][j].isMine) {
          board[i][j].isRevealed = true;
        }
      }
    }
  };

  const toggleFlag = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault();
    if (gameOver || gameWon || board[row][col].isRevealed) return;

    const newBoard = board.map((r) => r.map((cell) => ({ ...cell })));
    newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;

    setFlagCount((prev) =>
      newBoard[row][col].isFlagged ? prev + 1 : prev - 1,
    );
    setBoard(newBoard);
  };

  const checkWin = (board: CellState[][]) => {
    for (let i = 0; i < config.rows; i++) {
      for (let j = 0; j < config.cols; j++) {
        if (!board[i][j].isMine && !board[i][j].isRevealed) {
          return;
        }
      }
    }
    setGameWon(true);
    setIsPlaying(false);
  };

  const getCellContent = (cell: CellState) => {
    if (!cell.isRevealed) {
      return cell.isFlagged ? "🚩" : "";
    }
    if (cell.isMine) {
      return "💣";
    }
    return cell.neighborMines > 0 ? cell.neighborMines : "";
  };

  const getCellColor = (cell: CellState) => {
    if (!cell.isRevealed) {
      return "bg-gradient-to-br from-gray-300 to-gray-400 hover:from-gray-200 hover:to-gray-300";
    }
    if (cell.isMine) {
      return "bg-red-500";
    }
    return "bg-gray-100";
  };

  const getNumberColor = (num: number) => {
    const colors = [
      "",
      "text-blue-600",
      "text-green-600",
      "text-red-600",
      "text-purple-600",
      "text-yellow-600",
      "text-pink-600",
      "text-gray-800",
      "text-black",
    ];
    return colors[num] || "text-gray-700";
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getCellSize = () => {
    if (difficulty === "facil") return "w-12 h-12 text-lg";
    if (difficulty === "medio") return "w-10 h-10 text-base";
    return "w-8 h-8 text-sm";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 flex items-center justify-center p-5">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
            💣 Buscaminas
          </h1>
        </div>

        {/* Controls */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <button
              onClick={() => setDifficulty("facil")}
              className={`py-3 px-4 rounded-xl font-bold transition-all ${
                difficulty === "facil"
                  ? "bg-green-500 text-white shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Fácil
              <br />
              <span className="text-sm font-normal">8x8 - 10 minas</span>
            </button>
            <button
              onClick={() => setDifficulty("medio")}
              className={`py-3 px-4 rounded-xl font-bold transition-all ${
                difficulty === "medio"
                  ? "bg-yellow-500 text-white shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Medio
              <br />
              <span className="text-sm font-normal">12x12 - 25 minas</span>
            </button>
            <button
              onClick={() => setDifficulty("dificil")}
              className={`py-3 px-4 rounded-xl font-bold transition-all ${
                difficulty === "dificil"
                  ? "bg-red-500 text-white shadow-lg scale-105"
                  : "bg-white/20 text-white hover:bg-white/30"
              }`}
            >
              Difícil
              <br />
              <span className="text-sm font-normal">16x16 - 40 minas</span>
            </button>
          </div>

          <div className="flex justify-between items-center text-white">
            <div className="bg-black/30 px-6 py-3 rounded-xl">
              <span className="text-2xl font-bold">
                🚩 {flagCount}/{config.mines}
              </span>
            </div>
            <button
              onClick={initializeBoard}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
            >
              {gameOver || gameWon ? "Nuevo Juego" : "Reiniciar"}
            </button>
            <div className="bg-black/30 px-6 py-3 rounded-xl">
              <span className="text-2xl font-bold">
                ⏱️ {formatTime(timeElapsed)}
              </span>
            </div>
          </div>
        </div>

        {/* Game Status */}
        {(gameOver || gameWon) && (
          <div
            className={`text-center mb-6 p-6 rounded-2xl font-bold text-2xl ${
              gameWon ? "bg-green-500 text-white" : "bg-red-500 text-white"
            }`}
          >
            {gameWon
              ? "🎉 ¡Ganaste! ¡Encontraste todas las minas!"
              : "💥 ¡Game Over! Pisaste una mina"}
          </div>
        )}

        {/* Board */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 overflow-auto">
          <div className="inline-block mx-auto">
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))`,
              }}
            >
              {board.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => revealCell(rowIndex, colIndex)}
                    onContextMenu={(e) => toggleFlag(rowIndex, colIndex, e)}
                    className={`${getCellSize()} ${getCellColor(cell)} 
                      border-2 border-gray-400 rounded font-bold 
                      transition-all active:scale-95 shadow-md
                      ${!cell.isRevealed ? "cursor-pointer" : "cursor-default"}
                      ${cell.isRevealed && !cell.isMine ? "border-gray-300" : ""}
                    `}
                    disabled={gameOver || gameWon}
                  >
                    <span className={`${getNumberColor(cell.neighborMines)}`}>
                      {getCellContent(cell)}
                    </span>
                  </button>
                )),
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white text-center">
          <p className="text-sm">
            <strong>Cómo jugar:</strong> Click izquierdo para revelar. Click
            derecho para marcar con bandera 🚩. Evita las minas 💣 y revela
            todas las casillas seguras para ganar.
          </p>
        </div>
      </div>
    </div>
  );
}
