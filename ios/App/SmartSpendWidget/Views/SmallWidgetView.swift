import SwiftUI
import WidgetKit

struct SmallWidgetView: View {
    let data: WidgetData

    private let tealColor = Color(red: 0.094, green: 0.718, blue: 0.690)
    private let labelColor = Color.gray
    private let isPrivate = WidgetData.isPrivacyEnabled

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

    private func displayAmount(_ value: Double) -> String {
        isPrivate ? data.maskedAmount : data.formatAmount(value)
    }

    private var content: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(tealColor)
                Text("Lukas")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
                Spacer()
                privacyButton
            }

            Spacer()

            // Today's expenses
            VStack(alignment: .leading, spacing: 2) {
                Text(data.l.today)
                    .font(.system(size: 11, weight: .semibold))
                    .foregroundColor(labelColor)
                Text(displayAmount(data.todayExpenses))
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
                    Text(displayAmount(remaining))
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundColor(isPrivate ? .primary : (remaining >= 0 ? tealColor : Color.red))
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                } else {
                    let net = data.monthIncome - data.monthExpenses
                    Text(data.l.balance)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundColor(labelColor)
                    Text(displayAmount(net))
                        .font(.system(size: 15, weight: .semibold, design: .rounded))
                        .foregroundColor(isPrivate ? .primary : (net >= 0 ? tealColor : Color.red))
                        .minimumScaleFactor(0.6)
                        .lineLimit(1)
                }
            }
        }
        .widgetURL(URL(string: "smartspend://assistant"))
    }

    @ViewBuilder
    private var privacyButton: some View {
        if #available(iOSApplicationExtension 17.0, *) {
            Button(intent: ToggleWidgetPrivacyIntent()) {
                Image(systemName: isPrivate ? "eye.slash.fill" : "eye.fill")
                    .font(.system(size: 14))
                    .foregroundColor(labelColor)
            }
            .buttonStyle(.plain)
        } else {
            Image(systemName: "plus.circle.fill")
                .font(.system(size: 18))
                .foregroundColor(tealColor)
        }
    }
}
