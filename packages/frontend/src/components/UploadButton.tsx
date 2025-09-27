export default function UploadButton() {
  const onClick = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.txt,.md,.pdf';
    input.onchange = async () => {
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('http://localhost:8080/docs/upload', { method: 'POST', body: fd });
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
    };
    input.click();
  };
  return <button onClick={onClick}>Upload Doc</button>;
}
