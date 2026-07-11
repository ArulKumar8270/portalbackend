const { Op } = require("sequelize");
// const { queue } = require("../../../kue");
const config = require("../../../config");
const AWS = require("aws-sdk");
const db = require("../../../models");
const BUCKET_NAME = "bangmobileapplication";

/**
 * Helper function to extract vendor/store ID from authenticated user
 * Priority: vendorId > storeId
 * Returns null if neither is available
 */
const getVendorStoreId = (user) => {
  if (!user) {
    return null;
  }
  
  // Convert to number if it's a string
  const vendorId = user.vendorId ? (isNaN(user.vendorId) ? null : parseInt(user.vendorId)) : null;
  const storeId = user.storeId ? (isNaN(user.storeId) ? null : parseInt(user.storeId)) : null;
  
  // Priority: vendorId first, then storeId
  return vendorId || storeId || null;
};

function parseOneDayTruthy(value) {
  return value === true || value === "1" || value === 1 || value === "true";
}

function parseOptionalNumber(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizeProductSku(value) {
  const sku = String(value ?? "").trim();
  return sku || null;
}

async function assertUniqueProductSku(sku, excludeId = null) {
  const normalized = normalizeProductSku(sku);
  if (!normalized) return null;
  const where = { productSku: normalized };
  if (excludeId != null) {
    where.id = { [Op.ne]: Number(excludeId) };
  }
  const existing = await db.product.findOne({ where, attributes: ["id"] });
  if (existing) {
    throw new RequestError("Product ID already in use", 409);
  }
  return normalized;
}

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");


var deleteFileFromS3 = async (imgUrl) => {
  try {
    const lastItem = imgUrl.substring(imgUrl.lastIndexOf("/") + 1);
    var params = {
      Bucket: "photoabhi",
      Key: lastItem,
    };
    return new Promise((resolve, reject) => {
      s3.deleteObject(params, (error, data) => {
        if (error) {
          console.log(error, error.stack);
          reject(error);
        } else {
          resolve(data);
        }
      });
    });
  } catch (error) {
    console.log(error);
    throw new Error("Promise error");
  }
};

module.exports = {
  /* Add user api start here................................*/

  async addProduct(req, res, next) {
    try {
      // Extract vendor/store ID from authenticated user
      const vendorStoreId = getVendorStoreId(req.user);
      
      // If user is authenticated, use their vendor/store ID
      // Otherwise, use createdId from request body (for backward compatibility)
      const finalCreatedId = vendorStoreId || req.body.createdId;

      const {
        categoryId,
        subCategoryId,
        childCategoryId,
        name,
        slug,
        brand,
        productSku,
        status,
        unitSize,
        sortDesc,
        desc,
        description,
        buyerPrice,
        price,
        qty,
        discount,
        discountPer,
        total,
        grand_total,
        netPrice,
        paymentMode,
        createdId,
        createdType,
        isEnableEcommerce,
        isEnableCustomize,
        isBooking,
        photo,
        serviceType,
        size,
        weight,
        height,
        sizeUnitSizeMap,
        clientId,
        isOneDayEnabled,
        oneDayPrice,
        oneDayMaxQty,
        oneDayTrialOnly,
        oneDayTrialPrice,
      } = req.body;
      // Handle description field (map to desc if description is provided)
      const productDesc = desc || description || "";
      
      // Parse sizeUnitSizeMap if it's a string
      let parsedSizeUnitSizeMap = null;
      if (sizeUnitSizeMap) {
        try {
          parsedSizeUnitSizeMap = typeof sizeUnitSizeMap === 'string' 
            ? JSON.parse(sizeUnitSizeMap) 
            : sizeUnitSizeMap;
        } catch (e) {
          console.error("Error parsing sizeUnitSizeMap:", e);
        }
      }

      // Handle photo: prioritize uploaded file, then body photo, then empty string
      // If file was uploaded via multer, use req.file.path
      // If photo URL was provided in request body, use that
      // Otherwise, use empty string
      let productPhoto = "";
      if (req.file) {
        // File was uploaded via multer - use the file path
        productPhoto = req.file.path;
      } else if (photo) {
        // Photo URL was provided in request body (e.g., from external URL or existing image)
        productPhoto = photo;
      }

      let resolvedProductSku = null;
      try {
        resolvedProductSku = await assertUniqueProductSku(productSku);
      } catch (skuErr) {
        return next(skuErr);
      }

      return db.product
        .create({
          categoryId: Number(categoryId),
          subCategoryId: Number(subCategoryId),
          childCategoryId: Number(childCategoryId),
          name: name,
          slug: slug,
          status: status,
          brand: brand,
          productSku: resolvedProductSku,
          unitSize: unitSize,
          sortDesc: sortDesc,
          desc: productDesc,
          buyerPrice: buyerPrice,
          price: price,
          qty: qty || null,
          discount: discount || null,
          discountPer: discountPer || null,
          total: total || null,
          grandTotal: grand_total || null,
          netPrice: netPrice,
          paymentMode: paymentMode,
          photo: productPhoto,
          createdId: finalCreatedId, // Auto-set from session or use provided
          createdType: createdType || "Client",
          isEnableEcommerce: isEnableEcommerce,
          isEnableCustomize: isEnableCustomize,
          isBooking: isBooking,
          serviceType: serviceType,
          size: size || null,
          weight: weight || null,
          height: height || null,
          sizeUnitSizeMap: parsedSizeUnitSizeMap,
          // Note: products table doesn't have vendorId column, using createdId instead
          clientId: clientId || null,
          isOneDayEnabled: parseOneDayTruthy(isOneDayEnabled),
          oneDayPrice: oneDayPrice != null && oneDayPrice !== "" ? Number(oneDayPrice) : null,
          oneDayMaxQty: oneDayMaxQty != null && oneDayMaxQty !== "" ? Number(oneDayMaxQty) : null,
          oneDayTrialOnly:
            parseOneDayTruthy(isOneDayEnabled) && parseOneDayTruthy(oneDayTrialOnly),
          oneDayTrialPrice: parseOptionalNumber(oneDayTrialPrice),
        })
        .then(async (product) => {
          if (!product.productSku) {
            const autoSku = `SKU-${product.id}`;
            await product.update({ productSku: autoSku });
            product.productSku = autoSku;
          }
          res.status(200).json({
            success: true,
            msg: "Successfully inserted product",
            data: product,
          });
        })
        .catch(function (err) {
          console.log(err, "Erro34523r");
          next(err);
        });
    } catch (err) {
      console.error(err, "689579657");
      throw new RequestError("Error");
    }
  },

  async index(req, res, next) {
    try {
      const { supplierId, categoryId, subCategoryId } = req.query;
      db.product
        .findAll({
          order: [["createdAt", "DESC"]],
          where: {
            supplierId: supplierId,
            categoryId: categoryId,
            subCategoryId: subCategoryId,
          },
          include: [
            {
              model: db.productphoto,
              attributes: ["id", "imgUrl"],
              required: false,
            },
          ],
        })
        .then((product) => {
          res.status(200).json({ success: true, product });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getAllProductList(req, res, next) {
    try {
      // Extract vendor/store ID from authenticated user
      const vendorStoreId = getVendorStoreId(req.user);
      const { clientId, createdType, categoryId } = req.query;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limitRaw = parseInt(req.query.limit, 10);
      const limit = Math.min(Math.max(limitRaw || 20, 1), 100);
      const offset = (page - 1) * limit;

      // Build where clause
      const whereClause = { status: 1 };

      // Filter by vendor/store ID if user is authenticated
      if (vendorStoreId) {
        whereClause.createdId = vendorStoreId;
      }

      // Add optional filters
      if (clientId) {
        whereClause.clientId = parseInt(clientId);
      }

      if (createdType) {
        whereClause.createdType = createdType;
      }

      if (categoryId) {
        whereClause.categoryId = parseInt(categoryId);
      }

      const [products, totalCount] = await Promise.all([
        db.product.findAll({
          where: whereClause,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
          include: [
            {
              model: db.store, // Include the associated store
              attributes: ["id", "status"], // Fetch only relevant store fields
              where: { status: 1 }, // Filter active stores
              required: false, // Changed to false to allow products without stores
            },
            {
              model: db.subcategories,
              attributes: ["id", "sub_name"],
              include: [
                {
                  model: db.category,
                  attributes: ["id", "name"],
                },
              ],
              required: false,
            },
            {
              model: db.user,
              as: "client",
              attributes: ["id", "firstName", "lastName", "email", "logo"],
              required: false,
            },
            {
              model: db.category,
              as: "category",
              attributes: ["id", "name"],
              required: false,
            },
            {
              model: db.productphoto,
              attributes: ["id", "imgUrl"],
              required: false,
            },
          ],
        }),
        db.product.count({ where: whereClause }),
      ]);

      res.status(200).json({
        success: true,
        data: products,
        count: totalCount,
        page,
        limit,
      });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async update(req, res, next) {
    try {
      // Extract vendor/store ID from authenticated user
      const vendorStoreId = getVendorStoreId(req.user);
      
      const {
        id,
        productId,
        categoryId,
        subCategoryId,
        childCategoryId,
        name,
        slug,
        brand,
        productSku,
        status,
        unitSize,
        desc,
        description,
        buyerPrice,
        price,
        qty,
        sortDesc,
        discount,
        discountPer,
        total,
        grand_total,
        netPrice,
        paymentMode,
        createdId,
        createdType,
        isEnableEcommerce,
        isEnableCustomize,
        isBooking,
        photo,
        serviceType,
        size,
        weight,
        height,
        sizeUnitSizeMap,
        isOneDayEnabled,
        oneDayPrice,
        oneDayMaxQty,
        oneDayTrialOnly,
        oneDayTrialPrice,
      } = req.body;

      // Build where clause for finding product
      const whereClause = { id: id || productId };
      
      // If user is authenticated, verify ownership
      if (vendorStoreId) {
        whereClause.createdId = vendorStoreId;
      }

      db.product
        .findOne({ where: whereClause })
        .then(async (product) => {
          if (product) {
            // Verify ownership if user is authenticated
            if (vendorStoreId) {
              if (product.createdId !== vendorStoreId) {
                return res.status(403).json({
                  success: false,
                  message: "Access denied. You can only modify products belonging to your store/vendor."
                });
              }
            }
            // Handle description field (map to desc if description is provided)
            const productDesc = desc !== undefined ? desc : (description !== undefined ? description : product.desc);
            
            // Parse sizeUnitSizeMap if it's a string
            let parsedSizeUnitSizeMap = product.sizeUnitSizeMap;
            if (sizeUnitSizeMap !== undefined) {
              try {
                if (typeof sizeUnitSizeMap === "string") {
                  const s = String(sizeUnitSizeMap).trim();
                  // Mobile/web sometimes submit empty string for "no size map".
                  // Treat empty as {} (or keep existing if you prefer).
                  parsedSizeUnitSizeMap = s === "" ? {} : JSON.parse(s);
                } else {
                  parsedSizeUnitSizeMap = sizeUnitSizeMap;
                }
              } catch (e) {
                // Don't fail product update because client sent invalid JSON.
                // Keep previous value to avoid breaking existing products.
                console.warn("Invalid sizeUnitSizeMap; keeping previous value");
                parsedSizeUnitSizeMap = product.sizeUnitSizeMap ?? {};
              }
            }

            let nextProductSku = product.productSku;
            if (productSku !== undefined) {
              nextProductSku = await assertUniqueProductSku(productSku, product.id);
            }

            return db.product.update(
              {
                categoryId: categoryId !== undefined ? categoryId : product.categoryId,
                subCategoryId: subCategoryId !== undefined
                  ? subCategoryId
                  : product.subCategoryId,
                childCategoryId: childCategoryId !== undefined
                  ? childCategoryId
                  : product.childCategoryId,
                name: name !== undefined ? name : product.name,
                slug: slug !== undefined ? slug : product.slug,
                status: status !== undefined ? status : product.status,
                brand: brand !== undefined ? brand : product?.brand,
                productSku: nextProductSku,
                unitSize: unitSize !== undefined ? unitSize : product.unitSize,
                desc: productDesc,
                photo: photo !== undefined && photo !== null ? photo : product.photo,
                sortDesc: sortDesc !== undefined ? sortDesc : product.sortDesc,
                buyerPrice: buyerPrice !== undefined ? buyerPrice : product.buyerPrice,
                price: price !== undefined ? price : product.price,
                qty: qty !== undefined ? qty : product.qty,
                discount: discount !== undefined ? discount : product.discount,
                discountPer: discountPer !== undefined ? discountPer : product.discountPer,
                total: total !== undefined ? total : product.total,
                grandTotal: grand_total !== undefined ? grand_total : product.grandTotal,
                netPrice: netPrice !== undefined ? netPrice : product.netPrice,
                paymentMode: paymentMode !== undefined ? paymentMode : product.paymentMode,
                createdId: createdId !== undefined ? createdId : product.createdId,
                createdType: createdType !== undefined ? createdType : product.createdType,
                isEnableEcommerce: isEnableEcommerce !== undefined ? isEnableEcommerce : product.isEnableEcommerce,
                isEnableCustomize: isEnableCustomize !== undefined ? isEnableCustomize : product.isEnableCustomize,
                isBooking: isBooking !== undefined ? isBooking : product.isBooking,
                serviceType: serviceType !== undefined ? serviceType : product.serviceType,
                size: size !== undefined ? size : product.size,
                weight: weight !== undefined ? weight : product.weight,
                height: height !== undefined ? height : product.height,
                sizeUnitSizeMap: parsedSizeUnitSizeMap,
                isOneDayEnabled: isOneDayEnabled !== undefined
                  ? parseOneDayTruthy(isOneDayEnabled)
                  : product.isOneDayEnabled,
                oneDayPrice: oneDayPrice !== undefined
                  ? (oneDayPrice != null && oneDayPrice !== "" ? Number(oneDayPrice) : null)
                  : product.oneDayPrice,
                oneDayMaxQty: oneDayMaxQty !== undefined
                  ? (oneDayMaxQty != null && oneDayMaxQty !== "" ? Number(oneDayMaxQty) : null)
                  : product.oneDayMaxQty,
                oneDayTrialOnly: (() => {
                  const nextOneDayEnabled =
                    isOneDayEnabled !== undefined
                      ? parseOneDayTruthy(isOneDayEnabled)
                      : product.isOneDayEnabled;
                  if (!nextOneDayEnabled) return false;
                  if (oneDayTrialOnly !== undefined) {
                    return parseOneDayTruthy(oneDayTrialOnly);
                  }
                  return Boolean(product.oneDayTrialOnly);
                })(),
                oneDayTrialPrice: (() => {
                  const nextOneDayEnabled =
                    isOneDayEnabled !== undefined
                      ? parseOneDayTruthy(isOneDayEnabled)
                      : product.isOneDayEnabled;
                  const nextTrialOnly =
                    oneDayTrialOnly !== undefined
                      ? parseOneDayTruthy(oneDayTrialOnly)
                      : Boolean(product.oneDayTrialOnly);
                  if (!nextOneDayEnabled || !nextTrialOnly) return null;
                  if (oneDayTrialPrice !== undefined) {
                    return parseOptionalNumber(oneDayTrialPrice);
                  }
                  return product.oneDayTrialPrice;
                })(),
              },
              { where: { id: product.id } }
            );
          }
          throw new RequestError("Not Found Product", 409);
        })
        .then((p) => {
          res.status(200).json({ success: true, msg: "Updated Successfully" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getProductListByCategory(req, res, next) {
    try {
      db.product
        .findAll({
          order: [["createdAt", "DESC"]],
          where: {
            categoryId: req.query.categoryId,
            subCategoryId: req.query.subCategoryId,
          },
          include: [
            {
              model: db.productphoto,
              attributes: ["id", "imgUrl"],
              required: false,
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
  async getProductListById(req, res, next) {
    try {
      // Extract vendor/store ID from authenticated user
      const vendorStoreId = getVendorStoreId(req.user);
      const { id } = req.params;

      // Build where clause
      const whereClause = { id };

      // If user is authenticated, verify ownership
      if (vendorStoreId) {
        whereClause.createdId = vendorStoreId;
      }

      const product = await db.product.findOne({
        where: whereClause,
        include: [
          {
            model: db.productphoto,
            attributes: ["id", "imgUrl"],
          },
          {
            model: db.category,
            as: "category",
            attributes: ["id", "name"],
            required: false,
          },
          {
            model: db.user,
            as: "client",
            attributes: ["id", "firstName", "lastName", "email", "logo"],
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });

      if (!product) {
        return res
          .status(404)
          .json({ 
            success: false, 
            message: vendorStoreId 
              ? "Product not found or does not belong to your store" 
              : "Product not found" 
          });
      }

      res.status(200).json({ success: true, data: product });
    } catch (err) {
      next(err); // Pass the error to the next middleware or error handler
    }
  },

  async getWebProductListById(req, res, next) {
    try {
      db.product
        .findOne({
          where: { id: req.params.id },
          include: [{ model: db.productphoto, attributes: ["id", "imgUrl"] }],
          order: [["createdAt", "DESC"]],
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
  async addProductOffer(req, res, next) {
    try {
      const { productId, qty, discount_per, discount_price, total, net_price } =
        req.body;
      db.ProductOffer.findOne({ where: { id: productId } })
        .then((list) => {
          if (!list) {
            return db.ProductOffer.create({
              productId: productId,
              image: req.file ? req.file.location : "",
              qty: qty,
              discount_per: discount_per,
              discount_price: discount_price,
              total: total,
              net_price: net_price,
            });
          } else {
            return db.ProductOffer.update(
              {
                qty: qty,
                discount_per: discount_per,
                discount_price: discount_price,
                total: total,
                net_price: net_price,
              },
              { where: { id: list.id } }
            );
          }
        })
        .then((p) => {
          res.status(200).json({ success: true, msg: "Successfully" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getProductOffer(req, res, next) {
    try {
      db.ProductOffer.findAll({
        include: [
          {
            model: db.product,
            attributes: [
              "id",
              "categoryId",
              "price",
              "item_name",
              "description",
              "brand",
            ],
            include: [
              { model: db.category, attributes: ["id", "name"] },
              {
                model: db.productphoto,
                attributes: ["id", "imgUrl"],
                required: false,
              },
            ],
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

  async searchProductBySubCat(req, res, next) {
    try {
      db.subcategories
        .findOne({
          where: { sub_name: req.body.subCat },
        })
        .then((data) => {
          if (data) {
            return db.product.findAll({
              where: { subCategoryId: data.id },
              include: [
                {
                  model: db.productphoto,
                  attributes: ["id", "imgUrl"],
                  required: false,
                },
              ],
            });
          }
        })
        .then((list) => {
          console.log(JSON.stringify(list));
          res.status(200).json({ success: true, data: list });
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async productDelete(req, res, next) {
    db.product
      .findOne({ where: { id: parseInt(req.query.id) } })
      .then((product) => {
        if (product) {
          return db.product.destroy({ where: { id: product.id } });
        }
        throw new RequestError("Product is not found");
      })
      .then((re) => {
        return res.status(200).json({ status: "deleted Product Seccessfully" });
      })
      .catch((err) => {
        next(err);
      });
  },

  async productOfferDelete(req, res, next) {
    db.ProductOffer.findOne({ where: { id: parseInt(req.params.id) } })
      .then((product) => {
        if (product) {
          return db.ProductOffer.destroy({ where: { id: product.id } });
        }
        throw new RequestError("Product is not found");
      })
      .then((re) => {
        return res.status(200).json({ status: "deleted Product Seccessfully" });
      })
      .catch((err) => {
        next(err);
      });
  },

  async multiplePhotoUpload(req, res, next) {
    let attachmentEntries = [];
    var productId = req.body.productId;
    for (var i = 0; i < req.files.length; i++) {
      attachmentEntries.push({
        productId: productId,
        name: req.files[i].filename,
        mime: req.files[i].mimetype,
        imgUrl: req.files[i].location,
      });
    }

    db.product
      .findOne({
        where: { id: productId },
      })
      .then((r) => {
        if (r) {
          return null;
          // .create("img-upload", {
          //   productId: productId,
          //   productName: r.item_name,
          //   attachmentEntries: attachmentEntries,
          // })
          // .save();
        }
        throw new RequestError("ProductId is not found");
      })
      .then((r) => {
        res.status(200).json({ success: r });
      })
      .catch(function (error) {
        console.log(error);
        res.status(500).json({ errors: ["Error insert photo"] });
      });
  },

  async getAllPhoto(req, res, next) {
    try {
      db.product
        .findAll({
          order: [["createdAt", "DESC"]],
          attributes: ["id", "name", "brand"],
          include: [{ model: db.productphoto, attributes: ["id", "imgUrl"] }],
        })
        .then((data) => {
          res.status(200).json({ success: true, data });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },
  async deleteSliderPhoto(req, res, next) {
    db.productphoto
      .findOne({ where: { id: parseInt(req.query.id) } })
      .then((product) => {
        if (product) {
          return db.productphoto.destroy({ where: { id: req.query.id } });
        }
        throw new RequestError("Product is not found");
      })
      .then((re) => {
        return res.status(200).json({ status: "deleted Product Seccessfully" });
      })
      .catch((err) => {
        next(err);
      });
  },
  //All GroceryStample product
  async getAllGrocerryStaples(req, res, next) {
    try {
      db.category
        .findOne({
          attributes: ["id", "slug"],
          where: { slug: "grocery-staple" },
          include: [
            {
              model: db.product,
              order: [["createdAt", "DESC"]],
              include: [
                { model: db.productphoto, attributes: ["id", "imgUrl"] },
              ],
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

  async getAllProductBySlug(req, res, next) {
    try {
      db.category
        .findOne({
          attributes: ["id", "slug"],
          where: { slug: req.params.slug },
          include: [
            {
              model: db.product,
              order: [["createdAt", "DESC"]],
              include: [
                { model: db.productphoto, attributes: ["id", "imgUrl"] },
              ],
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

  // filter product
  async getFilterbyProduct(req, res, next) {
    try { 
      let search = "%%";
      if (req.query.search) {
        search = "%" + req.query.search + "%";
      }
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limitRaw = parseInt(req.query.limit, 10);
      const limit = Math.min(Math.max(limitRaw || 20, 1), 100);
      const offset = (page - 1) * limit;
      const flat = String(req.query.flat || "") === "1";

      // Extract paymentModes from query parameters and convert to array of integers
      const paymentModes = req.query.paymentModes
        ? req.query.paymentModes.split(",").map((pm) => parseInt(pm.trim(), 10))
        : [];

      // Define product filter conditions
      const productWhere = {
        [Op.or]: [
          { name: { [Op.like]: search } },
          { slug: { [Op.like]: search } },
        ],
      };

      // Apply paymentModes filter if provided
      if (paymentModes.length > 0) {
        productWhere.paymentMode = {
          [db.Sequelize.Op.or]: paymentModes.map((mode) => ({
            [db.Sequelize.Op.like]: `%${mode}%`,
          })),
        };
      }

      if (flat) {
        const result = await db.product.findAndCountAll({
          where: productWhere,
          order: [["createdAt", "DESC"]],
          limit,
          offset,
          include: [
            {
              model: db.productphoto,
              attributes: ["id", "imgUrl"],
              required: false,
            },
          ],
        });

        return res.status(200).json({
          success: true,
          data: result.rows,
          count: result.count,
          page,
          limit,
        });
      }

      // Find subcategories with filtered products
      const subcategories = await db.subcategories.findAll({
        attributes: ["id", "sub_name"],
        include: [
          {
            model: db.product,
            order: [["createdAt", "DESC"]],
            required: true,
            where: productWhere,
            include: [
              {
                model: db.productphoto,
                attributes: ["id", "imgUrl"],
                required: false,
              },
            ],
          },
        ],
      });

      res.status(200).json({ success: true, data: subcategories });
    } catch (err) {
      console.log(err, "Error");
      next(new RequestError("Error"));
    }
  },

  async GetAllByCategories(req, res, next) {
    try {
      // Extract categoryIds from the query parameters
      const { categoryIds } = req.query;
      const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
      const limitRaw = parseInt(req.query.limit, 10);
      const limit = Math.min(Math.max(limitRaw || 20, 1), 100);
      const offset = (page - 1) * limit;

      // Ensure categoryIds is an array, even if a single ID is passed
      const categoryArray = Array.isArray(categoryIds)
        ? categoryIds
        : categoryIds.split(",");

      // Find all products that belong to the specified categories
      const result = await db.product.findAndCountAll({
        where: {
          categoryId: {
            [db.Sequelize.Op.in]: categoryArray,
          },
        },
        order: [["createdAt", "DESC"]],
        limit,
        offset,
        include: [
          {
            model: db.productphoto,
            attributes: ["id", "imgUrl"],
          },
        ],
      });

      res.status(200).json({
        success: true,
        data: result.rows,
        count: result.count,
        page,
        limit,
      });
    } catch (err) {
      console.log(err, "Error");
      next(new RequestError("Error"));
    }
  },

  // aws image delete
  /**
   * Upload Product Photos
   * Accepts productPhotos as a stringified JSON array of URLs
   * POST /api/product/upload-photos
   */
  async uploadProductPhotos(req, res, next) {
    try {
      const { productId, productPhotos } = req.body;

      // Validate required fields
      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required'
        });
      }

      // Check if product exists
      const product = await db.product.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      // Parse productPhotos - handle both string and array
      let photoUrls = [];
      if (productPhotos == null) {
        photoUrls = [];
      } else if (typeof productPhotos === 'string') {
        try {
          const trimmed = productPhotos.trim();
          photoUrls = trimmed ? JSON.parse(trimmed) : [];
        } catch (parseError) {
          return res.status(400).json({
            success: false,
            message: 'Invalid productPhotos format. Expected JSON array string.'
          });
        }
      } else if (Array.isArray(productPhotos)) {
        photoUrls = productPhotos;
      } else {
        return res.status(400).json({
          success: false,
          message: 'productPhotos must be a JSON array string or array'
        });
      }

      // Validate that photoUrls is an array
      if (!Array.isArray(photoUrls)) {
        return res.status(400).json({
          success: false,
          message: 'productPhotos must be an array of URLs'
        });
      }

      // Validate that all items in array are strings (URLs)
      if (photoUrls.some(url => typeof url !== 'string')) {
        return res.status(400).json({
          success: false,
          message: 'All items in productPhotos must be valid URL strings'
        });
      }

      // Replace mode: delete existing photos, then insert the provided list.
      // This makes image delete/replace in UI persist correctly.
      await db.productphoto.destroy({
        where: { productId: parseInt(productId) }
      });

      // Create product photo records
      const photoRecords = photoUrls.map(url => ({
        productId: parseInt(productId),
        imgUrl: url.trim() // Trim whitespace from URLs
      })).filter(record => record.imgUrl); // Filter out empty URLs

      // If empty, treat as "clear all photos"
      let createdPhotos = [];
      if (photoRecords.length > 0) {
        createdPhotos = await db.productphoto.bulkCreate(photoRecords);
      }

      // Fetch all photos for this product (including newly created ones)
      const allPhotos = await db.productphoto.findAll({
        where: { productId: productId },
        attributes: ['id', 'productId', 'imgUrl', 'createdAt', 'updatedAt'],
        order: [['createdAt', 'DESC']]
      });

      return res.status(200).json({
        success: true,
        message: `Successfully saved ${createdPhotos.length} product photo(s)`,
        data: {
          productId: productId,
          photos: allPhotos,
          newlyAdded: createdPhotos.length
        }
      });

    } catch (error) {
      console.error('Error uploading product photos:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload product photos',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  async awsProductPhotoDelete(req, res, next) {
    try {
      const { id, imgUrl } = req.body;
      deleteFileFromS3(imgUrl)
        .then((data) => {
          if (!data) {
            return db.productphoto.destroy({ where: { id: id } });
          }
          throw new RequestError("error");
        })
        .then((success) => {
          res.status(200).json({
            success: true,
            msg: "Successflly deleted image from s3 Bucket",
          });
        });
    } catch (err) {
      next(err);
      // res.status(500).json({'success':false, msg: err})
    }
  },

  async getProductSubChildCat(req, res, next) {
    try {
      const { subCategoryId, childCategoryId } = req.body;
      db.product
        .findAll({
          where: {
            childCategoryId: childCategoryId,
            subCategoryId: childCategoryId,
          },
          include: [
            {
              model: db.productphoto,
              attributes: ["id", "imgUrl"],
              required: false,
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
      next(err);
      // res.status(500).json({ 'success':false, msg: err})
    }
  },

  async getProductsByOpenStores(req, res, next) {
    try {
      const currentHour = new Date().getHours(); // Get the current hour

      // Find all stores that are currently open
      const openStores = await db.store.findAll({
        where: {
          openTime: { [db.Sequelize.Op.lte]: currentHour }, // Store must be open at or before the current hour
          closeTime: { [db.Sequelize.Op.gte]: currentHour }, // Store must close at or after the current hour
        },
        attributes: ["id"], // Only need store IDs for filtering
      });

      const openStoreIds = openStores.map(store => store.id);

      // Query to find products that are sold in the open stores
      const products = await db.product.findAll({
        include: [
          {
            model: db.productphoto,
            attributes: ["id", "imgUrl"],
            required: false,
          },
          {
            model: db.store_product, // Ensure this association exists
            where: {
              supplierId: {
                [db.Sequelize.Op.in]: openStoreIds, // Filter by stores that are currently open
              },
              status: 1,
            },
            attributes: [], // No need to fetch attributes from store_product
          },
        ],
      });

      if (products.length > 0) { // Check if there are any products
        res.status(200).json({ success: true, data: products });
      } else {
        res.status(404).json({ success: false, message: "No products found from open stores" });
      }
    } catch (err) {
      console.error(err, "Error");
      next(new RequestError("Error"));
    }
  }
};
