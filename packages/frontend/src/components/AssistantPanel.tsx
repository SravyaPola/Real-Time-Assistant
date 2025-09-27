export default function AssistantPanel({ events }: { events: any[] }) {
  return (
    <div style={{ border: '1px solid #ddd', minHeight: 240, padding: 12 }}>
      {events.map((e, i) => (
        <div key={i}>• {e.text}</div>
      ))}
    </div>
  );
}
