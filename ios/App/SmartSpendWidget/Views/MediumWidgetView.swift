import SwiftUI
import WidgetKit

struct MediumWidgetView: View {
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
        VStack(spacing: 0) {
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
                if data.transactionCount > 0 {
                    Text("\(data.transactionCount) \(data.l.transactionsSuffix)")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(labelColor)
                }
            }

            Spacer().frame(height: 12)

            // Stats row
            HStack(spacing: 16) {
                statColumn(
                    label: data.l.today,
                    amount: data.todayExpenses,
                    color: .primary
                )

                divider

                statColumn(
                    label: data.l.month,
                    amount: data.monthExpenses,
                    color: .primary
                )

                divider

                if let remaining = data.budgetRemaining {
                    statColumn(
                        label: data.l.remaining,
                        amount: remaining,
                        color: isPrivate ? .primary : (remaining >= 0 ? tealColor : Color.red)
                    )
                } else {
                    let net = data.monthIncome - data.monthExpenses
                    statColumn(
                        label: data.l.balance,
                        amount: net,
                        color: isPrivate ? .primary : (net >= 0 ? tealColor : Color.red)
                    )
                }
            }

            Spacer()

            // Action buttons row
            HStack(spacing: 10) {
                Link(destination: URL(string: "smartspend://assistant?mode=audio")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "mic.fill")
                            .font(.system(size: 12, weight: .semibold))
                        Text(data.l.voice)
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(tealColor.opacity(0.15))
                    .foregroundColor(tealColor)
                    .cornerRadius(10)
                }

                Link(destination: URL(string: "smartspend://assistant")!) {
                    HStack(spacing: 4) {
                        Image(systemName: "plus")
                            .font(.system(size: 12, weight: .semibold))
                        Text(data.l.add)
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 8)
                    .background(Color.primary)
                    .foregroundColor(Color(UIColor.systemBackground))
                    .cornerRadius(10)
                }
            }
        }
    }

    private func statColumn(label: String, amount: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(labelColor)
            Text(displayAmount(amount))
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundColor(color)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var divider: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.3))
            .frame(width: 1, height: 30)
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
            EmptyView()
        }
    }
}
