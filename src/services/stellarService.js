import freighter from "@stellar/freighter-api";

class StellarService {
  constructor() {
    this.network = "TESTNET";
    this.isFreighterInstalled = false;
  }

  async checkFreighter() {
    try {
      this.isFreighterInstalled = await freighter.isConnected();
      return this.isFreighterInstalled;
    } catch (error) {
      console.error("Freighter kontrol hatası:", error);
      return false;
    }
  }

  async connectWallet() {
    try {
      const isConnected = await freighter.isConnected();
      if (!isConnected) {
        alert(
          "Freighter Wallet yüklü değil! Lütfen tarayıcınıza Freighter extension'ını yükleyin.",
        );
        window.open("https://www.freighter.app/", "_blank");
        return { success: false, error: "Freighter not installed" };
      }

      const isAllowed = await freighter.isAllowed();
      if (!isAllowed) {
        await freighter.setAllowed();
      }

      const publicKey = await freighter.getPublicKey();

      console.log("✅ Wallet bağlandı:", publicKey);

      return {
        success: true,
        publicKey: publicKey,
      };
    } catch (error) {
      console.error("❌ Wallet bağlantı hatası:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getPublicKey() {
    try {
      return await freighter.getPublicKey();
    } catch (error) {
      console.error("Public key alınamadı:", error);
      return null;
    }
  }

  async disconnectWallet() {
    localStorage.removeItem("stellar_public_key");
    return { success: true };
  }

  async signTransaction(xdr) {
    try {
      const signedXDR = await freighter.signTransaction(xdr, {
        network: this.network,
        networkPassphrase:
          this.network === "TESTNET"
            ? "Test SDF Network ; September 2015"
            : "Public Global Stellar Network ; September 2015",
      });

      return {
        success: true,
        signedXDR: signedXDR,
      };
    } catch (error) {
      console.error("Transaction imzalama hatası:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ⚠️ ÖNEMLİ: Bu satır EN SONDA olmalı!
export const stellarService = new StellarService();
