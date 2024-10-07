const expressLayouts = require('express-ejs-layouts');  
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

const app = express();

// Middleware setup
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Load product data from products.json
let products = [];
const loadProducts = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'products.json'), 'utf-8');
        products = JSON.parse(data);
    } catch (err) {
        console.error('Error reading products.json:', err);
    }
};
loadProducts();

// Load page data from pages.json
let pages = [];
const loadPages = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'pages.json'), 'utf-8');
        pages = JSON.parse(data);
    } catch (err) {
        console.error('Error reading pages.json:', err);
    }
};
loadPages();


// Load users data from users.json
const readUsersFromFile = async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'users.json'), 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return []; // Return empty array if file doesn't exist
        } else {
            throw err;
        }
    }
};

// Write users data to users.json
const writeUsersToFile = async (users) => {
    await fs.writeFile(path.join(__dirname, 'public', 'users.json'), JSON.stringify(users, null, 2));
};

const writeProductsToFile = async (users) => {
    await fs.writeFile(path.join(__dirname, 'public', 'products.json'), JSON.stringify(users, null, 2));
};

app.use((req, res, next) => {
    res.locals.username = req.session.username;
    req.session.cart = req.session.cart || [];
    req.session.tempCart = req.session.tempCart || [];
    res.locals.cart = req.session.cart;
    res.locals.tempCart = req.session.tempCart;
    next();
});

// Middleware to ensure user exists in users.json and is logged in
const ensureLoggedInAndExists = async (req, res, next) => {
    if (!req.session.username) {
        return res.redirect('/login?errorMessage=Please log in to continue');
    }

    const users = await readUsersFromFile();
    const userExists = users.some(user => user.username === req.session.username);

    if (!userExists) {
        return res.status(403).send('User not found in the system.');
    }

    next(); // Proceed if user exists
};

// Routes
app.get('/', async (req, res) => {
    if (products.length === 0) await loadProducts();
    res.render('index', { title: 'Home', products, filter: null });
});

app.get('/about', (req, res) => res.render('about', { title: 'About Us', filter: null }));
app.get('/shipping-&-returns', (req, res) => res.render('shipping-&-returns', { title: 'Shipping & Returns', filter: null }));
app.get('/store-policy', (req, res) => res.render('store-policy', { title: 'Store Policy', filter: null }));
app.get('/faq', (req, res) => res.render('faq', { title: 'FAQ', filter: null }));
app.get('/women', (req, res) => res.render('women', { title: 'Women', products, filter: null }));
app.get('/men', (req, res) => res.render('men', { title: 'Men', products, filter: null }));
app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products, filter: null }));
app.get('/login', (req, res) => res.render('login', { title: 'Login', errorMessage: req.query.errorMessage, filter: null }));

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) return res.redirect('/error');
        res.redirect('/?loggedOut=true');
    });
});

app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up', errorMessage: req.query.errorMessage, filter: null }));
app.get('/products', (req, res) => res.render('products', { title: 'All Products', products, filter: null }));

app.get('/product/:code', async (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) return res.status(404).send('Product not found');

    const users = await readUsersFromFile();
    const loggedInUser = req.session.username
    const hasReviewed = users && product.reviews && product.reviews.some(review => review.username === loggedInUser);
    
    const minPrice = Math.max(0, product.price - 10); // Adjust the range as needed
    const maxPrice = product.price + 10;

    const priceRangeProducts = products.filter(p => p.price >= minPrice && p.price <= maxPrice && p.code !== product.code && !product.category.includes('new'));

    // Similar filtering for recommendations
    const recommendedProducts = products.filter(product => {
    return product.category !== 'new' && product.price >= minPrice && product.price <= maxPrice;
});

    res.render('product', { title: 'Product', product, users, loggedInUser, hasReviewed, priceRangeProducts, recommendedProducts, filter: null });
});

