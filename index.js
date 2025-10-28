// Cek saat pengguna memilih file untuk mengisi otomatis jalur file
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        document.getElementById('filePath').value = file.name;
    }
});

async function upload() {
    // === Ambil elemen dan nilai dari DOM ===
    const fileInput = document.getElementById('fileInput');
    const owner = document.getElementById('repoOwner').value.trim();
    const repo = document.getElementById('repoName').value.trim();
    const path = document.getElementById('filePath').value.trim();
    const token = document.getElementById('githubToken').value.trim();
    const statusEl = document.getElementById('status');
    const uploadButton = document.getElementById('uploadButton');

    const file = fileInput.files[0];

    // === Validasi Input ===
    if (!file) {
        showStatus("Pilih file terlebih dahulu!", "error");
        return;
    }
    if (!owner || !repo || !path || !token) {
        showStatus("Harap isi semua detail repositori dan token.", "error");
        return;
    }

    // === Nonaktifkan tombol dan tampilkan status loading ===
    uploadButton.disabled = true;
    uploadButton.textContent = "Mengunggah...";
    showStatus("Sedang membaca file...", "loading");

    try {
        // === Baca konten file dan encode ke Base64 ===
        const content = await file.text();
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        // === Buat permintaan ke API GitHub ===
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const commitMessage = `feat: add/update file ${path}`;

        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                "Authorization": `token ${token}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                message: commitMessage,
                content: encodedContent,
            }),
        });

        const data = await response.json();

        // === Tampilkan hasil ke pengguna ===
        if (response.ok) {
            showStatus("File berhasil diunggah!", "success");
            // Kosongkan token untuk keamanan
            document.getElementById('githubToken').value = ''; 
        } else {
            // Tampilkan pesan error dari GitHub API
            throw new Error(data.message || `Gagal dengan status ${response.status}`);
        }

    } catch (error) {
        showStatus(`Gagal mengunggah: ${error.message}`, "error");
    } finally {
        // === Aktifkan kembali tombol setelah selesai ===
        uploadButton.disabled = false;
        uploadButton.textContent = "Unggah ke GitHub";
    }
}

/**
 * Menampilkan pesan status di UI.
 * @param {string} message Pesan yang akan ditampilkan.
 * @param {'success' | 'error' | 'loading'} type Jenis pesan.
 */
function showStatus(message, type) {
    const statusEl = document.getElementById('status');
    statusEl.textContent = message;
    statusEl.style.display = 'block';

    // Reset kelas warna
    statusEl.className = '';

    if (type === 'success') {
        statusEl.classList.add('status-success');
    } else if (type === 'error') {
        statusEl.classList.add('status-error');
    } else { // 'loading'
        statusEl.classList.add('text-yellow-300', 'bg-yellow-900/50');
    }
}
