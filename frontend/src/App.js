import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

const VOICE_OPTIONS = {
  english: [
    "en-IN-NeerjaNeural",
    "en-IN-PrabhatNeural",
  ],
  tamil: ["ta-IN-PallaviNeural","ta-IN-ValluvarNeural","ta-LK-SaranyaNeural",],
  hindi: [
    "hi-IN-SwaraNeural",
    "hi-IN-MadhurNeural",],
  telugu: [
    "te-IN-ShrutiNeural",
    "te-IN-MohanNeural",
  ],
  kannada: [
    "kn-IN-SapnaNeural",
  ],
  malayalam: [
    "ml-IN-SobhanaNeural",
    "ml-IN-MidhunNeural"
  ]
};
const SPEED_OPTIONS = [
  { label: "0.75x", value: 0.75 },
  { label: "1x (Normal)", value: 1.0 },
  { label: "1.25x", value: 1.25 },
  { label: "1.5x", value: 1.5 }
];
const pitchOptions = [
  { label: "Normal", value: "+0Hz" },
  { label: "+5Hz", value: "+5Hz" },
  { label: "-5Hz", value: "-5Hz" },
  { label: "+10Hz", value: "+10Hz" },
  { label: "-10Hz", value: "-10Hz" }
];


function App() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("");
  // const [voice, setVoice] = useState(VOICE_OPTIONS.english[0]);
  const [voice, setVoice] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [speed, setSpeed] = useState("");
  const [pitch, setPitch] = useState("+0Hz");
  const [loading, setLoading] = useState(false);
  const downloadAudio = () => {
    const link = document.createElement("a");
    link.href = audioUrl;
    link.setAttribute("download", "tts_audio.wav");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

useEffect(() => {
  if (language && VOICE_OPTIONS[language]) {
    setVoice("");
  }
}, [language]);

  const generateAudio = async () => {
    if (!text.trim()) {
      alert("Please enter text");
      return;
    }
    if (!language || !voice || !speed) {
    alert("Please select language, voice and speed");
    return;
  }

    try {
       setLoading(true);
      const response = await axios.post("http://127.0.0.1:8000/generate", {
        text: text,
        language: language,
        voice: voice,
        speed: speed,
        pitch: pitch
      });

      if (response.data.error) {
        alert(response.data.error);
        setLoading(false);
        return;
      }

      setAudioUrl(`http://127.0.0.1:8000/audio/${response.data.file}`);
    } catch (error) {
      alert("Backend not reachable. Is FastAPI running?");
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h2>Multi Language Text to Speech</h2>
      
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        className="dropdown"
      >
      <option value="" disabled>Select a language</option>
        <option value="english">English</option>
        <option value="tamil">Tamil</option>
        <option value="hindi">Hindi</option>
        <option value="telugu">Telugu</option>
        <option value="kannada">Kannada</option>
        <option value="malayalam">Malayalam</option>
      </select>

    <select
  value={voice}
  onChange={(e) => setVoice(e.target.value)}
  className="dropdown"
  disabled={!language}
>
  <option value="" disabled>Choose a voice</option>
  {language &&
    VOICE_OPTIONS[language]?.map((v) => (
      <option key={v} value={v}>
        {v}
      </option>
    ))}
    </select>
    <select
  value={pitch}
  onChange={(e) => setPitch(e.target.value)}
  className="dropdown"
>
  {pitchOptions.map((p) => (
    <option key={p.value} value={p.value}>
      Pitch {p.label}
    </option>
  ))}
</select>
  <select
  value={speed}
  onChange={(e) => setSpeed(parseFloat(e.target.value))}
  className="dropdown"
>
  <option value="" disabled>Select audio speed</option>
  {SPEED_OPTIONS.map((s) => (
    <option key={s.value} value={s.value}>
      {s.label}
    </option>
  ))}
  </select>


      <textarea
        className="textbox"
        placeholder="Type your sentence here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

     <button className="btn" onClick={generateAudio} disabled={loading}>
      {loading ? "Generating..." : "Generate Audio"}
      {loading && <span className="loader"></span>}
     </button>

      {audioUrl && (
  <div className="audio-section">
    <audio controls src={audioUrl} className="audio-player"></audio>
    
<button className="download-btn" onClick={downloadAudio}>
  Download
</button>
  </div>
)}
    </div>
  );
}

export default App;
