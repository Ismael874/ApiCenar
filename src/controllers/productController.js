// src/controllers/productController.js
// Controlador de productos (CRUD para comercios)

const Product = require('../models/Product');
const Category = require('../models/Category');
const Commerce = require('../models/Commerce');
const { validationResult } = require('express-validator');

// GET /api/products - Listar productos del comercio
exports.getMyProducts = async (req, res) => {
    try {
        const user = req.user;
        const commerce = await Commerce.findOne({ user: user._id });
        
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const { page = 1, pageSize = 10, search, categoryId, sortBy = 'createdAt', sortDirection = 'desc' } = req.query;
        
        const query = { commerce: commerce._id };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        if (categoryId) {
            query.category = categoryId;
        }
        
        const sort = {};
        sort[sortBy] = sortDirection === 'desc' ? -1 : 1;
        
        const products = await Product.find(query)
            .populate('category', 'name')
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        const total = await Product.countDocuments(query);
        
        res.status(200).json({
            data: products,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo productos:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/products/:id - Obtener producto por ID
exports.getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const product = await Product.findOne({ _id: id, commerce: commerce._id })
            .populate('category', 'name');
        
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.status(200).json(product);
        
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// POST /api/products - Crear producto
exports.createProduct = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { name, description, price, categoryId } = req.body;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        // Verificar que la categoría pertenezca al comercio
        const category = await Category.findOne({ _id: categoryId, commerce: commerce._id });
        if (!category) {
            return res.status(400).json({ message: 'Categoría no válida' });
        }
        
        const image = req.file ? `/uploads/products/${req.file.filename}` : '/uploads/products/default-product.png';
        
        const product = new Product({
            name,
            description: description || '',
            price: parseFloat(price),
            category: categoryId,
            commerce: commerce._id,
            image
        });
        
        await product.save();
        
        res.status(201).json({
            message: 'Producto creado exitosamente',
            product
        });
        
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PUT /api/products/:id - Actualizar producto
exports.updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, categoryId, isActive, isAvailable } = req.body;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const product = await Product.findOne({ _id: id, commerce: commerce._id });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        // Actualizar campos
        if (name) product.name = name;
        if (description !== undefined) product.description = description;
        if (price) product.price = parseFloat(price);
        if (isActive !== undefined) product.isActive = isActive === 'true' || isActive === true;
        if (isAvailable !== undefined) product.isAvailable = isAvailable === 'true' || isAvailable === true;
        
        // Verificar categoría si se proporciona
        if (categoryId) {
            const category = await Category.findOne({ _id: categoryId, commerce: commerce._id });
            if (!category) {
                return res.status(400).json({ message: 'Categoría no válida' });
            }
            product.category = categoryId;
        }
        
        // Actualizar imagen si se proporciona
        if (req.file) {
            product.image = `/uploads/products/${req.file.filename}`;
        }
        
        await product.save();
        
        res.status(200).json({
            message: 'Producto actualizado exitosamente',
            product
        });
        
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// DELETE /api/products/:id - Eliminar producto
exports.deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const product = await Product.findOneAndDelete({ _id: id, commerce: commerce._id });
        if (!product) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        
        res.status(200).json({ message: 'Producto eliminado exitosamente' });
        
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};