const mongoose = require('mongoose');
const Category = require('./models/category'); // Adjust the path according to your structure
const dbConnect = require('./config/config'); // Adjust according to your database connection file

const seedCategories = async () => {
    try {
        await dbConnect(); // Connect to the database

        // Sample categories to seed
        const categories = [
            { name: 'Clothes', slug: 'clothes', description: 'All kinds of clothes', status: 'listed' },
            { name: 'Electronics', slug: 'electronics', description: 'Electronic items', status: 'listed' },
            { name: 'Home & Kitchen', slug: 'home-kitchen', description: 'Kitchen and home appliances', status: 'listed' },
        ];

        // Insert categories into the database
        await Category.insertMany(categories);
        console.log('Categories have been seeded!');
    } catch (error) {
        console.error('Error seeding categories:', error);
    } finally {
        mongoose.connection.close(); // Close the connection
    }
};

seedCategories();
