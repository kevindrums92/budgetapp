import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
    let data: WidgetData

    private let tealColor = Color(red: 0.094, green: 0.718, blue: 0.690)
    private let labelColor = Color.gray

    var body: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            content
                .containerBackground(for: .widget) {
                    Color("WidgetBackground")
                }
        } else {
            content
                .padding()
                .background(Color(UIColor.systemBackground))
        }
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(tealColor)
                Text("SmartSpend")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
                Spacer()
                Image(systemName: "plus.circle.fill")
                    .font(.system(size: 18))
                    .foregroundColor(tealColor)
            }

            Spacer()

            // Today's expenses
            VStack(alignment: .leading, spacing: 2) {
                Text(data.l.today)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(labelColor)
                Text(data.formatAmount(data.todayExpenses))
                    .font(.system(size: 18, weight: .bold, design: .rounded))
                    .foregroundColor(.primary)
                    .minimumScaleFactor(0.6)
                    .lineLimit(1)
            }

            Spacer().frame(height: 10)

            // Monthly net or budget remaining
            VStack(alignment: .leading, spacing: 2) {
                if let remaining = data.budgetRemaining {
                    Text(data.l.remaining)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(labelColor)
                    Text(data.formatAmount(remaining))
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundColor(remaining >= 0 ? tealColor : Color.red)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                } else {
                    let net = data.monthIncome - data.monthExpenses
                    Text(data.l.balance)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(labelColor)
                    Text(data.formatAmount(net))
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundColor(net >= 0 ? tealColor : Color.red)
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                }
            }
        }
        .widgetURL(URL(string: "smartspend://assistant"))
    }
}
