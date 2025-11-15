// ==========================================
// DATA INITIALIZATION
// ==========================================

/**
 * Sample images array - Contains default gallery images
 * Each image object contains: url, width, height, category
 * Categories: nature, architecture, abstract, people, camera, documents
 */
let images = [];

// ==========================================
// STATE MANAGEMENT
// ==========================================

let currentFilter = "all"; // Current active filter (all, recent, camera, etc.)
let currentImageIndex = 0; // Current image index in lightbox
let filteredImages = [...images]; // Images after applying current filter
let uploadedImages = []; // Store user-uploaded images

// ==========================================
// IMAGE UPLOAD FUNCTIONALITY
// ==========================================

/**
 * Handle image upload button click
 * Triggers hidden file input
 */
document.getElementById("uploadBtn").addEventListener("click", () => {
  document.getElementById("imageUpload").click();
});

/**
 * Handle file input change event
 * Reads selected images and adds them to gallery
 */
document.getElementById("imageUpload").addEventListener("change", function (e) {
  const files = e.target.files;
  if (files.length === 0) return;

  // Process uploaded files
  uploadedImages = [];
  let loadedCount = 0;

  Array.from(files).forEach((file, index) => {
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();
      img.src = event.target.result;

      img.onload = function () {
        /**
         * Auto-categorize uploaded images as 'camera' uploads
         * All user-uploaded images go to Camera Uploads folder
         */
        let category = "camera";

        uploadedImages.push({
          url: event.target.result,
          width: img.width,
          height: img.height,
          category: category,
          uploadDate: new Date(),
          isRecent: true,
        });

        loadedCount++;

        /**
         * Once all images are loaded, update the gallery
         * Reset filter to 'all' and re-render
         */
        if (loadedCount === files.length) {
          images = [...uploadedImages];
          filteredImages = [...images];

          // Reset filter to "all"
          currentFilter = "all";
          document.querySelectorAll(".filter-btn").forEach((btn) => {
            btn.classList.remove("active");
            if (btn.getAttribute("data-filter") === "all") {
              btn.classList.add("active");
            }
          });

          // Re-render gallery
          const containerWidth = document.getElementById("gallery").offsetWidth;
          createJustifiedGallery(filteredImages, containerWidth);
        }
      };
    };

    reader.readAsDataURL(file);
  });
});

// ==========================================
// JUSTIFIED GALLERY LAYOUT ALGORITHM
// ==========================================

/**
 * Creates Google Photos-style justified gallery layout
 * Images maintain aspect ratio while filling row width perfectly
 * @param {Array} images - Array of image objects
 * @param {Number} containerWidth - Width of gallery container
 */
function createJustifiedGallery(images, containerWidth) {
  const gallery = document.getElementById("gallery");
  const targetRowHeight = window.innerWidth < 768 ? 150 : 200; // Responsive row height
  const gap = 4; // Gap between images (Google Photos style)

  gallery.innerHTML = "";

  let currentRow = [];
  let currentRowWidth = 0;

  // Process each image and group into rows
  images.forEach((img, index) => {
    const aspectRatio = img.width / img.height; // Calculate aspect ratio
    const scaledWidth = targetRowHeight * aspectRatio; // Width at target height

    currentRow.push({ ...img, scaledWidth, aspectRatio, index });
    currentRowWidth += scaledWidth + gap;

    /**
     * Render row when:
     * 1. Row width exceeds container width
     * 2. This is the last image
     */
    if (currentRowWidth >= containerWidth || index === images.length - 1) {
      renderRow(currentRow, containerWidth, targetRowHeight, gap);
      currentRow = [];
      currentRowWidth = 0;
    }
  });
}

/**
 * Renders a single row of justified images
 * Calculates scaled dimensions to fit container width perfectly
 * @param {Array} row - Array of images for this row
 * @param {Number} containerWidth - Width of gallery container
 * @param {Number} targetHeight - Target row height
 * @param {Number} gap - Gap between images
 */
function renderRow(row, containerWidth, targetHeight, gap) {
  const gallery = document.getElementById("gallery");
  const rowDiv = document.createElement("div");
  rowDiv.className = "gallery-row";

  /**
   * Calculate justified layout dimensions:
   * 1. Sum all aspect ratios in row
   * 2. Calculate available width (minus gaps)
   * 3. Scale row height to fit container width
   */
  const totalAspectRatio = row.reduce((sum, img) => sum + img.aspectRatio, 0);

  // Calculate actual row width (container width minus gaps)
  const availableWidth = containerWidth - gap * (row.length - 1);

  // Calculate scaled height to fit container width
  const scaledHeight = availableWidth / totalAspectRatio;

  row.forEach((img) => {
    const itemWidth = scaledHeight * img.aspectRatio;

    const item = document.createElement("div");
    item.className = "gallery-item";
    item.style.width = `${itemWidth}px`;
    item.style.height = `${scaledHeight}px`;
    item.setAttribute("data-index", img.index);
    item.setAttribute("data-category", img.category);

    const imgElement = document.createElement("img");
    imgElement.src = img.url;
    imgElement.alt = `Photo ${img.index + 1}`;
    imgElement.loading = "lazy";

    const overlay = document.createElement("div");
    overlay.className = "image-overlay";
    overlay.innerHTML = '<div class="overlay-icon">🔍</div>';

    item.appendChild(imgElement);
    item.appendChild(overlay);
    rowDiv.appendChild(item);

    // Add click event
    item.addEventListener("click", () => openLightbox(img.index));
  });

  gallery.appendChild(rowDiv);
}

