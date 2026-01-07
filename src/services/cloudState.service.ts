import { supabase } from "@/lib/supabaseClient";
import type { BudgetState } from "@/types/budget.types";

export async function getCloudState(): Promise<BudgetState | null> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_state")
    .select("state")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data?.state) return null;

  return data.state as BudgetState;
}

export async function upsertCloudState(state: BudgetState): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const { error } = await supabase.from("user_state").upsert(
    {
      user_id: user.id,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
