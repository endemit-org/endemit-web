import { getWalletByUserId } from "@/domain/wallet/operations/getWalletByUserId";
import { getTicketsByUserId } from "@/domain/ticket/operations/getTicketsByUserId";
import { getVisibleProducts } from "@/domain/product/actions/getProducts";
import { ProductCategory } from "@/domain/product/types/product";
import ProfileSidebar from "@/app/_components/profile/ProfileSidebar";

interface ProfileSidebarAsyncProps {
  userId: string;
  name: string | null;
  email: string;
  image: string | null;
}

export default async function ProfileSidebarAsync({
  userId,
  name,
  email,
  image,
}: ProfileSidebarAsyncProps) {
  const [wallet, upcomingTickets, allProducts] = await Promise.all([
    getWalletByUserId(userId),
    getTicketsByUserId(userId, { upcomingOnly: true }),
    getVisibleProducts(),
  ]);

  const currencyProducts = allProducts.filter(
    p => p.category === ProductCategory.CURRENCIES
  );

  return (
    <ProfileSidebar
      userId={userId}
      name={name}
      email={email}
      image={image}
      walletBalance={wallet?.balance ?? null}
      currencyProducts={currencyProducts}
      upcomingTickets={upcomingTickets.length}
    />
  );
}
