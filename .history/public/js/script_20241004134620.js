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

    // Get stock data and important elements
    var stockData = JSON.parse(document.getElementById('stock-data').value);
    var sizeSelect = document.getElementById('size-select');
    var stockDisplay = document.getElementById('stock-display');
    var quantityInput = document.getElementById('quantity');
    var increaseBtn = document.getElementById('increaseQty');
    var decreaseBtn = document.getElementById('decreaseQty');
    var addToCartBtn = document.getElementById('add-to-cart-btn');
    var buyNowBtn = document.getElementById('buy-now-btn');

    var selectedSizeStock = 0;

    // Handle size selection
    sizeSelect.addEventListener('change', function () {
        var selectedSize = sizeSelect.value;

        if (stockData[selectedSize]) {
            selectedSizeStock = stockData[selectedSize];
            stockDisplay.textContent = 'Stock Available: ' + selectedSizeStock;
            increaseBtn.disabled = false;
            decreaseBtn.disabled = true; // Initial quantity is 1
            quantityInput.value = 1;
            addToCartBtn.disabled = false;
            buyNowBtn.disabled = false;
        } else {
            stockDisplay.textContent = 'Please select a valid size';
            increaseBtn.disabled = true;
            decreaseBtn.disabled = true;
            addToCartBtn = true;
            buyNowBtn = true;
        }

    });

    increaseBtn.addEventListener('click', function () {
        var currentQuantity = parseInt(quantityInput.value);
        
        if (currentQuantity < selectedSizeStock) {
            quantityInput.value = currentQuantity + 1;
            decreaseBtn.disabled = false; // Enable decrease button
        }
        
        if (parseInt(quantityInput.value) === selectedSizeStock){
            increaseBtn.disabled = true; // Disable increase button when max stock is reached
        }
    });

    decreaseBtn.addEventListener('click', function() {
        var currentQuantity = parseInt(quantityInput.value);

        if(currentQuantity > 1) {
            quantityInput.value = currentQuantity - 1;
            increaseBtn.disable = false; // Enable increase button
        }

        if(parseInt(quantityInput.value) === 1) {
            decreaseBtn.disabled = true; // Disable decrease button when quantity is 1
        }
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

function updateTotal() {
    const useRewardsCheckbox = document.getElementById('useRewards');
    const totalAmountElement = document.getElementById('totalAmount');
    const rewardsPointsElement = document.getElementById('rewardsPoints');
    const pointsAddedElement = document.getElementById('pointsAdded'); // Always display points added
    const deductionElement = document.getElementById('deduction'); // Element to display RM deduction
    const pointsDeductedElement = document.getElementById('pointsDeducted'); // Element to display points deducted

    const cartItems = document.querySelectorAll('.products-table tbody tr');
    let totalAmount = 0;
    const shippingCost = 5.90; // Shipping cost

    const rewardsPoints = Math.round(parseFloat(rewardsPointsElement.innerText)) || 0;

    // Recalculate the total based on cart items
    cartItems.forEach(item => {
        const priceText = item.cells[2].innerText.replace('RM', '').trim(); // Access price cell
        const quantityText = item.cells[3].innerText.trim(); // Access quantity cell

        const price = parseFloat(priceText);
        const quantity = parseInt(quantityText);

        if (!isNaN(price) && !isNaN(quantity)) {
            totalAmount += price * quantity;
        }
    });

    totalAmount += shippingCost;

    // Calculate discount based on checkbox
    let discount = 0;
    let pointsDeducted = 0;
    if (useRewardsCheckbox.checked) {
        discount = Math.min(rewardsPoints * 0.01, totalAmount); // Maximum RM deduction
        pointsDeducted = Math.floor(discount / 0.01); // Convert RM discount to points
    } else {
        // Set to 0 if not checked
        discount = 0;
        pointsDeducted = 0;
    }

    const updatedTotal = totalAmount - discount;
    const finalTotal = Math.max(updatedTotal, 0);

    // Update the total amount in the HTML
    totalAmountElement.innerText = finalTotal.toFixed(2);

    // Display RM deduction and points deducted
    deductionElement.innerText = `RM ${discount.toFixed(2)}`; // Always show RM deducted (will show 0 if not checked)
    pointsDeductedElement.innerText = pointsDeducted; // Always show points deducted (will show 0 if not checked)

    // Always display points added
    const pointsAdded = Math.floor(totalAmount * 1); // Example calculation for points added
    pointsAddedElement.innerText = pointsAdded; // Display points added

    // Update rewards points display
    rewardsPointsElement.innerText = Math.round(rewardsPoints);
}

// Add event listener to update the total when rewards checkbox is clicked
document.getElementById('useRewards').addEventListener('change', updateTotal);

// Initial total calculation on page load
updateTotal();

async function receiveProduct(productCode, purchaseDate) {
    try {
        // Send AJAX request to the backend
        const response = await fetch('/receive-product-ajax', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ productCode, purchaseDate })
        });

        const data = await response.json();

        if (data.success) {
            // Find the product element
            const productElement = document.getElementById(`product-${productCode}`);
            
            // Update the button to "Rate Now" and adjust other relevant information
            const buttonHtml = `
                <a href="/product/${productCode}" class="rate-now-btn">Rate Now</a>
            `;
            const deliveryInfoHtml = `Delivered on ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

            // Update only the button and delivery status
            productElement.querySelector('.purchase-action').innerHTML = buttonHtml;
            productElement.querySelector('.delivery-status').innerHTML = deliveryInfoHtml;
        } else {
            console.error('Error receiving product:', data.error);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

// Function to send user input to Dialogflow and display it
async function sendMessage() {
    const userInput = document.getElementById('user-input').value;
    if (userInput) {
        displayMessage(userInput, 'user-message', 'user-bubble');

        // Show typing indicator
        showTypingIndicator();

        // Fetch response from Dialogflow API
        const response = await fetch('https://dialogflow.googleapis.com/v2/projects/newagent-mkvl/agent/sessions/session_251105`:detectIntent', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ya29.c.c0ASRK0GahG_gylFVVwTsIob8Gi8MafbvNWXAyyJN78CPXnjEtLig9j00EIeg1Ghvm1KaNEyUCcsozTnznscU_N5M0UXOPIQQ00gPbY9HIDcLTkXpHPBcmfMiwZKbAr1Ux4y-v6N9l7mANBCTE0CgaKrUVIhotUZ7XbRA4iOs793n4ftqGztFNL357BWmBrSOyEqVg-NraVKBgDIwuIgKyxm91yhFhXu2i5LHbLg8w24f8SQ7VJd8xFY6ZkrmRJXB1xaP4Rw-RGd5qbsU_dYGI5mNlp1zM7VDdNDYI2wODTjonmk2T8n4VH929Jz5_Xipzxm2jLAbhkKQRkRrG6WnxWADw_LLyUGAuDcie3sWek3if7uwUlQK0LutOtq-z1xofT1YoT397KMyiwZIoBROzuJteQ1-45xJecMJMgU90ZOYu7-h_XnqYI_Fb-arzZfUR6e4ba7m4ruxZb4R1_FeB-7JjV4z8k7Q_ncuxUbxzxW4xYtmrIlkIwOVqv_ebYae48e1cwmfo0MfixRjBWSU29byF-O2lZSSkvRI7ZbJkVBhX14W43u1kuvfO6tJgIXxkr0kiyyQuM-yttJJkt1BqXQuMBYrsBxj7QUJR58Wjt2qava6Jok5gYWkI2hZet-sizhuazuuFiVo-SjxBU3i65My6V7OOhidljhhUuZetFOnQjWyIta94JR3lmBgUX8WJq_nqzFeyyvbmshnX9-Yhai1885V3JIMuOxllyZe1-4u_dfbl_06t6oq2h6_r3y6Ru7Oia46B9BYyBWi66qf-Q6am6rr5VFrme3XdZVpg02SnbncjZ836FMeQz0d7V8o6OOJru6_5c0WyFpnw-gyZMdu7S6pzxw6xt2d-fSRgoxn4-kyfjRujd-w0FptXeQUjI_mSdMQ-yoYwq6kQ0JaV_mU-unld2Ft_oV9QWcmvs0pmVopyYeIYw5_FIss0jRUSFsvY5OoY_0avpMRQQSq3iB_8ni9u52V8pUs8fJ-U0UYJYaeZ_kq2mQB`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                queryInput: {
                    text: {
                        text: userInput,
                        languageCode: 'en'
                    }
                }
            })
        });
        const responseData = await response.json();
        const richMessages = responseData.queryResult.fulfillmentMessages;

        // Remove typing indicator
        hideTypingIndicator();

        // Display bot's rich responses
        displayRichMessages(richMessages);
        document.getElementById('user-input').value = '';
    }
}

