import AppIntents
import WidgetKit

/// Toggles widget privacy mode on/off (hides all amounts)
@available(iOS 17.0, *)
struct ToggleWidgetPrivacyIntent: AppIntent {
    static var title: LocalizedStringResource = "Toggle Widget Privacy"
    static var description = IntentDescription("Show or hide amounts in the widget")

    private static let appGroupID = "group.com.jhotech.smartspend"
    private static let privacyKey = "widgetPrivacyEnabled"

    func perform() async throws -> some IntentResult {
        guard let defaults = UserDefaults(suiteName: Self.appGroupID) else {
            return .result()
        }

        let current = defaults.bool(forKey: Self.privacyKey)
        defaults.set(!current, forKey: Self.privacyKey)

        // Reload all widget timelines so they re-render immediately
        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }
}
