import SwiftUI
import WidgetKit

struct LargeWidgetView: View {
    let data: WidgetData

    private let tealColor = Color(red: 0.094, green: 0.718, blue: 0.690)
    private let labelColor = Color.gray
    private let incomeColor = Color(red: 0.06, green: 0.73, blue: 0.51)

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
        VStack(spacing: 0) {
            // Header
            HStack {
                Image(systemName: "dollarsign.circle.fill")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(tealColor)
                Text("SmartSpend")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(.primary)
                Spacer()
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

                verticalDivider

                statColumn(
                    label: data.l.month,
                    amount: data.monthExpenses,
                    color: .primary
                )

                verticalDivider

                if let remaining = data.budgetRemaining {
                    statColumn(
                        label: data.l.remaining,
                        amount: remaining,
                        color: remaining >= 0 ? tealColor : Color.red
                    )
                } else {
                    statColumn(
                        label: data.l.balance,
                        amount: data.monthIncome - data.monthExpenses,
                        color: (data.monthIncome - data.monthExpenses) >= 0 ? tealColor : Color.red
                    )
                }
            }

            Spacer().frame(height: 14)

            // Divider line
            Rectangle()
                .fill(Color.gray.opacity(0.2))
                .frame(height: 1)

            Spacer().frame(height: 10)

            // Recent transactions header
            HStack {
                Text(data.l.recent)
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(labelColor)
                Spacer()
            }

            Spacer().frame(height: 6)

            // Recent transactions list
            transactionsSection

            Spacer(minLength: 4)

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

    // MARK: - Transactions Section

    private var transactionsSection: some View {
        Group {
            if let txns = data.recentTransactions, !txns.isEmpty {
                VStack(spacing: 0) {
                    transactionRow(txns[0])
                    if txns.count > 1 {
                        rowDivider
                        transactionRow(txns[1])
                    }
                    if txns.count > 2 {
                        rowDivider
                        transactionRow(txns[2])
                    }
                    if txns.count > 3 {
                        rowDivider
                        transactionRow(txns[3])
                    }
                    if txns.count > 4 {
                        rowDivider
                        transactionRow(txns[4])
                    }
                }
            } else {
                Text(data.l.noRecent)
                    .font(.system(size: 13))
                    .foregroundColor(labelColor)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
            }
        }
    }

    private func transactionRow(_ tx: RecentTransaction) -> some View {
        HStack(spacing: 10) {
            Circle()
                .fill(colorFromHex(tx.categoryColor))
                .frame(width: 10, height: 10)

            Text(tx.name)
                .font(.system(size: 13, weight: .semibold))
                .foregroundColor(.primary)
                .lineLimit(1)

            Spacer()

            Text(tx.type == "income"
                 ? "+\(data.formatAmount(tx.amount))"
                 : data.formatAmount(tx.amount))
                .font(.system(size: 13, weight: .bold, design: .rounded))
                .foregroundColor(tx.type == "income" ? incomeColor : .primary)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Helpers

    private func statColumn(label: String, amount: Double, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundColor(labelColor)
            Text(data.formatAmount(amount))
                .font(.system(size: 15, weight: .bold, design: .rounded))
                .foregroundColor(color)
                .minimumScaleFactor(0.5)
                .lineLimit(1)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var verticalDivider: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.3))
            .frame(width: 1, height: 30)
    }

    private var rowDivider: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.1))
            .frame(height: 1)
            .padding(.leading, 20)
    }

    private func colorFromHex(_ hex: String) -> Color {
        var h = hex
        if h.hasPrefix("#") {
            h = String(h.dropFirst())
        }
        guard h.count == 6, let val = UInt64(h, radix: 16) else {
            return Color.gray
        }
        return Color(
            red: Double((val >> 16) & 0xFF) / 255.0,
            green: Double((val >> 8) & 0xFF) / 255.0,
            blue: Double(val & 0xFF) / 255.0
        )
    }
}
