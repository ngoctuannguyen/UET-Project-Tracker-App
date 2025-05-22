const { Report, Product, Employee, Component } = require('../models');

const addProduct = async ( project ) => {
  try {
    const newProduct = await Product.create(
        {
            productCode: project.project_id,
            name: project.project_name,
            progress: project.project_progress,
            status: project.project_status,
            created_at: project.created_at,
            project_due: project.project_due
        }
        );
    return newProduct;
  } catch (error) {
    console.error('Error adding product:', error);
    throw new Error('Error adding product');
  }
}

const addComponent = async ( newTask, projectId ) => {
    try {
        const newComponent = await Component.create(
            {
                componentCode: newTask.task_id,
                name: newTask.work_description,
                productCode: projectId,
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

const deleteComponent = async (projectId, componentId, data) => {
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

const updateComponent = async ( projectId, componentId, data ) => {
    try {
        const component = await Component.findByPk(componentId);
        if (!component) return { success: false, message: 'Component not found' };
        await component.update({
            name: data.work_description,
            is_completed: data.status,
            productCode: projectId,
            componentCode: componentId
        });
        return { success: true, message: 'Component updated successfully' };
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
  updateComponent
};