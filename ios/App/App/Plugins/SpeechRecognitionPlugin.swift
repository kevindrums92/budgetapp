import Capacitor
import Speech
import AVFoundation

@objc(SpeechRecognitionPlugin)
public class SpeechRecognitionPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "SpeechRecognitionPlugin"
    public let jsName = "SpeechRecognitionNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "available", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestSpeechPermissions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "startListening", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stopListening", returnType: CAPPluginReturnPromise)
    ]

    private var speechRecognizer: SFSpeechRecognizer?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var audioEngine: AVAudioEngine?

    @objc func available(_ call: CAPPluginCall) {
        let recognizer = SFSpeechRecognizer()
        call.resolve(["available": recognizer?.isAvailable ?? false])
    }

    @objc func requestSpeechPermissions(_ call: CAPPluginCall) {
        SFSpeechRecognizer.requestAuthorization { authStatus in
            switch authStatus {
            case .authorized:
                AVAudioSession.sharedInstance().requestRecordPermission { granted in
                    call.resolve(["speechRecognition": granted ? "granted" : "denied"])
                }
            case .denied, .restricted:
                call.resolve(["speechRecognition": "denied"])
            case .notDetermined:
                call.resolve(["speechRecognition": "prompt"])
            @unknown default:
                call.resolve(["speechRecognition": "denied"])
            }
        }
    }

    @objc func startListening(_ call: CAPPluginCall) {
        let language = call.getString("language") ?? "es-ES"

        // Stop any existing session
        stopRecognition()

        speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: language))
        guard let speechRecognizer = speechRecognizer, speechRecognizer.isAvailable else {
            call.reject("Speech recognizer not available for language: \(language)")
            return
        }

        // Check authorization
        let authStatus = SFSpeechRecognizer.authorizationStatus()
        guard authStatus == .authorized else {
            call.reject("Speech recognition not authorized")
            return
        }

        do {
            let audioEngine = AVAudioEngine()
            self.audioEngine = audioEngine

            let recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
            recognitionRequest.shouldReportPartialResults = true
            if #available(iOS 16, *) {
                recognitionRequest.addsPunctuation = true
            }
            self.recognitionRequest = recognitionRequest

            // Configure audio session
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

            let inputNode = audioEngine.inputNode
            let recordingFormat = inputNode.outputFormat(forBus: 0)

            inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
                recognitionRequest.append(buffer)
            }

            recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
                guard let self = self else { return }

                if let result = result {
                    let transcript = result.bestTranscription.formattedString
                    self.notifyListeners("partialResults", data: [
                        "matches": [transcript]
                    ])
                }

                if error != nil || (result?.isFinal ?? false) {
                    // Recognition ended — could be timeout or error
                    // Don't auto-stop, the JS side will call stopListening() explicitly
                }
            }

            audioEngine.prepare()
            try audioEngine.start()

            call.resolve()
        } catch {
            call.reject("Failed to start audio engine: \(error.localizedDescription)")
        }
    }

    @objc func stopListening(_ call: CAPPluginCall) {
        stopRecognition()
        call.resolve()
    }

    private func stopRecognition() {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()

        audioEngine = nil
        recognitionRequest = nil
        recognitionTask = nil

        // Deactivate audio session
        try? AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
    }
}
