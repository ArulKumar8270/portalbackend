// const db = require("../../../models");
// const fs = require("fs-extra");
// const path = require("path");
// const jszip = require("jszip");
// const { createCanvas } = require("canvas");
// const xml2js = require("xml2js");
// const mammoth = require("mammoth"); // Simplifies extracting text from Word files
// const { PDFDocument } = require("pdf-lib");
// const pdf2json = require("pdf2json");
// const { PDFImage } = require("pdf-image");
// const { execSync } = require("child_process");
// var im = require("imagemagick");
// const pdf2pic = require("pdf2pic");
// const poppler = require("pdf-poppler");
// const sharp = require("sharp"); // For cropping the image
// const textract = require("textract");
// const { exec } = require("child_process");
// // const parser = new xml2js.Parser();
// const unzipper = require("unzipper");

// module.exports = {
//   /* Add user api start here................................*/
//   async index(req, res, next) {
//     try {
//       const {
//         id,
//         storename,
//         status,
//         shopaddress,
//         shopdesc,
//         ownername,
//         owneraddress,
//         email,
//         password,
//         phone,
//         areaId,
//         accountNo,
//         accountHolderName,
//         IFSC,
//         bankName,
//         branch,
//         adharCardNo,
//         panCardNo,
//         GSTNo,
//         website,
//         openTime,
//         closeTime,
//         location,
//       } = req.body;
//       console.log(status, "id452342");
//       db.vendor
//         .findOne({ where: { id: id ? id : null } })
//         .then((supplier) => {
//           if (supplier) {
//             console.log(supplier, "supplier4234523");

//             return db.vendor.update(
//               {
//                 storename: storename ? storename : supplier.storename,
//                 status: status ? status : supplier.status,
//                 shopaddress: shopaddress ? shopaddress : supplier.shopaddress,
//                 shopdesc: shopdesc ? shopdesc : supplier.shopdesc,
//                 ownername: ownername ? ownername : supplier.ownername,
//                 owneraddress: owneraddress
//                   ? owneraddress
//                   : supplier.owneraddress,
//                 email: email ? email : supplier.email,
//                 phone: phone ? phone : supplier.phone,
//                 accountNo: accountNo ? accountNo : supplier.accountNo,
//                 accountHolderName: accountHolderName
//                   ? accountHolderName
//                   : supplier.accountHolderName,
//                 IFSC: IFSC ? IFSC : supplier.IFSC,
//                 bankName: bankName ? bankName : supplier.bankName,
//                 branch: branch ? branch : supplier.branch,
//                 adharCardNo: adharCardNo ? adharCardNo : supplier.adharCardNo,
//                 panCardNo: panCardNo ? panCardNo : supplier.panCardNo,
//                 GSTNo: GSTNo ? GSTNo : supplier.GSTNo,
//                 website: website ? website : supplier.website,
//                 location: location ? location : supplier.location,
//                 openTime: openTime ? openTime : supplier.openTime,
//                 closeTime: closeTime ? closeTime : supplier.closeTime,
//                 vendorImage: req.file ? req.file.path : supplier.vendorImage,
//               },
//               { where: { id: id } }
//             );
//           }
//           return db.vendor.create({
//             storename: storename ? storename : null,
//             status: status ? status : null,
//             shopaddress: shopaddress ? shopaddress : null,
//             shopdesc: shopdesc ? shopdesc : null,
//             ownername: ownername ? ownername : null,
//             owneraddress: owneraddress ? owneraddress : null,
//             email: email ? email : null,
//             password: password ? password : null,
//             phone: phone ? phone : null,
//             accountNo: accountNo,
//             accountHolderName: accountHolderName,
//             IFSC: IFSC,
//             bankName: bankName,
//             branch: branch,
//             adharCardNo: adharCardNo,
//             panCardNo: panCardNo,
//             GSTNo: GSTNo,
//             areaId: areaId,
//             website: website,
//             location: location,
//             openTime: openTime,
//             closeTime: closeTime,
//             vendorImage: req?.file ? req?.file?.path : "",
//           });
//         })
//         .then((vendor) => {
//           if (areaId) {
//             let areaList = [];
//             for (var i = 0; i < areaId.length; i++) {
//               areaList.push({
//                 vendorId: vendor.id,
//                 areaId: areaId[i],
//               });
//             }
//             return db.vendor_area.bulkCreate(areaList);
//           }
//           return true;
//         })
//         .then((success) => {
//           res.status(200).json({
//             success: true,
//             msg: "Successfully inserted supplier",
//             data: success,
//           });
//         })
//         .catch(function (err) {
//           console.log(err);
//           next(err);
//         });
//     } catch (err) {
//       console.log(err);
//       throw new RequestError("Error");
//     }
//   },

