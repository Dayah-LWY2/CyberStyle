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
    // Close when clicking outside the sidebar or on the hamburger menu
    if (!sidebar.contains(event.target) && event.target !== hamburgerMenu) {
        sidebar.classList.remove('active');
    }
});

document.getElementById('decreaseQty').addEventListener('click', function() {
    var qty = document.getElementById('quantity');
    if (qty.value > 1) {
        qty.value = parseInt(qty.value) - 1;
    }
});

document.getElementById('increaseQty').addEventListener('click', function() {
    var qty = document.getElementById('quantity');
    qty.value = parseInt(qty.value) + 1;
});

document.getElementById('product-form').addEventListener('submit', function(event) {
    // Determine which button was clicked
    var targetButton = event.submitter;
    var action = targetButton.getAttribute('data-action');

    // Set the form action based on the clicked button
    this.action = action;
});

document.addEventListener("DOMContentLoaded", function() {
    const carousel = document.querySelector(".carousel-inner");
    const items = document.querySelectorAll(".carousel-item");
    let currentIndex = 0;
    const totalItems = items.length;

    function slideToNext() {
      currentIndex = (currentIndex + 1) % totalItems;
      carousel.style.transform = `translateX(-${currentIndex * 100}%)`;
    }

    setInterval(slideToNext, 3000); // Change slide every 3 seconds
});


