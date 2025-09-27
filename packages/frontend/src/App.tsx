import { useEffect, useRef, useState } from 'react';
import TranscriptFeed from './components/TranscriptFeed';
import AssistantPanel from './components/AssistantPanel';
import MicButton from './components/MicButton';
import UploadButton from './components/UploadButton';

type TranscriptItem = { text: string, kind: 'partial'|'final' };

export default function App() {
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [answer, setAnswer] = useState<string>('');
  const [question, setQuestion] = useState<string>('');
  const sttRef = useRef<WebSocket | null>(null);
  const assistRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8080/ws/assist');
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'events') setEvents((prev) => [...msg.events, ...prev]);
    };
    assistRef.current = ws;
    return () => ws.close();
  }, []);

  const startMic = async () => {
    const ws = new WebSocket('ws://localhost:8080/ws/stt');
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) e.data.arrayBuffer().then(buf => ws.send(buf));
    };
    mr.start(500);
    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (msg.type === 'partial') setTranscript((t) => [{ text: msg.text, kind: 'partial' }, ...t]);
      if (msg.type === 'final') setTranscript((t) => [{ text: msg.text, kind: 'final' }, ...t]);
    };
    sttRef.current = ws;
  };

  const stopMic = () => sttRef.current?.close();

  const ask = async () => {
    const res = await fetch('http://localhost:8080/chat/ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: question })
    });
    const data = await res.json();
    setAnswer(data.answer);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: 16 }}>
      <div>
        <h2>Transcript</h2>
        <TranscriptFeed items={transcript} />
        <MicButton onStart={startMic} onStop={stopMic} />
        <div style={{ marginTop: 12 }}>
          <UploadButton />
        </div>
      </div>
      <div>
        <h2>Assistant</h2>
        <AssistantPanel events={events} />
        <div style={{ marginTop: 16 }}>
          <input style={{ width: '100%', padding: 8 }} placeholder="Ask the docs..." value={question} onChange={e => setQuestion(e.target.value)} />
          <button style={{ marginTop: 8 }} onClick={ask}>Ask</button>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fafafa', padding: 12, marginTop: 8 }}>{answer}</pre>
        </div>
      </div>
    </div>
  );
}
