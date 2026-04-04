import { getOrdersByUserId } from "@/domain/order/operations/getOrdersByUserId";
import ProfileOrdersPreview from "@/app/_components/profile/ProfileOrdersPreview";

interface ProfileOrdersAsyncProps {
  userId: string;
}

export default async function ProfileOrdersAsync({
  userId,
}: ProfileOrdersAsyncProps) {
  const orders = await getOrdersByUserId(userId);
  const recentOrders = orders.slice(0, 5);

  return (
    <ProfileOrdersPreview
      orders={recentOrders}
      totalCount={orders.length}
    />
  );
}
