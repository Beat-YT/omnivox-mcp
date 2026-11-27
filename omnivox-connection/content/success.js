const download = document.getElementById('download');

download.addEventListener('click', async () => {
    const saved = await AuthData.downloadSession();
    if (!saved) return;

    download.textContent = 'session.json saved';
    download.classList.add('saved');
});

const testMode = document.getElementById('test-mode');

testMode.addEventListener('click', () => {
    AuthData.openSuperSecretTestMode();
});