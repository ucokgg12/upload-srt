
import { GITHUB_TOKEN_URL } from './api-config.js';

// === Ambil elemen DOM sekali untuk efisiensi ===
const fileInput = document.getElementById('fileInput');
const ownerEl = document.getElementById('repoOwner');
const repoEl = document.getElementById('repoName');
const folderPathEl = document.getElementById('folderPath');
const fileNameEl = document.getElementById('fileName');
const fullPathPreviewEl = document.getElementById('fullPathPreview');
const statusEl = document.getElementById('status');
const uploadButton = document.getElementById('uploadButton');
const srtFilesListEl = document.getElementById('srtFilesList');

// === Tambahkan Event Listeners ===
uploadButton.addEventListener('click', upload);
fileInput.addEventListener('change', handleFileSelect);
folderPathEl.addEventListener('input', updateFullPathPreview);
fileNameEl.addEventListener('input', updateFullPathPreview);
ownerEl.addEventListener('change', fetchAndDisplaySubtitleFiles);
repoEl.addEventListener('change', fetchAndDisplaySubtitleFiles);

// Inisialisasi pratinjau dan daftar file saat halaman dimuat
updateFullPathPreview();
document.addEventListener('DOMContentLoaded', fetchAndDisplaySubtitleFiles);


/**
 * Menangani pemilihan file oleh pengguna.
 * Mengisi otomatis nama file dan memperbarui pratinjau.
 */
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        fileNameEl.value = file.name;
        updateFullPathPreview();
    }
}

/**
 * Memperbarui pratinjau jalur lengkap berdasarkan input folder dan nama file.
 */
function updateFullPathPreview() {
    const folder = folderPathEl.value.trim().replace(/\/$/, ''); // Hapus garis miring di akhir
    const file = fileNameEl.value.trim();

    if (!file) {
        fullPathPreviewEl.textContent = '';
        return;
    }

    fullPathPreviewEl.textContent = folder ? `${folder}/${file}` : file;
}

/**
 * Fungsi pembantu untuk mengambil token GitHub dari API.
 * @returns {Promise<string>} Token GitHub.
 */
async function getToken() {
    const tokenResponse = await fetch(GITHUB_TOKEN_URL);
    if (!tokenResponse.ok) {
        throw new Error(`Gagal mengambil token. Status: ${tokenResponse.status}`);
    }
    const tokenData = await tokenResponse.json();
    const token = tokenData.github_token;
    if (!token) {
        throw new Error("Token tidak ditemukan dalam respons API.");
    }
    return token;
}

/**
 * Mengunggah file yang dipilih ke repositori GitHub.
 */
