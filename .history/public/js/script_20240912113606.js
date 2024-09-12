// DOM Elements
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

// Carousel functionality
document.addEventListener("DOMContentLoaded", function() {
    console.log("JavaScript loaded");
    const carousel = document.querySelector(".carousel-inner");
    const items = document.querySelectorAll(".carousel-item");
    let currentIndex = 0;
    const totalItems = items.length;

    // Set the width of .carousel-inner to accommodate all slides
    carousel.style.width = `${100 * totalItems}%`;

    function slideToNext() {
        console.log("Sliding to index: " + currentIndex);
        currentIndex = (currentIndex + 1) % totalItems;
        carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    setInterval(slideToNext, 3000); // Change slide every 3 seconds
});

function showLogoutMessage() {
    // Check if the URL contains the 'loggedOut' query parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get('loggedOut') === 'true') {
        alert('You have been logged out.');
    }
}
// Call the function when the page loads
window.onload = showLogoutMessage;


