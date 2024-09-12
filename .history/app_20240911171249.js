const expressLayouts = require('express-ejs-layouts');
const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

const app = express();

// Middleware
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layout');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: true,
}));

// Load product data from products.json
let products = [];
(async () => {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'products.json'), 'utf-8');
        products = JSON.parse(data);
    } catch (err) {
        console.error('Error reading products.json:', err);
    }
})();

// Load users data from products.json
let users = [];
async function readUsersFromFile() {
    try {
        const data = await fs.readFile(path.join(__dirname, 'public', 'users.json'), 'utf-8');
        users = JSON.parse(data);
    } catch (err) {
        console.error('Error reading users.json:', err);
    }
}

// 
async function writeUsersToFile (users) {
    await fs.writeFile('users.json', JSON.stringify(users, null, 2))
}

// Middleware to initialize cart in session
app.use((req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    res.locals.cart = req.session.cart;
    next();
});

// Routes
app.get('/', (req, res) => {
    const specificProductCodes = ['1', '2', '3']; // IDs of specific products
    const specificProducts = products.filter(p => specificProductCodes.includes(p.code)) || [];
    res.render('index', { title: 'Home', products, specificProducts });
});

app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));
app.get('/women', (req, res) => res.render('women', { title: 'Women', products }));
app.get('/men', (req, res) => res.render('men', { title: 'Men', products }));
app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products }));
app.get('/login', (req, res) => res.render('login', { title: 'Login' }));
// Route to render the signup page
app.get('/signup', (req, res) => {
    const errorMessage = req.query.errorMessage; // Retrieve error message from query params
    res.render('signup', { title: 'Sign Up', errorMessage }); // Pass error message to the template
});

app.get('/products', (req, res) => res.render('products', { title: 'All Products', products }));

// Product details route
app.get('/product/:code', (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('product', { title: 'Product', product });
});

app.get('/cart', (req, res) => res.render('cart', { title: 'Cart', cart: req.session.cart }));

// Payment page
app.get('/payment', (req, res) => {
    const cart = req.session.tempCart || req.session.cart;
    if (!cart || cart.length === 0) {
        return res.status(404).send('No items found for payment');
    }
    res.render('payment', { title: 'Payment Details', cart });
});

// Checkout page for main cart
app.get('/checkout', (req, res) => {
    const cart = req.session.cart;
    if (!cart || cart.length === 0) {
        return res.status(404).send('No items in cart');
    }
    res.render('checkout', { title: 'Checkout', cart });
});

app.get('/confirmation', (req, res) => res.render('confirmation', { title: 'Confirmation' }));

// Add to cart route
app.post('/add-to-cart', (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const existingProductIndex = req.session.cart.findIndex(
        item => item.product.code === productCode && item.size === size
    );

    if (existingProductIndex !== -1) {
        req.session.cart[existingProductIndex].quantity += parseInt(quantity, 10);
    } else {
        req.session.cart.push({
            product,
            size,
            quantity: parseInt(quantity, 10)
        });
    }

    res.redirect('/cart');
});

// Buy now route
app.post('/buy-now', (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    const tempCart = [{
        name: product.name,
        quantity: parseInt(quantity, 10),
        product: {
            price: product.price
        }
    }];

    req.session.tempCart = tempCart;

    // Redirect to payment page
    res.redirect('/payment');
});

// Process payment
app.post('/process-payment', (req, res) => {
    const { paymentMethod } = req.body;
    const tempCart = req.session.tempCart;

    if (!tempCart || tempCart.length === 0) {
        return res.status(404).send('No items in cart for payment');
    }

    if (paymentMethod === 'online-banking') {
        // Handle online banking payment (e.g., Stripe)
    } else if (paymentMethod === 'cod') {
        // Handle cash on delivery payment
    }

    // Clear temporary cart after payment
    req.session.tempCart = null;

    res.redirect('/confirmation');
});

// Remove from cart route
app.post('/remove-from-cart', (req, res) => {
    const { productCode, size } = req.body;
    req.session.cart = req.session.cart.filter(
        item => !(item.product.code === productCode && item.size === size)
    );
    res.redirect('/cart');
});

// User sign-up route
app.post('/signup', async (req, res) => {
    const { username, email, password, phone, gender, dob } = req.body;
    const users = await readUsersFromFile();
    
    // Check if the username already exists
    const existingUser = users.find(user => user.username === username);
    if (existingUser) {
        return res.redirect('/signup?errorMessage=Username already exists. Please choose another one.');
    }

      // Check if passwords match
    if (password !== confirmPassword) {
        return res.redirect('/signup?errorMessage=Passwords do not match. Please try again.');
    }

    // Add new user to the users array
    users.push({ username, email, password, phone, gender, dob });
  
    // Write updated users array to the JSON file
    await writeUsersToFile(users);
    
    // Redirect to login page after successful signup
    res.redirect('/login');
});

// Handle login form submission
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await readUsersFromFile();
  
    // Check if the user exists and the password matches
    const user = users.find(user => user.username === username && user.password === password);
    
    if (user) {
        res.redirect('/');
    } else {
      res.redirect('/login?errorMessage=Invalid username or password. Please try again.');
    }
  });
  
  

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
