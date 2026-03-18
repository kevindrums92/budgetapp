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
        let entry = SmartSpendEntry(
            date: Date(),
            data: WidgetData.load() ?? .placeholder
        )
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: Date())!
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
        .configurationDisplayName("SmartSpend")
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
