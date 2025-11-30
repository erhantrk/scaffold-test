import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { apiService } from "./services/apiService";

const INITIAL_BOARD = [
  ["r", "n", "b", "q", "k", "b", "n", "r"],
  ["p", "p", "p", "p", "p", "p", "p", "p"],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  [".", ".", ".", ".", ".", ".", ".", "."],
  ["P", "P", "P", "P", "P", "P", "P", "P"],
  ["R", "N", "B", "Q", "K", "B", "N", "R"],
];

const PIECE_SYMBOLS = {
  k: "♚",
  q: "♛",
  r: "♜",
  b: "♝",
  n: "♞",
  p: "♟",
  K: "♔",
  Q: "♕",
  R: "♖",
  B: "♗",
  N: "♘",
  P: "♙",
  ".": "",
};

const getPieceColor = (piece) => {
  if (piece === ".") return "transparent";
  return piece === piece.toLowerCase() ? "#000" : "#fff";
};

const fenToBoard = (fen) => {
  const parts = fen.split(" ");
  const rows = parts[0].split("/");
  const board = [];

  for (let row of rows) {
    const boardRow = [];
    for (let char of row) {
      if (char >= "1" && char <= "8") {
        for (let i = 0; i < parseInt(char); i++) {
          boardRow.push(".");
        }
      } else {
        boardRow.push(char);
      }
    }
    board.push(boardRow);
  }
  return board;
};

const formatMove = (move) => {
  if (move.length === 4) {
    return `${move.substring(0, 2)} → ${move.substring(2, 4)}`;
  }
  return move;
};

