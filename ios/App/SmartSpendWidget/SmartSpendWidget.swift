import WidgetKit
import SwiftUI

struct SmartSpendProvider: TimelineProvider {
    func placeholder(in context: Context) -> SmartSpendEntry {
        SmartSpendEntry(date: Date(), data: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (SmartSpendEntry) -> Void) {
        let entry = SmartSpendEntry(
            date: Date(),
            data: WidgetData.load() ?? .placeholder
        )
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<SmartSpendEntry>) -> Void) {
        let now = Date()
        let calendar = Calendar.current
        let loaded = WidgetData.load() ?? .placeholder

        // If cached data is from a previous day, zero out "today" values
        let data: WidgetData
        if loaded.isFromToday {
            data = loaded
        } else {
            data = loaded.withTodayReset()
        }

        let entry = SmartSpendEntry(date: now, data: data)

        // Schedule next refresh at midnight (start of next day) so "today" resets,
        // but cap at 30 min so intra-day updates aren't too stale
        let startOfTomorrow = calendar.startOfDay(for: calendar.date(byAdding: .day, value: 1, to: now)!)
        let thirtyMin = calendar.date(byAdding: .minute, value: 30, to: now)!
        let nextUpdate = min(startOfTomorrow, thirtyMin)

        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

struct SmartSpendEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

struct SmartSpendWidget: Widget {
    let kind: String = "SmartSpendWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: SmartSpendProvider()) { entry in
            SmartSpendWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("Lukas")
        .description("Ve tus gastos del día y mes de un vistazo")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct SmartSpendWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: SmartSpendEntry

    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        case .systemMedium:
            MediumWidgetView(data: entry.data)
        case .systemLarge:
            LargeWidgetView(data: entry.data)
        default:
            SmallWidgetView(data: entry.data)
        }
    }
}
