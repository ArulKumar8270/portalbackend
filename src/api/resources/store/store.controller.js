const db = require("../../../models");
const { haversineDistance, extractLatLngFromGoogleMapsUrl } = require("../../../utils/distance"); // Import the distance utility

/**
 * All subscriptions per store (newest first), merged from:
 * 1) customerId = store id
 * 2) customerId = user id where user.storeId = store id
 */
async function getAllSubscriptionsByStoreIds(storeIds) {
  /** @type {Record<string, any[]>} */
  const byStoreId = {};
  if (!storeIds || !storeIds.length) return byStoreId;

  const uniqNumeric = [
    ...new Set(
      storeIds
        .map((id) => Number(id))
        .filter((n) => !Number.isNaN(n))
    ),
  ];
  if (!uniqNumeric.length) return byStoreId;

  const stringIds = uniqNumeric.map(String);
  const payFilter = {
    paymentId: { [db.Sequelize.Op.ne]: "TEMP_PAYMENT_ID_DEV" },
  };

  for (const n of uniqNumeric) {
    byStoreId[String(n)] = [];
  }

  const directSubs = await db.subscriptions.findAll({
    where: {
      customerId: uniqNumeric,
      ...payFilter,
    },
    order: [["createdAt", "DESC"]],
    raw: true,
  });
  for (const row of directSubs) {
    const sid = String(Number(row.customerId));
    if (byStoreId[sid]) byStoreId[sid].push(row);
  }

  const users = await db.user.findAll({
    where: {
      storeId: {
        [db.Sequelize.Op.in]: [...new Set([...stringIds, ...uniqNumeric])],
      },
    },
    attributes: ["id", "storeId"],
    raw: true,
  });

  if (users.length) {
    const userIds = users.map((u) => u.id);
    const userSubs = await db.subscriptions.findAll({
      where: {
        customerId: userIds,
        ...payFilter,
      },
      order: [["createdAt", "DESC"]],
      raw: true,
    });
    const userIdToStoreId = new Map(
      users.map((u) => [u.id, String(Number(u.storeId))])
    );
    for (const row of userSubs) {
      const sid = userIdToStoreId.get(row.customerId);
      if (!sid || Number.isNaN(Number(sid))) continue;
      if (byStoreId[sid]) byStoreId[sid].push(row);
    }
  }

  for (const sid of Object.keys(byStoreId)) {
    const uniq = new Map();
    for (const r of byStoreId[sid]) {
      if (r && r.id != null && !uniq.has(r.id)) uniq.set(r.id, r);
    }
    byStoreId[sid] = [...uniq.values()].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  return byStoreId;
}

module.exports = {
  /* Add user api start here................................*/

  async index(req, res, next) {
    try {
      const {
        id,
        storename,
        status,
        deliveryPartner,
        shiprocketPickupLocation,
        storeaddress,
        storedesc,
        ownername,
        owneraddress,
        email,
        password,
        phone,
        areaId,
        accountNo,
        accountHolderName,
        IFSC,
        bankName,
        branch,
        adharCardNo,
        panCardNo,
        GSTNo,
        website,
        openTime,
        closeTime,
        storeImage,
        verifyDocument
      } = req.body;
      db.store
        .findOne({ where: { id: id ? id : null } })
        .then((supplier) => {
          if (supplier) {
            return db.store.update(
              {
                storename: storename ? storename : supplier.storename,
                status: status ? status : supplier.status,
                deliveryPartner:
                  deliveryPartner !== undefined
                    ? deliveryPartner
                    : supplier.deliveryPartner,
                shiprocketPickupLocation:
                  shiprocketPickupLocation !== undefined
                    ? shiprocketPickupLocation
                    : supplier.shiprocketPickupLocation,
                storeaddress: storeaddress
                  ? storeaddress
                  : supplier.storeaddress,
                storedesc: storedesc ? storedesc : supplier.storedesc,
                ownername: ownername ? ownername : supplier.ownername,
                owneraddress: owneraddress
                  ? owneraddress
                  : supplier.owneraddress,
                email: email ? email : supplier.email,
                phone: phone ? phone : supplier.phone,
                accountNo: accountNo ? accountNo : supplier.accountNo,
                accountHolderName: accountHolderName
                  ? accountHolderName
                  : supplier.accountHolderName,
                IFSC: IFSC ? IFSC : supplier.IFSC,
                bankName: bankName ? bankName : supplier.bankName,
                branch: branch ? branch : supplier.branch,
                adharCardNo: adharCardNo ? adharCardNo : supplier.adharCardNo,
                panCardNo: panCardNo ? panCardNo : supplier.panCardNo,
                GSTNo: GSTNo ? GSTNo : supplier.GSTNo,
                website: website ? website : supplier.website,
                openTime: openTime ? openTime : supplier.openTime,
                closeTime: closeTime ? closeTime : supplier.closeTime,
                storeImage: storeImage ? storeImage : supplier.storeImage,
                verifyDocument: verifyDocument ? verifyDocument : supplier.verifyDocument,
              },
              { where: { id: id } }
            );
          }
          return db.store.create({
            storename: storename ? storename : null,
            status: status ? status : 0,
            deliveryPartner:
              deliveryPartner !== undefined ? deliveryPartner : null,
            shiprocketPickupLocation:
              shiprocketPickupLocation !== undefined ? shiprocketPickupLocation : null,
            storeaddress: storeaddress ? storeaddress : null,
            storedesc: storedesc ? storedesc : null,
            ownername: ownername ? ownername : null,
            owneraddress: owneraddress ? owneraddress : null,
            email: email ? email : null,
            password: password ? password : null,
            phone: phone ? phone : null,
            accountNo: accountNo ? accountNo : null,
            accountHolderName: accountHolderName ? accountHolderName : null,
            IFSC: IFSC ? IFSC : null,
            bankName: bankName ? bankName : null,
            branch: branch ? branch : null,
            adharCardNo: adharCardNo ? adharCardNo : null,
            panCardNo: panCardNo ? panCardNo : null, // Added null check
            GSTNo: GSTNo ? GSTNo : null, // Added null check
            areaId: areaId,
            website: website ? website : null, // Added null check
            openTime: openTime ? openTime : null, // Added null check
            closeTime: closeTime ? closeTime : null, // Added null check and removed duplicate
            storeImage: storeImage ? storeImage : "",
            verifyDocument: verifyDocument ? verifyDocument : "",
          });
        })
        .then((store) => {
          res.status(200).json({
            success: true,
            msg: "Successfully inserted supplier",
            data: store,
          });
        })
        .catch(function (err) {
          console.log(err);
          next(err);
        });
    } catch (err) {
      console.log(err);
      throw new RequestError("Error");
    }
  },

  async storeAddProduct(req, res, next) {
    try {
      const { supplierId, productId, unitSize, buyerPrice } = req.body;
      db.store_product
        .findAll({
          where: {
            productId: productId,
          },
        })
        .then((data) => {
          if (!data.length > 0) {
            return db.store_product.create({
              supplierId: supplierId,
              productId: productId,
              unitSize: unitSize,
              price: buyerPrice,
            });
          } else {
            return db.store_product.update(
              {
                unitSize: unitSize ? unitSize : data.unitSize,
                price: buyerPrice ? buyerPrice : data.buyerPrice,
              },
              { where: { supplierId: supplierId, productId: productId } }
            );
          }
        })
        .then((success) => {
          res.status(200).json({
            success: true,
            msg: "Successfully inserted product in storeList",
          });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getAllstore(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 20, 1), 50);
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }

    try {
      // Define all store attributes to be selected
      const storeAttributes = [
        'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'storeImage', 'verifyDocument', 'location'
      ];

      // Construct the attributes array for the main query, including flattened attributes from includes and the product count
      const attributesToSelect = [
        ...storeAttributes,
        [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
      ];

      // Construct the group by array, including all non-aggregated attributes from the main model and included models
      const groupByColumns = [
        ...storeAttributes.map(attr => `store.${attr}`),
        'area.id', 'area.name',
        'area->location.id', 'area->location.name'
      ];

      const list = await db.store.findAll({
        attributes: attributesToSelect,
        where: { status: "1" }, // Add this line to filter by status = 1
        include: [
          {
            model: db.area,
            attributes: [], // Attributes are selected in the main query's attributes array
            include: [{ model: db.location, attributes: [] }], // Attributes are selected in the main query's attributes array
            required: false // Use LEFT JOIN to include stores even if they don't have an associated area/location
          },
          {
            model: db.store_product, // Assuming this is the join table between store and product
            attributes: [], // Don't select attributes from store_product itself
            required: false // Use LEFT JOIN to count products, even if a store has none
          },
        ],
        group: groupByColumns,
        raw: true // Return raw data objects, flattening included model attributes
      });

      // Calculate distance for each store if currentLocation is provided
      const storesWithDistance = list.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      const totalCount = sortedStores.length;
      const offset = (page - 1) * limit;
      const paged = sortedStores.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        data: paged,
        count: totalCount,
        page,
        limit,
      });
    } catch (err) {
      console.error(err); // Log the error for debugging
      throw new RequestError("Error");
    }
  },
  async getServiceAllstore(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {
      // Find all product IDs that match the filters
      const products = await db.product.findAll({
        where: {
          serviceType: "Service"
        },
        attributes: ["id"],
      });

      const productIds = products.map((product) => product.id);

      // Check if productIds is empty
      if (productIds.length === 0) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      // Find all stores that are associated with those products and get their product count
      const stores = await db.store.findAll({
        attributes: [
          'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'location', 'storeImage', 'verifyDocument',
          // Add the count of associated products as 'totalProducts'
          [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
        ],
        include: [
          {
            model: db.store_product,
            attributes: [], // No need to fetch attributes from store_product itself
            where: {
              productId: {
                [db.Sequelize.Op.in]: productIds,
              },
            },
            required: true // Ensures only stores with matching products are returned (INNER JOIN)
          },
        ],
        group: [
          // All non-aggregated attributes from the 'attributes' array must be in the 'group' clause
          'store.id', 'store.storename', 'store.status', 'store.storeaddress', 'store.storedesc', 'store.ownername', 'store.owneraddress', 'store.email', 'store.phone', 'store.accountNo', 'store.accountHolderName', 'store.IFSC', 'store.bankName', 'store.branch', 'store.adharCardNo', 'store.panCardNo', 'store.GSTNo', 'store.areaId', 'store.website', 'store.openTime', 'store.closeTime', 'store.location', 'store.storeImage', 'store.verifyDocument'
        ],
        raw: true, // Return raw data to easily access the 'totalProducts' alias,
        where: {
          status: "1",
        },
      });

      const storesWithDistance = stores.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      res.status(200).json({ success: true, data: sortedStores, count: sortedStores.length });
    } catch (err) {
      console.log(err, "Error");
      next(new RequestError("Error"));
    }
  },

  async adminGetAllstore(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }

    try {
      // Define all store attributes to be selected
      const storeAttributes = [
        'id', 'storename', 'status', 'deliveryPartner', 'shiprocketPickupLocation', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'storeImage', 'verifyDocument', 'location'
      ];

      // Construct the attributes array for the main query, including flattened attributes from includes and the product count
      const attributesToSelect = [
        ...storeAttributes,
        [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
      ];

      // Construct the group by array, including all non-aggregated attributes from the main model and included models
      const groupByColumns = [
        ...storeAttributes.map(attr => `store.${attr}`),
        'area.id', 'area.name',
        'area->location.id', 'area->location.name'
      ];

      const list = await db.store.findAll({
        attributes: attributesToSelect,
        // Main list should include both active and inactive stores, but exclude trashed.
        where: { isTrashed: false },
        include: [
          {
            model: db.area,
            attributes: [], // Attributes are selected in the main query's attributes array
            include: [{ model: db.location, attributes: [] }], // Attributes are selected in the main query's attributes array
            required: false // Use LEFT JOIN to include stores even if they don't have an associated area/location
          },
          {
            model: db.store_product, // Assuming this is the join table between store and product
            attributes: [], // Don't select attributes from store_product itself
            required: false // Use LEFT JOIN to count products, even if a store has none
          },
        ],
        group: groupByColumns,
        raw: true // Return raw data objects, flattening included model attributes
      });

      // Calculate distance for each store if currentLocation is provided
      const storesWithDistance = list.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      const allSubsByStore = await getAllSubscriptionsByStoreIds(
        sortedStores.map((s) => s.id)
      );
      const dataWithSubs = sortedStores.map((s) => {
        const subs = allSubsByStore[String(s.id)] || [];
        return {
          ...s,
          subscriptions: subs,
          subscription: subs[0] || null,
        };
      });

      res.status(200).json({ success: true, data: dataWithSubs, count: dataWithSubs.length });
    } catch (err) {
      console.error(err); // Log the error for debugging
      throw new RequestError("Error");
    }
  },

  //Get by Id
  async getstoreById(req, res, next) {
    const { currentLocation } = req.query;
    const { id } = req.params;
    let userLat, userLon;
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {

      // Define all store attributes to be selected
      const storeAttributes = [
        'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'storeImage', 'verifyDocument', 'location'
      ];
      // Construct the attributes array for the main query, including flattened attributes from includes and the product count
      const attributesToSelect = [
        ...storeAttributes,
        // Area zipcode (pickup pincode)
        [db.Sequelize.col('area.zipcode'), 'areaZipcode'],
        // Add the count of associated products as 'totalProducts'
        [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
      ];

      // Construct the group by array, including all non-aggregated attributes from the main model and included models
      const groupByColumns = [
        ...storeAttributes.map(attr => `store.${attr}`),];

      const list = await db.store
        .findOne({
          attributes: attributesToSelect,
          where: { id: id },
          include: [
            {
              model: db.area,
              attributes: [], // Attributes are selected in the main query's attributes array
              include: [{ model: db.location, attributes: [] }], // Attributes are selected in the main query's attributes array
              required: false // Use LEFT JOIN
            },
            {
              model: db.user, // Include related user data
              attributes: [], // Attributes are selected in the main query's attributes array
              required: false // Use LEFT JOIN if user is optional
            },
            {
              model: db.store_product, // Assuming this is the join table between store and product
              attributes: [], // Don't select attributes from store_product itself
              required: false // Use LEFT JOIN to count products, even if a store has none
            },
          ],
          group: groupByColumns,
          raw: true // Return raw data objects, flattening included model attributes
        });

      // Calculate distance for the store if currentLocation is provided
      let storeWithDistance = list ? { ...list } : null; // Initialize with a copy of list or null

      if (storeWithDistance && userLat !== undefined && userLon !== undefined && storeWithDistance.location) {
        const storeCoords = extractLatLngFromGoogleMapsUrl(storeWithDistance.location);
        if (storeCoords) {
          const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
          storeWithDistance.distance = parseFloat(distance.toFixed(2)); // Round to 2 decimal places
        } else {
          storeWithDistance.distance = null; // Set distance to null if not calculable
        }
      } else if (storeWithDistance) {
        storeWithDistance.distance = null; // Set distance to null if not calculable
      }

      if (storeWithDistance) {
        const allSubsByStore = await getAllSubscriptionsByStoreIds([id]);
        const subs = allSubsByStore[String(id)] || [];
        res.status(200).json({
          success: true,
          data: {
            ...storeWithDistance,
            subscriptions: subs,
            subscription: subs[0] || null,
          },
        });
      } else {
        res.status(404).json({ success: false, message: "Store not found" });
      }
    } catch (err) {
      console.error(err); // Log the error for debugging
      next(new RequestError("Error"));
    }
  },

  async getAllstoreProduct(req, res, next) {
    try {
      db.product
        .findAll({
          include: [
            {
              model: db.productphoto,
              attributes: ["id", "imgUrl"],
              required: false,
            },
            {
              model: db.store_product,
              attributes: [
                "id",
                "supplierId",
                "productId",
                "unitSize",
                "price",
              ],
              include: [
                {
                  model: db.store,
                },
              ],
            },
          ],
        })
        .then((list) => {
          res.status(200).json({ success: true, data: list, count: list.length });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getProductBystore(req, res, next) {
    const { isEnableEcommerce, isEnableCustomize } = req.query; // Get query parameters
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 20, 1), 100);
    const offset = (page - 1) * limit;

    const productWhere = {}; // Initialize where clause for product model

    // Apply filter for isEnableEcommerce if provided
    // Assuming frontend sends '1' or '0' as string
    if (isEnableEcommerce !== undefined) {
      productWhere.isEnableEcommerce = isEnableEcommerce;
    }

    // Apply filter for isEnableCustomize if provided
    // Assuming frontend sends '1' or '0' as string, convert to number as per frontend logic
    if (isEnableCustomize !== undefined) {
      productWhere.isEnableCustomize = isEnableCustomize;
    }
    try {
      db.store_product
        .findAndCountAll({
          where: { supplierId: req.params.id },
          limit,
          offset,
          distinct: true,
          include: [
            {
              model: db.product,
              where: {
                ...productWhere,
                status: "1", // Filter products with status equal to 1
              },
              include: [
                {
                  model: db.productphoto,
                  attributes: ["id", "imgUrl"],
                  required: false,
                },
              ],
            },
          ],
        })
        .then((result) => {
          const list = result?.rows ?? [];
          // Helper function to reorder product fields
          const reorderProductFields = (item) => {
            if (item.product) {
              const product = item.product.toJSON ? item.product.toJSON() : item.product;
              const { isEnableEcommerce, isEnableCustomize, isBooking, ...otherFields } = product;
              
              // Create new product object with priority fields first
              const reorderedProduct = {
                isEnableEcommerce,
                isEnableCustomize,
                isBooking,
                ...otherFields
              };
              
              return {
                ...item.toJSON ? item.toJSON() : item,
                product: reorderedProduct
              };
            }
            return item.toJSON ? item.toJSON() : item;
          };

          // Separate products into two groups:
          // First: products where isEnableEcommerce === 1 OR isEnableCustomize === 1 OR isBooking === 1
          // Second: all other products
          const priorityProducts = [];
          const otherProducts = [];

          list.forEach((item) => {
            if (item.product) {
              const product = item.product.toJSON ? item.product.toJSON() : item.product;
              const hasPriority = 
                Number(product.isEnableEcommerce) === Number(1) ||
                Number(product.isEnableCustomize) === Number(1) ||
                Number(product.isBooking) === Number(1);
              
              if (hasPriority) {
                priorityProducts.push(reorderProductFields(item));
              } else {
                otherProducts.push(reorderProductFields(item));
              }
            } else {
              otherProducts.push(reorderProductFields(item));
            }
          });

          // Combine: priority products first, then other products
          const reorderedList = [...priorityProducts, ...otherProducts];
          
          res.status(200).json({
            success: true,
            data: reorderedList,
            count: result?.count ?? reorderedList.length,
            page,
            limit,
          });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getAdminProductBystore(req, res, next) {
    const { isEnableEcommerce, isEnableCustomize } = req.query; // Get query parameters

    const productWhere = {}; // Initialize where clause for product model

    // Apply filter for isEnableEcommerce if provided
    // Assuming frontend sends '1' or '0' as string
    if (isEnableEcommerce !== undefined) {
      productWhere.isEnableEcommerce = isEnableEcommerce;
    }

    // Apply filter for isEnableCustomize if provided
    // Assuming frontend sends '1' or '0' as string, convert to number as per frontend logic
    if (isEnableCustomize !== undefined) {
      productWhere.isEnableCustomize = isEnableCustomize;
    }
    try {
      db.store_product
        .findAll({
          where: { supplierId: req.params.id },
          include: [
            {
              model: db.product,
              where: {
                ...productWhere,
              },
              include: [
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
          res.status(200).json({ success: true, data: list, count: list.length });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async storeUpdate(req, res, next) {
    try {
      const {
        id,
        storename,
        status,
        deliveryPartner,
        shiprocketPickupLocation,
        storeaddress,
        storedesc,
        ownername,
        owneraddress,
        email,
        password,
        phone,
        areaId,
        accountNo,
        accountHolderName,
        IFSC,
        bankName,
        branch,
        adharCardNo,
        panCardNo,
        GSTNo,
        website,
        openTime,
        closeTime,
        location,
        storeImage,
        verifyDocument
      } = req.body;
      db.store
        .findOne({ where: { id: id } })
        .then((list) => {
          if (list) {
            return db.store.update(
              {
                storename: storename ? storename : list?.storename,
                status: status ? status : list?.status,
                deliveryPartner:
                  deliveryPartner !== undefined
                    ? deliveryPartner
                    : list?.deliveryPartner,
                shiprocketPickupLocation:
                  shiprocketPickupLocation !== undefined
                    ? shiprocketPickupLocation
                    : list?.shiprocketPickupLocation,
                storeaddress: storeaddress ? storeaddress : list?.storeaddress,
                storedesc: storedesc ? storedesc : list?.storedesc,
                ownername: ownername ? ownername : list?.ownername,
                owneraddress: owneraddress ? owneraddress : list?.owneraddress,
                email: email ? email : list?.email,
                password: password ? password : list?.password,
                phone: phone ? phone : list?.phone,
                accountNo: accountNo ? accountNo : list?.accountNo,
                accountHolderName: accountHolderName
                  ? accountHolderName
                  : list?.accountHolderName,
                IFSC: IFSC ? IFSC : list?.IFSC,
                bankName: bankName ? bankName : list?.bankName,
                branch: branch ? branch : list?.branch,
                adharCardNo: adharCardNo ? adharCardNo : list?.adharCardNo,
                panCardNo: panCardNo ? panCardNo : list?.panCardNo,
                GSTNo: GSTNo ? GSTNo : list?.GSTNo,
                areaId: areaId ? areaId : list?.areaId,
                website: website ? website : list?.website,
                openTime: openTime ? openTime : list?.openTime,
                closeTime: closeTime ? closeTime : list?.closeTime,
                location: location ? location : list?.location,
                storeImage: storeImage ? storeImage : list?.storeImage,
                verifyDocument: verifyDocument ? verifyDocument : list?.verifyDocument,
              },
              { where: { id: id } }
            );
          }
          throw new RequestError("No data found", 409);
        })
        .then((store) => {
          res
            .status(200)
            .json({ success: true, msg: "Updated Successfully", data: store });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async storeDelete(req, res, next) {
    try {
      // Soft delete (move to trash) instead of permanent delete.
      // `status` is used for active/inactive. Trash is tracked by `isTrashed`.
      const store = await db.store.findOne({ where: { id: req.params.id } });
      if (!store) {
        throw new RequestError("Store is not found");
      }

      await db.store.update(
        { isTrashed: true },
        { where: { id: store.id } }
      );

      return res.status(200).json({
        success: true,
        msg: "Store moved to trash",
      });
    } catch (err) {
      next(err);
    }
  },

  // Admin: list trashed (soft-deleted) stores
  async adminGetTrashedStores(req, res, next) {
    try {
      const list = await db.store.findAll({
        where: { isTrashed: true },
        order: [["id", "DESC"]],
      });
      return res.status(200).json({ success: true, data: list, count: list.length });
    } catch (err) {
      next(err);
    }
  },

  // Admin: restore a store from trash
  async storeRestore(req, res, next) {
    try {
      const store = await db.store.findOne({ where: { id: req.params.id } });
      if (!store) {
        throw new RequestError("Store is not found");
      }

      await db.store.update(
        { isTrashed: false },
        { where: { id: store.id } }
      );

      return res.status(200).json({ success: true, msg: "Store restored" });
    } catch (err) {
      next(err);
    }
  },

  // Admin: permanent delete (dangerous) - only use from Trash
  async storeDestroyPermanent(req, res, next) {
    try {
      const store = await db.store.findOne({ where: { id: req.params.id } });
      if (!store) {
        throw new RequestError("Store is not found");
      }

      await db.store.destroy({ where: { id: store.id } });
      return res.status(200).json({ success: true, msg: "Store permanently deleted" });
    } catch (err) {
      next(err);
    }
  },

  async storeProductDelete(req, res, next) {
    try {
      db.store_product
        .findOne({ where: { id: req.body.id } })
        .then((data) => {
          if (data) {
            return db.store_product.destroy({ where: { id: req.body.id } });
          }
          throw new RequestError("Product is not found");
        })
        .then((re) => {
          return res.status(200).json({
            success: true,
            status: "Successfully deleted Product from store list",
          });
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getAllStoresByCategories(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 20, 1), 50);
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {
      const { categoryIds } = req.query; // Assuming the category IDs are passed as a query parameter

      // Parse categoryIds into an array if it's a string (e.g., "1,2,3")
      const categoryArray = Array.isArray(categoryIds)
        ? categoryIds
        : categoryIds.split(",");

      // Find all product IDs that belong to the specified categories
      const products = await db.product.findAll({
        where: {
          categoryId: {
            [db.Sequelize.Op.in]: categoryArray,
          },
        },
        attributes: ["id"],
      });

      const productIds = products.map((product) => product.id);

      // Check if productIds is empty
      if (productIds.length === 0) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }
      // Find all stores that are associated with those products and get their product count
      const stores = await db.store.findAll({
        attributes: [
          'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'location', 'storeImage', 'verifyDocument',
          // Add the count of associated products as 'totalProducts'
          [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
        ],
        include: [
          {
            model: db.store_product,
            attributes: [], // No need to fetch attributes from store_product itself
            where: {
              productId: {
                [db.Sequelize.Op.in]: productIds,
              },
            },
            required: true // Ensures only stores with matching products are returned (INNER JOIN)
          },
        ],
        group: [
          // All non-aggregated attributes from the 'attributes' array must be in the 'group' clause
          'store.id', 'store.storename', 'store.status', 'store.storeaddress', 'store.storedesc', 'store.ownername', 'store.owneraddress', 'store.email', 'store.phone', 'store.accountNo', 'store.accountHolderName', 'store.IFSC', 'store.bankName', 'store.branch', 'store.adharCardNo', 'store.panCardNo', 'store.GSTNo', 'store.areaId', 'store.website', 'store.openTime', 'store.closeTime', 'store.location', 'store.storeImage', 'store.verifyDocument'
        ],
        raw: true, // Return raw data to easily access the 'totalProducts' alias,
        where: {
          status: "1",
        },
      });

      const storesWithDistance = stores.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      const totalCount = sortedStores.length;
      const offset = (page - 1) * limit;
      const paged = sortedStores.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        data: paged,
        count: totalCount,
        page,
        limit,
      });
    } catch (err) {
      next(new RequestError("Error"));
    }
  },

  async getServiceAllStoresByCategories(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {
      const { categoryIds } = req.query; // Assuming the category IDs are passed as a query parameter

      // Parse categoryIds into an array if it's a string (e.g., "1,2,3")
      const categoryArray = Array.isArray(categoryIds)
        ? categoryIds
        : categoryIds.split(",");

      // Find all product IDs that belong to the specified categories
      const products = await db.product.findAll({
        where: {
          categoryId: {
            [db.Sequelize.Op.in]: categoryArray,
          },
          serviceType: "Service"
        },
        attributes: ["id"],
      });

      const productIds = products.map((product) => product.id);

      // Check if productIds is empty
      if (productIds.length === 0) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      // Find all stores associated with those products via store_product
      const stores = await db.store.findAll({
        attributes: [
          'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'storeImage', 'verifyDocument',
          // Add the count of associated products as 'totalProducts'
          [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
        ],
        include: [
          {
            model: db.store_product,
            where: {
              productId: {
                [db.Sequelize.Op.in]: productIds,
              },
            },
            attributes: [], // No need to fetch attributes from store_product
            required: true // Ensures only stores with matching products are returned (INNER JOIN)
          },
        ],
        group: [
          // All non-aggregated attributes from the 'attributes' array must be in the 'group' clause
          'store.id', 'store.storename', 'store.status', 'store.storeaddress', 'store.storedesc', 'store.ownername', 'store.owneraddress', 'store.email', 'store.phone', 'store.accountNo', 'store.accountHolderName', 'store.IFSC', 'store.bankName', 'store.branch', 'store.adharCardNo', 'store.panCardNo', 'store.GSTNo', 'store.areaId', 'store.website', 'store.openTime', 'store.closeTime', 'store.storeImage', 'store.verifyDocument', 'store.location'
        ],
        raw: true, // Return raw data to easily access the 'totalProducts' alias
        where: {
          status: "1",
        },
      });

      const storesWithDistance = stores.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      res.status(200).json({ success: true, data: sortedStores, count: sortedStores.length });
    } catch (err) {
      next(new RequestError("Error"));
    }
  },

  async getAllStoresByFilters(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limitRaw = parseInt(req.query.limit, 10);
    const limit = Math.min(Math.max(limitRaw || 20, 1), 50);
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {
      const { search, paymentModes } = req.query; // Extract filters from query parameters

      // Initialize filter conditions for products
      const productWhere = {};
      const paymentModeArray = paymentModes
        ? paymentModes.split(",").map((pm) => parseInt(pm.trim(), 10))
        : []; // Ensure integers

      // Apply filter by product name if provided
      if (search) {
        productWhere.name = {
          [db.Sequelize.Op.like]: `%${search}%`,
        };
      }

      // Apply filter by payment modes if provided
      if (paymentModes) {
        productWhere.paymentMode = {
          [db.Sequelize.Op.or]: paymentModeArray.map((mode) => ({
            [db.Sequelize.Op.like]: `%${mode}%`,
          })),
        };
      }

      // Find all product IDs that match the filters
      const products = await db.product.findAll({
        where: productWhere,
        attributes: ["id"],
      });

      const productIds = products.map((product) => product.id);

      // Check if productIds is empty
      if (productIds.length === 0) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      // Find all stores that are associated with those products and get their product count
      const stores = await db.store.findAll({
        attributes: [
          'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'location', 'storeImage', 'verifyDocument',
          // Add the count of associated products as 'totalProducts'
          [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
        ],
        include: [
          {
            model: db.store_product,
            attributes: [], // No need to fetch attributes from store_product itself
            where: {
              productId: {
                [db.Sequelize.Op.in]: productIds,
              },
            },
            required: true // Ensures only stores with matching products are returned (INNER JOIN)
          },
        ],
        group: [
          // All non-aggregated attributes from the 'attributes' array must be in the 'group' clause
          'store.id', 'store.storename', 'store.status', 'store.storeaddress', 'store.storedesc', 'store.ownername', 'store.owneraddress', 'store.email', 'store.phone', 'store.accountNo', 'store.accountHolderName', 'store.IFSC', 'store.bankName', 'store.branch', 'store.adharCardNo', 'store.panCardNo', 'store.GSTNo', 'store.areaId', 'store.website', 'store.openTime', 'store.closeTime', 'store.location', 'store.storeImage', 'store.verifyDocument'
        ],
        raw: true, // Return raw data to easily access the 'totalProducts' alias,
        where: {
          status: "1"
        },
      });

      const storesWithDistance = stores.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      const totalCount = sortedStores.length;
      const offset = (page - 1) * limit;
      const paged = sortedStores.slice(offset, offset + limit);

      res.status(200).json({
        success: true,
        data: paged,
        count: totalCount,
        page,
        limit,
      });
    } catch (err) {
      console.log(err, "Error");
      next(new RequestError("Error"));
    }
  },

  async getServiceAllStoresByFilters(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {
      const { search, paymentModes } = req.query; // Extract filters from query parameters

      // Initialize filter conditions for products
      const productWhere = {};
      const paymentModeArray = paymentModes
        ? paymentModes.split(",").map((pm) => parseInt(pm.trim(), 10))
        : []; // Ensure integers

      // Apply filter by product name if provided
      if (search) {
        productWhere.name = {
          [db.Sequelize.Op.like]: `%${search}%`,
        };
      }

      // Apply filter by payment modes if provided
      if (paymentModes) {
        productWhere.paymentMode = {
          [db.Sequelize.Op.or]: paymentModeArray.map((mode) => ({
            [db.Sequelize.Op.like]: `%${mode}%`,
          })),
        };
      }

      productWhere.serviceType = "Service";

      // Find all product IDs that match the filters
      const products = await db.product.findAll({
        where: productWhere,
        attributes: ["id"],
      });

      const productIds = products.map((product) => product.id);

      // Check if productIds is empty
      if (productIds.length === 0) {
        return res.status(200).json({ success: true, data: [], count: 0 });
      }

      // Find all stores that are associated with those products and get their product count
      const stores = await db.store.findAll({
        attributes: [
          'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'location', 'storeImage', 'verifyDocument',
          // Add the count of associated products as 'totalProducts'
          [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
        ],
        include: [
          {
            model: db.store_product,
            attributes: [], // No need to fetch attributes from store_product itself
            where: {
              productId: {
                [db.Sequelize.Op.in]: productIds,
              },
            },
            required: true // Ensures only stores with matching products are returned (INNER JOIN)
          },
        ],
        group: [
          // All non-aggregated attributes from the 'attributes' array must be in the 'group' clause
          'store.id', 'store.storename', 'store.status', 'store.storeaddress', 'store.storedesc', 'store.ownername', 'store.owneraddress', 'store.email', 'store.phone', 'store.accountNo', 'store.accountHolderName', 'store.IFSC', 'store.bankName', 'store.branch', 'store.adharCardNo', 'store.panCardNo', 'store.GSTNo', 'store.areaId', 'store.website', 'store.openTime', 'store.closeTime', 'store.location', 'store.storeImage', 'store.verifyDocument'
        ],
        raw: true, // Return raw data to easily access the 'totalProducts' alias,
        where: {
          status: "1"
        },
      });

      const storesWithDistance = stores.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      res.status(200).json({ success: true, data: sortedStores, count: sortedStores.length });
    } catch (err) {
      console.log(err, "Error");
      next(new RequestError("Error"));
    }
  },

  async getOpenStores(req, res, next) {
    const { currentLocation } = req.query;
    let userLat, userLon;
    if (currentLocation) {
      const coords = currentLocation.split(',').map(Number);
      if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
        userLat = coords[0];
        userLon = coords[1];
      } else {
        console.warn("Invalid currentLocation format:", currentLocation);
      }
    }
    try {
      const timeStringToMinutes = (value) => {
        if (value === null || value === undefined) return null;
        const raw = String(value).trim();
        if (!raw) return null;

        // Accept: "9", "09", "9:30", "09:30", "9 AM", "09:30 PM"
        const m = raw.match(/^(\d{1,2})(?::(\d{1,2}))?\s*(AM|PM)?$/i);
        if (!m) return null;

        let hh = parseInt(m[1], 10);
        const mm = m[2] !== undefined ? parseInt(m[2], 10) : 0;
        const ap = m[3] ? m[3].toUpperCase() : null;

        if (Number.isNaN(hh) || Number.isNaN(mm)) return null;
        if (mm < 0 || mm > 59) return null;

        if (ap) {
          // 12-hour clock
          if (hh < 1 || hh > 12) return null;
          const isPM = ap === "PM";
          hh = hh % 12;
          if (isPM) hh += 12;
        } else {
          // 24-hour clock
          if (hh < 0 || hh > 23) return null;
        }

        return hh * 60 + mm;
      };

      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();

      // Define all store attributes to be selected
      const storeAttributes = [
        'id', 'storename', 'status', 'storeaddress', 'storedesc', 'ownername', 'owneraddress', 'email', 'phone', 'accountNo', 'accountHolderName', 'IFSC', 'bankName', 'branch', 'adharCardNo', 'panCardNo', 'GSTNo', 'areaId', 'website', 'openTime', 'closeTime', 'storeImage', 'verifyDocument', 'location'
      ];

      // Construct the attributes array for the main query, including flattened attributes from includes and the product count
      const attributesToSelect = [
        ...storeAttributes,
        [db.Sequelize.fn('COUNT', db.Sequelize.col('store_products.productId')), 'totalProducts']
      ];

      // Construct the group by array, including all non-aggregated attributes from the main model and included models
      const groupByColumns = [
        ...storeAttributes.map(attr => `store.${attr}`),
        'area.id', 'area.name',
        'area->location.id', 'area->location.name'
      ];

      // Fetch active stores, then filter open/close times in JS (openTime/closeTime are strings)
      const allActiveStores = await db.store.findAll({
        attributes: attributesToSelect,
        where: {
          status: "1",
        },
        include: [
          {
            model: db.area,
            attributes: [], // Attributes are selected in the main query's attributes array
            include: [{ model: db.location, attributes: [] }], // Attributes are selected in the main query's attributes array
            required: false // Use LEFT JOIN
          },
          {
            model: db.store_product, // Assuming this is the join table between store and product
            attributes: [], // Don't select attributes from store_product itself
            required: false // Use LEFT JOIN to count products, even if a store has none
          },
        ],
        group: groupByColumns,
        raw: true // Return raw data objects, flattening included model attributes
      });

      const openStores = (allActiveStores ?? []).filter((store) => {
        const openM = timeStringToMinutes(store?.openTime);
        const closeM = timeStringToMinutes(store?.closeTime);
        if (openM === null || closeM === null) return false;

        // If open == close, treat as always-open (common "00:00" to "00:00" encoding)
        if (openM === closeM) return true;

        // Normal same-day window (e.g. 09:00-18:00)
        if (openM < closeM) return nowMinutes >= openM && nowMinutes <= closeM;

        // Overnight window (e.g. 20:00-02:00)
        return nowMinutes >= openM || nowMinutes <= closeM;
      });

      const storesWithDistance = openStores.map(store => {
        if (userLat !== undefined && userLon !== undefined && store.location) {
          const storeCoords = extractLatLngFromGoogleMapsUrl(store.location);
          if (storeCoords) {
            const distance = haversineDistance(userLat, userLon, storeCoords.lat, storeCoords.lon);
            return { ...store, distance: parseFloat(distance.toFixed(2)) }; // Round to 2 decimal places
          }
        }
        return { ...store, distance: null }; // Set distance to null if not calculable
      });

      // Sort by distance: nearest first, then stores with null distance at the end
      const sortedStores = storesWithDistance.sort((a, b) => {
        if (a.distance === null && b.distance === null) return 0;
        if (a.distance === null) return 1; // Put null distances at the end
        if (b.distance === null) return -1; // Put null distances at the end
        return a.distance - b.distance; // Sort by distance ascending (nearest first)
      });

      res.status(200).json({
        success: true,
        data: sortedStores,
        count: sortedStores.length,
      });
    } catch (err) {
      console.error(err, "Error");
      next(new RequestError("Error"));
    }
  },
};
