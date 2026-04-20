import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const RootPage = async () => {
  return redirect("/home");
};

export default RootPage;
