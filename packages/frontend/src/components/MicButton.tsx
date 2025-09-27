export default function MicButton({ onStart, onStop }: { onStart: () => void; onStop: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
      <button onClick={onStart}>Start Mic</button>
      <button onClick={onStop}>Stop Mic</button>
    </div>
  );
}
