import { useState, useEffect } from "react";
import { User, LogOut, Info } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useBudgetStore } from "@/state/budget.store";
import BackupExportButton from "@/components/BackupExportButton";
import BackupImportButton from "@/components/BackupImportButton";

export default function SettingsPage() {
  const cloudMode = useBudgetStore((s) => s.cloudMode);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user?.email ?? null);
    }
    loadUser();
  }, []);

  async function handleLogout() {
    const confirmed = confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-28 space-y-6">
      {/* Account Section */}
      {cloudMode === "cloud" && (
        <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 mb-3">
            <User size={18} className="text-gray-600" />
            <h2 className="font-semibold text-gray-900">Account</h2>
          </div>
          <div className="space-y-3">
            {userEmail && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Email:</span> {userEmail}
              </div>
            )}
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 active:scale-95 transition-all w-full sm:w-auto"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </section>
      )}

      {/* Backup & Restore Section */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💾</span>
          <h2 className="font-semibold text-gray-900">Backup & Restore</h2>
        </div>

        <div className="space-y-4">
          {/* Manual Backup */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Manual Backup</h3>
            <p className="text-xs text-gray-500 mb-3">
              Export your data to a JSON file or import from a previous backup.
            </p>
            <div className="flex flex-wrap gap-2">
              <BackupExportButton />
              <BackupImportButton />
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <Info size={16} className="text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-blue-800">
                <p className="font-medium mb-1">Backup Tips:</p>
                <ul className="space-y-1">
                  <li>• Export creates a complete snapshot of all your data</li>
                  <li>• Keep backups in a safe place (cloud storage, USB, etc.)</li>
                  <li>• Restore will replace your current data (creates auto-backup first)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-2 mb-3">
          <Info size={18} className="text-gray-600" />
          <h2 className="font-semibold text-gray-900">About</h2>
        </div>
        <div className="space-y-2 text-sm text-gray-600">
          <div>
            <span className="font-medium">Version:</span> 0.6.2
          </div>
          <div>
            <span className="font-medium">Schema:</span> v4
          </div>
          <div>
            <span className="font-medium">Mode:</span>{" "}
            {cloudMode === "cloud" ? "Cloud Sync" : "Guest"}
          </div>
        </div>
      </section>
    </div>
  );
}
