import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import ProfileTransactionsPreview from "@/app/_components/profile/ProfileTransactionsPreview";

interface ProfileTransactionsAsyncProps {
  userId: string;
}

export default async function ProfileTransactionsAsync({
  userId,
}: ProfileTransactionsAsyncProps) {
  const wallet = await getWalletByUserId(userId);

  if (!wallet || wallet.transactions.length === 0) {
    return null;
  }

  const recentTransactions = wallet.transactions.slice(0, 5);

  return (
    <ProfileTransactionsPreview
      userId={userId}
      initialTransactions={recentTransactions}
      totalCount={wallet.transactions.length}
    />
  );
}
