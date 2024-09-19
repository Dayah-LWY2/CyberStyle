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

// Quantity adjustment
document.getElementById('decreaseQty')?.addEventListener('click', function() {
    var qty = document.getElementById('quantity');
    if (qty && qty.value > 1) {
        qty.value = parseInt(qty.value) - 1;
    }
});

document.getElementById('increaseQty')?.addEventListener('click', function() {
    var qty = document.getElementById('quantity');
    if (qty) {
        qty.value = parseInt(qty.value) + 1;
    }
});

// Form submission handling
document.getElementById('product-form')?.addEventListener('submit', function(event) {
    var targetButton = event.submitter;
    var action = targetButton.getAttribute('data-action');
    this.action = action;
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

function toggleFilterDropdown() {
    const filterDropdown = document.getElementById('filterDropdown');
    filterDropdown.style.display = (filterDropdown.style.display === 'none' || !filterDropdown.style.display) ? 'block' : 'none';
}

// Apply filter when clicked
function applyFilter(filter) {
    console.log('Filter applied:', filter);
    // Implement the logic to filter based on category, newest, oldest, or popular
    // For example, you can redirect or send an AJAX request to apply the filter
    const searchQuery = document.getElementById('searchQuery').value;
    if (searchQuery) {
        window.location.href = `/search?query=${searchQuery}&filter=${filter}`;
    } else {
        window.location.href = `/search?filter=${filter}`;
    }
}

// Handle search suggestions
function searchSuggestions() {
    const query = document.getElementById('searchQuery').value;
    const suggestionsDropdown = document.getElementById('suggestions');

    if (query.length > 0) {
        fetch(`/search-suggestions?query=${query}`)
            .then(response => response.json())
            .then(suggestions => {
                suggestionsDropdown.innerHTML = '';
                if (suggestions.length > 0) {
                    suggestions.forEach(suggestion => {
                        const li = document.createElement('li');
                        li.textContent = suggestion.name;
                        li.addEventListener('click', () => {
                            window.location.href = `/products/${suggestion.code}`;
                        });
                        suggestionsDropdown.appendChild(li);
                    });
                    suggestionsDropdown.style.display = 'block';
                } else {
                    suggestionsDropdown.style.display = 'none';
                }
            })
            .catch(error => console.error('Error fetching suggestions:', error));
    } else {
        suggestionsDropdown.style.display = 'none';
    }
}
