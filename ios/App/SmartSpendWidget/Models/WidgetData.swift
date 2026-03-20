import Foundation

struct RecentTransaction: Codable {
    let name: String
    let amount: Double
    let type: String       // "expense" or "income"
    let categoryName: String
    let categoryColor: String  // hex color
    let categoryIcon: String   // lucide icon name (kebab-case)
    let date: String           // YYYY-MM-DD
}

struct WidgetLabels: Codable {
    let today: String
    let month: String
    let remaining: String
    let balance: String
    let recent: String
    let noRecent: String
    let transactionsSuffix: String
    let voice: String
    let add: String

    static let defaultLabels = WidgetLabels(
        today: "Hoy",
        month: "Mes",
        remaining: "Restante",
        balance: "Balance",
        recent: "Recientes",
        noRecent: "Sin movimientos recientes",
        transactionsSuffix: "mov.",
        voice: "Voz",
        add: "Agregar"
    )
}

struct WidgetData: Codable {
    let todayExpenses: Double
    let todayIncome: Double
    let monthExpenses: Double
    let monthIncome: Double
    let budgetRemaining: Double?
    let budgetTotal: Double?
    let currencySymbol: String
    let currencyCode: String
    let currencyDecimals: Int
    let transactionCount: Int
    let lastUpdated: String
    let recentTransactions: [RecentTransaction]?
    let labels: WidgetLabels?

    /// Resolved labels with fallback to Spanish defaults
    var l: WidgetLabels {
        labels ?? .defaultLabels
    }

    static let appGroupID = "group.com.jhotech.smartspend"
    static let storageKey = "widgetData"
    private static let privacyKey = "widgetPrivacyEnabled"

    /// Whether widget privacy mode is enabled (amounts hidden)
    static var isPrivacyEnabled: Bool {
        UserDefaults(suiteName: appGroupID)?.bool(forKey: privacyKey) ?? false
    }

    /// Masked amount string (e.g. "$ •••••")
    var maskedAmount: String {
        "\(currencySymbol) •••••"
    }

    static func load() -> WidgetData? {
        guard let defaults = UserDefaults(suiteName: appGroupID),
              let data = defaults.data(forKey: storageKey),
              let decoded = try? JSONDecoder().decode(WidgetData.self, from: data)
        else { return nil }
        return decoded
    }

    func save() {
        guard let defaults = UserDefaults(suiteName: WidgetData.appGroupID),
              let encoded = try? JSONEncoder().encode(self)
        else { return }
        defaults.set(encoded, forKey: WidgetData.storageKey)
    }

    static let placeholder = WidgetData(
        todayExpenses: 45000,
        todayIncome: 0,
        monthExpenses: 320000,
        monthIncome: 500000,
        budgetRemaining: 180000,
        budgetTotal: 500000,
        currencySymbol: "$",
        currencyCode: "COP",
        currencyDecimals: 0,
        transactionCount: 3,
        lastUpdated: "",
        recentTransactions: [
            RecentTransaction(name: "Almuerzo", amount: 25000, type: "expense", categoryName: "Comida", categoryColor: "#F97316", categoryIcon: "utensils", date: "2026-03-17"),
            RecentTransaction(name: "Taxi", amount: 12000, type: "expense", categoryName: "Transporte", categoryColor: "#3B82F6", categoryIcon: "car", date: "2026-03-17"),
            RecentTransaction(name: "Supermercado", amount: 85000, type: "expense", categoryName: "Mercado", categoryColor: "#8B5CF6", categoryIcon: "shopping-cart", date: "2026-03-16"),
            RecentTransaction(name: "Netflix", amount: 27000, type: "expense", categoryName: "Suscripciones", categoryColor: "#EF4444", categoryIcon: "tv", date: "2026-03-16"),
            RecentTransaction(name: "Salario", amount: 500000, type: "income", categoryName: "Sueldo", categoryColor: "#10B981", categoryIcon: "briefcase", date: "2026-03-15"),
        ],
        labels: .defaultLabels
    )

    /// Whether `lastUpdated` falls on the current calendar day
    var isFromToday: Bool {
        guard !lastUpdated.isEmpty else { return false }
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        // Try with fractional seconds first, then without
        if let date = formatter.date(from: lastUpdated) {
            return Calendar.current.isDateInToday(date)
        }
        formatter.formatOptions = [.withInternetDateTime]
        if let date = formatter.date(from: lastUpdated) {
            return Calendar.current.isDateInToday(date)
        }
        return false
    }

    /// Returns a copy with today's expenses/income zeroed out (stale day)
    func withTodayReset() -> WidgetData {
        WidgetData(
            todayExpenses: 0,
            todayIncome: 0,
            monthExpenses: monthExpenses,
            monthIncome: monthIncome,
            budgetRemaining: budgetRemaining,
            budgetTotal: budgetTotal,
            currencySymbol: currencySymbol,
            currencyCode: currencyCode,
            currencyDecimals: currencyDecimals,
            transactionCount: transactionCount,
            lastUpdated: lastUpdated,
            recentTransactions: recentTransactions,
            labels: labels
        )
    }

    func formatAmount(_ value: Double) -> String {
        if currencyDecimals == 0 {
            let formatter = NumberFormatter()
            formatter.numberStyle = .decimal
            formatter.maximumFractionDigits = 0
            formatter.groupingSeparator = "."
            return "\(currencySymbol) \(formatter.string(from: NSNumber(value: value)) ?? "0")"
        } else {
            let formatter = NumberFormatter()
            formatter.numberStyle = .decimal
            formatter.minimumFractionDigits = currencyDecimals
            formatter.maximumFractionDigits = currencyDecimals
            formatter.groupingSeparator = ","
            formatter.decimalSeparator = "."
            return "\(currencySymbol) \(formatter.string(from: NSNumber(value: value)) ?? "0")"
        }
    }
}
