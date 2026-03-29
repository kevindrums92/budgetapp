import AppIntents
import Foundation

// MARK: - Register Expense Intent (Apple Pay / Wallet Automation)

/// This intent receives structured Amount and Merchant parameters from
/// iOS Wallet automations (Apple Pay). When the user taps a card,
/// iOS provides the transaction details which get passed as parameters.
@available(iOS 16, *)
struct RegisterExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Registrar gasto"
    static var description = IntentDescription("Registra un gasto con monto y comercio. Ideal para automatizaciones de pagos con tarjeta.")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Cantidad", description: "El monto de la transacción")
    var amount: String

    @Parameter(title: "Comercio", description: "El nombre del comercio o tienda")
    var merchant: String

    func perform() async throws -> some IntentResult {
        let scheme = Self.getURLScheme()

        // Parse the amount string handling locale formats:
        // COP: "7.000" or "1.234.567" (dot = thousands separator)
        // USD: "1,234.56" (comma = thousands, dot = decimal)
        var cleaned = amount
            .replacingOccurrences(of: "[^0-9.,]", with: "", options: .regularExpression)

        // Detect dot as thousands separator: dot followed by exactly 3 digits
        // e.g. "7.000" → "7000", "1.234.567" → "1234567"
        // But "7.50" stays as "7.50" (decimal)
        if cleaned.range(of: #"\.\d{3}(?:\.\d{3})*$"#, options: .regularExpression) != nil {
            cleaned = cleaned.replacingOccurrences(of: ".", with: "")
        }

        // Treat remaining commas as decimal separator (e.g. "7,50" → "7.50")
        cleaned = cleaned.replacingOccurrences(of: ",", with: ".")
        let parsedAmount = Double(cleaned) ?? 0

        var components = URLComponents()
        components.scheme = scheme
        components.host = "add"
        components.queryItems = [
            URLQueryItem(name: "amount", value: String(format: "%.0f", parsedAmount)),
            URLQueryItem(name: "name", value: merchant),
            URLQueryItem(name: "type", value: "expense"),
        ]

        if let url = components.url {
            UserDefaults.standard.set(url.absoluteString, forKey: "pendingShortcutDeepLink")
            // Signal the app process via Darwin notification (cross-process).
            // NotificationCenter is local to each process and won't reach AppDelegate
            // when the intent runs in the Shortcuts process.
            let center = CFNotificationCenterGetDarwinNotifyCenter()
            CFNotificationCenterPostNotification(center, CFNotificationName("com.jhotech.smartspend.shortcutDeepLink" as CFString), nil, nil, true)
        }

        return .result()
    }

    private static func getURLScheme() -> String {
        if let urlTypes = Bundle.main.object(forInfoDictionaryKey: "CFBundleURLTypes") as? [[String: Any]],
           let first = urlTypes.first,
           let schemes = first["CFBundleURLSchemes"] as? [String],
           let scheme = schemes.first
        {
            return scheme
        }
        return "smartspend"
    }
}