app.get('/cart', ensureLoggedInAndExists, async (req, res) => {
    // Fetch users and find the logged-in user
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === req.session.username);

    if (!user) {
        return res.status(404).send('User not found');
    }

    // Get the user's cart from users.json
    const userCart = user.cart || [];

    // Map the cart product codes to product details from the products array
    const detailedCart = userCart.map(cartItem => {
        const product = products.find(p => p.code === cartItem.productCode);
        return {
            product: product,
            size: cartItem.size,
            quantity: cartItem.quantity
        };
    });

    // Update the session cart if needed
    req.session.cart = detailedCart;

    // Render the cart view with the user's cart data
    res.render('cart', { title: 'Cart', cart: detailedCart,  rewardsPoints: user.rewardsPoints || 0, filter: null });
});

app.get('/payment', async (req, res) => {
    const username = req.session.username; 
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);
    const address = user ? user.address || '' : '';

    const cart = req.session.tempCart;
    if (!cart || cart.length === 0) return res.status(404).send('No items found for payment');
    res.render('payment', { title: 'Payment Details', cart, address, rewardsPoints: user.rewardsPoints || 0, filter: null });
});

app.get('/checkout', async (req, res) => {
    const username = req.session.username;  
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);
    const address = user ? user.address || '' : '';

    const cart = req.session.cart;
    if (!cart || cart.length === 0) return res.status(404).send('No items in cart');
    res.render('checkout', { title: 'Checkout', cart, address, rewardsPoints: user.rewardsPoints || 0, filter: null });
});

app.get('/confirmation', async (req, res) => {
    const username = req.session.username;

    // Read users from the JSON file
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username);
    const recommendations = [];

    if (user && user.purchased && Object.keys(user.purchased).length > 0) {
        const purchasedCategories = new Set(); // Using a Set to avoid duplicates
        
        // Collect categories of purchased products
        for (const code in user.purchased) {
            const product = products.find(p => p.code === code);
            if (product) {
                purchasedCategories.add(product.category); // Add category to Set
            }
        }

        // Filter products based on purchased categories
        const filteredRecommendations = products.filter(p => purchasedCategories.has(p.category));

        // Limit to 4 products
        recommendations.push(...filteredRecommendations.slice(0, 4)); // Get first 4 products
    }

    // Render the confirmation page with recommendations
    res.render('confirmation', { 
        title: 'Confirmation', 
        recommendations, 
        filter: null 
    });
});


app.get('/search', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    const filter = req.query.filter || 'none';

    if (!query && filter === 'none') {
        return res.redirect('/products');
    }

    let matchedProducts = [];
    let matchedPages = [];

    if (query) {
        matchedProducts = products.filter(product => 
            product.name.toLowerCase().includes(query) &&
            product.category !== 'new'
        );

        matchedPages = pages.filter(page =>
            page.name.toLowerCase().includes(query)
        );
    } else {
        matchedProducts = products.filter(product => product.category !== 'new');
    }

    switch (filter) {
        case 'price-asc':
            matchedProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            matchedProducts.sort((a, b) => b.price - a.price);
            break;
        case 'date-popular':
            matchedProducts.sort((a, b) => b.popularity - a.popularity);
            break;
        case 'date-latest':
            matchedProducts.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
        case 'date-oldest':
            matchedProducts.sort((a, b) => new Date(a.dateAdded) - new Date(b.dateAdded));
            break;
        default:
            break;
    }

    let results = [];
    if (query) {
        results = matchedProducts.concat(matchedPages);
    } else {
        results = matchedProducts;
    }

    res.render('searchResults', { title: 'Search Results', results, query, filter });
});

