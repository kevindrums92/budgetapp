import AuthBar from "@/components/AuthBar";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-28">
      <h2 className="text-base font-semibold">Settings</h2>
      <p className="mt-2 text-sm text-gray-600">
        Cuenta, sincronización, y opciones de la app.
      </p>

      <div className="mt-4 space-y-3">
        <AuthBar />
       
      </div>
    </div>
  );
}