//   async vendorAddProduct(req, res, next) {
//     try {
//       const { supplierId, productId, unitSize, buyerPrice } = req.body;
//       let id = productId;
//       db.vendor_product
//         .findAll({
//           where: {
//             supplierId: supplierId,
//             productId: productId,
//             unitSize: unitSize,
//           },
//         })
//         .then((data) => {
//           if (!data.length > 0) {
//             return db.vendor_product.create({
//               supplierId: supplierId,
//               productId: productId,
//               unitSize: unitSize,
//               price: buyerPrice,
//             });
//           } else {
//             return db.vendor_product.update(
//               {
//                 unitSize: unitSize ? unitSize : data.unitSize,
//                 price: buyerPrice ? buyerPrice : data.buyerPrice,
//               },
//               { where: { supplierId: supplierId, productId: productId } }
//             );
//           }
//         })
//         .then((success) => {
//           res.status(200).json({
//             success: true,
//             msg: "Successfully inserted product in VendorList",
//           });
//         })
//         .catch(function (err) {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },

//   async getAllvendor(req, res, next) {
//     try {
//       db.vendor
//         .findAll({
//           include: [
//             {
//               model: db.area,
//               attributes: ["id", "name"],
//               include: [{ model: db.location, attributes: ["id", "name"] }],
//             },
//           ],
//         })
//         .then((list) => {
//           res.status(200).json({ success: true, data: list });
//         })
//         .catch(function (err) {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },

//   //Get by Id
//   async getVendorStockById(req, res, next) {
//     try {
//       const { id } = req.params;

//       const vendorData = await db.vendor.findOne({
//         where: { id }, // Filter vendor by its ID
//         include: [
//           {
//             model: db.area, // Include related area data
//             attributes: ["id", "name"],
//             include: [
//               {
//                 model: db.location, // Include related location data
//                 attributes: ["id", "name"],
//               },
//             ],
//           },
//           {
//             model: db.user, // Include related user data
//             attributes: ["id"], // Adjust attributes as needed
//           },
//         ],
//       });

//       if (vendorData) {
//         return res.status(200).json({ success: true, data: [vendorData] });
//       } else {
//         return res
//           .status(404)
//           .json({ success: false, message: "Vendor not found" });
//       }
//     } catch (err) {
//       console.error(err);
//       next(err);
//     }
//   },

//   async getAllVendorProduct(req, res, next) {
//     try {
//       db.product
//         .findAll({
//           attributes: ["id", "name", "brand"],
//           include: [
//             {
//               model: db.vendor_product,
//               attributes: [
//                 "id",
//                 "supplierId",
//                 "productId",
//                 "unitSize",
//                 "price",
//               ],
//               include: [
//                 {
//                   model: db.vendor,
//                   attributes: ["id", "storename", "ownername"],
//                 },
//               ],
//             },
//           ],
//         })
//         .then((list) => {
//           res.status(200).json({ success: true, data: list });
//         })
//         .catch(function (err) {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },

//   async getProductByVendor(req, res, next) {
//     try {
//       db.vendor_product
//         .findAll({
//           attributes: ["id", "supplierId", "productId", "unitSize", "price"],
//           where: { supplierId: req.params.id },
//           include: [
//             {
//               model: db.product,
//               attributes: [
//                 "id",
//                 "name",
//                 "brand",
//                 "photo",
//                 "status",
//                 "sortDesc",
//                 "unitSize",
//                 "price",
//                 "discount",
//                 "discountPer",
//                 "paymentMode",
//               ],
//             },
//           ],
//         })
//         .then((list) => {
//           res.status(200).json({ success: true, data: list });
//         })
//         .catch(function (err) {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },

//   async vendorUpdate(req, res, next) {
//     try {
//       const {
//         id,
//         storename,
//         status,
//         shopaddress,
//         shopdesc,
//         ownername,
//         owneraddress,
//         email,
//         password,
//         phone,
//         location,
//         website,
//         openTime,
//         closeTime,
//       } = req.body;
//       db.vendor
//         .findOne({ where: { id: id } })
//         .then((list) => {
//           if (list) {
//             return db.vendor.update(
//               {
//                 storename: storename,
//                 status: status ? parseInt(status) : list.status,
//                 shopaddress: shopaddress ? shopaddress : list.shopaddress,
//                 shopdesc: shopdesc ? shopdesc : list.shopdesc,
//                 ownername: ownername ? ownername : list.ownername,
//                 owneraddress: owneraddress ? owneraddress : list.owneraddress,
//                 email: email ? email : list.email,
//                 password: password ? password : list.password,
//                 phone: phone ? phone : list.phone,
//                 website: website ? website : list.website,
//                 location: location ? location : list.location,
//                 openTime: openTime ? openTime : list.openTime,
//                 closeTime: closeTime ? closeTime : list.closeTime,
//                 vendorImage: req.file ? req.file.path : list.vendorImage,
//               },
//               { where: { id: id } }
//             );
//           }
//           throw new RequestError("No data found", 409);
//         })
//         .then((e) => {
//           res.status(200).json({ success: true, msg: "Updated Successfully" });
//         })
//         .catch(function (err) {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },

