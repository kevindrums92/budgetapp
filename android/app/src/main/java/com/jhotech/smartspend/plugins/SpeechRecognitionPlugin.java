package com.jhotech.smartspend.plugins;

import android.Manifest;
import android.content.Intent;
import android.os.Bundle;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.util.ArrayList;

@CapacitorPlugin(
    name = "SpeechRecognitionNative",
    permissions = {
        @Permission(strings = { Manifest.permission.RECORD_AUDIO }, alias = "microphone")
    }
)
public class SpeechRecognitionPlugin extends Plugin {

    private SpeechRecognizer speechRecognizer;
    private boolean isListening = false;
    private String currentLanguage = "es-ES";
    private String accumulatedTranscript = "";

    @PluginMethod
    public void available(PluginCall call) {
        boolean available = SpeechRecognizer.isRecognitionAvailable(getContext());
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }

    @PluginMethod
    public void requestSpeechPermissions(PluginCall call) {
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            JSObject result = new JSObject();
            result.put("speechRecognition", "granted");
            call.resolve(result);
        } else {
            requestPermissionForAlias("microphone", call, "microphonePermissionCallback");
        }
    }

    @PermissionCallback
    private void microphonePermissionCallback(PluginCall call) {
        JSObject result = new JSObject();
        if (getPermissionState("microphone") == PermissionState.GRANTED) {
            result.put("speechRecognition", "granted");
        } else {
            result.put("speechRecognition", "denied");
        }
        call.resolve(result);
    }

    @PluginMethod
    public void startListening(PluginCall call) {
        currentLanguage = call.getString("language", "es-ES");

        if (getPermissionState("microphone") != PermissionState.GRANTED) {
            call.reject("Microphone permission not granted");
            return;
        }

        // Stop any existing session
        stopRecognition();
        accumulatedTranscript = "";

        getActivity().runOnUiThread(() -> {
            try {
                if (!SpeechRecognizer.isRecognitionAvailable(getContext())) {
                    call.reject("Speech recognition not available");
                    return;
                }

                speechRecognizer = SpeechRecognizer.createSpeechRecognizer(getContext());
                speechRecognizer.setRecognitionListener(createListener());

                Intent intent = createRecognizerIntent(currentLanguage);
                isListening = true;
                speechRecognizer.startListening(intent);
                call.resolve();
            } catch (Exception e) {
                call.reject("Failed to start speech recognition: " + e.getMessage());
            }
        });
    }

    @PluginMethod
    public void stopListening(PluginCall call) {
        isListening = false;
        getActivity().runOnUiThread(this::stopRecognition);
        call.resolve();
    }

    private Intent createRecognizerIntent(String language) {
        Intent intent = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, language);
        intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, language);
        intent.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        intent.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1);
        return intent;
    }

    private RecognitionListener createListener() {
        return new RecognitionListener() {
            @Override
            public void onReadyForSpeech(Bundle params) {}

            @Override
            public void onBeginningOfSpeech() {}

            @Override
            public void onRmsChanged(float rmsdB) {}

            @Override
            public void onBufferReceived(byte[] buffer) {}

            @Override
            public void onEndOfSpeech() {}

            @Override
            public void onError(int error) {
                // Restart on silence/no-match for continuous listening
                if (isListening && (error == SpeechRecognizer.ERROR_NO_MATCH
                        || error == SpeechRecognizer.ERROR_SPEECH_TIMEOUT)) {
                    restartListening();
                }
            }

            @Override
            public void onResults(Bundle results) {
                ArrayList<String> matches = results.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    String segment = matches.get(0);
                    if (!segment.isEmpty()) {
                        accumulatedTranscript = accumulatedTranscript.isEmpty()
                                ? segment
                                : accumulatedTranscript + " " + segment;
                        emitTranscript(accumulatedTranscript);
                    }
                }

                // Auto-restart for continuous listening
                if (isListening) {
                    restartListening();
                }
            }

            @Override
            public void onPartialResults(Bundle partialResults) {
                ArrayList<String> matches = partialResults.getStringArrayList(
                        SpeechRecognizer.RESULTS_RECOGNITION);
                if (matches != null && !matches.isEmpty()) {
                    String partial = matches.get(0);
                    if (!partial.isEmpty()) {
                        String fullText = accumulatedTranscript.isEmpty()
                                ? partial
                                : accumulatedTranscript + " " + partial;
                        emitTranscript(fullText);
                    }
                }
            }

            @Override
            public void onEvent(int eventType, Bundle params) {}
        };
    }

    private void emitTranscript(String text) {
        JSObject data = new JSObject();
        JSArray matchesArray = new JSArray();
        matchesArray.put(text);
        data.put("matches", matchesArray);
        notifyListeners("partialResults", data);
    }

    private void restartListening() {
        if (!isListening || speechRecognizer == null) return;

        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = createRecognizerIntent(currentLanguage);
                speechRecognizer.startListening(intent);
            } catch (Exception e) {
                // Silently fail restart
            }
        });
    }

    private void stopRecognition() {
        if (speechRecognizer != null) {
            try {
                speechRecognizer.stopListening();
                speechRecognizer.cancel();
                speechRecognizer.destroy();
            } catch (Exception e) {
                // Ignore cleanup errors
            }
            speechRecognizer = null;
        }
    }
}
