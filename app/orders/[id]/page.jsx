import OrderDetailsClient from "./OrderDetailsClient";

export default async function OrderDetailsPage({ params }) {
  const resolved = await params; // 🔥 FIX: unwrap promise

  return <OrderDetailsClient id={resolved.id} />;
}
