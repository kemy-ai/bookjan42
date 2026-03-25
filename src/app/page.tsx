import { createClient } from "@/lib/supabase/server";
import type { Place } from "@/types";
import HomeClient from "@/components/home-client";

export default async function Home() {
  const supabase = await createClient();
  const { data: places, error } = await supabase
    .from("places")
    .select("*")
    .order("name");

  if (error) {
    console.error("장소 데이터 로드 실패:", error);
  }

  return <HomeClient places={(places as Place[]) ?? []} />;
}
