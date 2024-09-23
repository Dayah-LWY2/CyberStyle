// DOM Elements for the sidebar and menu
const hamburgerMenu = document.querySelector('.hamburger-menu');
const sidebar = document.querySelector('.sidebar');
const closeBtn = document.querySelector('.sidebar .close-btn');
const submenuLink = document.querySelector('.sidebar .submenu > a');
const submenu = document.querySelector('.sidebar .submenu');

// Open the sidebar when the hamburger menu is clicked
hamburgerMenu.addEventListener('click', () => {
    sidebar.classList.add('active');
});

// Close the sidebar when the close button is clicked
closeBtn.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Toggle the dropdown menu when "Shop All" is clicked
submenuLink.addEventListener('click', (event) => {
    event.preventDefault(); // Prevent default action of anchor tag
    submenu.classList.toggle('active');
});

// Close the sidebar when clicking outside of it
window.addEventListener('click', (event) => {
    if (!sidebar.contains(event.target) && event.target !== hamburgerMenu) {
        sidebar.classList.remove('active');
    }
});

// Stock Management
let availableStock = 0;

// Update available stock based on selected size
const sizeSelect = document.querySelector('select[name="size"]');
const stockMessage = document.getElementById('stock-message');

function updateAvailableStock() {
    const selectedSize = sizeSelect.value;
    const stock = JSON.parse('<%= JSON.stringify(product.stock) %>'); // Get stock data
    availableStock = stock[selectedSize] || 0;
    stockMessage.textContent = availableStock + " items left in stock";
    updateQtyButtons(1); // Update buttons based on new stock
}

sizeSelect.addEventListener('change', updateAvailableStock);
updateAvailableStock(); // Initialize stock when the page loads

const updateQtyButtons = (qty) => {
    document.getElementById('decreaseQty').disabled = qty <= 1;
    document.getElementById('increaseQty').disabled = qty >= availableStock;
};

// Quantity adjustment
document.getElementById('decreaseQty')?.addEventListener('click', function() {
    var qty = document.getElementById('quantity');
    if (qty && qty.value > 1) {
        qty.value = parseInt(qty.value) - 1;
        updateQtyButtons(parseInt(qty.value));
    }
});

document.getElementById('increaseQty')?.addEventListener('click', function() {
    var qty = document.getElementById('quantity');
    if (qty) {
        qty.value = parseInt(qty.value) + 1;
        updateQtyButtons(parseInt(qty.value));
    }
});

// Form submission handling
document.getElementById('product-form')?.addEventListener('submit', function(event) {
    var targetButton = event.submitter;
    var action = targetButton.getAttribute('data-action');
    this.action = action;

    const qty = parseInt(document.getElementById('quantity').value, 10);
    
    // Check stock availability
    if (qty > availableStock) {
        alert('Not enough stock available!');
        event.preventDefault();
        return;
    }

    // Update available stock
    availableStock -= qty;
    updateAvailableStock(); // Update stock display
});

