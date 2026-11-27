const download = document.getElementById('download');

download.addEventListener('click', async () => {
    const saved = await AuthData.downloadSession();
    if (!saved) return;

    download.textContent = 'session.json saved';
    download.classList.add('saved');
});
