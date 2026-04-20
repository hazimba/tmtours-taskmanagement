import { createClient } from "@/lib/supabase/server";

const HomePage = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*");
  console.log("data", data);
  console.log("error", error);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen !scrollbar-hide">
      <h1 className="text-4xl font-bold mb-4 text-center scrollbar-hide">
        Welcome to Task Management App
      </h1>
    </div>
  );
};
export default HomePage;