document.addEventListener("DOMContentLoaded", function() {
    console.log("JavaScript loaded");

    const carousel = document.querySelector(".carousel-inner");
    const carouselItems = document.querySelectorAll(".carousel-item");
    let carouselIndex = 0;
    const totalCarouselItems = carouselItems.length;

    if (totalCarouselItems > 0) {
        // Set the width of .carousel-inner to accommodate all slides
        carousel.style.width = `${100 * totalCarouselItems}%`;

        function slideToNext() {
            console.log("Sliding to index: " + carouselIndex);
            carouselIndex = (carouselIndex + 1) % totalCarouselItems;
            carousel.style.transform = `translateX(-${carouselIndex * 100}%)`;
        }

        // Change slide every 3 seconds
        setInterval(slideToNext, 3000);
    } else {
        console.error("No carousel items found");
    }

    // Image slider functionality for thumbnails
    const thumbnails = document.querySelectorAll(".thumbnail");
    const mainImage = document.getElementById("main-product-image");

    if (thumbnails.length > 0 && mainImage) {
        // Function to change the main image when a thumbnail is clicked
        thumbnails.forEach(thumbnail => {
            thumbnail.addEventListener("click", function() {
                mainImage.src = this.src;
            });
        });

        // Automatically slide through the images
        let imageIndex = 0;
        const totalImages = thumbnails.length;

        function updateMainImage() {
            console.log("Updating main image to index: " + imageIndex);
            imageIndex = (imageIndex + 1) % totalImages;
            mainImage.src = thumbnails[imageIndex].src;
        }

        // Change image every 3 seconds
        setInterval(updateMainImage, 3000);
    } else {
        console.error("Thumbnails or main image not found");
    }

    const faqQuestions = document.querySelectorAll('.faq-question');

    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const answer = question.nextElementSibling;
            const isVisible = answer.classList.contains('open');

            // Close all other answers
            faqQuestions.forEach(item => {
                const ans = item.nextElementSibling;
                if (ans !== answer) {
                    ans.style.maxHeight = null;
                    ans.classList.remove('open');
                    item.classList.remove('active');
                    item.querySelector('.icon').textContent = '+';
                }
            });

            // Toggle the selected answer
            if (isVisible) {
                answer.style.maxHeight = null;
                answer.classList.remove('open');
                question.classList.remove('active');
                question.querySelector('.icon').textContent = '+';
            } else {
                answer.style.maxHeight = answer.scrollHeight + 'px';
                answer.classList.add('open');
                question.classList.add('active');
                question.querySelector('.icon').textContent = 'x';
            }
        });
    });

    const searchBar = document.getElementById('search-bar');
    const filterOptions = document.getElementById('filter-options');
    const searchButton = document.getElementById('search-btn');
    const suggestionBox = document.getElementById('suggestion-box');

    // Function to fetch autocomplete suggestions
    const fetchSuggestions = async (query) => {
        if (!query) {
            suggestionBox.innerHTML = '';
            suggestionBox.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`/autocomplete?q=${encodeURIComponent(query)}`);
            const suggestions = await response.json();
            displayDropdown(suggestions);
        } catch (error) {
            console.error('Error fetching suggestions:', error);
        }
    };

    // Function to display suggestions in the dropdown
    const displayDropdown = (suggestions) => {
        suggestionBox.innerHTML = '';
        
        if (suggestions.length === 0) {
            suggestionBox.style.display = 'none';
            return;
        }

        suggestions.forEach(suggestion => {
            const suggestionElement = document.createElement('div');
            suggestionElement.classList.add('dropdown-item');
            suggestionElement.textContent = suggestion.name;
            suggestionElement.addEventListener('click', () => {
                window.location.href = suggestion.url;
            });
            suggestionBox.appendChild(suggestionElement);
        });

        suggestionBox.style.display = 'block';
    };

    // Event listener for input in the search bar
    searchBar.addEventListener('input', function() {
        const query = this.value.trim();
        fetchSuggestions(query);
    });

    // Event listener to hide suggestions when clicking outside
    document.addEventListener('click', function(event) {
        if (!suggestionBox.contains(event.target) && event.target !== searchBar) {
            suggestionBox.style.display = 'none';
        }
    });

    // Optional: Handle form submission via Enter key
    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', function(event) {
        // Ensure suggestions are hidden on form submission
        suggestionBox.style.display = 'none';
    });

    updateAvailableStock();

});

// Popup functionality
function showPopupMessage(type) {
    // Show different messages based on the type (logged in or logged out)
    let popup = document.getElementById(type + '-popup');
    
    if (popup) {
        popup.classList.add('show');

        // Hide the popup after 3 seconds (optional)
        setTimeout(() => {
            popup.classList.remove('show');
        }, 3000);
    }
}

// Call the function when the page loads
window.onload = function() {
    const params = new URLSearchParams(window.location.search);
    
    if (params.get('loggedIn') === 'true') {
        showPopupMessage('logged-in');
    } else if (params.get('loggedOut') === 'true') {
        showPopupMessage('logged-out');
    } else if (params.get('signedUp') === 'true') {
        showPopupMessage('signed-up');
    }
};

function validateReviewForm() {
    const rating = document.getElementById('rating').value;
    const comment = document.getElementById('comment').value;

    if (!rating || !comment) {
alert('All fields are required.');
        return false;
    }

    if (rating < 1 || rating > 5) {
        alert('Rating must be between 1 and 5.');
        return false;
    }

    return true;
}