// Display user and bot messages
function displayMessage(message, className, bubbleClass) {
    const chatWindow = document.getElementById('chat-window');
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', className);
    messageDiv.innerHTML = `<div class="${bubbleClass}">${message}</div>`;
    chatWindow.appendChild(messageDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Display typing indicator
function showTypingIndicator() {
    const chatWindow = document.getElementById('chat-window');
    const typingDiv = document.createElement('div');
    typingDiv.classList.add('typing-indicator');
    typingDiv.id = 'typing-indicator';
    typingDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';
    chatWindow.appendChild(typingDiv);
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// Remove typing indicator
function hideTypingIndicator() {
    const typingDiv = document.getElementById('typing-indicator');
    if (typingDiv) {
        typingDiv.remove();
    }
}

// Display rich messages like cards or text
function displayRichMessages(richMessages) {
    const chatWindow = document.getElementById('chat-window');

    richMessages.forEach(richMessage => {
        if (richMessage.card) {
            const card = richMessage.card;

            const cardHTML = `
                <div class="rich-card">
                    <h3>${card.title}</h3>
                    <p>${card.subtitle}</p>
                    ${card.imageUri ? `<img src="${card.imageUri}" alt="${card.title}">` : ''}
                    ${card.buttons.map(button => `<button onclick="window.open('${button.postback}', '_blank')">${button.text}</button>`).join('')}
                </div>
            `;

            chatWindow.innerHTML += cardHTML;
            chatWindow.scrollTop = chatWindow.scrollHeight;
        } else if (richMessage.text) {
            displayMessage(richMessage.text.text[0], 'bot-message', 'bot-bubble');
        }
    });
}

// Open chat when clicking on the bot emoji (optional)
function openChat() {
    // Optionally, you can make the chat container visible or scroll to the bottom
    const chatWindow = document.getElementById('chat-window');
    chatWindow.scrollTop = chatWindow.scrollHeight; // Scroll to bottom
}
