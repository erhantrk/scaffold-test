import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "./services/apiService";
import { useWallet } from "./hooks/useWallet";
import { connectWallet } from "./util/wallet";

const Register = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  // Get wallet address and connection status from the hook
  const { address, isPending } = useWallet();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!address) {
      alert("❌ Önce Freighter Wallet bağlamalısınız!");
      return;
    }

    try {
      const response = await apiService.register(
        username,
        password,
        address, // Use the address from useWallet
      );

      console.log("Kayıt Başarılı:", response);
      alert(
        `✅ Kayıt Başarılı! Elo Puanınız: ${response.elo}\nŞimdi giriş yapabilirsiniz.`,
      );

      // Stellar key'i local storage'a kaydet (isteğe bağlı, wallet provider zaten yönetiyor ama backend login için gerekebilir)
      localStorage.setItem("stellar_public_key", address);

      navigate("/");
    } catch (error) {
      const errorMessage =
        error.message ||
        "Sunucuya ulaşılamadı veya kullanıcı adı zaten alınmış.";
      alert(`❌ Kayıt Başarısız: ${errorMessage}`);
      console.error(error);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        background:
          "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
      }}
    >
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          padding: "50px",
          borderRadius: "20px",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "3em",
            marginBottom: "10px",
            marginTop: 0,
            color: "#fff",
          }}
        >
          📝
        </h1>
        <h2
          style={{ marginBottom: "30px", color: "#fff", letterSpacing: "2px" }}
        >
          YENİ HESAP OLUŞTUR
        </h2>

        <form
          onSubmit={handleRegister}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: "15px",
              borderRadius: "10px",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "16px",
              border: "none",
              outline: "none",
              borderBottom: "2px solid transparent",
              transition: "all 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderBottom = "2px solid #2ecc71")}
            onBlur={(e) =>
              (e.target.style.borderBottom = "2px solid transparent")
            }
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: "15px",
              borderRadius: "10px",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "16px",
              border: "none",
              outline: "none",
              borderBottom: "2px solid transparent",
              transition: "all 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderBottom = "2px solid #2ecc71")}
            onBlur={(e) =>
              (e.target.style.borderBottom = "2px solid transparent")
            }
          />

          {/* FREIGHTER WALLET BAĞLANTISI */}
          <div
            style={{
              background: address
                ? "rgba(46, 204, 113, 0.2)"
                : "rgba(0,0,0,0.3)",
              padding: "15px",
              borderRadius: "10px",
              border: address ? "2px solid #2ecc71" : "2px solid transparent",
            }}
          >
            {address ? (
              <div>
                <div
                  style={{
                    color: "#2ecc71",
                    fontSize: "14px",
                    marginBottom: "5px",
                  }}
                >
                  ✅ Wallet Bağlandı
                </div>
                <div
                  style={{
                    color: "#aaa",
                    fontSize: "12px",
                    wordBreak: "break-all",
                  }}
                >
                  {address.slice(0, 10)}...{address.slice(-10)}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => connectWallet()}
                disabled={isPending}
                style={{
                  width: "100%",
                  padding: "10px",
                  background:
                    "linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)",
                  color: "white",
                  fontSize: "16px",
                  fontWeight: "bold",
                  border: "none",
                  borderRadius: "8px",
                  cursor: isPending ? "not-allowed" : "pointer",
                  opacity: isPending ? 0.6 : 1,
                }}
              >
                {isPending ? "🔄 Bağlanıyor..." : "🔗 Cüzdan Bağla"}
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!address}
            style={{
              marginTop: "20px",
              padding: "15px",
              background: address
                ? "linear-gradient(90deg, #2ecc71 0%, #27ae60 100%)"
                : "rgba(100, 100, 100, 0.5)",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "10px",
              cursor: address ? "pointer" : "not-allowed",
              transition: "transform 0.2s",
              opacity: address ? 1 : 0.5,
            }}
            onMouseEnter={(e) =>
              address && (e.target.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) =>
              address && (e.target.style.transform = "scale(1)")
            }
          >
            HESAP OLUŞTUR
          </button>
        </form>

        <button
          onClick={() => navigate("/")}
          style={{
            marginTop: "30px",
            background: "transparent",
            border: "1px solid #aaa",
            padding: "10px 20px",
            color: "#aaa",
            cursor: "pointer",
            fontSize: "14px",
            borderRadius: "5px",
            transition: "color 0.2s",
          }}
        >
          Giriş Ekranına Geri Dön
        </button>

        {/* FREIGHTER İNDİRME LİNKİ */}
        <div style={{ marginTop: "20px", fontSize: "12px", color: "#888" }}>
          Freighter yüklü değil mi?{" "}
          <a
            href="https://www.freighter.app/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#00d2ff", textDecoration: "underline" }}
          >
            Hemen İndir
          </a>
        </div>
      </div>
    </div>
  );
};

export default Register;
