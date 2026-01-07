import { supabase } from "@/lib/supabaseClient";
import type { BudgetState } from "@/types/budget.types";

async function getUserId(): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user?.id ?? null;
}

export async function getCloudState(): Promise<BudgetState | null> {
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from("user_state")
    .select("state")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  if (!data?.state) return null;

  return data.state as BudgetState;
}

export async function upsertCloudState(state: BudgetState): Promise<void> {
  const userId = await getUserId();
  if (!userId) return;

  const { error } = await supabase.from("user_state").upsert(
    {
      user_id: userId,
      state,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" }
  );

  if (error) throw error;
}
