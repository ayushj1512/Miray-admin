import WooCommerceRestApi from "@woocommerce/woocommerce-rest-api";

console.log("🔧 Initializing WooCommerce API with env values:");
console.log("Store URL:", process.env.NEXT_PUBLIC_WC_STORE_URL);
console.log("Consumer Key present:", !!process.env.NEXT_PUBLIC_WC_CONSUMER_KEY);
console.log("Consumer Secret present:", !!process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET);

const api = new WooCommerceRestApi({
  url: process.env.NEXT_PUBLIC_WC_STORE_URL,
  consumerKey: process.env.NEXT_PUBLIC_WC_CONSUMER_KEY,
  consumerSecret: process.env.NEXT_PUBLIC_WC_CONSUMER_SECRET,
  version: "wc/v3",
});

export default api;
