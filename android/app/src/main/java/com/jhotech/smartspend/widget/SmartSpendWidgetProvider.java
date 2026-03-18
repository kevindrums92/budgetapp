package com.jhotech.smartspend.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.net.Uri;
import android.os.Bundle;
import android.view.View;
import android.widget.RemoteViews;

import com.jhotech.smartspend.MainActivity;
import com.jhotech.smartspend.R;

import org.json.JSONArray;
import org.json.JSONObject;

import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;

public class SmartSpendWidgetProvider extends AppWidgetProvider {

    static final String PREFS_NAME = "SmartSpendWidget";
    static final String DATA_KEY = "widgetData";

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int id : appWidgetIds) {
            updateWidget(context, manager, id);
        }
    }

    @Override
    public void onAppWidgetOptionsChanged(Context context, AppWidgetManager manager, int appWidgetId, Bundle newOptions) {
        updateWidget(context, manager, appWidgetId);
    }

    static void updateWidget(Context context, AppWidgetManager manager, int appWidgetId) {
        Bundle options = manager.getAppWidgetOptions(appWidgetId);
        int minHeight = options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_HEIGHT, 110);

        RemoteViews views;
        if (minHeight >= 200) {
            views = buildLargeLayout(context);
        } else if (minHeight >= 100) {
            views = buildMediumLayout(context);
        } else {
            views = buildSmallLayout(context);
        }

        manager.updateAppWidget(appWidgetId, views);
    }

    static void updateAllWidgets(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        int[] ids = manager.getAppWidgetIds(
                new android.content.ComponentName(context, SmartSpendWidgetProvider.class));
        for (int id : ids) {
            updateWidget(context, manager, id);
        }
    }

    // ── Data loading ──

    private static JSONObject loadData(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String json = prefs.getString(DATA_KEY, null);
        if (json == null) return null;
        try {
            return new JSONObject(json);
        } catch (Exception e) {
            return null;
        }
    }

    private static boolean isFromToday(JSONObject data) {
        String lastUpdated = data.optString("lastUpdated", "");
        if (lastUpdated.isEmpty()) return false;
        try {
            SimpleDateFormat fmt = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
            fmt.setTimeZone(TimeZone.getTimeZone("UTC"));
            Date updated = fmt.parse(lastUpdated);
            if (updated == null) return false;

            Calendar updatedCal = Calendar.getInstance();
            updatedCal.setTime(updated);
            Calendar now = Calendar.getInstance();

            return updatedCal.get(Calendar.YEAR) == now.get(Calendar.YEAR)
                    && updatedCal.get(Calendar.DAY_OF_YEAR) == now.get(Calendar.DAY_OF_YEAR);
        } catch (Exception e) {
            return false;
        }
    }

    // ── Amount formatting ──

    private static String formatAmount(JSONObject data, double value) {
        String symbol = data.optString("currencySymbol", "$");
        int decimals = data.optInt("currencyDecimals", 0);

        DecimalFormatSymbols symbols = new DecimalFormatSymbols(Locale.US);
        if (decimals == 0) {
            symbols.setGroupingSeparator('.');
            DecimalFormat df = new DecimalFormat("#,###", symbols);
            return symbol + " " + df.format(value);
        } else {
            symbols.setGroupingSeparator(',');
            symbols.setDecimalSeparator('.');
            StringBuilder pattern = new StringBuilder("#,##0.");
            for (int i = 0; i < decimals; i++) pattern.append("0");
            DecimalFormat df = new DecimalFormat(pattern.toString(), symbols);
            return symbol + " " + df.format(value);
        }
    }

    // ── Labels ──

    private static String getLabel(JSONObject data, String key, String fallback) {
        JSONObject labels = data.optJSONObject("labels");
        if (labels != null) {
            return labels.optString(key, fallback);
        }
        return fallback;
    }

    // ── PendingIntents ──

    private static PendingIntent makeDeepLinkIntent(Context context, String url, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
        intent.setClassName(context.getPackageName(), "com.jhotech.smartspend.MainActivity");
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(context, requestCode, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    private static PendingIntent makeLaunchIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        return PendingIntent.getActivity(context, 0, intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // ── Small layout ──

    private static RemoteViews buildSmallLayout(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_small);
        JSONObject data = loadData(context);

        if (data == null) {
            views.setTextViewText(R.id.amount_today, "$ 0");
            views.setTextViewText(R.id.amount_remaining, "$ 0");
            views.setOnClickPendingIntent(R.id.label_today, makeLaunchIntent(context));
            return views;
        }

        boolean today = isFromToday(data);
        double todayExp = today ? data.optDouble("todayExpenses", 0) : 0;
        Double budgetRemaining = data.isNull("budgetRemaining") ? null : data.optDouble("budgetRemaining", 0);
        double monthIncome = data.optDouble("monthIncome", 0);
        double monthExpenses = data.optDouble("monthExpenses", 0);

        views.setTextViewText(R.id.label_today, getLabel(data, "today", "Hoy"));
        views.setTextViewText(R.id.amount_today, formatAmount(data, todayExp));

        if (budgetRemaining != null) {
            views.setTextViewText(R.id.label_remaining, getLabel(data, "remaining", "Restante"));
            views.setTextViewText(R.id.amount_remaining, formatAmount(data, budgetRemaining));
            views.setTextColor(R.id.amount_remaining,
                    budgetRemaining >= 0 ? Color.parseColor("#18B7B0") : Color.parseColor("#EF4444"));
        } else {
            double net = monthIncome - monthExpenses;
            views.setTextViewText(R.id.label_remaining, getLabel(data, "balance", "Balance"));
            views.setTextViewText(R.id.amount_remaining, formatAmount(data, net));
            views.setTextColor(R.id.amount_remaining,
                    net >= 0 ? Color.parseColor("#18B7B0") : Color.parseColor("#EF4444"));
        }

        // Click opens assistant
        views.setOnClickPendingIntent(R.id.label_today,
                makeDeepLinkIntent(context, "smartspend://assistant", 10));

        return views;
    }

    // ── Medium layout ──

    private static RemoteViews buildMediumLayout(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_medium);
        JSONObject data = loadData(context);

        if (data == null) {
            views.setOnClickPendingIntent(R.id.btn_add, makeLaunchIntent(context));
            return views;
        }

        boolean today = isFromToday(data);
        double todayExp = today ? data.optDouble("todayExpenses", 0) : 0;
        double monthExpenses = data.optDouble("monthExpenses", 0);
        double monthIncome = data.optDouble("monthIncome", 0);
        Double budgetRemaining = data.isNull("budgetRemaining") ? null : data.optDouble("budgetRemaining", 0);
        int txCount = today ? data.optInt("transactionCount", 0) : 0;

        // Labels
        views.setTextViewText(R.id.label_today, getLabel(data, "today", "Hoy"));
        views.setTextViewText(R.id.label_month, getLabel(data, "month", "Mes"));
        String btnVoiceText = "\uD83C\uDFA4 " + getLabel(data, "voice", "Voz");
        String btnAddText = "+ " + getLabel(data, "add", "Agregar");
        views.setTextViewText(R.id.btn_voice_label, btnVoiceText);
        views.setTextViewText(R.id.btn_add_label, btnAddText);

        // Amounts
        views.setTextViewText(R.id.amount_today, formatAmount(data, todayExp));
        views.setTextViewText(R.id.amount_month, formatAmount(data, monthExpenses));

        // Transaction count
        if (txCount > 0) {
            String suffix = getLabel(data, "transactionsSuffix", "mov.");
            views.setTextViewText(R.id.transaction_count, txCount + " " + suffix);
        } else {
            views.setTextViewText(R.id.transaction_count, "");
        }

        // Remaining / Balance
        if (budgetRemaining != null) {
            views.setTextViewText(R.id.label_remaining, getLabel(data, "remaining", "Restante"));
            views.setTextViewText(R.id.amount_remaining, formatAmount(data, budgetRemaining));
            views.setTextColor(R.id.amount_remaining,
                    budgetRemaining >= 0 ? Color.parseColor("#18B7B0") : Color.parseColor("#EF4444"));
        } else {
            double net = monthIncome - monthExpenses;
            views.setTextViewText(R.id.label_remaining, getLabel(data, "balance", "Balance"));
            views.setTextViewText(R.id.amount_remaining, formatAmount(data, net));
            views.setTextColor(R.id.amount_remaining,
                    net >= 0 ? Color.parseColor("#18B7B0") : Color.parseColor("#EF4444"));
        }

        // Buttons
        views.setOnClickPendingIntent(R.id.btn_voice,
                makeDeepLinkIntent(context, "smartspend://assistant?mode=audio", 1));
        views.setOnClickPendingIntent(R.id.btn_add,
                makeDeepLinkIntent(context, "smartspend://assistant", 2));

        return views;
    }

    // ── Large layout ──

    private static RemoteViews buildLargeLayout(Context context) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_large);
        JSONObject data = loadData(context);

        if (data == null) {
            views.setViewVisibility(R.id.empty_state, View.VISIBLE);
            views.setOnClickPendingIntent(R.id.btn_add, makeLaunchIntent(context));
            return views;
        }

        boolean today = isFromToday(data);
        double todayExp = today ? data.optDouble("todayExpenses", 0) : 0;
        double monthExpenses = data.optDouble("monthExpenses", 0);
        double monthIncome = data.optDouble("monthIncome", 0);
        Double budgetRemaining = data.isNull("budgetRemaining") ? null : data.optDouble("budgetRemaining", 0);
        int txCount = today ? data.optInt("transactionCount", 0) : 0;

        // Labels
        views.setTextViewText(R.id.label_today, getLabel(data, "today", "Hoy"));
        views.setTextViewText(R.id.label_month, getLabel(data, "month", "Mes"));
        views.setTextViewText(R.id.label_recent, getLabel(data, "recent", "Recientes"));
        String btnVoiceText = "\uD83C\uDFA4 " + getLabel(data, "voice", "Voz");
        String btnAddText = "+ " + getLabel(data, "add", "Agregar");
        views.setTextViewText(R.id.btn_voice_label, btnVoiceText);
        views.setTextViewText(R.id.btn_add_label, btnAddText);

        // Amounts
        views.setTextViewText(R.id.amount_today, formatAmount(data, todayExp));
        views.setTextViewText(R.id.amount_month, formatAmount(data, monthExpenses));

        // Transaction count
        if (txCount > 0) {
            String suffix = getLabel(data, "transactionsSuffix", "mov.");
            views.setTextViewText(R.id.transaction_count, txCount + " " + suffix);
        } else {
            views.setTextViewText(R.id.transaction_count, "");
        }

        // Remaining / Balance
        if (budgetRemaining != null) {
            views.setTextViewText(R.id.label_remaining, getLabel(data, "remaining", "Restante"));
            views.setTextViewText(R.id.amount_remaining, formatAmount(data, budgetRemaining));
            views.setTextColor(R.id.amount_remaining,
                    budgetRemaining >= 0 ? Color.parseColor("#18B7B0") : Color.parseColor("#EF4444"));
        } else {
            double net = monthIncome - monthExpenses;
            views.setTextViewText(R.id.label_remaining, getLabel(data, "balance", "Balance"));
            views.setTextViewText(R.id.amount_remaining, formatAmount(data, net));
            views.setTextColor(R.id.amount_remaining,
                    net >= 0 ? Color.parseColor("#18B7B0") : Color.parseColor("#EF4444"));
        }

        // Recent transactions
        int[] rowIds = {R.id.transaction_row_1, R.id.transaction_row_2, R.id.transaction_row_3,
                R.id.transaction_row_4, R.id.transaction_row_5};
        int[] dotIds = {R.id.dot_1, R.id.dot_2, R.id.dot_3, R.id.dot_4, R.id.dot_5};
        int[] nameIds = {R.id.name_1, R.id.name_2, R.id.name_3, R.id.name_4, R.id.name_5};
        int[] amountIds = {R.id.amount_1, R.id.amount_2, R.id.amount_3, R.id.amount_4, R.id.amount_5};

        JSONArray txns = data.optJSONArray("recentTransactions");
        if (txns != null && txns.length() > 0) {
            views.setViewVisibility(R.id.empty_state, View.GONE);
            for (int i = 0; i < 5; i++) {
                if (i < txns.length()) {
                    JSONObject tx = txns.optJSONObject(i);
                    if (tx == null) continue;

                    views.setViewVisibility(rowIds[i], View.VISIBLE);
                    views.setTextViewText(nameIds[i], tx.optString("name", ""));

                    double amt = tx.optDouble("amount", 0);
                    String type = tx.optString("type", "expense");
                    boolean isIncome = "income".equals(type);
                    String amtText = isIncome
                            ? "+" + formatAmount(data, amt)
                            : formatAmount(data, amt);
                    views.setTextViewText(amountIds[i], amtText);
                    views.setTextColor(amountIds[i],
                            isIncome ? Color.parseColor("#10B981") : Color.parseColor("#1F2937"));

                    // Tint category dot
                    String colorHex = tx.optString("categoryColor", "#9CA3AF");
                    try {
                        views.setInt(dotIds[i], "setColorFilter", Color.parseColor(colorHex));
                    } catch (Exception ignored) {
                    }
                } else {
                    views.setViewVisibility(rowIds[i], View.GONE);
                }
            }
        } else {
            views.setViewVisibility(R.id.empty_state, View.VISIBLE);
            views.setTextViewText(R.id.empty_state,
                    getLabel(data, "noRecent", "Sin movimientos recientes"));
            for (int rowId : rowIds) {
                views.setViewVisibility(rowId, View.GONE);
            }
        }

        // Buttons
        views.setOnClickPendingIntent(R.id.btn_voice,
                makeDeepLinkIntent(context, "smartspend://assistant?mode=audio", 1));
        views.setOnClickPendingIntent(R.id.btn_add,
                makeDeepLinkIntent(context, "smartspend://assistant", 2));

        return views;
    }
}
