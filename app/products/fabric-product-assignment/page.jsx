import FabricProductAssignment from "@/components/fabric/FabricProductAssignment";
export const metadata = {
  title: "Fabric Product Assignment",
};

export default function ProductFabricAssignmentPage() {
  return (
    <FabricProductAssignment source="products" />
  );
}