// ==========================================
// MOBILE SIDEBAR FUNCTIONALITY
// ==========================================

/**
 * Mobile sidebar for filter navigation
 * Opens from left side on mobile screens
 */
const menuToggle = document.getElementById("menuToggle");
const mobileSidebar = document.getElementById("mobileSidebar");
const mobileOverlay = document.getElementById("mobileOverlay");
const sidebarClose = document.getElementById("sidebarClose");

function openSidebar() {
  mobileSidebar.classList.add("open");
  mobileOverlay.classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeSidebar() {
  mobileSidebar.classList.remove("open");
  mobileOverlay.classList.remove("open");
  document.body.style.overflow = "";
}

menuToggle.addEventListener("click", openSidebar);
sidebarClose.addEventListener("click", closeSidebar);
mobileOverlay.addEventListener("click", closeSidebar);

// ==========================================
// DESKTOP DROPDOWN FILTER FUNCTIONALITY
// ==========================================

/**
 * Desktop filter dropdown menu
 * Toggles on button click, closes on outside click
 */
const filterDropdown = document.getElementById("filterDropdown");
const dropdownBtn = document.getElementById("dropdownBtn");
const selectedFilterText = document.getElementById("selectedFilter");

dropdownBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  filterDropdown.classList.toggle("open");
});

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  if (!filterDropdown.contains(e.target)) {
    filterDropdown.classList.remove("open");
  }
});

// ==========================================
// FILTER FUNCTIONALITY
// ==========================================

/**
 * Handle filter button clicks
 * Filters images by category and updates gallery
 */
const filterButtons = document.querySelectorAll(".filter-btn");
filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    /**
     * Update UI state:
     * 1. Remove active class from all buttons
     * 2. Add active class to clicked button
     * 3. Update dropdown text
     */
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Update selected filter text in dropdown
    selectedFilterText.textContent = btn.textContent;

    // Close dropdown on desktop
    filterDropdown.classList.remove("open");

    // Close sidebar on mobile after selection
    if (window.innerWidth <= 768) {
      closeSidebar();
    }

    /**
     * Apply filter logic:
     * - all: Show all images
     * - recent: Show recently uploaded (last 7 days)
     * - albums: Show album view with grouped categories
     * - category: Show specific category images
     */
    const filter = btn.getAttribute("data-filter");
    currentFilter = filter;

    if (filter === "all") {
      filteredImages = [...images];
    } else if (filter === "recent") {
      // Show recently uploaded images (last 7 days or marked as recent)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filteredImages = images.filter(
        (img) =>
          img.isRecent || (img.uploadDate && img.uploadDate > sevenDaysAgo),
      );
    } else if (filter === "albums") {
      // Show album view - group images by category
      renderAlbumView();
      return;
    } else {
      filteredImages = images.filter((img) => img.category === filter);
    }

    // Re-render gallery
    const containerWidth = document.getElementById("gallery").offsetWidth;
    createJustifiedGallery(filteredImages, containerWidth);
  });
});

// ==========================================
// ALBUM VIEW RENDERER
// ==========================================

/**
 * Renders album view - groups images by category
 * Shows category cards with image count and preview thumbnails
 */