// Autocomplete Suggestions Route
app.get('/autocomplete', (req, res) => {
    const query = req.query.q ? req.query.q.toLowerCase() : '';
    if (!query) {
        return res.json([]);
    }

    // Filter matched products to exclude the 'new' category
    const matchedProducts = products.filter(product => 
        product.name.toLowerCase().includes(query) && !product.category.includes('new')
    );

    const matchedPages = pages.filter(page =>
        page.name.toLowerCase().includes(query)
    );

    // Combine matched products and pages into suggestions
    const suggestions = matchedProducts.map(product => ({
        type: 'product',
        name: product.name,
        url: `/product/${product.code}`
    })).concat(matchedPages.map(page => ({
        type: 'page',
        name: page.name,
        url: page.url
    })));

    res.json(suggestions);
});

// Review submission logic
app.post('/product/:code/review', ensureLoggedInAndExists, async (req, res) => {
    const productCode = req.params.code;
    const product = products.find(p => String(p.code) === String(productCode)); 

    if (product) {
        // Validate form data
        if (!req.body.rating || !req.body.comment) {
            return res.status(400).send('All fields are required.');
        }

        const rating = parseInt(req.body.rating);
        if (rating < 1 || rating > 5) {
            return res.status(400).send('Rating must be between 1 and 5.');
        }

        // Check if the user has purchased the product
        const users = await readUsersFromFile();
        const user = users.find(u => u.username === req.session.username);
        if (!user || !user.purchased.includes(productCode)) {
            return res.status(403).send('You can only review products you have purchased.');
        }

        // Add the review to the product
        const review = {
            username: req.session.username,
            rating,
            comment: req.body.comment,
            date: new Date()
        };

        if (!product.reviews) {
            product.reviews = [];
        }
        product.reviews.push(review);
        
        // Save updated products data back to JSON file
        await fs.writeFile(path.join(__dirname, 'public', 'products.json'), JSON.stringify(products, null, 2));

        res.redirect(`/product/${product.code}?reviewSubmitted=true`);
    } else {
        res.status(404).send('Product not found');
    }
});

// Existing routes for adding to cart, buying now, and processing payments
app.post('/add-to-cart', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    const users = await readUsersFromFile();
    const userIndex = users.findIndex(user => user.username === req.session.username);
    const user = users[userIndex];

    if (!user) return res.status(404).send('User not found');

    // Check if the product with the same size exists in the user's cart
    const existingProductIndex = user.cart.findIndex(item => item.productCode === productCode && item.size === size);

    if (existingProductIndex !== -1) {
        // Product exists, update the quantity
        user.cart[existingProductIndex].quantity += parseInt(quantity, 10);
    } else {
        // Product doesn't exist, add it to the cart
        user.cart.push({
            productCode,
            size,
            quantity: parseInt(quantity, 10)
        });
    }

    // Save the updated user data back to the users.json file
    await writeUsersToFile(users);

    // Also update the session cart (if needed)
    const sessionProductIndex = req.session.cart.findIndex(item => item.product.code === productCode && item.size === size);
    if (sessionProductIndex !== -1) {
        req.session.cart[sessionProductIndex].quantity += parseInt(quantity, 10);
    } else {
        req.session.cart.push({ product, size, quantity: parseInt(quantity, 10) });
    }

    res.redirect('/cart');
});

