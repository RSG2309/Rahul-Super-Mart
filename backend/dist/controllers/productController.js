"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkExport = exports.bulkUpload = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProductById = exports.getProducts = void 0;
const models_1 = require("../models");
const redis_1 = require("../services/redis");
const getProducts = async (req, res) => {
    try {
        const { category, brand, search } = req.query;
        // Check cache first for simple listings
        const includeInactive = req.query.includeInactive === 'true';
        const cacheKey = `products:cat_${category || ''}:br_${brand || ''}:s_${search || ''}:inc_${includeInactive}`;
        const cachedData = await redis_1.cacheService.get(cacheKey);
        if (cachedData) {
            return res.status(200).json({
                success: true,
                source: 'cache',
                products: JSON.parse(cachedData)
            });
        }
        let products = await models_1.ProductModel.find({});
        if (!includeInactive) {
            products = products.filter(p => p.isActive !== false);
        }
        // Manual filtering for search/filters to ensure consistency
        if (category) {
            products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
        }
        if (brand) {
            products = products.filter(p => p.brand.toLowerCase() === brand.toLowerCase());
        }
        if (search) {
            const s = search.toLowerCase();
            products = products.filter(p => p.name.toLowerCase().includes(s) ||
                p.sku.toLowerCase().includes(s) ||
                p.brand.toLowerCase().includes(s) ||
                p.description.toLowerCase().includes(s));
        }
        // Set cache (TTL 60 seconds)
        await redis_1.cacheService.set(cacheKey, JSON.stringify(products), 60);
        return res.status(200).json({
            success: true,
            source: 'database',
            products
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await models_1.ProductModel.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        return res.status(200).json({ success: true, product });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.getProductById = getProductById;
const createProduct = async (req, res) => {
    try {
        const { name, sku, brand, category, description, mrp, wholesalePrice, retailerPrice, discount, gstPercentage, moq, stock, weight, unit, specifications } = req.body;
        if (!name || !sku || !brand || !category || !mrp || !wholesalePrice || !retailerPrice || !gstPercentage || !weight) {
            return res.status(400).json({ success: false, message: 'Please provide all mandatory product parameters' });
        }
        const existingSku = await models_1.ProductModel.findOne({ sku });
        if (existingSku) {
            return res.status(400).json({ success: false, message: `Product with SKU ${sku} already exists` });
        }
        const product = await models_1.ProductModel.create({
            name,
            sku,
            brand,
            category,
            description: description || name,
            images: req.body.images || ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'],
            mrp,
            wholesalePrice,
            retailerPrice,
            discount: discount || 0,
            gstPercentage,
            moq: moq || 1,
            stock: stock || 0,
            weight,
            unit: unit || 'Piece',
            specifications: specifications || [],
            isActive: req.body.isActive !== undefined ? req.body.isActive : true
        });
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'PRODUCT_CREATE',
            details: `Created product ${name} (SKU: ${sku})`
        });
        // Clear product cache
        await redis_1.cacheService.clear();
        return res.status(201).json({ success: true, message: 'Product created successfully', product });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedProduct = await models_1.ProductModel.findByIdAndUpdate(id, req.body);
        if (!updatedProduct) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'PRODUCT_UPDATE',
            details: `Updated product ${updatedProduct.name} (SKU: ${updatedProduct.sku})`
        });
        // Clear cache
        await redis_1.cacheService.clear();
        return res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const success = await models_1.ProductModel.findByIdAndDelete(id);
        if (!success) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'PRODUCT_DELETE',
            details: `Deleted product ID: ${id}`
        });
        // Clear cache
        await redis_1.cacheService.clear();
        return res.status(200).json({ success: true, message: 'Product deleted successfully' });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.deleteProduct = deleteProduct;
const bulkUpload = async (req, res) => {
    try {
        const { products } = req.body; // Expecting array of products in JSON format
        if (!Array.isArray(products)) {
            return res.status(400).json({ success: false, message: 'Invalid format. Expected JSON array of products.' });
        }
        const uploadedCount = [];
        for (const prod of products) {
            const existing = await models_1.ProductModel.findOne({ sku: prod.sku });
            if (!existing) {
                const p = await models_1.ProductModel.create({
                    name: prod.name,
                    sku: prod.sku,
                    brand: prod.brand,
                    category: prod.category,
                    description: prod.description || prod.name,
                    images: prod.images || ['https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'],
                    mrp: Number(prod.mrp),
                    wholesalePrice: Number(prod.wholesalePrice),
                    retailerPrice: Number(prod.retailerPrice),
                    discount: Number(prod.discount || 0),
                    gstPercentage: Number(prod.gstPercentage),
                    moq: Number(prod.moq || 1),
                    stock: Number(prod.stock || 0),
                    weight: Number(prod.weight || 1),
                    unit: prod.unit || 'Piece',
                    specifications: prod.specifications || []
                });
                uploadedCount.push(p);
            }
        }
        await models_1.AuditLogModel.create({
            userId: req.user?.id || 'admin',
            userEmail: req.user?.email || 'admin@b2b.com',
            userRole: req.user?.role || 'admin',
            action: 'BULK_UPLOAD',
            details: `Uploaded ${uploadedCount.length} new products via bulk upload`
        });
        await redis_1.cacheService.clear();
        return res.status(200).json({
            success: true,
            message: `Bulk import completed. Successfully uploaded ${uploadedCount.length} new products.`,
            count: uploadedCount.length
        });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.bulkUpload = bulkUpload;
const bulkExport = async (req, res) => {
    try {
        const products = await models_1.ProductModel.find({});
        // Construct CSV Header
        let csv = 'SKU,Name,Brand,Category,MRP,WholesalePrice,RetailerPrice,GSTPercentage,MOQ,Stock,Weight,Unit\n';
        products.forEach(p => {
            csv += `"${p.sku}","${p.name.replace(/"/g, '""')}","${p.brand}","${p.category}",${p.mrp},${p.wholesalePrice},${p.retailerPrice},${p.gstPercentage},${p.moq},${p.stock},${p.weight},"${p.unit}"\n`;
        });
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=b2b_products.csv');
        return res.status(200).send(csv);
    }
    catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
exports.bulkExport = bulkExport;