const Game = () => {
  const { id } = useParams();
  const [board, setBoard] = useState(INITIAL_BOARD);
  const [selected, setSelected] = useState(null);
  const [status, setStatus] = useState("Bağlanıyor...");
  const socketRef = useRef(null);
  const [moveHistory, setMoveHistory] = useState([]);
  const [validMoves, setValidMoves] = useState([]);
  const [currentTurn, setCurrentTurn] = useState("white");
  const lastFenRef = useRef("");
  const pendingMoveRef = useRef(null);
  const [myColor, setMyColor] = useState(null);
  const [myId, setMyId] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [winner, setWinner] = useState(null);
  const [payoutTxHash, setPayoutTxHash] = useState(null);
  const [payoutStatus, setPayoutStatus] = useState(null); // 'success' | 'failed' | null

  // OYUNCU STATE'LERİ
  const [whitePlayer, setWhitePlayer] = useState({ name: "?", elo: "?" });
  const [blackPlayer, setBlackPlayer] = useState({ name: "?", elo: "?" });
  const [whitePlayerId, setWhitePlayerId] = useState(null);
  const [blackPlayerId, setBlackPlayerId] = useState(null);

  // BET BİLGİSİ
  const [betAmount, setBetAmount] = useState(0);
  const [potSize, setPotSize] = useState(0);

  const isBoardFlipped = myColor === "black";

  // Yardımcı: ID ile kullanıcı bilgisini çeken fonksiyon
  const fetchPlayerDetails = async (playerId) => {
    if (!playerId) return { username: "RAKİP BEKLENİYOR", elo: "?" };
    try {
      const user = await apiService.getUser(playerId);
      return user;
    } catch {
      return { username: "Bağlantı Hatası", elo: "?" };
    }
  };

  // 1. Kimlik Al
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await apiService.getCurrentUser();
        setMyId(data.id);
      } catch (error) {
        console.error("Kimlik alınamadı:", error);
      }
    };
    fetchMe();
  }, []);

  // 2. Durum Kontrolü, Renk ve Elo Belirleme (Polling)
  useEffect(() => {
    const checkGameStatus = async () => {
      try {
        const game = await apiService.getGame(id);

        setWhitePlayerId(game.white_player_id);
        setBlackPlayerId(game.black_player_id);
        setBetAmount(game.bet_amount || 0);
        setPotSize((game.bet_amount || 0) * 2);

        // ELO VE İSİM GÜNCELLEME
        const [whiteData, blackData] = await Promise.all([
          fetchPlayerDetails(game.white_player_id),
          fetchPlayerDetails(game.black_player_id),
        ]);

        setWhitePlayer({ name: whiteData.username, elo: whiteData.elo });
        setBlackPlayer({
          name: blackData.username || "RAKİP ARANIYOR",
          elo: blackData.elo || "?",
        });

        if (myId) {
          if (game.white_player_id === myId) setMyColor("white");
          else if (game.black_player_id === myId) setMyColor("black");
          else setMyColor("spectator");
        }

        if (game.status === "finished") {
          setGameOver(true);
          if (game.winner_id === null) setWinner("draw");
          else if (game.winner_id === game.white_player_id) setWinner("white");
          else setWinner("black");
        }
      } catch (error) {
        console.warn("Polling hatası:", error);
      }
    };

    if (myId) checkGameStatus();
    const interval = setInterval(checkGameStatus, 2000);
    return () => clearInterval(interval);
  }, [id, myId]);

  // 3. WebSocket Bağlantısı
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/game/${id}`);

    ws.onopen = () => {
      setStatus("🟢 Bağlı");
      ws.send("get_state");
    };

    ws.onmessage = (event) => {
      const data = event.data;

      // PAYOUT NOTIFICATION KONTROLÜ
      if (data.startsWith("game_finished:")) {
        const parts = data.split(":");
        const winnerId = parseInt(parts[1]);
        const payoutResult = parts[2]; // 'payout_success' veya 'payout_failed'
        const txHash = parts[3]; // transaction hash (varsa)

        if (payoutResult === "payout_success") {
          setPayoutStatus("success");
          setPayoutTxHash(txHash);
          console.log("✅ Ödeme başarılı! TX:", txHash);
        } else {
          setPayoutStatus("failed");
          console.log("❌ Ödeme başarısız!");
        }
        return;
      }

      if (data.startsWith("error:")) {
        console.error("Hata:", data);
        if (pendingMoveRef.current) {
          setMoveHistory((prev) => prev.slice(0, -1));
        }
        pendingMoveRef.current = null;
        return;
      }

      try {
        const newBoard = fenToBoard(data);
        if (lastFenRef.current !== data) {
          lastFenRef.current = data;

          if (pendingMoveRef.current) {
            pendingMoveRef.current = null;
          }
        }

        setBoard(newBoard);
        setSelected(null);
        setValidMoves([]);

        const parts = data.split(" ");
        setCurrentTurn(parts[1] === "w" ? "white" : "black");
      } catch (err) {
        console.error("FEN hatası:", err);
      }
    };

    ws.onclose = () => setStatus("🔴 Kopuk");
    socketRef.current = ws;
    return () => ws.close();
  }, [id]);

  const getValidMovesForPiece = (row, col, piece) => {
    const moves = [];
    const isWhite = piece === piece.toUpperCase();
    const pieceType = piece.toLowerCase();

    const checkSquare = (r, c, p) => {
      if (r < 0 || r > 7 || c < 0 || c > 7) return "boundary";
      const targetPiece = board[r][c];
      if (targetPiece === ".") return "empty";
      if (getPieceColor(targetPiece) === getPieceColor(p)) return "friend";
      return "enemy";
    };
    const checkSlide = (directions, r, c, p, m) => {
      for (let [dr, dc] of directions) {
        for (let i = 1; i < 8; i++) {
          const nr = r + dr * i;
          const nc = c + dc * i;
          const targetStatus = checkSquare(nr, nc, p);

          if (targetStatus === "boundary" || targetStatus === "friend") break;
          m.push([nr, nc]);
          if (targetStatus === "enemy") break;
        }
      }
    };

    if (pieceType === "p") {
      const direction = isWhite ? -1 : 1;
      if (checkSquare(row + direction, col, piece) === "empty") {
        moves.push([row + direction, col]);
        if (
          ((isWhite && row === 6) || (!isWhite && row === 1)) &&
          checkSquare(row + direction * 2, col, piece) === "empty"
        )
          moves.push([row + direction * 2, col]);
      }
      if (checkSquare(row + direction, col - 1, piece) === "enemy")
        moves.push([row + direction, col - 1]);
      if (checkSquare(row + direction, col + 1, piece) === "enemy")
        moves.push([row + direction, col + 1]);
    } else if (pieceType === "n") {
      const km = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (let [dr, dc] of km) {
        const nr = row + dr,
          nc = col + dc;
        const ts = checkSquare(nr, nc, piece);
        if (ts === "empty" || ts === "enemy") moves.push([nr, nc]);
      }
    } else if (pieceType === "r")
      checkSlide(
        [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
        ],
        row,
        col,
        piece,
        moves,
      );
    else if (pieceType === "b")
      checkSlide(
        [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ],
        row,
        col,
        piece,
        moves,
      );
    else if (pieceType === "q")
      checkSlide(
        [
          [0, 1],
          [0, -1],
          [1, 0],
          [-1, 0],
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ],
        row,
        col,
        piece,
        moves,
      );
    else if (pieceType === "k") {
      const dirs = [
        [0, 1],
        [0, -1],
        [1, 0],
        [-1, 0],
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ];
      for (let [dr, dc] of dirs) {
        const nr = row + dr,
          nc = col + dc;
        const ts = checkSquare(nr, nc, piece);
        if (ts === "empty" || ts === "enemy") moves.push([nr, nc]);
      }
    }
    return moves;
  };

  const handleSquareClick = (row, col) => {
    if (gameOver) return;
    const piece = board[row][col];

    if (selected) {
      if (!isValidMove(row, col)) {
        setSelected(null);
        setValidMoves([]);
        if (
          piece !== "." &&
          ((myColor === "white" && piece === piece.toUpperCase()) ||
            (myColor === "black" && piece === piece.toLowerCase()))
        ) {
          handleSquareClick(row, col);
        }
        return;
      }

      const [fromRow, fromCol] = selected;
      const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const from = files[fromCol] + (8 - fromRow);
      const to = files[col] + (8 - row);
      const move = from + to;

      if (socketRef.current?.readyState === WebSocket.OPEN) {
        const movingPiece = board[fromRow][fromCol];
        const moveNumber = Math.floor(moveHistory.length / 2) + 1;
        const isWhite = movingPiece === movingPiece.toUpperCase();

        const newMove = {
          number: moveNumber,
          move: move,
          piece: PIECE_SYMBOLS[movingPiece],
          color: isWhite ? "white" : "black",
          notation: formatMove(move),
        };

        setMoveHistory((prev) => [...prev, newMove]);
        pendingMoveRef.current = newMove;
        socketRef.current.send(move);
      }
      setSelected(null);
      setValidMoves([]);
    } else if (piece !== ".") {
      if (myColor) {
        if (currentTurn !== myColor) return;
        const isPieceWhite = piece === piece.toUpperCase();
        if (myColor === "white" && !isPieceWhite) return;
        if (myColor === "black" && isPieceWhite) return;
      }
      setSelected([row, col]);
      const moves = getValidMovesForPiece(row, col, piece);
      setValidMoves(moves);
    }
  };

  const isValidMove = (row, col) => {
    return validMoves.some(([r, c]) => r === row && c === col);
  };

  const opponent = myColor === "white" ? blackPlayer : whitePlayer;
  const myself = myColor === "white" ? whitePlayer : blackPlayer;

  if (gameOver) {
    const didIWin =
      (winner === "white" && myColor === "white") ||
      (winner === "black" && myColor === "black");
    const isDraw = winner === "draw";

    return (
      <div
        style={{
          padding: "20px",
          background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
          minHeight: "100vh",
          color: "white",
          fontFamily: "Arial",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            background: "rgba(0,0,0,0.9)",
            padding: "60px",
            borderRadius: "20px",
            border: isDraw
              ? "3px solid #888"
              : didIWin
                ? "3px solid gold"
                : "3px solid #f00",
            boxShadow: isDraw
              ? "0 0 40px rgba(136,136,136,0.5)"
              : didIWin
                ? "0 0 50px rgba(255,215,0,0.7)"
                : "0 0 30px rgba(100,100,100,0.3)",
            textAlign: "center",
            maxWidth: "700px",
          }}
        >
          <h1
            style={{
              fontSize: "4em",
              margin: "0 0 30px 0",
              color: isDraw ? "#ccc" : didIWin ? "gold" : "#ff4444",
              textShadow: isDraw
                ? "0 0 20px #888"
                : didIWin
                  ? "0 0 40px gold"
                  : "none",
            }}
          >
            {isDraw
              ? "🤝 BERABERE!"
              : didIWin
                ? "👑 KAZANDIN!"
                : "💀 KAYBETTİN!"}
          </h1>

          {!isDraw && (
            <h2
              style={{
                fontSize: "2em",
                margin: "20px 0",
                color: winner === "white" ? "#fff" : "#000",
                background:
                  winner === "white"
                    ? "linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))"
                    : "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(200,200,200,0.8))",
                padding: "20px",
                borderRadius: "10px",
                textShadow:
                  winner === "white" ? "none" : "0 0 5px rgba(0,0,0,0.5)",
              }}
            >
              Kazanan: {winner === "white" ? "⚪ BEYAZ" : "⚫ SİYAH"}
            </h2>
          )}

          {/* POT SİZE */}
          <div
            style={{
              margin: "30px 0",
              padding: "20px",
              background: "rgba(0,255,100,0.1)",
              borderRadius: "10px",
              border: "2px solid rgba(0,255,100,0.3)",
            }}
          >
            <div style={{ fontSize: "16px", color: "#aaa" }}>
              Kazanılan Miktar
            </div>
            <div
              style={{ fontSize: "32px", color: "#00ff64", fontWeight: "bold" }}
            >
              {(potSize / 10000000).toFixed(2)} CH3S
            </div>
          </div>

          {/* PAYOUT DURUMU */}
          {payoutStatus && (
            <div
              style={{
                margin: "20px 0",
                padding: "15px",
                background:
                  payoutStatus === "success"
                    ? "rgba(46, 204, 113, 0.2)"
                    : "rgba(231, 76, 60, 0.2)",
                borderRadius: "10px",
                border:
                  payoutStatus === "success"
                    ? "2px solid #2ecc71"
                    : "2px solid #e74c3c",
              }}
            >
              {payoutStatus === "success" ? (
                <div>
                  <div
                    style={{
                      fontSize: "18px",
                      color: "#2ecc71",
                      marginBottom: "10px",
                    }}
                  >
                    ✅ Ödeme Başarılı!
                  </div>
                  {payoutTxHash && (
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${payoutTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: "#00d2ff",
                        fontSize: "12px",
                        textDecoration: "underline",
                      }}
                    >
                      Transaction'ı Görüntüle
                    </a>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: "16px", color: "#e74c3c" }}>
                  ❌ Ödeme Başarısız
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => (window.location.href = "/lobby")}
            style={{
              marginTop: "20px",
              padding: "15px 40px",
              background: "#4CAF50",
              color: "white",
              border: "none",
              fontSize: "18px",
              cursor: "pointer",
              borderRadius: "10px",
              transition: "all 0.3s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🏠 Lobiye Dön
          </button>
        </div>
      </div>
    );
  }

  const rows = [];
  for (let i = 0; i < 8; i++) rows.push(i);
  const displayRows = isBoardFlipped ? [...rows].reverse() : rows;
  const cols = [];
  for (let i = 0; i < 8; i++) cols.push(i);
  const displayCols = isBoardFlipped ? [...cols].reverse() : cols;

  return (
    <div
      style={{
        padding: "20px",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
        minHeight: "100vh",
        color: "white",
        fontFamily: "Arial",
      }}
    >
      {/* POT SIZE BANNER */}
      <div
        style={{
          textAlign: "center",
          background: "rgba(0,0,0,0.5)",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "10px",
          border: "2px solid rgba(255,215,0,0.3)",
        }}
      >
        <div style={{ fontSize: "14px", color: "#aaa" }}>💰 POT SIZE</div>
        <div style={{ fontSize: "24px", color: "gold", fontWeight: "bold" }}>
          {(potSize / 10000000).toFixed(2)} CH3S
        </div>
      </div>

      <h1
        style={{
          textAlign: "center",
          textShadow: "0 0 20px rgba(0,255,255,0.5)",
        }}
      >
        ♟️ STELLAR ARENA
      </h1>

      {/* ÜST OYUNCU (RAKİP) */}
      <div
        style={{
          textAlign: "center",
          marginBottom: "10px",
          color: opponent.name === "RAKİP ARANIYOR" ? "#888" : "#fff",
        }}
      >
        {opponent.name} (ELO: {opponent.elo})
      </div>

      <div
        style={{
          textAlign: "center",
          margin: "10px auto",
          padding: "10px",
          background: currentTurn === "white" ? "#eee" : "#333",
          color: currentTurn === "white" ? "#000" : "#fff",
          width: "200px",
          borderRadius: "10px",
          fontWeight: "bold",
        }}
      >
        SIRA: {currentTurn === "white" ? "BEYAZ" : "SİYAH"}
      </div>

      <div style={{ display: "flex", gap: "30px", justifyContent: "center" }}>
        <div>
          <div
            style={{
              display: "inline-block",
              border: "5px solid #444",
              boxShadow: "0 0 40px rgba(0,255,255,0.3)",
              borderRadius: "10px",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {displayRows.map((rowIndex) => (
              <div key={rowIndex} style={{ display: "flex" }}>
                {displayCols.map((colIndex) => {
                  const piece = board[rowIndex][colIndex];
                  const isLight = (rowIndex + colIndex) % 2 === 0;
                  const isSelected =
                    selected &&
                    selected[0] === rowIndex &&
                    selected[1] === colIndex;
                  const isValid = isValidMove(rowIndex, colIndex);

                  const isWhitePiece = piece === piece.toUpperCase();
                  const pieceColorStyle =
                    piece === "."
                      ? "transparent"
                      : isWhitePiece
                        ? "#fff"
                        : "#000";

                  const textShadowStyle =
                    piece === "."
                      ? "none"
                      : isWhitePiece
                        ? "0 0 2px #000, 0 0 2px #000"
                        : "0 0 2px #fff, 0 0 2px #fff";

                  return (
                    <div
                      key={colIndex}
                      onClick={() => handleSquareClick(rowIndex, colIndex)}
                      style={{
                        width: "70px",
                        height: "70px",
                        background: isSelected
                          ? "#6a5acd"
                          : isLight
                            ? "#f0d9b5"
                            : "#b58863",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "50px",
                        cursor: "pointer",
                        color: pieceColorStyle,
                        textShadow: textShadowStyle,
                        position: "relative",
                        userSelect: "none",
                      }}
                    >
                      {PIECE_SYMBOLS[piece]}
                      {isValid && (
                        <div
                          style={{
                            position: "absolute",
                            width: "20px",
                            height: "20px",
                            background: "rgba(0,255,0,0.5)",
                            borderRadius: "50%",
                          }}
                        />
                      )}

                      {colIndex === (isBoardFlipped ? 7 : 0) && (
                        <span
                          style={{
                            position: "absolute",
                            top: 2,
                            left: 2,
                            fontSize: 10,
                            color: isLight ? "#b58863" : "#f0d9b5",
                            fontWeight: "bold",
                          }}
                        >
                          {8 - rowIndex}
                        </span>
                      )}
                      {rowIndex === (isBoardFlipped ? 0 : 7) && (
                        <span
                          style={{
                            position: "absolute",
                            bottom: 0,
                            right: 2,
                            fontSize: 10,
                            color: isLight ? "#b58863" : "#f0d9b5",
                            fontWeight: "bold",
                          }}
                        >
                          {["a", "b", "c", "d", "e", "f", "g", "h"][colIndex]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            width: "300px",
            background: "rgba(0,0,0,0.5)",
            padding: "10px",
            color: "white",
            borderRadius: "10px",
            maxHeight: "600px",
            overflowY: "auto",
          }}
        >
          <h4>📜 Hamleler</h4>
          {moveHistory.map(
            (m, i) =>
              m && (
                <div
                  key={i}
                  style={{
                    padding: "5px",
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {m.number}. {m.color === "white" ? "⚪" : "⚫"} {m.notation}
                </div>
              ),
          )}
        </div>
      </div>

      {/* ALT OYUNCU (SEN) */}
      <div
        style={{
          textAlign: "center",
          marginTop: "10px",
          color: myself.name === "RAKİP ARANIYOR" ? "#888" : "gold",
        }}
      >
        {myself.name} (ELO: {myself.elo}) | SENİN RENGİN:{" "}
        {myColor === "white" ? "⚪" : "⚫"}
      </div>
    </div>
  );
};

export default Game;
