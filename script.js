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

// === Slideshow & Dot Indicators ===
  const cardImagesContainers = document.querySelectorAll('.card-img');

  cardImagesContainers.forEach(container => {
      // Chỉ tìm img và video cục bộ (Không dùng iframe ở ngoài Card nữa)
      const mediaElements = container.querySelectorAll('img, video'); 
      if (mediaElements.length <= 1) return;

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
          const currentMedia = mediaElements[currentIdx];
          currentMedia.classList.remove('active');
          dots[currentIdx].classList.remove('active');

          if (currentMedia.tagName.toLowerCase() === 'video') {
              currentMedia.pause();
              currentMedia.currentTime = 0;
          }

          currentIdx = (currentIdx + 1) % mediaElements.length;

          const nextMedia = mediaElements[currentIdx];
          nextMedia.classList.add('active');
          dots[currentIdx].classList.add('active');

          scheduleNext(nextMedia);
      }

      function scheduleNext(media) {
          clearTimeout(slideTimer);

          if (media.tagName.toLowerCase() === 'video') {
              const playPromise = media.play();
              if (playPromise !== undefined) {
                  playPromise.catch(() => slideTimer = setTimeout(playNext, 3000));
              }
              media.addEventListener('ended', playNext, { once: true });
          } else {
              // Ảnh thường và ảnh bìa Youtube đều trượt sau 3 giây
              slideTimer = setTimeout(playNext, 3000); 
          }
      }

      scheduleNext(mediaElements[0]);
  });

  // === Modal Logic & Keyboard Support ===
  let currentMediaList = [];
  let currentIdx = 0;
  let currentTitle = "";

  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("imgFull");
  const modalVideo = document.getElementById("videoFull");
  const modalIframe = document.getElementById("iframeFull");
  const captionText = document.getElementById("caption");

  function updateModal() {
      const currentMedia = currentMediaList[currentIdx];

      if (modalVideo) { modalVideo.pause(); modalVideo.currentTime = 0; }
      if (modalIframe) { modalIframe.src = ""; }

      modalImg.style.display = "none";
      modalVideo.style.display = "none";
      modalIframe.style.display = "none";

      if (currentMedia.type === 'video') {
          modalVideo.style.display = "block";
          modalVideo.src = currentMedia.src;
          modalVideo.play().catch(e => console.log(e));
      } else if (currentMedia.type === 'youtube') {
          // Bật chế độ YouTube to rõ ràng khi xem chi tiết
          modalIframe.style.display = "block";
          let url = new URL(currentMedia.src);
          url.searchParams.set('autoplay', '1');
          url.searchParams.set('controls', '1');
          url.searchParams.set('playsinline', '1');
          modalIframe.src = url.toString();
      } else {
          modalImg.style.display = "block";
          modalImg.src = currentMedia.src;
      }

      captionText.innerText = currentTitle + " (" + (currentIdx + 1) + "/" + currentMediaList.length + ")";
  }

  document.querySelectorAll(".view-img-btn").forEach(btn => {
      btn.addEventListener("click", function() {
          const card = this.closest(".card");
          currentTitle = card.querySelector("h3").textContent;

          const allMedia = card.querySelectorAll(".card-img img, .card-img video");

          currentMediaList = Array.from(allMedia).map(media => {
              // Nhận diện ảnh nào là YouTube thì chuyển vào Modal dạng iframe
              if (media.tagName.toLowerCase() === 'img' && media.hasAttribute('data-youtube')) {
                  return { type: 'youtube', src: media.getAttribute('data-youtube') };
              }
              return { type: media.tagName.toLowerCase(), src: media.src };
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
      if (modalVideo) { modalVideo.pause(); modalVideo.src = ""; }
      if (modalIframe) modalIframe.src = "";
  };

  document.querySelector(".close-modal").onclick = closeModal;

  modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
  });

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
