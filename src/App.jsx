import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Lobby from "./Lobby";
import Game from "./Game";
import Register from "./Register"; // <-- YENİ

function App() {
  return (
    <Router>
      <style>{`
        body, html { margin: 0; padding: 0; height: 100%; background: #1a1a2e; }
        * { box-sizing: border-box; }
      `}</style>

      <div
        style={{
          minHeight: "100vh",
          color: "white",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
        }}
      >
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />{" "}
          {/* <-- YENİ ROTA */}
          <Route path="/lobby" element={<Lobby />} />
          <Route path="/game/:id" element={<Game />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
