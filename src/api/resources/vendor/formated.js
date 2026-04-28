const db = require("../../../models");
const fs = require("fs-extra");
const path = require("path");
const jszip = require("jszip");
const { createCanvas } = require("canvas");
const xml2js = require("xml2js");
const mammoth = require("mammoth"); // Simplifies extracting text from Word files

module.exports = {
  /* Add user api start here................................*/
  async index(req, res, next) {
    try {
      const {
        id,
        storename,
        status,
        shopaddress,
        shopdesc,
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
      } = req.body;
      console.log(status, "id452342");
      db.vendor
        .findOne({ where: { id: id ? id : null } })
        .then((supplier) => {
          if (supplier) {
            console.log(supplier, "supplier4234523");

            return db.vendor.update(
              {
                storename: storename ? storename : supplier.storename,
                status: status ? status : supplier.status,
                shopaddress: shopaddress ? shopaddress : supplier.shopaddress,
                shopdesc: shopdesc ? shopdesc : supplier.shopdesc,
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
                location: location ? location : supplier.location,
                openTime: openTime ? openTime : supplier.openTime,
                closeTime: closeTime ? closeTime : supplier.closeTime,
                vendorImage: req.file ? req.file.path : supplier.vendorImage,
              },
              { where: { id: id } }
            );
          }
          return db.vendor.create({
            storename: storename ? storename : null,
            status: status ? status : null,
            shopaddress: shopaddress ? shopaddress : null,
            shopdesc: shopdesc ? shopdesc : null,
            ownername: ownername ? ownername : null,
            owneraddress: owneraddress ? owneraddress : null,
            email: email ? email : null,
            password: password ? password : null,
            phone: phone ? phone : null,
            accountNo: accountNo,
            accountHolderName: accountHolderName,
            IFSC: IFSC,
            bankName: bankName,
            branch: branch,
            adharCardNo: adharCardNo,
            panCardNo: panCardNo,
            GSTNo: GSTNo,
            areaId: areaId,
            website: website,
            location: location,
            openTime: openTime,
            closeTime: closeTime,
            vendorImage: req?.file ? req?.file?.path : "",
          });
        })
        .then((vendor) => {
          if (areaId) {
            let areaList = [];
            for (var i = 0; i < areaId.length; i++) {
              areaList.push({
                vendorId: vendor.id,
                areaId: areaId[i],
              });
            }
            return db.vendor_area.bulkCreate(areaList);
          }
          return true;
        })
        .then((success) => {
          res.status(200).json({
            success: true,
            msg: "Successfully inserted supplier",
            data: success,
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

  async vendorAddProduct(req, res, next) {
    try {
      const { supplierId, productId, unitSize, buyerPrice } = req.body;
      let id = productId;
      db.vendor_product
        .findAll({
          where: {
            supplierId: supplierId,
            productId: productId,
            unitSize: unitSize,
          },
        })
        .then((data) => {
          if (!data.length > 0) {
            return db.vendor_product.create({
              supplierId: supplierId,
              productId: productId,
              unitSize: unitSize,
              price: buyerPrice,
            });
          } else {
            return db.vendor_product.update(
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
            msg: "Successfully inserted product in VendorList",
          });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async getAllvendor(req, res, next) {
    try {
      db.vendor
        .findAll({
          include: [
            {
              model: db.area,
              attributes: ["id", "name"],
              include: [{ model: db.location, attributes: ["id", "name"] }],
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

  //Get by Id
  async getVendorStockById(req, res, next) {
    try {
      const { id } = req.params;

      const vendorData = await db.vendor.findOne({
        where: { id }, // Filter vendor by its ID
        include: [
          {
            model: db.area, // Include related area data
            attributes: ["id", "name"],
            include: [
              {
                model: db.location, // Include related location data
                attributes: ["id", "name"],
              },
            ],
          },
          {
            model: db.user, // Include related user data
            attributes: ["id"], // Adjust attributes as needed
          },
        ],
      });

      if (vendorData) {
        return res.status(200).json({ success: true, data: [vendorData] });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "Vendor not found" });
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  },

  async getAllVendorProduct(req, res, next) {
    try {
      db.product
        .findAll({
          attributes: ["id", "name", "brand"],
          include: [
            {
              model: db.vendor_product,
              attributes: [
                "id",
                "supplierId",
                "productId",
                "unitSize",
                "price",
              ],
              include: [
                {
                  model: db.vendor,
                  attributes: ["id", "storename", "ownername"],
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

  async getProductByVendor(req, res, next) {
    try {
      db.vendor_product
        .findAll({
          attributes: ["id", "supplierId", "productId", "unitSize", "price"],
          where: { supplierId: req.params.id },
          include: [
            {
              model: db.product,
              attributes: [
                "id",
                "name",
                "brand",
                "photo",
                "status",
                "sortDesc",
                "unitSize",
                "price",
                "discount",
                "discountPer",
                "paymentMode",
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

  async vendorUpdate(req, res, next) {
    try {
      const {
        id,
        storename,
        status,
        shopaddress,
        shopdesc,
        ownername,
        owneraddress,
        email,
        password,
        phone,
        location,
        website,
        openTime,
        closeTime,
      } = req.body;
      db.vendor
        .findOne({ where: { id: id } })
        .then((list) => {
          if (list) {
            return db.vendor.update(
              {
                storename: storename,
                status: status ? parseInt(status) : list.status,
                shopaddress: shopaddress ? shopaddress : list.shopaddress,
                shopdesc: shopdesc ? shopdesc : list.shopdesc,
                ownername: ownername ? ownername : list.ownername,
                owneraddress: owneraddress ? owneraddress : list.owneraddress,
                email: email ? email : list.email,
                password: password ? password : list.password,
                phone: phone ? phone : list.phone,
                website: website ? website : list.website,
                location: location ? location : list.location,
                openTime: openTime ? openTime : list.openTime,
                closeTime: closeTime ? closeTime : list.closeTime,
                vendorImage: req.file ? req.file.path : list.vendorImage,
              },
              { where: { id: id } }
            );
          }
          throw new RequestError("No data found", 409);
        })
        .then((e) => {
          res.status(200).json({ success: true, msg: "Updated Successfully" });
        })
        .catch(function (err) {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async vendorDelete(req, res, next) {
    try {
      db.vendor
        .findOne({ where: { id: req.params.id } })
        .then((data) => {
          if (data) {
            return db.vendor.destroy({ where: { id: data.id } });
          }
          throw new RequestError("Seller is not found");
        })
        .then((re) => {
          return res
            .status(200)
            .json({ success: true, status: "Deleted vendor successfully" });
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async vendorProductDelete(req, res, next) {
    try {
      db.vendor_product
        .findOne({ where: { id: req.body.id } })
        .then((data) => {
          if (data) {
            return db.vendor_product.destroy({ where: { id: req.body.id } });
          }
          throw new RequestError("Product is not found");
        })
        .then((re) => {
          return res.status(200).json({
            success: true,
            status: "Successfully deleted Product from Vendor list",
          });
        })
        .catch((err) => {
          next(err);
        });
    } catch (err) {
      throw new RequestError("Error");
    }
  },

  async wordtojson(req, res, next) {
    console.log(req.file.path, "Processing Word document");
    const rgbPattern = /RGB[_-]?(\d{3,4})/gi; // Updated regex for RGB values like RGB_0169

    const outputFolder = "./shapes";
    const wordFilePath = req.file.path;

    try {
      await fs.ensureDir(outputFolder);
      const fileBuffer = await fs.readFile(wordFilePath);
      const zip = await jszip.loadAsync(fileBuffer);

      // Get document.xml and relationships
      const documentXml = zip.files["word/document.xml"];
      const relsFile = zip.files["word/_rels/document.xml.rels"];

      if (!documentXml) {
        console.log("No document.xml found");
        return res.status(400).json({
          success: false,
          message: "Invalid Word document format",
        });
      }

      // Parse document content
      const documentData = await documentXml.async("text");
      const parser = new xml2js.Parser();
      const result = await parser.parseStringPromise(documentData);

      // Extract text using mammoth
      const { value: extractedText } = await mammoth.extractRawText({
        buffer: fileBuffer,
      });
      console.log("Extracted text:", extractedText);

      // Parse questions from text (if needed)
      const questionData = parseWordTable(extractedText);

      // Combine question data and shape/RGB data
      return res.status(200).json({
        success: true,
        data: {
          questions: questionData.data,
        },
      });
    } catch (err) {
      console.error("Error processing document:", err);
      return next(err);
    }
  },
};

function parseWordTable(text) {
  const data = [];
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line); // Remove blank lines

  let currentQuestion = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Start new question when we find "Question" followed by a number
    if (line.match(/^Question\s+\d+/)) {
      // Save previous question if exists
      if (
        currentQuestion &&
        currentQuestion.question &&
        currentQuestion.options?.length > 0
      ) {
        data.push(currentQuestion);
      }

      // Create new question object
      currentQuestion = {
        question: "",
        options: [],
        correctAnswer: "",
        positiveMark: "0",
        negativeMark: "0",
        type: "Multiple Choice",
      };

      // Get question text (it's in the next line)
      if (i + 1 < lines.length) {
        currentQuestion.question = lines[i + 1].trim();
      }

      continue;
    }

    if (!currentQuestion) continue;

    // Handle options
    if (line.match(/^Option [A-E]/i)) {
      const optionMatch = line.match(/^Option ([A-E])\s*(.*)/i);
      if (optionMatch && i + 1 < lines.length) {
        const optionText = lines[i + 1].trim();
        // Clean up option text by removing trailing slash and spaces
        const cleanOption = optionText.replace(/\s*\/\s*$/, "").trim();
        currentQuestion.options.push(cleanOption);
      }
    }
    // Handle type
    else if (line.startsWith("Type")) {
      if (i + 1 < lines.length) {
        currentQuestion.type = lines[i + 1].trim();
      }
    }
    // Handle correct answer
    else if (line.startsWith("Correct Answer")) {
      if (i + 1 < lines.length) {
        currentQuestion.correctAnswer = lines[i + 1].trim();
      }
    }
    // Handle positive mark
    else if (line.startsWith("Positive Mark")) {
      if (i + 1 < lines.length) {
        currentQuestion.positiveMark = lines[i + 1].trim();
      }
    }
    // Handle negative mark
    else if (line.startsWith("Negative Mark")) {
      if (i + 1 < lines.length) {
        currentQuestion.negativeMark = lines[i + 1].trim();
      }
    }
  }

  // Don't forget to add the last question
  if (
    currentQuestion &&
    currentQuestion.question &&
    currentQuestion.options?.length > 0
  ) {
    data.push(currentQuestion);
  }

  // Log the parsed data for debugging
  console.log("Parsed questions:", JSON.stringify(data, null, 2));

  return {
    success: true,
    data,
  };
}
