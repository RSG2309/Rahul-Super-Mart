import { Request, Response } from 'express';
import { ProductModel, CategoryModel, AuditLogModel } from '../models';
import { cacheService } from '../services/redis';
import { AuthRequest } from '../middleware/auth';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, brand, search } = req.query;
    
    // Check cache first for simple listings
    const includeInactive = req.query.includeInactive === 'true';
    const cacheKey = `products:cat_${category || ''}:br_${brand || ''}:s_${search || ''}:inc_${includeInactive}`;
    const cachedData = await cacheService.get(cacheKey);
    
    if (cachedData) {
      return res.status(200).json({
        success: true,
        source: 'cache',
        products: JSON.parse(cachedData)
      });
    }

    let products = await ProductModel.find({});

    if (!includeInactive) {
      products = products.filter(p => p.isActive !== false);
    }

    // Manual filtering for search/filters to ensure consistency
    if (category) {
      products = products.filter(p => p.category.toLowerCase() === (category as string).toLowerCase());
    }
    if (brand) {
      products = products.filter(p => p.brand.toLowerCase() === (brand as string).toLowerCase());
    }
    if (search) {
      const s = (search as string).toLowerCase();
      products = products.filter(p => 
        p.name.toLowerCase().includes(s) || 
        p.sku.toLowerCase().includes(s) || 
        p.brand.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s)
      );
    }

    // Sort products by sortOrder ascending, and then by createdAt descending
    products.sort((a, b) => {
      const orderA = a.sortOrder !== undefined ? a.sortOrder : 1000;
      const orderB = b.sortOrder !== undefined ? b.sortOrder : 1000;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA; // Newest first
    });

    // Set cache (TTL 60 seconds)
    await cacheService.set(cacheKey, JSON.stringify(products), 60);

    return res.status(200).json({
      success: true,
      source: 'database',
      products
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const product = await ProductModel.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.status(200).json({ success: true, product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { name, sku, brand, category, description, mrp, wholesalePrice, retailerPrice, discount, gstPercentage, moq, stock, weight, unit, specifications, sortOrder } = req.body;

    if (!name || !sku || !brand || !category || !mrp || !wholesalePrice || !retailerPrice || !gstPercentage || !weight) {
      return res.status(400).json({ success: false, message: 'Please provide all mandatory product parameters' });
    }

    const existingSku = await ProductModel.findOne({ sku });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Product with SKU ${sku} already exists` });
    }

    const product = await ProductModel.create({
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
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      sortOrder: sortOrder !== undefined ? Number(sortOrder) : 1000
    });

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: 'PRODUCT_CREATE',
      details: `Created product ${name} (SKU: ${sku})`
    });

    // Clear product cache
    await cacheService.clear();

    return res.status(201).json({ success: true, message: 'Product created successfully', product });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const updatedProduct = await ProductModel.findByIdAndUpdate(id, req.body);

    if (!updatedProduct) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: 'PRODUCT_UPDATE',
      details: `Updated product ${updatedProduct.name} (SKU: ${updatedProduct.sku})`
    });

    // Clear cache
    await cacheService.clear();

    return res.status(200).json({ success: true, message: 'Product updated successfully', product: updatedProduct });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const success = await ProductModel.findByIdAndDelete(id);

    if (!success) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: 'PRODUCT_DELETE',
      details: `Deleted product ID: ${id}`
    });

    // Clear cache
    await cacheService.clear();

    return res.status(200).json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkUpload = async (req: AuthRequest, res: Response) => {
  try {
    const { products } = req.body; // Expecting array of products in JSON format
    
    if (!Array.isArray(products)) {
      return res.status(400).json({ success: false, message: 'Invalid format. Expected JSON array of products.' });
    }

    const uploadedCount = [];
    for (const prod of products) {
      const existing = await ProductModel.findOne({ sku: prod.sku });
      if (!existing) {
        const p = await ProductModel.create({
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
          specifications: prod.specifications || [],
          sortOrder: prod.sortOrder !== undefined ? Number(prod.sortOrder) : 1000
        });
        uploadedCount.push(p);
      }
    }

    await AuditLogModel.create({
      userId: req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@b2b.com',
      userRole: req.user?.role || 'admin',
      action: 'BULK_UPLOAD',
      details: `Uploaded ${uploadedCount.length} new products via bulk upload`
    });

    await cacheService.clear();

    return res.status(200).json({
      success: true,
      message: `Bulk import completed. Successfully uploaded ${uploadedCount.length} new products.`,
      count: uploadedCount.length
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const bulkExport = async (req: Request, res: Response) => {
  try {
    const products = await ProductModel.find({});
    
    // Construct CSV Header
    let csv = 'SKU,Name,Brand,Category,MRP,WholesalePrice,RetailerPrice,GSTPercentage,MOQ,Stock,Weight,Unit\n';
    
    products.forEach(p => {
      csv += `"${p.sku}","${p.name.replace(/"/g, '""')}","${p.brand}","${p.category}",${p.mrp},${p.wholesalePrice},${p.retailerPrice},${p.gstPercentage},${p.moq},${p.stock},${p.weight},"${p.unit}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=b2b_products.csv');
    return res.status(200).send(csv);
  } catch (error: any) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
