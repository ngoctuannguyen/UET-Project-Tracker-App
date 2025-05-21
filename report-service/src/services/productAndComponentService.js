const { Report, Product, Employee,Component } = require('../models');

const addProduct = async (id, name,progress,status) => {
  try {
    const newProduct = await Product.create(
        {
            productCode: id,
            name: name,
            progress: progress,
            status: status,
            timeSpent: 0
        }
        );
    return newProduct;
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error('Database error');
  }
}

const addComponent = async (componentId,description,productId) => {
    try {
        const newComponent = await Component.create(
            {
                componentCode: componentId,
                name: description,
                productCode: productId,
                is_completed: false
            }
            );
        return newComponent;
    } catch (error) {
        console.error('Error adding component:', error);
        throw new Error('Database error');
    }
    }

const deleteProduct = async (productId) => {
  try {
    const product = await Product.findByPk(productId);
    if (!product) return { success: false, message: 'Product not found' };

    await product.destroy();
    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, message: error.message };
  }
}

const deleteComponent = async (componentId) => {
    try {
        const component = await Component.findByPk(componentId);
        if (!component) return { success: false, message: 'Component not found' };
    
        await component.destroy();
        return { success: true };
    } catch (error) {
        console.error('Error deleting component:', error);
        return { success: false, message: error.message };
    }
    }

module.exports = {
  addProduct,
  addComponent,
  deleteProduct,
  deleteComponent,
};