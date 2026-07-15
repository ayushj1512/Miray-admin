import OrderSizeChange from "@/components/orders/OrderSizeChange";

export default function ShopifySizeChangePage() {
  return (
    <OrderSizeChange
      defaultSource="shopify"
      showSourceSelector={false}
      title="Shopify Order Size Change"
      description="Search a Shopify order and update the size of its order items."
    />
  );
}