package com.jhotech.smartspend;

import android.os.Bundle;
import androidx.core.view.WindowCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Edge-to-edge: let WebView draw behind system bars
        // This makes env(safe-area-inset-*) work in CSS
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
    }
}