function renderAlbumView() {
  const gallery = document.getElementById("gallery");
  gallery.innerHTML = "";

  /**
   * Category definitions with icons and names
   * Groups all images into their respective categories
   */
  const categories = {
    camera: { name: "📷 Camera Uploads", images: [] },
    documents: { name: "📄 Documents", images: [] },
    nature: { name: "🌿 Nature", images: [] },
    architecture: { name: "🏛️ Architecture", images: [] },
    people: { name: "👥 People", images: [] },
    abstract: { name: "🎨 Abstract", images: [] },
  };

  images.forEach((img) => {
    if (categories[img.category]) {
      categories[img.category].images.push(img);
    }
  });

  // Create album cards
  Object.keys(categories).forEach((catKey) => {
    const cat = categories[catKey];
    if (cat.images.length === 0) return;

    const albumCard = document.createElement("div");
    albumCard.style.cssText = `
                    background: var(--bg-secondary);
                    border-radius: 12px;
                    padding: 20px;
                    margin-bottom: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 2px solid rgba(255,255,255,0.1);
                `;

    albumCard.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                        <h3 style="font-size: 18px; font-weight: 500; color: var(--text-primary);">${cat.name}</h3>
                        <span style="background: var(--accent-color); color: var(--bg-primary); padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">${cat.images.length} photos</span>
                    </div>
                    <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; max-width: 400px;">
                        ${cat.images
                          .slice(0, 4)
                          .map(
                            (img) => `
                            <div style="aspect-ratio: 1; border-radius: 8px; overflow: hidden; background: var(--bg-primary);">
                                <img src="${img.url}" style="width: 100%; height: 100%; object-fit: cover;" alt="Album preview">
                            </div>
                        `,
                          )
                          .join("")}
                    </div>
                `;

    // Add hover effect
    albumCard.addEventListener("mouseenter", () => {
      albumCard.style.transform = "translateY(-4px)";
      albumCard.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)";
    });

    albumCard.addEventListener("mouseleave", () => {
      albumCard.style.transform = "translateY(0)";
      albumCard.style.boxShadow = "none";
    });

    // Click to view category
    albumCard.addEventListener("click", () => {
      // Trigger the category filter
      const categoryBtn = document.querySelector(`[data-filter="${catKey}"]`);
      if (categoryBtn) {
        categoryBtn.click();
      } else {
        // If category button doesn't exist, filter manually
        filteredImages = images.filter((img) => img.category === catKey);
        const containerWidth = document.getElementById("gallery").offsetWidth;
        createJustifiedGallery(filteredImages, containerWidth);
      }
    });

    gallery.appendChild(albumCard);
  });
}

// ==========================================
// LIGHTBOX FUNCTIONALITY
// ==========================================

/**
 * Lightbox for fullscreen image viewing
 * Features: navigation, keyboard controls, touch swipe
 */
function openLightbox(index) {
  currentImageIndex = index;
  updateLightbox();
  document.getElementById("lightbox").classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  document.getElementById("lightbox").classList.remove("active");
  document.body.style.overflow = "";
}

function updateLightbox() {
  const lightboxImage = document.getElementById("lightbox-image");
  const counter = document.getElementById("lightbox-counter");

  lightboxImage.src = filteredImages[currentImageIndex].url;
  counter.textContent = `${currentImageIndex + 1} / ${filteredImages.length}`;
}

function nextImage() {
  currentImageIndex = (currentImageIndex + 1) % filteredImages.length;
  updateLightbox();
}

function prevImage() {
  currentImageIndex =
    (currentImageIndex - 1 + filteredImages.length) % filteredImages.length;
  updateLightbox();
}

/**
 * Lightbox event listeners
 * - Close button
 * - Navigation buttons (prev/next)
 * - Click outside to close
 */
document
  .getElementById("lightbox-close")
  .addEventListener("click", closeLightbox);
document.getElementById("lightbox-next").addEventListener("click", nextImage);
document.getElementById("lightbox-prev").addEventListener("click", prevImage);

// Click outside to close
document.getElementById("lightbox").addEventListener("click", (e) => {
  if (e.target.id === "lightbox") {
    closeLightbox();
  }
});

// ==========================================
// KEYBOARD NAVIGATION
// ==========================================

/**
 * Handle keyboard shortcuts in lightbox
 * - Escape: Close lightbox
 * - Arrow Left: Previous image
 * - Arrow Right: Next image
 */
document.addEventListener("keydown", (e) => {
  if (!document.getElementById("lightbox").classList.contains("active")) return;

  switch (e.key) {
    case "Escape":
      closeLightbox();
      break;
    case "ArrowLeft":
      prevImage();
      break;
    case "ArrowRight":
      nextImage();
      break;
  }
});

// ==========================================
// RESPONSIVE RESIZE HANDLER
// ==========================================

/**
 * Debounced resize handler
 * Re-renders gallery when window is resized
 * Debounced to improve performance
 */
let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const containerWidth = document.getElementById("gallery").offsetWidth;
    createJustifiedGallery(filteredImages, containerWidth);
  }, 250);
});

// ==========================================
// INITIALIZATION
// ==========================================

/**
 * Initialize gallery on page load
 * Calculates container width and renders justified layout
 */
window.addEventListener("load", () => {
  const containerWidth = document.getElementById("gallery").offsetWidth;
  createJustifiedGallery(filteredImages, containerWidth);
});

// ==========================================
// TOUCH SWIPE SUPPORT (MOBILE)
// ==========================================

/**
 * Enable touch swipe gestures in lightbox
 * Swipe left: Next image
 * Swipe right: Previous image
 */
let touchStartX = 0;
let touchEndX = 0;

document.getElementById("lightbox").addEventListener("touchstart", (e) => {
  touchStartX = e.changedTouches[0].screenX;
});

document.getElementById("lightbox").addEventListener("touchend", (e) => {
  touchEndX = e.changedTouches[0].screenX;
  handleSwipe();
});

function handleSwipe() {
  if (touchEndX < touchStartX - 50) nextImage();
  if (touchEndX > touchStartX + 50) prevImage();
}