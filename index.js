import { GITHUB_TOKEN_URL } from './api-config.js';

// Kaitkan fungsi upload ke tombol unggah
document.getElementById('uploadButton').addEventListener('click', upload);

// Cek saat pengguna memilih file untuk mengisi otomatis jalur file
document.getElementById('fileInput').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        // Default ke root jika tidak ada path yang ditentukan
        const currentPath = document.getElementById('filePath').value.trim();
        if (!currentPath.includes('/')) {
             document.getElementById('filePath').value = file.name;
        }
    }
});

async function upload() {
    // === Ambil elemen dan nilai dari DOM ===
    const fileInput = document.getElementById('fileInput');
    const owner = document.getElementById('repoOwner').value.trim();
    const repo = document.getElementById('repoName').value.trim();
    const path = document.getElementById('filePath').value.trim();
    const statusEl = document.getElementById('status');
    const uploadButton = document.getElementById('uploadButton');

    const file = fileInput.files[0];

    // === Validasi Input ===
    if (!file) {
        showStatus("Pilih file terlebih dahulu!", "error");
        return;
    }
    if (!owner || !repo || !path) {
        showStatus("Harap isi semua detail repositori.", "error");
        return;
    }

    // === Nonaktifkan tombol dan tampilkan status loading ===
    uploadButton.disabled = true;
    uploadButton.textContent = "Mengunggah...";
    showStatus("Sedang memproses...", "loading");

    try {
        // 0. Ambil token dari API
        showStatus("Mengambil token...", "loading");
        const tokenResponse = await fetch(GITHUB_TOKEN_URL);
        if (!tokenResponse.ok) {
            throw new Error(`Gagal mengambil token. Status: ${tokenResponse.status}`);
        }
        const tokenData = await tokenResponse.json();
        const token = tokenData.github_token;
        if (!token) {
            throw new Error("Token tidak ditemukan dalam respons API.");
        }

        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const headers = {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
        };

        // 1. Cek apakah file sudah ada untuk mendapatkan SHA
        let existingFileSha = null;
        showStatus("Mengecek file di repositori...", "loading");
        const checkResponse = await fetch(apiUrl, { headers });
        
        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            existingFileSha = existingFile.sha;
            console.log(`File ditemukan. SHA: ${existingFileSha}`);
        } else if (checkResponse.status !== 404) {
            // Jika errornya bukan 404 (Not Found), maka ada masalah lain
            const errorData = await checkResponse.json();
            throw new Error(errorData.message || `Gagal memeriksa file. Status: ${checkResponse.status}`);
        }

        // 2. Baca konten file dan encode ke Base64
        showStatus("Membaca dan mengenkode file...", "loading");
        const content = await file.text();
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        // 3. Buat body permintaan, tambahkan SHA jika ada
        const commitMessage = `feat: ${existingFileSha ? 'update' : 'add'} file ${path}`;
        const body = {
            message: commitMessage,
            content: encodedContent,
        };
        if (existingFileSha) {
            body.sha = existingFileSha;
        }

        // 4. Kirim permintaan PUT untuk membuat/memperbarui file
        showStatus(`Mengunggah ${existingFileSha ? 'pembaruan' : 'file baru'}...`, "loading");
        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        // 5. Tampilkan hasil ke pengguna
        if (response.ok) {
            const successMessage = existingFileSha ? "File berhasil diperbarui!" : "File berhasil dibuat!";
            showStatus(successMessage, "success");
        } else {
            throw new Error(data.message || `Gagal dengan status ${response.status}`);
        }

    } catch (error) {
        showStatus(`Gagal mengunggah: ${error.message}`, "error");
        console.error("Upload error:", error);
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
    statusEl.className = 'mt-4 p-3 rounded-md text-center font-bold';

    if (type === 'success') {
        statusEl.classList.add('status-success');
    } else if (type === 'error') {
        statusEl.classList.add('status-error');
    } else { // 'loading'
        statusEl.classList.add('text-blue-200', 'bg-blue-900/50');
    }
}
