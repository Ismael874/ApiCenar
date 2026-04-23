// src/controllers/categoryController.js
// Controlador para gestión de categorías (comercios)

const Category = require('../models/Category');
const Commerce = require('../models/Commerce');
const Product = require('../models/Product');
const { validationResult } = require('express-validator');

// GET /api/categories - Listar categorías del comercio
exports.getMyCategories = async (req, res) => {
    try {
        const user = req.user;
        const commerce = await Commerce.findOne({ user: user._id });
        
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const { page = 1, pageSize = 20, search, sortBy = 'name', sortDirection = 'asc' } = req.query;
        
        const query = { commerce: commerce._id };
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        const sort = {};
        sort[sortBy] = sortDirection === 'desc' ? -1 : 1;
        
        const categories = await Category.find(query)
            .sort(sort)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize));
        
        // Obtener cantidad de productos por categoría
        const categoriesWithCount = await Promise.all(categories.map(async (category) => {
            const productCount = await Product.countDocuments({ category: category._id });
            return {
                ...category.toObject(),
                productCount
            };
        }));
        
        const total = await Category.countDocuments(query);
        
        res.status(200).json({
            data: categoriesWithCount,
            pagination: {
                page: parseInt(page),
                pageSize: parseInt(pageSize),
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
        
    } catch (error) {
        console.error('Error obteniendo categorías:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// GET /api/categories/:id - Obtener categoría por ID
exports.getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const category = await Category.findOne({ _id: id, commerce: commerce._id });
        
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        const productCount = await Product.countDocuments({ category: category._id });
        
        res.status(200).json({
            ...category.toObject(),
            productCount
        });
        
    } catch (error) {
        console.error('Error obteniendo categoría:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// POST /api/categories - Crear categoría
exports.createCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { name, description } = req.body;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        // Verificar si ya existe una categoría con el mismo nombre
        const existingCategory = await Category.findOne({ name, commerce: commerce._id });
        if (existingCategory) {
            return res.status(409).json({ message: 'Ya existe una categoría con este nombre' });
        }
        
        const category = new Category({
            name,
            description: description || '',
            commerce: commerce._id,
            isActive: true
        });
        
        await category.save();
        
        res.status(201).json({
            message: 'Categoría creada exitosamente',
            category
        });
        
    } catch (error) {
        console.error('Error creando categoría:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// PUT /api/categories/:id - Actualizar categoría
exports.updateCategory = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const { id } = req.params;
        const { name, description, isActive } = req.body;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const category = await Category.findOne({ _id: id, commerce: commerce._id });
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar nombre duplicado
        if (name && name !== category.name) {
            const existingCategory = await Category.findOne({ name, commerce: commerce._id, _id: { $ne: id } });
            if (existingCategory) {
                return res.status(409).json({ message: 'Ya existe una categoría con este nombre' });
            }
            category.name = name;
        }
        
        if (description !== undefined) category.description = description;
        if (isActive !== undefined) category.isActive = isActive === true || isActive === 'true';
        
        await category.save();
        
        res.status(200).json({
            message: 'Categoría actualizada exitosamente',
            category
        });
        
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};

// DELETE /api/categories/:id - Eliminar categoría
exports.deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        const commerce = await Commerce.findOne({ user: user._id });
        if (!commerce) {
            return res.status(404).json({ message: 'Comercio no encontrado' });
        }
        
        const category = await Category.findOne({ _id: id, commerce: commerce._id });
        if (!category) {
            return res.status(404).json({ message: 'Categoría no encontrada' });
        }
        
        // Verificar si tiene productos asociados
        const productCount = await Product.countDocuments({ category: id });
        if (productCount > 0) {
            return res.status(400).json({ 
                message: 'No se puede eliminar la categoría porque tiene productos asociados' 
            });
        }
        
        await Category.deleteOne({ _id: id });
        
        res.status(200).json({ message: 'Categoría eliminada exitosamente' });
        
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.status(500).json({ message: 'Error del servidor' });
    }
};