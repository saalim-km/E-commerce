const Category = require("../models/category");

//  all categories
const getAllCategories = async (req, res) => {
  try {
    if(!req.session.admin){
      return res.redirect("/admin/login");
    }else{
      const categories = await Category.find();

    if (categories.length === 0) {
      req.flash("info", "No categories found. Please add some categories.");
      return res.redirect('/admin/users');
    }
    res.render("categories", { categories });
    }
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not retrieve categories");
    res.redirect("/admin");
  }
};

//  new category
const createCategory = async (req, res) => {
  const { name, description } = req.body;
    console.log(name,description);
    
  const existingCategory = await Category.findOne({ name });
  if (existingCategory) {
    req.flash("error", "Category already exists");
    return res.redirect("/admin/categories");
  }

  const newCategory = new Category({
    name,
    description,
    status: "listed", 
  });

  try {
    await newCategory.save();
    req.flash("success", "Category added successfully");
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not add category");
    res.redirect("/admin/categories");
  }
};

//  edit category 
const editCategoryForm = async (req, res) => {
  const { id } = req.params;
  try {
    const category = await Category.findById(id);
    res.render("editCategory", { category }); // Make sure this path is correct
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not retrieve category for editing");
    res.redirect("/admin/categories");
  }
};

// update  category
const updateCategory = async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  try {
    await Category.findByIdAndUpdate(id, {
      name,
      description,
    });
    req.flash("success", "Category updated successfully");
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not update category");
    res.redirect("/admin/categories");
  }
};


const toggleCategoryStatus = async (req, res) => {
  const { id } = req.params;

  try {
    const category = await Category.findById(id);
    category.isListed = category.isListed ? false : true;
    await category.save();
    req.flash(
      "success",
      `Category ${
        category.isListed ? "listed" : "unlisted"
      } successfully`
    );
    res.redirect("/admin/categories");
  } catch (error) {
    console.error(error.message);
    req.flash("error", "Could not toggle category status");
    res.redirect("/admin/categories");
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  editCategoryForm,
  updateCategory,
  toggleCategoryStatus,
};
