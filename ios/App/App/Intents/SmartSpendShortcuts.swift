import AppIntents

/// Provides pre-built shortcuts that appear in the Shortcuts app under Lukas's section.
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

        AppShortcut(
            intent: RegisterExpenseIntent(),
            phrases: [
                "Registrar gasto de tarjeta en \(.applicationName)",
                "Automatización de pago en \(.applicationName)",
                "Log card expense in \(.applicationName)",
            ],
            shortTitle: "Automatización de pago",
            systemImageName: "creditcard"
        )
    }
}
