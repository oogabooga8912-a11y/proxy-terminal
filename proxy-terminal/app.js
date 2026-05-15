const output = document.getElementById('output');
const input = document.getElementById('command-input');

function addLine(text, className = '') {
    const div = document.createElement('div');
    div.className = `line ${className}`;
    div.innerHTML = text;
    output.appendChild(div);
    output.scrollTop = output.scrollHeight;
}

function addPromptLine(url) {
    const div = document.createElement('div');
    div.className = 'line';
    div.innerHTML = `<span class="prompt">C:\\Users\\Harris&gt;</span> ${escapeHtml(url)}`;
    output.appendChild(div);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

async function fetchUrl(url) {
    addLine('Fetching...', 'loading');
    try {
        const response = await fetch(`/fetch?url=${encodeURIComponent(url)}`);
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || `HTTP ${response.status}`);
        }
        const contentType = response.headers.get('content-type') || '';
        if (contentType.includes('text/html')) {
            const html = await response.text();
            const iframe = document.createElement('iframe');
            iframe.className = 'site-frame';
            const line = document.createElement('div');
            line.className = 'line';
            line.style.width = '100%';
            line.appendChild(iframe);
            output.appendChild(line);
            iframe.srcdoc = html;
        } else if (contentType.includes('application/json')) {
            const data = await response.json();
            addLine(JSON.stringify(data, null, 2));
        } else {
            const text = await response.text();
            addLine(text.substring(0, 2000) + (text.length > 2000 ? '...' : ''));
        }
    } catch (err) {
        addLine(`Error: ${err.message}`, 'error');
    }
    output.scrollTop = output.scrollHeight;
}

input.addEventListener('keydown', async (e) => {
    if (e.key !== 'Enter') return;
    const url = input.value.trim();
    if (!url) return;
    addPromptLine(url);
    input.value = '';
    if (url === 'clear') { output.innerHTML = ''; return; }
    if (url === 'help') { addLine('Commands: help, clear, or any URL'); return; }
    await fetchUrl(url);
});

document.getElementById('terminal').addEventListener('click', () => input.focus());
