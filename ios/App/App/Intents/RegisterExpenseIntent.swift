import AppIntents
import Foundation

// MARK: - Register Expense Intent (Apple Pay / Wallet Automation)

/// This intent receives structured Amount and Merchant parameters from
/// iOS Wallet automations (Apple Pay). When the user taps a card,
/// iOS provides the transaction details which get passed as parameters.
@available(iOS 16, *)
struct RegisterExpenseIntent: AppIntent {
    static var title: LocalizedStringResource = "Registrar gasto"
    static var description = IntentDescription("Registra un gasto con monto y comercio. Ideal para automatizaciones de Apple Pay.")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Cantidad", description: "El monto de la transacción")
    var amount: String

    @Parameter(title: "Comercio", description: "El nombre del comercio o tienda")
    var merchant: String

    func perform() async throws -> some IntentResult {
        let scheme = Self.getURLScheme()

        // Parse the amount string (may come as "1,234.56", "$1234", etc.)
        let cleaned = amount
            .replacingOccurrences(of: "[^0-9.,]", with: "", options: .regularExpression)
            .replacingOccurrences(of: ",", with: ".")
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
