// DOM Elements
const hamburgerMenu = document.querySelector('.hamburger-menu');
const sidebar = document.querySelector('.sidebar');
const closeBtn = document.querySelector('.sidebar .close-btn');
const submenuLink = document.querySelector('.sidebar .submenu > a');
const submenu = document.querySelector('.sidebar .submenu');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const filterButton = document.getElementById('filter-button');
const filterDropdown = document.getElementById('filter-dropdown');

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

// Toggle filter dropdown
filterButton.addEventListener('click', () => {
    filterDropdown.classList.toggle('active');
});

// Close filter dropdown when clicking outside of it
window.addEventListener('click', (event) => {
    if (!filterDropdown.contains(event.target) && event.target !== filterButton) {
        filterDropdown.classList.remove('active');
    }
});

// Perform search as the user types
searchInput.addEventListener('input', async () => {
    const query = searchInput.value;

    if (query.length > 0) {
        try {
            const response = await fetch(`/search?query=${encodeURIComponent(query)}`);
            const data = await response.json();
            updateSearchResults(data);
        } catch (error) {
            console.error('Error fetching search results:', error);
        }
    } else {
        // Clear search results if input is empty
        searchResults.innerHTML = '';
    }
});

// Update search results in the dropdown
function updateSearchResults(data) {
    searchResults.innerHTML = '';

    data.forEach(item => {
        const link = document.createElement('a');
        link.href = item.url;
        link.textContent = item.name;
        link.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = item.url;
        });
        searchResults.appendChild(link);
    });
}

// Quantity adjustment (for other pages)
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

// Example of showing popup messages (use when appropriate)
// showPopupMessage('logged-in');
// showPopupMessage('logged-out');
