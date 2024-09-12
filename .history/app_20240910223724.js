const expressLayouts = require('express-ejs-layouts');
const express = require('express');
const session = require('express-session');
const app = express();
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config(); // For loading environment variables

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
    
        // Define the specific product ID you want to display
        const specificProductIds = [1, 2, 3]; // Change this ID to the one you want
    
        // Find the specific product
        const specificProducts = products.find(p => p.code === specificProductIds);
    
        res.render('index', { title: 'Home', products, specificProducts });
});

app.get('/about', (req, res) => res.render('about', { title: 'About Us' }));

app.get('/women', (req, res) => res.render('women', { title: 'Women', products }));

app.get('/men', (req, res) => res.render('men', { title: 'Men', products }));

app.get('/kids', (req, res) => res.render('kids', { title: 'Kids', products }));

app.get('/login', (req, res) => res.render('login', { title: 'Login' }));

app.get('/signup', (req, res) => res.render('signup', { title: 'Sign Up' }));

app.get('/products', (req, res) => res.render('products', { title: 'All Products', products }));

app.get('/product/:code', (req, res) => {
    const product = products.find(p => p.code === req.params.code);
    if (!product) {
        return res.status(404).send('Product not found');
    }
    res.render('product', { title: 'Product', product });
});

app.get('/cart', (req, res) => res.render('cart', { title: 'Cart', cart: req.session.cart }));

app.get('/payment', (req, res) => {
    // For simplicity, let's assume you have cart details in req.session.cart
    const cart = req.session.cart; // Or fetch cart details from a database
    const user = req.session.user; // Or fetch user details from a database
  
    res.render('payment', { title: 'Payment Details', cart, user });
  });

  app.get('/payment', (req, res) => {
    const cart = req.session.tempCart;

    if (!cart) {
        return res.status(404).send('No items found for payment');
    }

    res.render('payment', { cart });
});


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

// Buy Now Route
app.post('/buy-now', (req, res) => {
    const { productCode, size, quantity } = req.body;
    const product = products.find(p => p.code === productCode);

    if (!product) {
        return res.status(404).send('Product not found');
    }

    // Add product to the main cart
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

    // Create a temporary cart for the payment page
    const tempCart = [{
        name: product.name,
        quantity: parseInt(quantity, 10),
        product: {
            price: product.price
        }
    }];
     // Store the temporary cart in the session for the payment page
     req.session.tempCart = tempCart;

     // Redirect to payment page
     res.redirect('/payment');
 });
 
 // Payment Page Route (for temporary cart)
 app.get('/payment', (req, res) => {
     const cart = req.session.tempCart;
 
     if (!cart) {
         return res.status(404).send('No items found for payment');
     }
 
     res.render('payment', { cart });
 });
 
 // Checkout Route (for main cart)
 app.get('/checkout', (req, res) => {
     const cart = req.session.cart;
 
     if (!cart || cart.length === 0) {
         return res.status(404).send('No items in cart');
     }
 
     res.render('checkout', { title: 'Cart', cart });
 });

 app.get('/confirmation', (req, res) => res.render('confirmation', { title: 'Confirmation' }));

// Process Payment Route (for temporary cart)
app.post('/process-payment', (req, res) => {
    const { paymentMethod } = req.body;

    if(!req.session.tempCart) {
        req.session.tempCart = [];
    }

    if (paymentMethod === 'online-banking') {
        // Handle online banking payment (Stripe)
        
      } else if (paymentMethod === 'cod') {
        // Handle cash on delivery payment
      }
    
    // Clear the temporary cart after payment processing
    req.session.tempCart = null;

     // Remove items from the main cart after payment
     req.session.cart = req.session.cart.filter(item => {
        const tempCartItem = req.session.tempCart.find(tempItem => tempItem.product.code === item.product.code);
        return !tempCartItem || tempCartItem.quantity < item.quantity;
    });

    // Here you would handle the payment processing logic
    res.redirect('/confirmation'); // Adjust the redirect as needed
});

// Process Checkout Route (for main cart)
app.post('/process-checkout', (req, res) => {
    const { paymentMethod } = req.body;

    if(!req.session.tempCart) {
        req.session.tempCart = [];
    }

    if (paymentMethod === 'online-banking') {
        // Handle online banking payment (Stripe)
        
      } else if (paymentMethod === 'cod') {
        // Handle cash on delivery payment
      }

    // Clear the main cart after payment processing
    req.session.cart = [];

    // Here you would handle the payment processing logic
    res.redirect('/confirmation'); // Adjust the redirect as needed
});

app.post('/remove-from-cart', (req, res) => {
    const { productCode, size } = req.body;
    req.session.cart = req.session.cart.filter(
        item => !(item.product.code === productCode && item.size === size)
    );
    res.redirect('/cart');
});

app.post('/signup', (req, res) => {
    const { username, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match.');
    }

    // Placeholder for database logic
    console.log(`New user registered: ${username}, ${email}`);

    res.redirect('/login');
});

// Start the server
app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});