app.post('/buy-now', ensureLoggedInAndExists, async (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);
    if (!product) return res.status(404).send('Product not found');

    try {
        const username = req.session.username;

        // Read users data from users.json
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        const user = users[userIndex];

        // Check if the product is already in the user's cart
        const existingProductIndex = user.cart.findIndex(item => item.productCode === productCode && item.size === size);

        if (existingProductIndex !== -1) {
            // If the product exists, increase the quantity
            user.cart[existingProductIndex].quantity += parseInt(quantity, 10);
        } else {
            // If the product doesn't exist, add it to the cart
            user.cart.push({ productCode, size, quantity: parseInt(quantity, 10) });
        }

        // Save the updated users data to users.json
        await writeUsersToFile(users);

        // Also store in the session tempCart for immediate checkout
        req.session.tempCart = [{ 
        productCode,
        name: product.name, 
        quantity: parseInt(quantity, 10),
        size,
            product: {
                price: product.price
            }
    }];
    
    res.redirect('/payment');
    } catch (error) {
        console.error('Error processing buy-now:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Remove from cart
app.post('/remove-from-cart', ensureLoggedInAndExists, async (req, res) => {
    try {
    const { productCode, size } = req.body;
        const username = req.session.username;

        // Read users data from users.json
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        const user = users[userIndex];

        // Remove the product from the user's cart
        const updatedCart = user.cart.filter(item => !(item.productCode === productCode && item.size === size));

        // Update the cart in the user's data
        user.cart = updatedCart;

        // Save the updated users data to users.json
    await writeUsersToFile(users);

        // Also update the session cart
        req.session.cart = updatedCart;

    res.redirect('/cart');
    } catch (error) {
        console.error('Error removing item from cart:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Sign up and login routes
app.post('/signup', async (req, res) => {
    const { username, email, password, confirmPassword, phone, gender, dob } = req.body;
    const users = await readUsersFromFile();

    if (users.some(user => user.username === username)) return res.redirect('/signup?errorMessage=Username already exists.');
    if (users.some(user => user.email === email)) return res.redirect('/signup?errorMessage=Email already exists.');
    if (password !== confirmPassword) return res.redirect('/signup?errorMessage=Passwords do not match.');

    users.push({ username, email, password, phone, gender, dob, purchased: {}, cart: [] }); // Initialize purchased as an empty array
    await writeUsersToFile(users);
    res.redirect('/login?signedUp=true');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsersFromFile();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        req.session.username = user.username;
        res.redirect('/?loggedIn=true');
    } else {
        res.redirect('/login?errorMessage=Invalid username or password.');
    }
});

app.post('/process-payment', ensureLoggedInAndExists, async (req, res) => {
    try {
        const { address, useRewards } = req.body;
        const isUsingRewards = useRewards === 'true';

        if (!address || address.trim() === '') {
            return res.status(400).send('Address is required');
        }

        const username = req.session.username;
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        const user = users[userIndex];
        const cart = user.cart;

        // Ensure there are items in the cart
        if (!cart || cart.length === 0) {
            return res.status(404).send('No items in cart for payment');
        }

        // Get the most recent product (last product in the cart)
        const mostRecentProduct = cart.pop(); // Removes the last item from the array

        // Find the product details
        const product = products.find(p => p.code === mostRecentProduct.productCode);
        if (!product) {
            return res.status(404).send('Product not found');
        }

        const selectedSize = mostRecentProduct.size;

        // Check if stock for the specific size exists and if there's enough
        if (!product.stock || !product.stock[selectedSize] || product.stock[selectedSize] < mostRecentProduct.quantity) {
            return res.status(400).send('Invalid size or insufficient stock available');
        }

        // Decrease the stock of the product for the specific size
        product.stock[selectedSize] -= mostRecentProduct.quantity;

        // Increment popularity count for the product
        product.popularity = (product.popularity || 0) + mostRecentProduct.quantity;

        // Save updated products to file
        await writeProductsToFile(products);

        // Calculate total cost for the most recent item
        let totalSpent = product.price * mostRecentProduct.quantity;
        const shippingCost = 5.90;
        totalSpent += shippingCost;

        // Calculate rewards points earned (1 point for every $1 spent)
        const rewardsPointsEarned = Math.floor(totalSpent); // Earn points based on totalSpent (no cents)
        user.rewardsPoints = (user.rewardsPoints || 0) + rewardsPointsEarned;

        // Apply discount if rewards are used
        let discount = 0;
        if (isUsingRewards && user.rewardsPoints > 0) {
            discount = Math.min(user.rewardsPoints * 0.01, totalSpent); // 1 point = $0.01
            totalSpent -= discount; // Reduce total spent by discount
            user.rewardsPoints -= discount * 100; // Deduct the used points (100 points = $1.00)
        }

        // Ensure the total is non-negative
        totalSpent = Math.max(totalSpent, 0);

        // Update user's purchased products
        user.purchased = user.purchased || {};
        user.purchased[mostRecentProduct.productCode] = (user.purchased[mostRecentProduct.productCode] || 0) + mostRecentProduct.quantity;

        // Update the user's address and cart
        user.address = address;
        user.cart = cart;

        // Save the updated user data back to users.json
        await writeUsersToFile(users);

        // Clear the temp session cart after processing the payment
        req.session.tempCart = [];

        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/process-checkout', ensureLoggedInAndExists, async (req, res) => {
    try {
        const { address, useRewards } = req.body;
        const isUsingRewards = useRewards === 'true';

        if (!address || address.trim() === '') {
            return res.status(400).send('Address is required');
        }

        const username = req.session.username;
        const users = await readUsersFromFile();
        const userIndex = users.findIndex(u => u.username === username);

        if (userIndex === -1) {
            return res.status(404).send('User not found');
        }

        const user = users[userIndex];
        const cart = req.session.cart;

        if (!cart || cart.length === 0) {
            return res.status(404).send('No items in cart for payment');
        }

        let totalSpent = 0;
        let totalQuantity = 0;
        let discount = 0;

        // Loop through each cart item to calculate the total cost and update stock
        for (const item of cart) {
            const product = products.find(p => p.code === item.product.code);
            if (!product) {
                return res.status(404).send(`Product with code ${item.product.code} not found`);
            }

            const selectedSize = item.size;
            if (!product.stock || product.stock[selectedSize] < item.quantity) {
                return res.status(400).send(`Insufficient stock for product: ${product.name}, size: ${selectedSize}`);
            }

            // Calculate total cost for this item
            totalSpent += product.price * item.quantity;
            totalQuantity += item.quantity;

            // Decrease stock for the size
            product.stock[selectedSize] -= item.quantity;

            // Increment product popularity
            product.popularity = (product.popularity || 0) + item.quantity;

            // Update user's purchased products
            user.purchased[item.product.code] = (user.purchased[item.product.code] || 0) + item.quantity;
        }

        // Include shipping cost when calculating totalSpent
        const shippingCost = 5.90;
        totalSpent += shippingCost; // Include shipping in total spent

        // Apply rewards points (100 points = RM1 off)
        if (isUsingRewards && user.rewardsPoints > 0) {
            discount = Math.min(user.rewardsPoints * 0.01, totalSpent); // Limit discount to total spent
            totalSpent -= discount; // Reduce total spent by discount
            const pointsToDeduct = discount * 100; // Calculate points to deduct

            // Log current points before deduction
            console.log('Current Rewards Points Before Deduction:', user.rewardsPoints);
            console.log('Points to Deduct:', pointsToDeduct);

            // Deduct points only if user has enough points
            if (user.rewardsPoints >= pointsToDeduct) {
                user.rewardsPoints -= pointsToDeduct; // Deduct used points
                console.log(`Points deducted. New Rewards Points: ${user.rewardsPoints}`);
            } else {
                console.log('Not enough points to deduct');
            }
        }

        // Ensure totalSpent is non-negative
        totalSpent = Math.max(totalSpent, 0);

        // Calculate rewards points earned (1 point per RM1 spent including shipping)
        const rewardsPointsEarned = Math.floor(totalSpent);
        user.rewardsPoints = (user.rewardsPoints || 0) + rewardsPointsEarned;

        // Update user address and clear their cart
        user.address = address;
        user.cart = [];

        // Save all changes to users.json and products.json
        req.session.cart = []; // Clear the session cart
        await writeUsersToFile(users);
        await writeProductsToFile(products);

        res.redirect('/confirmation');
    } catch (error) {
        console.error('Error processing checkout:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
app.listen(PORT, HOST, () => console.log(`Server running at http://${HOST}:${PORT}`));