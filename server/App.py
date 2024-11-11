import os
import soundfile as sf
import torch
import sounddevice as sd
from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from transformers import Wav2Vec2ForCTC, Wav2Vec2Tokenizer, AutoTokenizer, TFAutoModelForSeq2SeqLM

app = Flask(__name__)
CORS(app)

tokenizer_speech = Wav2Vec2Tokenizer.from_pretrained("facebook/wav2vec2-base-960h")
model_speech = Wav2Vec2ForCTC.from_pretrained("facebook/wav2vec2-base-960h")
tokenizer_translation = AutoTokenizer.from_pretrained("Helsinki-NLP/opus-mt-en-hi")
model_translation = TFAutoModelForSeq2SeqLM.from_pretrained("Helsinki-NLP/opus-mt-en-hi")
recording = []
is_recording = False
@app.route('/start_recording', methods=['POST'])
def start_recording():
    global recording, is_recording
    is_recording = True
    duration = request.json.get("duration", 30)
    sample_rate = 16000
    recording = sd.rec(int(duration * sample_rate), samplerate=sample_rate, channels=1, dtype='float32')
    sd.wait()
    sf.write("recording.wav", recording, sample_rate)
    is_recording = False
    return jsonify({"message": "Recording complete"}), 200
@app.route('/stop_recording', methods=['POST'])
def stop_recording():
    global is_recording
    if is_recording:
        sd.stop()
        is_recording = False
        sf.write("recording.wav", recording, 16000)
        return jsonify({"message": "Recording stopped and saved"}), 200
    else:
        return jsonify({"message": "No recording in progress"}), 400
@app.route('/play_recording', methods=['GET'])
def play_recording():
    return send_file("recording.wav", as_attachment=True)
@app.route('/transcribe', methods=['POST'])
def transcribe():
    audio_input, _ = sf.read("recording.wav")
    input_values = tokenizer_speech(audio_input, return_tensors="pt", sampling_rate=16000).input_values
    logits = model_speech(input_values).logits
    predicted_ids = torch.argmax(logits, dim=-1)
    transcription = tokenizer_speech.decode(predicted_ids[0])
    return jsonify({"transcription": transcription}), 200
@app.route('/translate', methods=['POST'])
def translate():
    data = request.get_json()
    text = data.get("text")
    tokenized_input = tokenizer_translation([text], return_tensors="tf")
    translated_ids = model_translation.generate(**tokenized_input, max_length=128)
    translation = tokenizer_translation.decode(translated_ids[0], skip_special_tokens=True)
    return jsonify({"translation": translation}), 200
if __name__ == '__main__':
    app.run(debug=True)
