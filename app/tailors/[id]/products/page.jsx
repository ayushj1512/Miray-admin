import { redirect } from "next/navigation";

/*
 * Product allocation is handled through Production Jobs.
 * Keep this route for backward-compatible links.
 */
export default async function TailorProductsPage({
  params,
}) {
  const { id } = await params;

  redirect(
    `/production-jobs/create?tailorId=${encodeURIComponent(id)}`,
  );
}