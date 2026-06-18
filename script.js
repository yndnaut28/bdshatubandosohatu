document.addEventListener("DOMContentLoaded", () => {
  // === Dropdown logic ===
  const customSelect = document.querySelector(".custom-select");
  const selected = customSelect.querySelector(".selected");
  const optionsList = customSelect.querySelectorAll(".options div");

  // === Search & Filter logic ===
  const searchInput = document.getElementById("searchInput");
  const allCards = document.querySelectorAll(".card-container .card");
  
  let currentFilter = "all";
  let currentSearchTerm = "";

  const categoryNameMap = new Map();
  optionsList.forEach(option => {
    if (option.dataset.value !== "all") {
      categoryNameMap.set(option.dataset.value, option.textContent);
    }
  });

  function normalizeText(text) {
    return text.toLowerCase()
               .normalize("NFD")
               .replace(/[\u0300-\u036f]/g, "")
               .replace(/đ/g, "d");
  }

  function filterCards() {
    const normalizedSearchTerm = normalizeText(currentSearchTerm);
    allCards.forEach(card => {
      const cardTypeString = card.dataset.type || "";
      const cardTypesArray = cardTypeString.split(' ');
      const cardTitle = card.querySelector(".card-text h3").textContent;
      const cardAddress = card.querySelector(".card-text p").textContent;
      const cardKeywords = card.dataset.keywords || "";
      const categoryNames = cardTypesArray.map(type => categoryNameMap.get(type) || "").join(" ");

      const searchableText = cardTitle + " " + cardAddress + " " + cardKeywords + " " + categoryNames;
      const normalizedCardText = normalizeText(searchableText);
      const filterMatch = (currentFilter === "all") || cardTypesArray.includes(currentFilter);
      const searchMatch = normalizedCardText.includes(normalizedSearchTerm);

      card.style.display = (filterMatch && searchMatch) ? "flex" : "none";
    });
  }

  selected.addEventListener("click", () => customSelect.classList.toggle("active"));
  optionsList.forEach(option => {
    option.addEventListener("click", () => {
      selected.textContent = option.textContent;
      customSelect.classList.remove("active");
      currentFilter = option.dataset.value;
      filterCards(); 
    });
  });

  searchInput.addEventListener("input", () => {
    currentSearchTerm = searchInput.value;
    filterCards();
  });

  document.addEventListener("click", e => {
    if (!customSelect.contains(e.target)) customSelect.classList.remove("active");
  });

// === Slideshow & Dot Indicators (Lỗi 5.2) ===
  const cardImagesContainers = document.querySelectorAll('.card-img');
  
  cardImagesContainers.forEach(container => {
      // Lấy cả thẻ img và video
      const mediaElements = container.querySelectorAll('img, video');
      if (mediaElements.length <= 1) return;

      // Tạo dots
      const dotsDiv = document.createElement('div');
      dotsDiv.className = 'dot-indicator';
      mediaElements.forEach((_, i) => {
          const dot = document.createElement('span');
          dot.className = 'dot' + (i === 0 ? ' active' : '');
          dotsDiv.appendChild(dot);
      });
      container.appendChild(dotsDiv);

      let currentIdx = 0;
      const dots = dotsDiv.querySelectorAll('.dot');
      let slideTimer;

      function playNext() {
          // Xóa class active của phần tử hiện tại
          mediaElements[currentIdx].classList.remove('active');
          dots[currentIdx].classList.remove('active');
          
          // Nếu phần tử hiện tại là video, hãy tạm dừng và tua lại từ đầu
          if (mediaElements[currentIdx].tagName.toLowerCase() === 'video') {
              mediaElements[currentIdx].pause();
              mediaElements[currentIdx].currentTime = 0;
          }

          // Chuyển sang phần tử tiếp theo
          currentIdx = (currentIdx + 1) % mediaElements.length;
          
          // Thêm class active cho phần tử mới
          const nextMedia = mediaElements[currentIdx];
          nextMedia.classList.add('active');
          dots[currentIdx].classList.add('active');

          // Đặt lịch chuyển slide tiếp theo
          scheduleNext(nextMedia);
      }

      function scheduleNext(media) {
          clearTimeout(slideTimer);
          
          if (media.tagName.toLowerCase() === 'video') {
              // Bắt đầu phát video
              const playPromise = media.play();
              if (playPromise !== undefined) {
                  playPromise.catch(error => {
                      // Nếu trình duyệt chặn Autoplay, tự động bỏ qua sau 3 giây
                      slideTimer = setTimeout(playNext, 3000);
                  });
              }
              // Lắng nghe sự kiện video kết thúc thì chuyển slide (chỉ gọi 1 lần)
              media.addEventListener('ended', playNext, { once: true });
          } else {
              // Nếu là ảnh, tự động chuyển sau 3 giây
              slideTimer = setTimeout(playNext, 3000);
          }
      }

      // Kích hoạt logic đếm ngược/chờ cho phần tử đầu tiên ngay khi tải
      scheduleNext(mediaElements[0]);
  });

// === Modal Logic & Keyboard Support (Hỗ trợ Ảnh & Video) ===
  let currentMediaList = []; // Chuyển từ danh sách ảnh thành danh sách media tổng hợp
  let currentIdx = 0;
  let currentTitle = "";
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("imgFull");
  const modalVideo = document.getElementById("videoFull"); // Lấy thêm phần tử video của modal
  const captionText = document.getElementById("caption");

  function updateModal() {
      const currentMedia = currentMediaList[currentIdx];
      
      // Mỗi lần chuyển slide trong modal, tạm dừng video hiện tại (nếu có) và tua về đầu
      modalVideo.pause();
      modalVideo.currentTime = 0;

      if (currentMedia.type === 'video') {
          // Ẩn ảnh, hiện video
          modalImg.style.display = "none";
          modalVideo.style.display = "block";
          modalVideo.src = currentMedia.src;
          
          // Tự động phát video trong modal
          modalVideo.play().catch(err => console.log("Autoplay trong modal bị chặn hoặc lỗi"));
      } else {
          // Ẩn video, hiện ảnh
          modalVideo.style.display = "none";
          modalImg.style.display = "block";
          modalImg.src = currentMedia.src;
      }

      // Cập nhật lại thanh tiêu đề đếm số lượng
      captionText.innerText = currentTitle + " (" + (currentIdx + 1) + "/" + currentMediaList.length + ")";
  }

  document.querySelectorAll(".view-img-btn").forEach(btn => {
      btn.addEventListener("click", function() {
          const card = this.closest(".card");
          currentTitle = card.querySelector("h3").textContent;
          
          // Lấy tất cả phần tử img và video nằm bên trong .card-img của card này
          const allMedia = card.querySelectorAll(".card-img img, .card-img video");
          
          // Tạo mảng đối tượng lưu thông tin loại thẻ (tag) và đường dẫn (src)
          currentMediaList = Array.from(allMedia).map(media => {
              return {
                  type: media.tagName.toLowerCase(),
                  src: media.src
              };
          });
          
          currentIdx = 0;
          modal.style.display = "flex";
          updateModal();
      });
  });

  document.querySelector(".modal-next").onclick = () => {
      if (currentMediaList.length <= 1) return;
      currentIdx = (currentIdx + 1) % currentMediaList.length;
      updateModal();
  };

  document.querySelector(".modal-prev").onclick = () => {
      if (currentMediaList.length <= 1) return;
      currentIdx = (currentIdx - 1 + currentMediaList.length) % currentMediaList.length;
      updateModal();
  };

  const closeModal = () => {
      modal.style.display = "none";
      modalVideo.pause(); // Dừng video ngay lập tức khi tắt modal
      modalVideo.src = ""; // Giải phóng tài nguyên video ngầm
  };

  document.querySelector(".close-modal").onclick = closeModal;

  // Đóng khi click ra vùng nền đen bên ngoài bản xem chi tiết
  modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
  });

  // Hỗ trợ các phím điều hướng mũi tên & ESC tắt modal nhanh
  document.addEventListener("keydown", (e) => {
      if (modal.style.display === "flex") {
          if (e.key === "ArrowRight") document.querySelector(".modal-next").click();
          if (e.key === "ArrowLeft") document.querySelector(".modal-prev").click();
          if (e.key === "Escape") closeModal();
      }
  });

  filterCards();
});
let ytPlayer;

window.addEventListener('load', () => {
    const muteBtn = document.getElementById('custom-mute-btn');
    const muteIcon = document.getElementById('mute-icon');
    const ytIframe = document.getElementById('yt-video');
    
    // Mặc định video đang bị tắt tiếng do thuộc tính autoplay
    let isMuted = true; 

    muteBtn.addEventListener('click', () => {
        if (isMuted) {
            ytIframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
            ytIframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
            muteIcon.textContent = '🔊';
            isMuted = false;
        } else {
            // Bắn lệnh mute
            ytIframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
            muteIcon.textContent = '🔇';
            isMuted = true;
        }
    });
});