async function upload() {
    const owner = ownerEl.value.trim();
    const repo = repoEl.value.trim();
    const path = fullPathPreviewEl.textContent.trim();
    const file = fileInput.files[0];

    if (!file) {
        showStatus("Pilih file terlebih dahulu!", "error");
        return;
    }
    if (!owner || !repo || !path) {
        showStatus("Harap isi semua detail repositori dan pastikan ada nama file.", "error");
        return;
    }

    uploadButton.disabled = true;
    uploadButton.textContent = "Mengunggah...";
    showStatus("Sedang memproses...", "loading");

    try {
        showStatus("Mengambil token...", "loading");
        const token = await getToken();
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
        const headers = {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
        };

        let existingFileSha = null;
        showStatus("Mengecek file di repositori...", "loading");
        const checkResponse = await fetch(apiUrl, { headers });
        
        if (checkResponse.ok) {
            const existingFile = await checkResponse.json();
            existingFileSha = existingFile.sha;
        } else if (checkResponse.status !== 404) {
            const errorData = await checkResponse.json();
            throw new Error(errorData.message || `Gagal memeriksa file. Status: ${checkResponse.status}`);
        }

        showStatus("Membaca dan mengenkode file...", "loading");
        const content = await file.text();
        const encodedContent = btoa(unescape(encodeURIComponent(content)));

        const commitMessage = `feat: ${existingFileSha ? 'update' : 'add'} file ${path}`;
        const body = {
            message: commitMessage,
            content: encodedContent,
        };
        if (existingFileSha) {
            body.sha = existingFileSha;
        }

        showStatus(`Mengunggah ${existingFileSha ? 'pembaruan' : 'file baru'}...`, "loading");
        const response = await fetch(apiUrl, {
            method: "PUT",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await response.json();

        if (response.ok) {
            const successMessage = existingFileSha ? "File berhasil diperbarui!" : "File berhasil dibuat!";
            showStatus(successMessage, "success");
            fetchAndDisplaySubtitleFiles(); // Muat ulang daftar file setelah berhasil
        } else {
            throw new Error(data.message || `Gagal dengan status ${response.status}`);
        }

    } catch (error) {
        showStatus(`Gagal mengunggah: ${error.message}`, "error");
        console.error("Upload error:", error);
    } finally {
        uploadButton.disabled = false;
        uploadButton.textContent = "Unggah ke GitHub";
    }
}

/**
 * Mengambil dan menampilkan semua file .srt dan .vtt dari repositori yang ditentukan.
 */
async function fetchAndDisplaySubtitleFiles() {
    const owner = ownerEl.value.trim();
    const repo = repoEl.value.trim();

    if (!owner || !repo) {
        srtFilesListEl.innerHTML = '<p class="text-gray-400">Masukkan pemilik dan nama repositori untuk melihat daftar file.</p>';
        return;
    }

    srtFilesListEl.innerHTML = '<p class="text-blue-300">Memuat daftar file subtitle...</p>';

    try {
        const token = await getToken();
        const headers = {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
        };

        const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/main?recursive=1`, { headers });
        if (!treeResponse.ok) {
             const masterTreeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`, { headers });
            if (!masterTreeResponse.ok) throw new Error('Gagal mengambil struktur file dari branch main atau master.');
            const treeData = await masterTreeResponse.json();
            displaySubtitleFiles(treeData.tree, owner, repo);
            return;
        }
        const treeData = await treeResponse.json();
        displaySubtitleFiles(treeData.tree, owner, repo);

    } catch (error) {
        srtFilesListEl.innerHTML = `<p class="text-red-400">Gagal memuat file: ${error.message}</p>`;
        console.error("Fetch subtitle files error:", error);
    }
}

/**
 * Merender daftar file subtitle ke DOM.
 * @param {Array} tree - Daftar file dari API GitHub Tree.
 * @param {string} owner - Pemilik repositori.
 * @param {string} repo - Nama repositori.
 */
function displaySubtitleFiles(tree, owner, repo) {
    const subtitleFiles = tree.filter(item => {
        const lowerPath = item.path.toLowerCase();
        return item.type === 'blob' && (lowerPath.endsWith('.srt') || lowerPath.endsWith('.vtt'));
    });

    srtFilesListEl.innerHTML = ''; // Hapus pesan loading

    if (subtitleFiles.length === 0) {
        srtFilesListEl.innerHTML = '<p class="text-gray-400">Tidak ada file .srt atau .vtt ditemukan di repositori ini.</p>';
        return;
    }

    subtitleFiles.forEach(file => {
        const fileItem = document.createElement('div');
        fileItem.className = 'flex justify-between items-center bg-gray-700 p-2 rounded mb-2';

        const filePathEl = document.createElement('span');
        filePathEl.className = 'text-gray-300 font-mono text-sm break-all pr-2';
        filePathEl.textContent = file.path;

        const copyButton = document.createElement('button');
        copyButton.textContent = 'Salin Tautan';
        copyButton.className = 'bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-1 px-2 rounded flex-shrink-0';
        copyButton.style.width = 'auto';
        copyButton.style.marginTop = '0';
        
        copyButton.onclick = () => {
            const url = `https://${owner}.github.io/${repo}/${file.path}`;
            navigator.clipboard.writeText(url).then(() => {
                copyButton.textContent = 'Disalin!';
                setTimeout(() => {
                    copyButton.textContent = 'Salin Tautan';
                }, 2000);
            });
        };

        fileItem.appendChild(filePathEl);
        fileItem.appendChild(copyButton);
        srtFilesListEl.appendChild(fileItem);
    });
}


/**
 * Menampilkan pesan status di UI.
 * @param {string} message Pesan yang akan ditampilkan.
 * @param {'success' | 'error' | 'loading'} type Jenis pesan.
 */
function showStatus(message, type) {
    statusEl.textContent = message;
    statusEl.style.display = 'block';

    statusEl.className = 'mt-4 p-3 rounded-md text-center font-bold';

    if (type === 'success') {
        statusEl.classList.add('status-success');
    } else if (type === 'error') {
        statusEl.classList.add('status-error');
    } else { // 'loading'
        statusEl.classList.add('text-blue-200', 'bg-blue-900/50');
    }
}
