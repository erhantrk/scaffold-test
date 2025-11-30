import { useState } from "react";
import { Button, Card, Input, Text, Alert } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { Box } from "./layout/Box";
import { Client as CH3SClient } from "ch3s_sale";

const CONTRACT_ID = "CDUA7SHTUBYEPYAAYDSAVFVKIUKGX5W475YQFHCNXOXJS7TDM4EJEPTN"; // Adım 2.2-b'den gelen ID
const CH3S_ISSUER = "GB756P3BHL22Y52PDRCMHJQVJPPKC5US3EHGLVTWM74DHG2ND33XOXHM"; // Adım 2.1-c'den gelen ISSUER_ADDRESS

export const Ch3sSaleComponent = () => {
  const { address, signTransaction, updateBalances, balances } = useWallet();
  const [amount, setAmount] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txResult, setTxResult] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const ch3sBalance = balances?.[`CH3S:${CH3S_ISSUER}`]?.balance || "0";
  const xlmBalance = balances?.["xlm"]?.balance || "0";

  const handleBuy = async () => {
    if (!address || !amount) return;
    setIsSubmitting(true);
    setTxResult(null);

    try {
      // 1. Miktarı Stroop formatına çevir (10.000.000 ile çarp)
      const amountInStroops = BigInt(
        Math.floor(parseFloat(amount) * 10_000_000),
      );

      // 2. Kontrat Client'ını oluştur
      const client = new CH3SClient({
        networkPassphrase: "Standalone Network ; February 2017",
        contractId: CONTRACT_ID,
        rpcUrl: "http://localhost:8000/rpc",
        allowHttp: true,
        publicKey: address,
      });

      // 3. İşlemi oluştur
      const tx = await client.buy({
        buyer: address,
        amount_ch3s: amountInStroops,
      });

      // 4. İmzala ve Gönder
      // signAndSend hata fırlatmazsa işlem başarılıdır.
      const submissionResult = await tx.signAndSend({ signTransaction });

      // Konsola yazdırıp sonucun ne olduğuna bakabilirsiniz (opsiyonel)
      console.log("İşlem Sonucu:", submissionResult);

      // Buraya kadar hata almadan geldiyse işlem başarılıdır
      setTxResult({
        type: "success",
        message: `Başarılı! ${amount} CH3S satın aldınız.`,
      });
      setAmount("");

      // 5. Bakiyeleri güncelle
      await updateBalances();
    } catch (error) {
      console.error(error); // Hatayı konsola yazdır
      setTxResult({
        type: "error",
        message: `Hata oluştu: ${(error as Error).message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!address) {
    // Düzeltme: placement="inline" eklendi
    return (
      <Alert variant="warning" title="Cüzdan Bağlı Değil" placement="inline">
        Lütfen sağ üstten cüzdanınızı bağlayın.
      </Alert>
    );
  }

  return (
    <Card>
      {/* Düzeltme: as="h2" ve as="p" eklendi */}
      <Text as="h2" size="lg" weight="bold">
        CH3S Token Satışı
      </Text>
      <Text as="p" size="sm">
        1 XLM karşılığında 100 CH3S alabilirsiniz.
      </Text>

      <Box gap="md" addlClassName="mt-4">
        <div
          style={{
            display: "flex",
            gap: "20px",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              backgroundColor: "#f4f4f4",
              padding: "10px",
              borderRadius: "8px",
              flex: 1,
            }}
          >
            {/* Düzeltme: as="div" eklendi */}
            <Text as="div" size="xs">
              XLM Bakiyeniz
            </Text>
            <Text as="div" size="lg" weight="bold">
              {xlmBalance}
            </Text>
          </div>
          <div
            style={{
              backgroundColor: "#e3f2fd",
              padding: "10px",
              borderRadius: "8px",
              flex: 1,
            }}
          >
            <Text as="div" size="xs">
              CH3S Bakiyeniz
            </Text>
            <Text as="div" size="lg" weight="bold">
              {ch3sBalance}
            </Text>
          </div>
        </div>

        <Input
          id="buy-amount"
          // Düzeltme: fieldSize="lg" eklendi
          fieldSize="lg"
          label="Almak istediğiniz CH3S miktarı"
          placeholder="Örn: 10"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          type="number"
          // Düzeltme: İçerideki Text için as="span" eklendi
          rightElement={
            <Text as="span" size="sm">
              CH3S
            </Text>
          }
        />

        {amount &&
          parseFloat(amount) > 0 && ( // amount var VE pozitif bir sayıysa göster
            <Text as="div" size="sm" style={{ color: "gray" }}>
              Tahmini Maliyet:
              <strong>
                {(parseFloat(amount) / 100 + 0.0125729).toFixed(7)} XLM
              </strong>
            </Text>
          )}

        <Button
          variant="primary"
          size="lg"
          onClick={() => void handleBuy()}
          disabled={isSubmitting || !amount || parseFloat(amount) <= 0}
          isLoading={isSubmitting}
        >
          {isSubmitting ? "İşleniyor..." : "Satın Al"}
        </Button>

        {txResult && (
          <Alert
            variant={txResult.type === "success" ? "success" : "error"}
            title={txResult.type === "success" ? "İşlem Başarılı" : "Hata"}
            // Düzeltme: placement="inline" eklendi
            placement="inline"
          >
            {txResult.message}
          </Alert>
        )}
      </Box>
    </Card>
  );
};
