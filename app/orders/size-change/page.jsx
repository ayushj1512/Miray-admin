import OrderSizeChange from "@/components/orders/OrderSizeChange";

export default function WebsiteOrderSizeChangePage() {
  return (
    <OrderSizeChange
      defaultSource="website"
      showSourceSelector={false}
      title="Website Order Size Change"
      description="Search a Miray website order and update the size of its order items."
    />
  );
}