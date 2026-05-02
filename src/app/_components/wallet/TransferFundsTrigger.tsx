"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import { useRealtimeChannel } from "@/app/_hooks/useRealtimeChannel";

const SendFundsModal = dynamic(
  () => import("@/app/_components/wallet/SendFundsModal"),
  { ssr: false }
);

interface Props {
  userId: string;
  initialBalance: number;
}

export default function TransferFundsTrigger({
  userId,
  initialBalance,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [balance, setBalance] = useState(initialBalance);

  const handleWalletUpdate = useCallback(
    (payload: { balanceAfter: number }) => {
      setBalance(payload.balanceAfter);
    },
    []
  );

  useRealtimeChannel({
    channelName: `user:${userId}`,
    event: "wallet_transaction_created",
    onMessage: handleWalletUpdate,
  });

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        Transfer funds
      </button>
      <SendFundsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        senderBalance={balance}
      />
    </>
  );
}
