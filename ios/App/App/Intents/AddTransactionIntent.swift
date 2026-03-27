import AppIntents
import Foundation

// MARK: - Add Transaction Intent (Batch Entry via AI)

@available(iOS 16, *)
struct AddTransactionIntent: AppIntent {
    static var title: LocalizedStringResource = "Registrar transacción"
    static var description = IntentDescription("Registra gastos o ingresos en Lukas usando texto natural con IA")
    static var openAppWhenRun: Bool = true

    @Parameter(title: "Texto", description: "Describe tus gastos en lenguaje natural. Ej: 25k de mercado, 12 mil en taxi")
    var text: String

    func perform() async throws -> some IntentResult {
        // Read URL scheme from Info.plist (smartspend or smartspend-dev)
        let scheme = Self.getURLScheme()

        // Build deep link URL for batch entry
        var components = URLComponents()
        components.scheme = scheme
        components.host = "batch"
        components.queryItems = [
            URLQueryItem(name: "text", value: text)
        ]

        if let url = components.url {
            // Store the deep link URL for the app to pick up when it becomes active
            UserDefaults.standard.set(url.absoluteString, forKey: "pendingShortcutDeepLink")
        }

        return .result()
    }

    /// Reads the app's URL scheme from Info.plist (supports both prod and dev builds)
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
