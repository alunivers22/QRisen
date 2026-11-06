(function () {
  "use strict";

  // Database Simulasi
  const DB = [
    { id: "9360091500001", name: "WARUNG BERKAH SEJAHTERA", owner: "Su***", status: "safe",   bank: "PT Bank BCA" },
    { id: "9920131299999", name: "TOKO PALSU ELEKTRONIK",   owner: "Bu***", status: "danger", reason: "QRIS Tempel (Overlay) terdeteksi" },
    { id: "9360091500002", name: "KOPI BORNEO ASLI",        owner: "Ah***", status: "safe",   bank: "PT Bank Mandiri" },
    { id: "8823910293812", name: "REKENING PENIPUAN BUDI",  owner: "Bu***", status: "danger", reason: "Rekening dilaporkan 15+ kali" },
    { id: "9360091599999", name: "TOKO SINAR JAYA",         owner: "Al***", status: "unknown", reason: "NMID belum terdaftar di database ASPI / BI" }
  ];

  let currentScanIndex = 0;
  let activeStream = null;
  let currentFacingMode = "environment";

  window.showScreen = function(name) {
    document.querySelectorAll(".screen").forEach(s => s.classList.toggle("active", s.dataset.screen === name));
    document.querySelectorAll("[data-nav]").forEach(n => n.classList.toggle("active", n.dataset.nav === name));

    const titles = {
      "dashboard": { t: "Dashboard", s: "Pantau perlindungan QRIS" },
      "cek-qris":  { t: "Cek QRIS",  s: "Verifikasi payload forensik" },
      "safe-qris": { t: "Safe QRIS", s: "Pusat laporan komunitas" },
      "isen-map":  { t: "ISEN Map",  s: "Peta risiko real-time" }
    };
    if (titles[name]) {
      document.getElementById("page-title").textContent = titles[name].t;
      document.getElementById("page-subtitle").textContent = titles[name].s;
    }

    if (name === 'cek-qris') {
      startCamera();
    } else {
      stopCamera();
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  document.addEventListener("click", e => {
    const nav = e.target.closest("[data-nav]");
    if (nav) { e.preventDefault(); showScreen(nav.dataset.nav); }
  });

  const videoEl = document.getElementById("camera-feed");
  const scannerContainer = document.getElementById("scanner-container");

  async function startCamera() {
    stopCamera();
    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: currentFacingMode } } });
      } catch (err) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      videoEl.srcObject = stream;
      await videoEl.play().catch(console.warn);
      activeStream = stream;

      const errDiv = scannerContainer.querySelector(".camera-error");
      if (errDiv) errDiv.remove();

    } catch (err) {
      console.warn("Kamera gagal/diblokir", err);
      if (scannerContainer && !scannerContainer.querySelector(".camera-error")) {
        const errDiv = document.createElement("div");
        errDiv.className = "camera-error";
        errDiv.innerHTML = `
          <span class="material-symbols-outlined" style="font-size:36px;margin-bottom:8px;color:#ef4444;">videocam_off</span>
          <p style="font-size:12px;color:#fff;font-weight:bold;">Kamera Tidak Aktif / Diblokir</p>
        `;
        scannerContainer.appendChild(errDiv);
      }
    }
  }

  function stopCamera() {
    if (activeStream) {
      activeStream.getTracks().forEach(track => track.stop());
      activeStream = null;
      videoEl.srcObject = null;
    }
  }

  document.getElementById("switch-camera-btn")?.addEventListener("click", () => {
    currentFacingMode = currentFacingMode === "environment" ? "user" : "environment";
    startCamera();
  });

  window.simulateScan = function() {
    const btn = document.getElementById("btn-simulate");
    const badge = document.getElementById("scan-status-badge");

    document.getElementById("ui-empty").classList.add("hidden");
    document.getElementById("ui-safe").classList.add("hidden");
    document.getElementById("ui-alert").classList.add("hidden");
    document.getElementById("ui-unknown")?.classList.add("hidden");

    if (btn) {
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;animation:spin 1s linear infinite;">sync</span> Memindai...`;
      btn.disabled = true;
    }
    if (badge) {
      badge.textContent = "Mencocokkan...";
      badge.className = "badge badge-sky";
    }

    setTimeout(() => {
      const record = DB[currentScanIndex];
      currentScanIndex = (currentScanIndex + 1) % DB.length;

      if (btn) {
        btn.innerHTML = `<span class="material-symbols-outlined" style="font-size:18px;">center_focus_strong</span> Simulasikan Scan`;
        btn.disabled = false;
      }

      if (record.status === "unknown") {
        if(document.getElementById("unknown-name"))  document.getElementById("unknown-name").textContent  = record.name;
        if(document.getElementById("unknown-nmid"))  document.getElementById("unknown-nmid").textContent  = `NMID: ${record.id}`;
        if(document.getElementById("unknown-owner")) document.getElementById("unknown-owner").textContent = record.owner;
        if(document.getElementById("unknown-desc"))  document.getElementById("unknown-desc").innerHTML =
          `<strong>NMID ini belum tercatat di database ASPI / BI.</strong> Bukan otomatis penipuan — ${record.reason}.`;

        document.getElementById("ui-unknown").classList.remove("hidden");
        if (badge) {
          badge.textContent = "Belum Terdaftar";
          badge.className = "badge badge-amber";
        }
      } else if (record.status === "safe") {
        if(document.getElementById("res-name"))  document.getElementById("res-name").textContent  = record.name;
        if(document.getElementById("res-nmid"))  document.getElementById("res-nmid").textContent  = `NMID: ${record.id}`;
        if(document.getElementById("res-owner")) document.getElementById("res-owner").textContent = record.owner;

        document.getElementById("ui-safe").classList.remove("hidden");
        if (badge) {
          badge.textContent = "Lulus";
          badge.className = "badge badge-green";
        }
      } else {
        if(document.getElementById("alert-title")) document.getElementById("alert-title").textContent = record.name;
        if(document.getElementById("alert-desc"))  document.getElementById("alert-desc").textContent  = `Anomali: ${record.reason}`;
        if(document.getElementById("alert-owner")) document.getElementById("alert-owner").textContent = record.owner;

        document.getElementById("ui-alert").classList.remove("hidden");
        if (badge) {
          badge.textContent = "Bahaya";
          badge.className = "badge badge-red-solid";
        }
      }
    }, 1000);
  };

  window.resetScan = function() {
    document.getElementById("ui-empty")?.classList.remove("hidden");
    document.getElementById("ui-safe")?.classList.add("hidden");
    document.getElementById("ui-alert")?.classList.add("hidden");
    document.getElementById("ui-unknown")?.classList.add("hidden");
    const badge = document.getElementById("scan-status-badge");
    if(badge) {
      badge.textContent = "Menunggu Scan...";
      badge.className = "badge badge-slate";
    }
  };

  document.getElementById("btn-cancel")?.addEventListener("click", function() {
    alert("✅ PEMBAYARAN DIBATALKAN!\n\nSesi transaksi telah dikunci.");
    resetScan();
  });

  document.getElementById("btn-lanjut")?.addEventListener("click", function() {
    alert("🔒 MENGHUBUNGKAN KE GATEWAY...\n\nTransaksi aman.");
  });

  document.getElementById("btn-caution")?.addEventListener("click", function() {
    const ok = confirm(
      "⚠️ MERCHANT BELUM TERDAFTAR\n\n" +
      "Anda akan melanjutkan ke merchant yang BELUM diverifikasi.\n\n" +
      "Pastikan:\n" +
      "• Nama merchant & nama pemilik sesuai papan display\n" +
      "• Nominal pembayaran benar\n" +
      "• Anda mengenal / percaya penjual\n\n" +
      "Lanjutkan?"
    );
    if (ok) {
      alert("🔓 MELANJUTKAN DENGAN HATI-HATI\n\nTetap waspada. Jangan bagikan OTP / PIN ke siapa pun.");
      resetScan();
    }
  });

  // --- MODAL UBAH LOKASI ---
  window.openLocationModal = function() {
    document.getElementById("location-modal").classList.remove("hidden");
  };

  window.closeLocationModal = function() {
    document.getElementById("location-modal").classList.add("hidden");
  };

  window.selectLocation = function(title, lat, lng) {
    document.getElementById("gps-title").textContent = title;
    document.getElementById("gps-coords").textContent = `Palangka Raya (${lat}, ${lng})`;
    closeLocationModal();
    
    // Tampilkan toast
    const t = document.getElementById("toast");
    const m = document.getElementById("toast-msg");
    if(t && m) {
      m.textContent = "Lokasi berhasil diperbarui!";
      t.classList.add("show");
      setTimeout(() => t.classList.remove("show"), 3000);
    }
  };
  // -----------------------------------------

  window.handleFile = function(input) {
    if (input.files && input.files[0]) {
      document.getElementById("upload-idle")?.classList.add("hidden");
      const preview = document.getElementById("upload-preview");
      if(preview) {
        preview.classList.remove("hidden");
        preview.style.display = "flex";
      }
      const fileName = document.getElementById("file-name");
      if(fileName) fileName.textContent = input.files[0].name;

      const reader = new FileReader();
      reader.onload = e => {
        const img = document.getElementById("preview-img");
        if(img) img.src = e.target.result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  };

  window.submitReport = function() {
    const btn = document.getElementById("submit-btn");
    if(btn) {
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined" style="animation:spin 1s linear infinite">refresh</span> Mengirim...`;
    }

    setTimeout(() => {
      if(btn) btn.classList.add("hidden");
      document.getElementById("success-box")?.classList.remove("hidden");
    }, 1000);
  };

  // MARKERS UPDATE
  const MARKERS = {
    pasar: { title: "Laporan Penipuan", badge: "Zona Bahaya", badgeClass: "badge-red-solid", icon: "warning", iconClass: "red", modus: "Penipuan", count: "5 Korban", status: "Penyisiran Satgas", note: "Bahaya! Jangan Transfer", noteClass: "red" },
    bundaran: { title: "Gangguan Transaksi", badge: "Waspada", badgeClass: "badge-amber", icon: "notification_important", iconClass: "amber", modus: "Gangguan Jaringan", count: "5 Laporan", status: "Verifikasi Auditor", note: "Transaksi Sering Gagal", noteClass: "amber" },
    flamboyan: { title: "Pusat Kuliner Flamboyan", badge: "Zona Aman", badgeClass: "badge-green", icon: "verified", iconClass: "green", modus: "QRIS Bersegel Hologram", count: "34 Merchant", status: "Aman", note: "Aman untuk transaksi", noteClass: "green" }
  };

  window.pickMarker = function(id) {
    const m = MARKERS[id];
    if (!m) return;
    if(document.getElementById("insp-title")) document.getElementById("insp-title").textContent = m.title;
    const badge = document.getElementById("insp-badge");
    if(badge) {
      badge.textContent = m.badge;
      badge.className = `badge ${m.badgeClass}`;
    }
    if(document.getElementById("insp-icon")) document.getElementById("insp-icon").className = `inspector-icon ${m.iconClass}`;
    if(document.getElementById("insp-symbol")) document.getElementById("insp-symbol").textContent = m.icon;
    if(document.getElementById("insp-modus")) document.getElementById("insp-modus").textContent = m.modus;
    if(document.getElementById("insp-count")) document.getElementById("insp-count").textContent = m.count;
    if(document.getElementById("insp-status")) document.getElementById("insp-status").textContent = m.status;
    if(document.getElementById("insp-note-text")) document.getElementById("insp-note-text").textContent = m.note;
    if(document.getElementById("insp-note")) document.getElementById("insp-note").className = `inspector-note ${m.noteClass}`;
  };

  window.applyFilter = function(btn, type) {
    document.querySelectorAll(".chip-filter").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    document.querySelectorAll(".map-marker").forEach(marker => {
      const status = marker.dataset.status;
      marker.classList.toggle("hidden-marker", (type !== "all" && status !== type));
    });

    if (type === "all" || type === "danger") pickMarker('pasar');
    else if (type === "warning") pickMarker('bundaran');
    else if (type === "safe") pickMarker('flamboyan');
  };

  const laser = document.getElementById("laser");
  if (laser) {
    let pos = 0, dir = 1, max = 210, min = 10;
    (function step() {
      pos += dir * 2.2;
      if (pos >= max) dir = -1; else if (pos <= min) dir = 1;
      laser.style.transform = `translateY(${pos}px)`;
      requestAnimationFrame(step);
    })();
  }

  showScreen("dashboard");

})();