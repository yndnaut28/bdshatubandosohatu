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
      const images = container.querySelectorAll('img');
      if (images.length <= 1) return;

      // Tạo dots
      const dotsDiv = document.createElement('div');
      dotsDiv.className = 'dot-indicator';
      images.forEach((_, i) => {
          const dot = document.createElement('span');
          dot.className = 'dot' + (i === 0 ? ' active' : '');
          dotsDiv.appendChild(dot);
      });
      container.appendChild(dotsDiv);

      let currentIdx = 0;
      const dots = dotsDiv.querySelectorAll('.dot');
      
      setInterval(() => {
          images[currentIdx].classList.remove('active');
          dots[currentIdx].classList.remove('active');
          currentIdx = (currentIdx + 1) % images.length;
          images[currentIdx].classList.add('active');
          dots[currentIdx].classList.add('active');
      }, 3000); 
  });

  // === Modal Logic & Keyboard Support (Lỗi 5.2) ===
  let currentImgList = [];
  let currentIdx = 0;
  let currentTitle = "";
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("imgFull");
  const captionText = document.getElementById("caption");

  function updateModal() {
      modalImg.src = currentImgList[currentIdx];
      captionText.innerText = currentTitle + " (" + (currentIdx + 1) + "/" + currentImgList.length + ")";
  }

  document.querySelectorAll(".view-img-btn").forEach(btn => {
      btn.addEventListener("click", function() {
          const card = this.closest(".card");
          currentTitle = card.querySelector("h3").textContent;
          const allImgs = card.querySelectorAll(".card-img img");
          currentImgList = Array.from(allImgs).map(img => img.src);
          currentIdx = 0;
          modal.style.display = "flex";
          updateModal();
      });
  });

  document.querySelector(".modal-next").onclick = () => {
      currentIdx = (currentIdx + 1) % currentImgList.length;
      updateModal();
  };

  document.querySelector(".modal-prev").onclick = () => {
      currentIdx = (currentIdx - 1 + currentImgList.length) % currentImgList.length;
      updateModal();
  };

  const closeModal = () => modal.style.display = "none";
  document.querySelector(".close-modal").onclick = closeModal;

  // Đóng khi click backdrop
  modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
  });

  // Hỗ trợ phím mũi tên & ESC
  document.addEventListener("keydown", (e) => {
      if (modal.style.display === "flex") {
          if (e.key === "ArrowRight") document.querySelector(".modal-next").click();
          if (e.key === "ArrowLeft") document.querySelector(".modal-prev").click();
          if (e.key === "Escape") closeModal();
      }
  });

  filterCards();
});