//   async vendorDelete(req, res, next) {
//     try {
//       db.vendor
//         .findOne({ where: { id: req.params.id } })
//         .then((data) => {
//           if (data) {
//             return db.vendor.destroy({ where: { id: data.id } });
//           }
//           throw new RequestError("Seller is not found");
//         })
//         .then((re) => {
//           return res
//             .status(200)
//             .json({ success: true, status: "Deleted vendor successfully" });
//         })
//         .catch((err) => {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },

//   async vendorProductDelete(req, res, next) {
//     try {
//       db.vendor_product
//         .findOne({ where: { id: req.body.id } })
//         .then((data) => {
//           if (data) {
//             return db.vendor_product.destroy({ where: { id: req.body.id } });
//           }
//           throw new RequestError("Product is not found");
//         })
//         .then((re) => {
//           return res.status(200).json({
//             success: true,
//             status: "Successfully deleted Product from Vendor list",
//           });
//         })
//         .catch((err) => {
//           next(err);
//         });
//     } catch (err) {
//       throw new RequestError("Error");
//     }
//   },
//   async extractClustersFromDocx(req, res, next) {
//     try {
//       const wordFilePath = req.file.path; // The file path of the uploaded Word document

//       console.log("Received file:", req.file);

//       // Create a read stream for the uploaded file and pipe it through unzipper
//       const zipStream = fs.createReadStream(wordFilePath);
//       const zip = zipStream.pipe(unzipper.Parse()); // Parsing the ZIP file

//       let documentXml = ""; // Variable to accumulate XML content

//       // Process the zip stream
//       zip.on("entry", (entry) => {
//         console.log("Zip entry:", entry.path); // Log the path of each entry in the ZIP
//         const fileName = entry.path;

//         if (fileName === "word/document.xml") {
//           entry.setEncoding("utf8");
//           entry.on("data", (chunk) => {
//             documentXml += chunk; // Accumulate the XML content
//           });

//           entry.on("end", async () => {
//             console.log(documentXml, "Finished reading document.xml");

//             try {
//               const text = await parseDocumentXml(documentXml);
//               const clusters = extractAlphaNumericClusters(text);
//               console.log("Extracted Clusters:", clusters);

//               // Return the extracted clusters as JSON response
//               return res.status(200).json({
//                 success: true,
//                 clusters: clusters,
//               });
//             } catch (err) {
//               console.error("Error parsing document.xml:", err);
//               return next(err);
//             }
//           });
//         } else {
//           entry.autodrain(); // Skip other files in the docx archive
//         }
//       });

//       // Handle errors in the ZIP stream
//       zip.on("error", (err) => {
//         console.error("Error while reading zip stream:", err);
//         return next(err);
//       });

//       // Handle when the entire ZIP is read
//       zip.on("close", function () {
//         console.log("Finished processing the ZIP file.");
//       });
//     } catch (err) {
//       console.error("Error processing the document:", err);
//       return next(err); // Pass the error to error-handling middleware
//     }
//   },
// };
// function extractAlphaNumericClusters(text) {
//   const pattern = /\b[A-Za-z]+\^\d+\b/g; // Regex pattern to match clusters like U^6, B^25, etc.
//   return text.match(pattern) || []; // Return all matches or empty array if no matches
// }

// function parseDocumentXml(xmlContent) {
//   return new Promise((resolve, reject) => {
//     xml2js.parseString(
//       xmlContent,
//       { explicitArray: false, trim: true },
//       (err, result) => {
//         if (err) {
//           return reject(err);
//         }

//         let text = "";
//         const body = result["w:document"]["w:body"];
//         if (body && Array.isArray(body["w:p"])) {
//           body["w:p"].forEach((paragraph) => {
//             if (paragraph["w:r"] && Array.isArray(paragraph["w:r"])) {
//               paragraph["w:r"].forEach((run) => {
//                 if (run["w:t"]) {
//                   text += run["w:t"] + " "; // Concatenate all text nodes
//                 }
//               });
//             }
//           });
//         }
//         resolve(text);
//       }
//     );
//   });
// }
