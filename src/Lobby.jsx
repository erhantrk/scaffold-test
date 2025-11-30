import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "./services/apiService";
import { Ch3sSaleComponent } from "/Users/erhanturker/Stellar/scaffold-test/src/components/Ch3sSale.tsx";

const Lobby = () => {
  const navigate = useNavigate();
  const [statusText, setStatusText] = useState("");
  const [waitingGameId, setWaitingGameId] = useState(null);
  const [selectedBet, setSelectedBet] = useState(10000000); // 1 CH3S = 10^7 stroops
  const [userBalance, setUserBalance] = useState(0);
  const [username, setUsername] = useState("");

  // Kullanıcı bilgilerini al
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const user = await apiService.getCurrentUser();
        setUsername(user.username);

        // Token balance al (eğer backend'de endpoint varsa)
        try {
          const balanceData = await apiService.getTokenBalance();
          setUserBalance(balanceData.balance || 0);
        } catch (error) {
          console.warn("Balance alınamadı");
        }
      } catch (error) {
        console.error("Kullanıcı bilgisi alınamadı:", error);
        navigate("/");
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // BET OPTIONS (Stroops cinsinden)
  const betOptions = [
    { label: "1 CH3S", value: 10000000, color: "#3498db" },
    { label: "5 CH3S", value: 50000000, color: "#9b59b6" },
    { label: "10 CH3S", value: 100000000, color: "#e74c3c" },
    { label: "50 CH3S", value: 500000000, color: "#f39c12" },
  ];

  // MATCHMAKING
  const handleMatchmaking = async () => {
    setStatusText("SİSTEM KONTROL EDİLİYOR...");
    const token = localStorage.getItem("token");

    if (!token) {
      alert("Önce giriş yapmalısınız!");
      navigate("/");
      return;
    }

    try {
      // Backend'e bet miktarı ile maç bul
      const response = await apiService.matchmake(selectedBet);
      const game = response;

      if (game.status === "active") {
        // Maç bulundu, hemen başla
        navigate(`/game/${game.id}`);
      } else {
        // Yeni oyun oluşturuldu, bekle
        setWaitingGameId(game.id);
        setStatusText(
          `RAKİP ARANIYOR... (${betOptions.find((b) => b.value === selectedBet)?.label} BET)`,
        );
      }
    } catch (error) {
      console.error("Matchmaking hatası:", error);
      setStatusText("HATA: " + (error.message || "Bilinmeyen hata"));
      setWaitingGameId(null);

      // Yetersiz bakiye kontrolü
      if (error.message?.includes("Blockchain")) {
        alert("❌ İşlem başarısız! Yetersiz bakiye veya blockchain hatası.");
      }
    }
  };

  // POLLING - Rakip geldi mi kontrol
  useEffect(() => {
    if (!waitingGameId) return;

    const checkStatus = async () => {
      try {
        const game = await apiService.getGame(waitingGameId);

        if (game.status === "active") {
          navigate(`/game/${waitingGameId}`);
        }
      } catch (e) {
        console.error("Durum kontrol hatası:", e);
      }
    };

    const interval = setInterval(checkStatus, 2000);
    return () => clearInterval(interval);
  }, [waitingGameId, navigate]);

  // Beklemeyi iptal et
  const handleCancelWaiting = () => {
    setWaitingGameId(null);
    setStatusText("");
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        width: "100vw",
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
        color: "white",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      {/* ÜSTTE KULLANICI BİLGİSİ */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          right: "20px",
          background: "rgba(0,0,0,0.5)",
          padding: "15px 25px",
          borderRadius: "10px",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <div style={{ fontSize: "14px", color: "#aaa" }}>Oyuncu</div>
        <div style={{ fontSize: "18px", fontWeight: "bold", color: "#00d2ff" }}>
          {username || "Yükleniyor..."}
        </div>
        <div style={{ fontSize: "12px", color: "#888", marginTop: "5px" }}>
          Bakiye: {(userBalance / 10000000).toFixed(2)} CH3S
          <Ch3sSaleComponent />
        </div>
      </div>

      {/* LOGO */}
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <div
          style={{
            fontSize: "80px",
            marginBottom: "20px",
            filter: "drop-shadow(0 0 15px cyan)",
          }}
        >
          ♟️
        </div>
        <h1
          style={{
            fontSize: "4em",
            margin: 0,
            textShadow: "0 0 30px rgba(0, 255, 255, 0.6)",
            letterSpacing: "5px",
          }}
        >
          STELLAR
        </h1>
        <h2
          style={{
            fontSize: "1.5em",
            margin: 0,
            color: "#aaa",
            letterSpacing: "10px",
            fontWeight: "300",
          }}
        >
          ARENA
        </h2>
      </div>

      {waitingGameId ? (
        /* BEKLEME EKRANI */
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              width: "50px",
              height: "50px",
              border: "5px solid rgba(255,255,255,0.3)",
              borderTop: "5px solid cyan",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 20px auto",
            }}
          ></div>
          <h2 style={{ color: "cyan", letterSpacing: "2px" }}>{statusText}</h2>
          <p style={{ color: "#aaa" }}>Eşleşme bekleniyor...</p>

          <button
            onClick={handleCancelWaiting}
            style={{
              marginTop: "30px",
              padding: "12px 30px",
              background: "rgba(231, 76, 60, 0.8)",
              color: "white",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "14px",
            }}
          >
            İPTAL ET
          </button>
        </div>
      ) : (
        /* BET SEÇİMİ VE OYNA BUTONU */
        <div style={{ textAlign: "center" }}>
          {/* BET SEÇİMİ */}
          <div style={{ marginBottom: "40px" }}>
            <h3
              style={{
                color: "#aaa",
                marginBottom: "20px",
                letterSpacing: "2px",
              }}
            >
              BET MİKTARI SEÇ
            </h3>
            <div
              style={{ display: "flex", gap: "15px", justifyContent: "center" }}
            >
              {betOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedBet(option.value)}
                  style={{
                    padding: "20px 30px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    color: "white",
                    background:
                      selectedBet === option.value
                        ? `linear-gradient(135deg, ${option.color}, ${option.color}dd)`
                        : "rgba(255,255,255,0.1)",
                    border:
                      selectedBet === option.value
                        ? "3px solid white"
                        : "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "15px",
                    cursor: "pointer",
                    transition: "all 0.3s",
                    boxShadow:
                      selectedBet === option.value
                        ? `0 0 20px ${option.color}`
                        : "none",
                  }}
                  onMouseEnter={(e) => {
                    if (selectedBet !== option.value) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.15)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedBet !== option.value) {
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.1)";
                    }
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: "15px", fontSize: "14px", color: "#888" }}>
              Kazanan tüm potu alır:{" "}
              <span style={{ color: "#00d2ff", fontWeight: "bold" }}>
                {((selectedBet * 2) / 10000000).toFixed(2)} CH3S
              </span>
            </div>
          </div>

          {/* OYNA BUTONU */}
          <button
            onClick={handleMatchmaking}
            style={{
              padding: "25px 80px",
              fontSize: "28px",
              fontWeight: "900",
              color: "white",
              background: "linear-gradient(90deg, #FF512F 0%, #DD2476 100%)",
              border: "none",
              borderRadius: "50px",
              cursor: "pointer",
              boxShadow: "0 0 40px rgba(221, 36, 118, 0.6)",
              transition: "all 0.3s ease",
              letterSpacing: "2px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            🎮 OYNA
          </button>
        </div>
      )}

      {/* ÇIKIŞ BUTONU */}
      {!waitingGameId && (
        <button
          onClick={() => {
            apiService.clearToken();
            navigate("/");
          }}
          style={{
            position: "absolute",
            bottom: "30px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#aaa",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "#e74c3c";
            e.currentTarget.style.color = "#e74c3c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
            e.currentTarget.style.color = "#aaa";
          }}
        >
          ÇIKIŞ YAP
        </button>
      )}

      <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
    </div>
  );
};

export default Lobby;
