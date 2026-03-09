package com.jhotech.smartspend;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.graphics.Insets;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: let WebView draw behind system bars
        // This makes env(safe-area-inset-*) work in CSS
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        // Pass keyboard (IME) height to WebView as CSS variable.
        // With edge-to-edge + adjustResize, the WebView doesn't shrink when the
        // keyboard opens — we must read the IME insets and forward them to CSS.
        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (v, windowInsets) -> {
            Insets imeInsets = windowInsets.getInsets(WindowInsetsCompat.Type.ime());
            boolean imeVisible = windowInsets.isVisible(WindowInsetsCompat.Type.ime());
            int keyboardHeightPx = imeVisible ? imeInsets.bottom : 0;

            // Convert physical pixels to CSS pixels (dp) for the WebView.
            // WindowInsets returns px; CSS in WebView uses dp (density-independent pixels).
            float density = getResources().getDisplayMetrics().density;
            int keyboardHeightDp = Math.round(keyboardHeightPx / density);

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(
                    "document.documentElement.style.setProperty('--keyboard-height', '" + keyboardHeightDp + "px')",
                    null
                );
            }

            return ViewCompat.onApplyWindowInsets(v, windowInsets);
        });
    }
}
