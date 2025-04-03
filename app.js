const SUPABASE_URL = 'https://mkaqtowoyddwftmqlhor.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1rYXF0b3dveWRkd2Z0bXFsaG9yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MjM2MTksImV4cCI6MjA1ODA5OTYxOX0.vTvxyrbz2Bag3SN05wnRaVuaRDLu1oMCEwoJUK5ad38';

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const albumSelect = document.getElementById("albumSelect");
const uploadAlbumSelect = document.getElementById("uploadAlbumSelect");
const fileList = document.getElementById("fileList");
const addAlbumBtn = document.getElementById("addAlbumBtn");
const albumModal = document.getElementById("albumModal");
const saveAlbumBtn = document.getElementById("saveAlbumBtn");
const cancelAlbumBtn = document.getElementById("cancelAlbumBtn");
const albumNameInput = document.getElementById("albumNameInput");
const uploadForm = document.getElementById('uploadForm');
const toggleViewBtn = document.getElementById('toggleViewBtn');

async function loadAlbums() {
  const { data, error } = await supabase.from("albums").select("*").order("tanggal_buat", { ascending: false });
  if (error) {
    console.error("Gagal mengambil album:", error);
    return;
  }
  
  albumSelect.innerHTML = `<option value="">All Images</option>`;
  uploadAlbumSelect.innerHTML = `<option value="">All Images</option>`;
  
  data.forEach(album => {
    const option = `<option value="${album.id}">${album.nama_album}</option>`;
    albumSelect.innerHTML += option;
    uploadAlbumSelect.innerHTML += option;
  });
}

albumSelect.addEventListener("change", loadFiles);

addAlbumBtn.addEventListener("click", () => albumModal.classList.remove("hidden"));
cancelAlbumBtn.addEventListener("click", () => albumModal.classList.add("hidden"));

saveAlbumBtn.addEventListener("click", async () => {
  const nama_album = albumNameInput.value.trim();
  if (!nama_album) {
    alert("Nama album tidak boleh kosong!");
    return;
  }

  const { error } = await supabase.from("albums").insert([{ nama_album }]);
  if (error) {
    console.error("Gagal menambah album:", error);
    return;
  }

  alert("Album berhasil ditambahkan!");
  albumModal.classList.add("hidden");
  albumNameInput.value = "";
  loadAlbums();
});

let isGridView = false;
console.log('Supabase initialized:', supabase);

async function loadFiles() {
  const albumId = albumSelect.value;
  let query = supabase.from("dokumen_files").select("*").order("tanggal_upload", { ascending: false });

   // ⛔ 
  if (!albumId || albumId === "") {
    query = query.neq("album_id", "71dd9b79-c381-40d6-b8b7-b7fe183db609"); // Hanya menyembunyikan album "yab"
  } else {
    query = query.eq("album_id", albumId); // Jika ada album dipilih, hanya tampilkan album tersebut
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error ambil file:', error);
    return;
  }

  fileList.innerHTML = '';
  fileList.className = isGridView ? 'grid grid-cols-2' : 'space-y-2';

  data.forEach(file => {
    const li = document.createElement('li');
    li.className = 'flex flex-col md:flex-row justify-between items-start md:items-end  gap-2';
    const filePath = file.file_path;
    const fileExt = filePath.split('.').pop().toLowerCase();
    const customPublicUrl = `${SUPABASE_URL}/storage/v1/object/public/${file.file_path}`;
    let previewElement = '';

    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
      previewElement = `<img src="${customPublicUrl}" alt="${file.nama_file}" class="w-full h-[150px] object-cover rounded-lg px-1 cursor-pointer transition-height" onclick="toggleExpand(this)" />`;
    } else if (fileExt === 'pdf') {
      previewElement = `<button class="preview-pdf-btn bg-blue-500 text-white px-3 py-1 rounded" data-url="${customPublicUrl}">Preview PDF</button>`;
    } else {
      previewElement = `<div class="text-gray-500">No Preview</div>`;
    }

    li.innerHTML = `
      <div class="flex flex-col space-y-2 max-w-sm w-full rounded-lg mx-auto relative">
        <div class="flex flex-col items-center space-y-1">
          ${previewElement}
          <span class="text-white font-medium truncate w-full text-center">${file.nama_file}</span>
        </div>
        <div class="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-5 bg-white bg-opacity-50 backdrop-blur-sm p-2 rounded-lg">
          <a href="${customPublicUrl}" target="_blank" class="text-gray-800 hover:text-gray-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <button onclick="deleteFile('${file.id}', '${file.file_path}')" class="text-red-500 hover:text-red-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button onclick="moveToAlbum('${file.id}')" class="text-blue-500 hover:text-blue-700">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M10 12l2-2m0 0l2 2m-2-2v6" />
            </svg>
          </button>
        </div>
      </div>
    `;
    fileList.appendChild(li);
  });

  document.querySelectorAll('.preview-pdf-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pdfUrl = e.target.getAttribute('data-url');
      showPdfPreview(pdfUrl);
    });
  });
}

function toggleExpand(img) {
  if (img.classList.contains('expanded')) {
    img.style.height = '150px';
  } else {
    img.style.height = 'auto';
    
  }
  img.classList.toggle('expanded');
}

