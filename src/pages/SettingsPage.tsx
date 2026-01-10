export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-6 pb-28">
      <h2 className="text-base font-semibold">Settings</h2>
      <p className="mt-2 text-sm text-gray-600">
        Configuraciones de la app.
      </p>

      <div className="mt-4 space-y-3">
        {/* Futuras configuraciones irán aquí */}
        <p className="text-sm text-gray-400">
          Próximamente: tema, notificaciones, exportar datos...
        </p>
      </div>
    </div>
  );
}
