import { useState } from "react";
import { Button, Text, Modal, Profile } from "@stellar/design-system";
import { useWallet } from "../hooks/useWallet";
import { connectWallet, disconnectWallet } from "../util/wallet";

export const WalletButton = () => {
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const { address, isPending, balances } = useWallet();
  const buttonLabel = isPending ? "Loading..." : "Connect";

  if (!address) {
    return (
      <Button variant="primary" size="md" onClick={() => void connectWallet()}>
        {buttonLabel}
      </Button>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: "5px",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <Text as="div" size="sm">
        Wallet Balance: {balances?.xlm?.balance ?? "-"} XLM
      </Text>

      <div id="modalContainer">
        <Modal
          visible={showDisconnectModal}
          onClose={() => setShowDisconnectModal(false)}
          parentId="modalContainer"
        >
          <Modal.Heading>
            Connected as{" "}
            <code style={{ lineBreak: "anywhere" }}>{address}</code>. Do you
            want to disconnect?
          </Modal.Heading>
          <Modal.Footer itemAlignment="stack">
            <Button
              size="md"
              variant="primary"
              onClick={() => {
                void disconnectWallet().then(() =>
                  setShowDisconnectModal(false),
                );
              }}
            >
              Disconnect
            </Button>
            <Button
              size="md"
              variant="tertiary"
              onClick={() => {
                setShowDisconnectModal(false);
              }}
            >
              Cancel
            </Button>
          </Modal.Footer>
        </Modal>
      </div>

      <Profile
        publicAddress={address}
        size="md"
        isShort
        onClick={() => setShowDisconnectModal(true)}
      />
    </div>
  );
};

export const ShowBalance = () => {
  const { balances } = useWallet();

  // CH3S'nin Issuer adresi (Terminalden aldığın GB3MD... ile başlayan adres)
  const ISSUER_ADDRESS =
    "GB756P3BHL22Y52PDRCMHJQVJPPKC5US3EHGLVTWM74DHG2ND33XOXHM";
  const assetKey = `CH3S:${ISSUER_ADDRESS}`;

  const ch3sBalance = balances?.[assetKey]?.balance || "0";

  return (
    <div style={{ marginRight: "10px", textAlign: "right" }}>
      <Text as="div" size="sm">
        CH3S Bakiye: {ch3sBalance} CH3S
      </Text>
    </div>
  );
};
