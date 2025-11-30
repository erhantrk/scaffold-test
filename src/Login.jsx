import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("secret");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const response = await axios.post(
        "http://localhost:8000/token",
        formData,
      );
      localStorage.setItem("token", response.data.access_token);

      navigate("/lobby");
    } catch (error) {
      alert(
        "Giriş başarısız! Kullanıcı adı veya şifre yanlış, ya da backend kapalı.",
      );
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
      {/* GİRİŞ KARTI */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(10px)",
          padding: "50px",
          borderRadius: "20px",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: "3em",
            marginBottom: "10px",
            marginTop: 0,
            textShadow: "0 0 20px cyan",
          }}
        >
          ♟️
        </h1>
        <h2
          style={{ marginBottom: "30px", color: "#fff", letterSpacing: "2px" }}
        >
          STELLAR GİRİŞ
        </h2>

        <form
          onSubmit={handleLogin}
          style={{ display: "flex", flexDirection: "column", gap: "20px" }}
        >
          <input
            type="text"
            placeholder="Kullanıcı Adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "16px",
              outline: "none",
              borderBottom: "2px solid transparent",
              transition: "all 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderBottom = "2px solid cyan")}
            onBlur={(e) =>
              (e.target.style.borderBottom = "2px solid transparent")
            }
          />

          <input
            type="password"
            placeholder="Şifre"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "15px",
              borderRadius: "10px",
              border: "none",
              background: "rgba(0,0,0,0.3)",
              color: "white",
              fontSize: "16px",
              outline: "none",
              borderBottom: "2px solid transparent",
              transition: "all 0.3s",
            }}
            onFocus={(e) => (e.target.style.borderBottom = "2px solid cyan")}
            onBlur={(e) =>
              (e.target.style.borderBottom = "2px solid transparent")
            }
          />

          <button
            type="submit"
            style={{
              marginTop: "20px",
              padding: "15px",
              background: "linear-gradient(90deg, #00d2ff 0%, #3a7bd5 100%)",
              color: "white",
              fontSize: "18px",
              fontWeight: "bold",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              transition: "transform 0.2s",
              boxShadow: "0 0 20px rgba(0, 210, 255, 0.5)",
            }}
            onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
          >
            SİSTEME GİRİŞ 🚀
          </button>
        </form>

        {/* YENİ KAYIT LINKİ BURADA */}
        <button
          onClick={() => navigate("/register")}
          style={{
            marginTop: "30px",
            background: "transparent",
            border: "none",
            color: "#aaa",
            cursor: "pointer",
            fontSize: "14px",
            textDecoration: "underline",
            transition: "color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.color = "cyan")}
          onMouseLeave={(e) => (e.target.style.color = "#aaa")}
        >
          Hesabın yok mu? Hemen Kayıt Ol!
        </button>
      </div>
    </div>
  );
};

export default Login;
