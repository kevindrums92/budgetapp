import AppIntents

/// Provides pre-built shortcuts that appear in the Shortcuts app under SmartSpend's section.
/// This is what makes the app show up like "MonAi > New transaction in MonAi".
@available(iOS 16, *)
struct SmartSpendShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: AddTransactionIntent(),
            phrases: [
                "Registrar gasto en \(.applicationName)",
                "Nuevo gasto en \(.applicationName)",
                "Agregar transacción en \(.applicationName)",
                "Ingreso inteligente en \(.applicationName)",
                "Log expense in \(.applicationName)",
                "Add transaction in \(.applicationName)",
                "Smart entry in \(.applicationName)",
            ],
            shortTitle: "Ingreso inteligente",
            systemImageName: "sparkles"
        )
    }
}
