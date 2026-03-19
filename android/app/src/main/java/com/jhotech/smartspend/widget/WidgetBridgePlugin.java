package com.jhotech.smartspend.widget;

import android.content.Context;
import android.content.SharedPreferences;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WidgetBridge")
public class WidgetBridgePlugin extends Plugin {

    @PluginMethod
    public void updateWidgetData(PluginCall call) {
        try {
            // Get the full JSON payload from the call
            JSObject data = call.getData();
            if (data == null) {
                call.reject("No data provided");
                return;
            }

            // Store in SharedPreferences
            Context context = getContext();
            SharedPreferences prefs = context.getSharedPreferences(
                    SmartSpendWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE);
            prefs.edit()
                    .putString(SmartSpendWidgetProvider.DATA_KEY, data.toString())
                    .apply();

            // Force immediate widget refresh
            SmartSpendWidgetProvider.updateAllWidgets(context);

            call.resolve();
        } catch (Exception e) {
            call.reject("Failed to update widget: " + e.getMessage());
        }
    }
}
