const { Op } = require("sequelize");
const db = require("../../../models");

module.exports = {
  /* Add user api start here................................*/

  async addCategory(req, res, next) {
    try {
      const { name, slug, createdId, createdType } = req.body;
      console.log(req.body, "Incoming request body");
  
      // Check for an existing category by name
      const existingCategory = await db.category.findOne({ where: { name } });
  
      if (existingCategory) {
        return res.status(400).json({ success: false, message: "Category with this name already exists" });
      }
  
      // Create the new category
      const category = await db.category.create({
        name,
        slug,
        createdId,
        createdType,
      });
  
      return res.status(200).json({ success: true, msg: "Successfully inserted category", category });
  
    } catch (err) {
      console.log("Error occurred:", err);
      next(err); // Pass the error to the error handler middleware
    }
  },  
  async updateCategory(req, res, next) {
    try {
      const { name, slug, id } = req.body;
      db.category
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.category.update(
              { slug: slug },
              { name: name },
              { where: { id: data.id } }
            );
          }
        })
        .then((category) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully updated category" });
        })
        .catch(function (err) {
          console.log(err, "errrrrrrrrrrrrrrrrrrr");
          next(err);
        });
    } catch (err) {
      console.log(err, "erreo2034028");
      throw new RequestError("Error");
    }
  },

  async addSubCategory(req, res, next) {
    try {
      const { categoryId, sub_name } = req.body;
      db.subcategories
        .findOne({ where: { sub_name: sub_name } })
        .then((data) => {
          if (data) {
            throw new RequestError("Category already exist", 409);
          }
          return db.subcategories.create({
            categoryId: categoryId,
            sub_name: sub_name,
          });
        })
        .then((category) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully inserted category" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async addSubChildCategory(req, res, next) {
    try {
      const { categoryId, subcategoryId, name } = req.body;
      db.subchildcategories
        .findOne({ where: { name: name } })
        .then((data) => {
          if (data) {
            throw new RequestError("Category already exist", 409);
          }
          return db.subchildcategories.create({
            categoryId: categoryId,
            subcategoryId: subcategoryId,
            name: name,
          });
        })
        .then((category) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully inserted category" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async updateCategory(req, res, next) {
    try {
      const { childcategoryId, subcategoryId, sub_name, name } = req.body;
      db.subcategories
        .findOne({ where: { id: subcategoryId } })
        .then((data) => {
          if (data) {
            return db.subcategories.update(
              { sub_name: sub_name },
              { where: { id: subcategoryId } }
            );
          }
          throw new RequestError("Category Not Found", 409);
        });
      db.subchildcategories
        .findOne({ where: { id: childcategoryId } })
        .then((data) => {
          if (data) {
            return db.subchildcategories.update(
              { name: name },
              { where: { id: childcategoryId } }
            );
          }
          throw new RequestError("Category Not Found", 409);
        })
        .then((category) => {
          res.status(200).json({ success: true, msg: "Successfully Updated" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getCategoryList(req, res, next) {
    try {
      db.category
        .findAll({
          attributes: ["id", "name", "createdId", "createdType"],
          include: [{ model: db.subcategories }],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getSubCategoryList(req, res, next) {
    try {
      db.subcategories
        .findAll({
          where: { categoryId: req.query.categoryId },
          include: [{ model: db.category, attributes: ["id", "name"] }],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getSubChildCategoryList(req, res, next) {
    try {
      const { subcategoryId } = req.query;
      db.subchildcategories
        .findAll({
          where: { subcategoryId: subcategoryId },
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getList(req, res, next) {
    try {
      db.subchildcategories
        .findAll({
          include: [
            {
              model: db.subcategories,
              attributes: ["id", "sub_name"],
              include: [{ model: db.category, attributes: ["id", "name"] }],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getCategoryById(req, res, next) {
    try {
      let categoryId = req.query.categoryId;
      db.subchildcategories
        .findAll({
          where: { categoryId: categoryId },
          include: [
            {
              model: db.subcategories,
              attributes: ["id", "sub_name"],
              include: [{ model: db.category, attributes: ["id", "name"] }],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  // category list
  async getMainList(req, res, next) {
    try {
      db.category
        .findAll()
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getMainListUpdate(req, res, next) {
    try {
      const { id, name, slug } = req.body;
      db.category
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.category.update(
              { name: name, slug: slug },
              { where: { id: data.id } }
            );
          }
          throw new RequestError("Category is not found");
        })
        .then((category) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully Updated category" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },
  // Sub category list
  async getSubCategory(req, res, next) {
    try {
      db.subcategories
        .findAll({
          include: [{ model: db.category, attributes: ["id", "name"] }],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },
  async getSubCatListUpdate(req, res, next) {
    try {
      const { id, sub_name } = req.body;
      db.subcategories
        .findOne({ where: { id: id } })
        .then((data) => {
          if (data) {
            return db.subcategories.update(
              { sub_name: sub_name },
              { where: { id: data.id } }
            );
          }
          throw new RequestError("Sub_Category is not found");
        })
        .then((category) => {
          res
            .status(200)
            .json({ success: true, msg: "Successfully Updated Sub_Category" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getDeletedSubCatList(req, res, next) {
    try {
      db.subcategories
        .findOne({ where: { id: parseInt(req.query.id) } })
        .then((list) => {
          if (list) {
            return db.subcategories.destroy({ where: { id: list.id } });
          }
          throw new RequestError("Id is not found");
        })
        .then((re) => {
          return res.status(200).json({
            msg: "success",
            status: "deleted Sub_Category Seccessfully",
          });
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  //child category
  async deleteCategory(req, res, next) {
    db.subchildcategories
      .findOne({ where: { id: parseInt(req.query.id) } })
      .then((data) => {
        if (data) {
          return db.subchildcategories
            .destroy({ where: { id: data.id } })
            .then((r) => [r, data]);
        }
        throw new RequestError("child_category is not found");
      })
      .then((re) => {
        return res
          .status(200)
          .json({ status: "deleted category Seccessfully" });
      })
      .catch((err) => {
        next(err);
      });
  },

  async getAllCategoryBySlug(req, res, next) {
    try {
      db.category
        .findOne({
          where: { slug: req.query.slug },
          include: [
            {
              model: db.subcategories,
              include: [{ model: db.subchildcategories }],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async filterByCategoryList(req, res, next) {
    try {
      db.product
        .findAll({
          where: { childCategoryId: req.params.id },
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getFilterbyCategory(req, res, next) {
    try {
      let { id, name } = req.body;
      db.subcategories
        .findOne({
          attributes: ["id", "sub_name"],
          where: { id: id, sub_name: name },
          include: [{ model: db.subchildcategories }],
        })
        .then((product) => {
          res.status(200).json({ success: true, data: product });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getProductBySubcategory(req, res, next) {
    try {
      let { id, name } = req.body;
      let search = "%%";
      if (name) {
        search = "%" + name + "%";
      }
      db.subcategories
        .findAll({
          attributes: ["id", "sub_name"],
          include: [
            {
              model: db.product,
              order: [["createdAt", "DESC"]],
              required: true,
              where: {
                [Op.or]: [{ name: { [Op.like]: search }, subCategoryId: id }],
              },
            },
          ],
        })
        .then((product) => {
          res.status(200).json({ success: true, data: product });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  //mobile
  async getAllMobileCategory(req, res, next) {
    try {
      db.category
        .findAll({
          attributes: ["id", "name"],
          include: [
            {
              model: db.subcategories,
              include: [{ model: db.subchildcategories }],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getAllSubCategoryById(req, res, next) {
    try {
      db.product
        .findAll({
          where: { subCategoryId: req.body.subId },
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },
};
