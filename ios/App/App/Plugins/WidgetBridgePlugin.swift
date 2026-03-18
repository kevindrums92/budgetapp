import Capacitor
import WidgetKit

@objc(WidgetBridgePlugin)
public class WidgetBridgePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "WidgetBridgePlugin"
    public let jsName = "WidgetBridge"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "updateWidgetData", returnType: CAPPluginReturnPromise)
    ]

    private static let appGroupID = "group.com.jhotech.smartspend"
    private static let storageKey = "widgetData"

    @objc func updateWidgetData(_ call: CAPPluginCall) {
        guard let defaults = UserDefaults(suiteName: Self.appGroupID) else {
            call.reject("Cannot access App Group UserDefaults")
            return
        }

        // Build JSON dictionary matching WidgetData Codable struct
        var payload: [String: Any] = [
            "todayExpenses": call.getDouble("todayExpenses") ?? 0,
            "todayIncome": call.getDouble("todayIncome") ?? 0,
            "monthExpenses": call.getDouble("monthExpenses") ?? 0,
            "monthIncome": call.getDouble("monthIncome") ?? 0,
            "currencySymbol": call.getString("currencySymbol") ?? "$",
            "currencyCode": call.getString("currencyCode") ?? "COP",
            "currencyDecimals": call.getInt("currencyDecimals") ?? 0,
            "transactionCount": call.getInt("transactionCount") ?? 0,
            "lastUpdated": call.getString("lastUpdated") ?? ""
        ]

        // Handle optionals — only include if present
        if let budgetRemaining = call.getDouble("budgetRemaining") {
            payload["budgetRemaining"] = budgetRemaining
        }
        if let budgetTotal = call.getDouble("budgetTotal") {
            payload["budgetTotal"] = budgetTotal
        }

        // Recent transactions array
        if let recentTxns = call.getArray("recentTransactions") as? [[String: Any]] {
            var txArray: [[String: Any]] = []
            for tx in recentTxns {
                let txDict: [String: Any] = [
                    "name": tx["name"] as? String ?? "",
                    "amount": tx["amount"] as? Double ?? (tx["amount"] as? Int).map(Double.init) ?? 0,
                    "type": tx["type"] as? String ?? "expense",
                    "categoryName": tx["categoryName"] as? String ?? "",
                    "categoryColor": tx["categoryColor"] as? String ?? "#888888",
                    "categoryIcon": tx["categoryIcon"] as? String ?? "circle",
                    "date": tx["date"] as? String ?? ""
                ]
                txArray.append(txDict)
            }
            payload["recentTransactions"] = txArray
        }

        // Localized labels
        if let labels = call.getObject("labels") {
            let labelsDict: [String: Any] = [
                "today": labels["today"] as? String ?? "Hoy",
                "month": labels["month"] as? String ?? "Mes",
                "remaining": labels["remaining"] as? String ?? "Restante",
                "balance": labels["balance"] as? String ?? "Balance",
                "recent": labels["recent"] as? String ?? "Recientes",
                "noRecent": labels["noRecent"] as? String ?? "Sin movimientos recientes",
                "transactionsSuffix": labels["transactionsSuffix"] as? String ?? "mov.",
                "voice": labels["voice"] as? String ?? "Voz",
                "add": labels["add"] as? String ?? "Agregar"
            ]
            payload["labels"] = labelsDict
        }

        if let jsonData = try? JSONSerialization.data(withJSONObject: payload) {
            defaults.set(jsonData, forKey: Self.storageKey)
        }

        // Reload widget timeline
        WidgetCenter.shared.reloadAllTimelines()

        call.resolve()
    }
}