function showPdfPreview(url) {
  const modal = document.getElementById('pdfModal');
  const viewer = document.getElementById('pdfViewer');
  modal.classList.remove('hidden');
  viewer.src = url;
}

document.getElementById('closePdfModal').addEventListener('click', () => {
  const modal = document.getElementById('pdfModal');
  const viewer = document.getElementById('pdfViewer');
  modal.classList.add('hidden');
  viewer.src = '';
});

function closePreview() {
  const modal = document.getElementById('previewModal');
  const iframe = document.getElementById('pdfViewer');
  iframe.src = '';
  modal.classList.add('hidden');
}

async function deleteFile(fileId, filePath) {
  const confirmed = confirm('Yakin mau hapus file ini?');
  if (!confirmed) return;
  const { error: deleteStorageError } = await supabase
    .storage
    .from('dokumen')
    .remove([filePath]);

  if (deleteStorageError) {
    console.error('Gagal hapus file dari storage:', deleteStorageError);
    alert('Gagal hapus file dari storage!');
    return;
  }

  const { error: deleteDbError } = await supabase
    .from('dokumen_files')
    .delete()
    .eq('id', fileId);

  if (deleteDbError) {
    console.error('Gagal hapus data dari database:', deleteDbError);
    alert('Gagal hapus data dari database!');
    return;
  }

  alert('File berhasil dihapus!');
  loadFiles();
}

async function moveToAlbum(fileId) {
  const modal = document.getElementById("albumSelectionModal");
  const albumDropdown = document.getElementById("albumDropdown");
  const closeModal = document.getElementById("closeAlbumModal");
  const moveButton = document.getElementById("moveToSelectedAlbum");

  // Fetch the list of albums
  const { data: albums, error } = await supabase.from("albums").select("*");
  if (error) {
    console.error("Gagal mengambil daftar album:", error);
    alert("Gagal mengambil daftar album!");
    return;
  }

  // If no albums exist, notify the user
  if (!albums || albums.length === 0) {
    alert("Tidak ada album yang tersedia. Silakan buat album terlebih dahulu.");
    return;
  }

  // Populate the dropdown with album options
  albumDropdown.innerHTML = '<option selected="">Select Album</option>';
  albums.forEach((album) => {
    const option = document.createElement("option");
    option.value = album.id;
    option.textContent = album.nama_album;
    albumDropdown.appendChild(option);
  });

  // Show the modal
  modal.classList.remove("hidden");

  // Handle the move action
  moveButton.onclick = async () => {
    const selectedAlbumId = albumDropdown.value;
    if (!selectedAlbumId) {
      alert("Pilih album terlebih dahulu!");
      return;
    }

    // Update the file's album_id in the database
    const { error: updateError } = await supabase
      .from("dokumen_files")
      .update({ album_id: selectedAlbumId })
      .eq("id", fileId);

    if (updateError) {
      console.error("Gagal memindahkan file ke album:", updateError);
      alert("Gagal memindahkan file ke album!");
      return;
    }

    alert("File berhasil dipindahkan ke album!");
    modal.classList.add("hidden"); // Close the modal
    loadFiles(); // Reload the file list to reflect the changes
  };

  // Close the modal when the close button is clicked
  closeModal.addEventListener("click", () => {
    modal.classList.add("hidden");
  });
}

uploadForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const progressBar = document.getElementById('progressBar');
  progressBar.style.width = '0%';

  const fileInput = document.getElementById("fileInput");
  const namaFile = document.getElementById("namaFile").value.trim();
  const albumId = document.getElementById("uploadAlbumSelect").value;

  if (!fileInput.files.length) {
      alert('Pilih minimal satu file!');
      return;
  }

  for (const file of fileInput.files) {
      await uploadFile(file, namaFile, albumId, progressBar);
  }

  alert('Semua file berhasil diupload!');
  uploadForm.reset();
  progressBar.style.width = '0%';
  loadFiles();
});

async function uploadFile(file, namaFile, albumId, progressBar) {
  const fileExt = file.name.split('.').pop();
  const filePath = `${Date.now()}_${file.name}`;

  const formData = new FormData();
  formData.append('cacheControl', '3600');
  formData.append('file', file);

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/dokumen/${filePath}`;

  return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', uploadUrl, true);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_KEY}`);

      xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
              const percent = Math.round((event.loaded / event.total) * 100);
              progressBar.style.width = `${percent}%`;
          }
      });

      xhr.onload = async () => {
          if (xhr.status === 200 || xhr.status === 201) {
              const { error: dbError } = await supabase.from("dokumen_files").insert([
                  { nama_file: namaFile, file_path: `dokumen/${filePath}`, album_id: albumId || null }
              ]);
              if (dbError) {
                  alert("Gagal simpan data!");
                  reject(dbError);
                  return;
              }
              resolve();
          } else {
              console.error(xhr.responseText);
              alert(`Gagal upload file ${file.name}!`);
              reject(xhr.responseText);
          }
      };

      xhr.onerror = () => {
          alert(`Gagal upload file ${file.name}!`);
          reject('Upload error');
      };

      xhr.send(file);
  });
}


  toggleViewBtn.addEventListener('click', () => {
    isGridView = !isGridView;
    toggleViewBtn.textContent = isGridView ? '▤' : '◫';
    loadFiles(); 
  });
  
  loadAlbums();
  loadFiles();
