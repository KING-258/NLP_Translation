import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
function App() {
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [page, setPage] = useState('welcome');
  const startRecording = async () => {
    setIsRecording(true);
    await axios.post('http://127.0.0.1:5000/start_recording', { duration: 60 });
    setIsRecording(false);
    alert("Recording complete!");
  };
  const stopRecording = async () => {
    if (isRecording) {
      await axios.post('http://127.0.0.1:5000/stop_recording');
      setIsRecording(false);
      alert("Recording stopped manually!");
    } else {
      alert("No recording in progress.");
    }
  };
  const playRecording = async () => {
    const response = await axios.get('http://127.0.0.1:5000/play_recording', { responseType: 'blob' });
    const audioUrl = URL.createObjectURL(new Blob([response.data]));
    const audio = new Audio(audioUrl);
    audio.play();
  };
  const transcribe = async () => {
    const response = await axios.post('http://127.0.0.1:5000/transcribe');
    setTranscription(response.data.transcription);
  };
  const translate = async () => {
    const response = await axios.post('http://127.0.0.1:5000/translate', { text: transcription });
    setTranslation(response.data.translation);
  };
  useEffect(() => {
    if (transcription) {
      let index = 0;
      const typewriter = setInterval(() => {
        document.getElementById("transcription-box").innerText = transcription.slice(0, index);
        index++;
        if (index > transcription.length) clearInterval(typewriter);
      }, 50);
    }
  }, [transcription]);
  return (
    <div className="App">
      {page === 'welcome' ? (
        <div className="welcome-page">
          <h1>Speech to Text with Translation</h1>
          <h2>Implemented using NLP</h2>
          <button className="welcome-button" onClick={() => setPage('main')}>Welcome</button>
        </div>
      ) : (
        <div className="app-container">
          <h1 className="title">Audio Translator</h1>
          <div className="button-container">
            <button onClick={startRecording} disabled={isRecording}>Start Recording</button>
            <button onClick={stopRecording} disabled={!isRecording}>Stop Recording</button>
            <button onClick={playRecording}>Play Recording</button>
            <button onClick={transcribe}>Transcribe</button>
            <button onClick={translate}>Translate</button>
          </div>
          <div className="text-box">
            <h2>Transcription:</h2>
            <div id="transcription-box" className="transcription-box"></div>
          </div>
          <div className="text-box">
            <h2>Translation (Hindi):</h2>
            <p>{translation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;