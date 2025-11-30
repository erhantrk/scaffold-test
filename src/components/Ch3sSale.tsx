import { useState } from "react";
import { Alert } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { Client as CH3SClient } from "ch3s_sale";
import { network } from "../contracts/util";

// ⚠️ DİKKAT: Terminali yeniden başlattıysanız bu ID'ler değişmiştir!
// Yeni ID'leri almak için terminalde `stellar contract ids` çalıştırın.
const CONTRACT_ID = "CDUA7SHTUBYEPYAAYDSAVFVKIUKGX5W475YQFHCNXOXJS7TDM4EJEPTN"; //"CDUA7SHTUBYEPYAAYDSAVFVKIUKGX5W475YQFHCNXOXJS7TDM4EJEPTN";
const CH3S_ISSUER = "GB756P3BHL22Y52PDRCMHJQVJPPKC5US3EHGLVTWM74DHG2ND33XOXHM";

export const Ch3sSaleComponent = () => {
  const { address, signTransaction, updateBalances, balances } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const assetKey = `CH3S:${CH3S_ISSUER}`;
  const ch3sBalance = balances?.[assetKey]?.balance || "0";
  const xlmBalance = balances?.["xlm"]?.balance || "0";

  const handleBuy = async () => {
    if (!address || !amount) return;
    setIsSubmitting(true);
    setTxResult(null);

    try {
      const amountInStroops = BigInt(
        Math.floor(parseFloat(amount) * 10_000_000),
      );

      const client = new CH3SClient({
        networkPassphrase: network.passphrase,
        contractId: CONTRACT_ID,
        rpcUrl: network.rpcUrl,
        // DÜZELTME: Kesin çözüm için doğrudan true yapıyoruz
        allowHttp: true,
        publicKey: address,
      });

      const tx = await client.buy({
        buyer: address,
        amount_ch3s: amountInStroops,
      });

      const submissionResult = await tx.signAndSend({ signTransaction });

      console.log("Tx Result:", submissionResult);

      setTxResult({
        type: "success",
        message: `Başarılı! ${amount} CH3S satın aldınız.`,
      });
      setAmount("");
      await updateBalances();
    } catch (error) {
      console.error(error);
      setTxResult({
        type: "error",
        message: `Hata: ${(error as Error).message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!address) {
    return (
      <Alert variant="warning" title="Cüzdan Bağlı Değil" placement="inline">
        Lütfen sağ üstten cüzdanınızı bağlayın.
      </Alert>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #e0e0e0",
        borderRadius: "16px", // Daha modern, yuvarlak hatlar
        padding: "24px",
        maxWidth: "480px",
        backgroundColor: "#fff",
        boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        fontFamily: "system-ui, -apple-system, sans-serif", // Sistem fontu
      }}
    >
      {/* --- Header Kısmı --- */}
      <div style={{ marginBottom: "24px", textAlign: "center" }}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            fontWeight: "700",
            color: "#1a1a1a",
          }}
        >
          CH3S Token Satışı
        </h2>
        <p style={{ margin: 0, fontSize: "14px", color: "#666" }}>
          Kur:{" "}
          <span style={{ color: "#007bff", fontWeight: "600" }}>
            1 XLM = 100 CH3S
          </span>
        </p>
      </div>

      {/* --- Bakiyeler (Grid Yapısı) --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "12px",
          marginBottom: "24px",
        }}
      >
        {/* XLM Kutu */}
        <div
          style={{
            border: "1px solid #eee",
            borderRadius: "12px",
            padding: "12px",
            textAlign: "center",
            backgroundColor: "#fafafa",
          }}
        >
          <div style={{ fontSize: "12px", color: "#888", marginBottom: "4px" }}>
            XLM Bakiyeniz
          </div>
          <div style={{ fontSize: "18px", fontWeight: "bold", color: "#333" }}>
            {xlmBalance}
          </div>
        </div>

        {/* CH3S Kutu */}
        <div
          style={{
            border: "1px solid #e3f2fd",
            borderRadius: "12px",
            padding: "12px",
            textAlign: "center",
            backgroundColor: "#f0f9ff",
          }}
        >
          <div
            style={{ fontSize: "12px", color: "#558bbf", marginBottom: "4px" }}
          >
            CH3S Bakiyeniz
          </div>
          <div
            style={{ fontSize: "18px", fontWeight: "bold", color: "#007bff" }}
          >
            {ch3sBalance}
          </div>
        </div>
      </div>

      {/* --- Input Alanı --- */}
      <div style={{ marginBottom: "20px" }}>
        <label
          htmlFor="buy-amount"
          style={{
            display: "block",
            fontSize: "14px",
            fontWeight: "600",
            marginBottom: "8px",
            color: "#333",
          }}
        >
          Miktar
        </label>

        <div
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
          }}
        >
          <input
            id="buy-amount"
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 60px 12px 12px", // Sağ taraftaki yazı için boşluk
              fontSize: "16px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              outline: "none",
              transition: "border-color 0.2s",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#007bff")}
            onBlur={(e) => (e.target.style.borderColor = "#ccc")}
          />
          {/* Input içi sağ yazı (Suffix) */}
          <span
            style={{
              position: "absolute",
              right: "12px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#888",
              pointerEvents: "none", // Tıklamayı engelle
            }}
          >
            CH3S
          </span>
        </div>

        {/* Tahmini maliyet notu */}
        <div
          style={{
            fontSize: "12px",
            color: "#888",
            marginTop: "6px",
            textAlign: "right",
          }}
        >
          Tahmini Maliyet:{" "}
          {amount ? (parseFloat(amount) / 100).toFixed(2) : "0"} XLM
        </div>
      </div>

      {/* --- Buton --- */}
      <button
        onClick={() => void handleBuy()}
        disabled={isSubmitting || !amount}
        style={{
          width: "100%",
          padding: "14px",
          backgroundColor: isSubmitting || !amount ? "#ccc" : "#007bff",
          color: "white",
          border: "none",
          borderRadius: "8px",
          fontSize: "16px",
          fontWeight: "600",
          cursor: isSubmitting || !amount ? "not-allowed" : "pointer",
          transition: "background-color 0.2s",
        }}
      >
        {isSubmitting ? "İşleniyor..." : "Satın Al"}
      </button>

      {/* --- Alert Mesajı --- */}
      {txResult && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "8px",
            fontSize: "14px",
            backgroundColor:
              txResult.type === "success" ? "#d4edda" : "#f8d7da",
            color: txResult.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${txResult.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          <strong>
            {txResult.type === "success" ? "Başarılı: " : "Hata: "}
          </strong>
          {txResult.message}
        </div>
      )}
    </div>
  );
};
