const JWT = require("jsonwebtoken");
const mailer = require("../../../mailer");
const config = require("../../../config");
const bcrypt = require("bcrypt-nodejs");
const speakeasy = require("speakeasy");
const { validateEmail } = require("./../../../functions");
const db = require("../../../models");
const { Op, Sequelize } = require('sequelize'); // Import Sequelize Op for logical operators
const AWS = require("aws-sdk"); // New import
const dotenv = require("dotenv"); // New import
const sharp = require("sharp"); // Import sharp for image processing
const fs = require("fs"); // New import

// Load environment variables from .env file
dotenv.config(); // New line

// Configure Cloudflare R2 (S3-compatible API)
const s3 = new AWS.S3({ // New S3 configuration
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  accessKeyId: process.env.CLOUDFLARE_ACCESS_KEY_ID,
  secretAccessKey: process.env.CLOUDFLARE_SECRET_ACCESS_KEY,
  signatureVersion: "v4",
  region: "auto",
});

function JWTSign(user, date) {
  const now = new Date();
  return JWT.sign(
    {
      iss: config.app.name,
      sub: user.id,
      iam: user.type,
      iat: date.getTime(),
      exp: Number(new Date(now.getTime() + 24 * 60 * 60 * 1000)),
    },
    config.app.secret
  );
}

function generateOtp() {
  let token = speakeasy.totp({
    secret: process.env.OTP_KEY,
    encoding: "base32",
    step: 30 - Math.floor((new Date().getTime() / 1000.0) % 30),
  });
  return token;
}

function verifyOtp(token) {
  let expiry = speakeasy.totp.verify({
    secret: process.env.OTP_KEY,
    encoding: "base32",
    token: token,
    step: 30 - Math.floor((new Date().getTime() / 1000.0) % 30),
    window: 0,
  });
  return expiry;
}

module.exports = {
  async requestPasswordReset(req, res, next) {
    try {
      const { email } = req.body || {};
      if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Valid email is required" });
      }

      const user = await db.user.findOne({ where: { email }, paranoid: false });
      if (!user) {
        // Don't reveal whether an email exists; respond success
        return res.status(200).json({ success: true, message: "If the account exists, OTP has been sent." });
      }

      const token = generateOtp();
      try {
        await mailer.sendPasswordResetOtp(email, token);
      } catch (e) {
        console.error("Mailer failed:", e);
        return res.status(500).json({ success: false, message: "Could not send OTP email" });
      }

      return res.status(200).json({ success: true, message: "OTP sent to your email" });
    } catch (err) {
      next(err);
    }
  },

  async confirmPasswordReset(req, res, next) {
    try {
      const { email, otp, password } = req.body || {};
      if (!email || !validateEmail(email)) {
        return res.status(400).json({ success: false, message: "Valid email is required" });
      }
      if (!otp || String(otp).trim().length < 4) {
        return res.status(400).json({ success: false, message: "OTP is required" });
      }
      if (!password || String(password).length < 5) {
        return res.status(400).json({ success: false, message: "Password must be at least 5 characters" });
      }

      const valid = verifyOtp(String(otp).trim());
      if (!valid) {
        return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
      }

      const user = await db.user.findOne({ where: { email }, paranoid: false });
      if (!user) {
        return res.status(400).json({ success: false, message: "User not found" });
      }

      const passwordHash = bcrypt.hashSync(password);
      await db.user.update(
        { password: passwordHash },
        { where: { id: user.id } }
      );

      return res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (err) {
      next(err);
    }
  },
  async addUser(req, res, next) {
    const {
      firstName,
      lastName,
      phoneNo,
      email,
      address,
      password,
      role,
      verify,
      storeId,
    } = req.body;
    var passwordHash = bcrypt.hashSync(password);
    var token = generateOtp();
    var otp = verifyOtp(token);
    db.user
      .findOne({ where: { email: email }, paranoid: false })
      .then((find) => {
        if (find) {
          throw new RequestError("Email is already in use", 409);
        }
        return db.user.create({
          firstName: firstName,
          lastName: lastName,
          email: email,
          phone: phoneNo,
          address: address,
          password: passwordHash,
          verify: verify,
          role: role,
          storeId: storeId,
        });
      })
      .then((user) => {
        // if (user) {
        //     mailer.sendEmployeePassword(email, token);
        //     return res.status(200).json({ success: true, key: otp, msg: "New Registration added and password has been sent to " + email + " ." });
        // }
        // else
        res.status(200).json({ success: true, user });
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  },

  async findUser(req, res, next) {
    try {
      // First, find the user
      const user = await db.user.findOne({
        where: { id: req.params.id },
        paranoid: false,
      });

      if (!user) {
        return res.status(500).json({ success: false });
      }

      // Build array of possible customerId values (id, storeId, vendorId)
      const customerIds = [user.id];
      
      // Add storeId if it exists and is a valid number
      if (user.storeId && user.storeId !== '' && !isNaN(user.storeId)) {
        customerIds.push(parseInt(user.storeId));
      }
      
      // Add vendorId if it exists and is a valid number
      if (user.vendorId && user.vendorId !== '' && !isNaN(user.vendorId)) {
        customerIds.push(parseInt(user.vendorId));
      }

      // Find subscriptions where customerId matches any of the user's id, storeId, or vendorId
      const subscriptions = await db.subscriptions.findAll({
        where: {
          customerId: {
            [Op.in]: customerIds,
          },
        },
      });

      // Attach subscriptions to user object
      user.dataValues.subscriptions = subscriptions;

      return res.status(200).json({ success: true, data: user });
    } catch (err) {
      console.log(err);
      next(err);
    }
  },

  async getAllUserList(req, res, next) {
    try {
      // Admin (role 0) should see ALL users including referrals from any vendor/store
      const isAdmin = req.user?.role === '0' || req.user?.role === 0;
      const whereClause = {};

      if (!isAdmin) {
        // Non-admin (e.g. vendor/store): filter by their vendor/store only
        const vendorStoreId = req.user?.vendorId || req.user?.storeId;
        if (vendorStoreId) {
          const vendorIdStr = String(vendorStoreId);
          whereClause[Op.or] = [
            { vendorId: vendorIdStr },
            { storeId: vendorIdStr }
          ];
        }
      }

      const users = await db.user.findAll({
        where: whereClause,
        attributes: [
          "id",
          "firstName",
          "lastName",
          "email",
          "phone",
          "address",
          "vendorId",
          "storeId",
          "role",
          "plan",
          "createdAt",
          "updatedAt",
        ],
        order: [["createdAt", "DESC"]],
      });

      if (users && users.length > 0) {
        return res.status(200).json({ success: true, data: users });
      } else {
        return res.status(200).json({ success: true, data: [], message: "No users found" });
      }
    } catch (err) {
      console.error(err);
      next(err);
    }
  },

  async userUpdate(req, res, next) {
    const {
      id,
      firstName,
      lastName,
      email,
      address,
      password,
      role,
      verify,
      vendorId,
      storeId,
    } = req.body;
    var passwordHash = bcrypt.hashSync(password);
    db.user
      .findOne({ where: { email: email }, paranoid: false })
      .then((user) => {
        if (!user) {
          throw new RequestError("User is not found", 409);
        }
        return db.user.update(
          {
            firstName: firstName ? firstName : user.firstName,
            lastName: lastName ? lastName : user.lastName,
            password: password ? passwordHash : user.passwordHash,
            address: address ? address : user.address,
            role: role ? role : user.role,
            verify: verify ? verify : user.verify,
            vendorId: vendorId ? vendorId : user.vendorId,
            storeId: storeId ? storeId : user.storeId,
          },
          {
            where: {
              [Op.or]: [
                { id: id ? id : null }, // Check if the `id` matches
                { email: email ? email : null }, // Or if the `email` matches
              ],
            },
          }
        );
      })
      .then((user) => {
        if (user) {
          return res.status(200).json({
            success: true,
            msg: "User update successsfully",
          });
        } else res.status(500).json({ success: false });
      })
      .catch((err) => {
        console.log(err);
        next(err);
      });
  },

  async login(req, res, next) {
    try {
      // Check if user data exists
      if (!req.user) {
        return res.status(400).json({
          success: false,
          message: "User data is missing.",
        });
      }

      const isSubUser = req.user.isSubUser || false;
      const menuPermissions = req.user.menuPermissions || {};

      // Generate token
      const currentDate = new Date();
      const token = JWTSign(req.user, currentDate);

      if (!token) {
        return res.status(500).json({
          success: false,
          message: "Failed to generate token.",
        });
      }

      // Set the cookie
      res.cookie("XSRF-token", token, {
        expires: new Date(currentDate.getTime() + 30 * 24 * 60 * 60 * 1000), // Cookie expiration set to 30 days
        httpOnly: true, // Secure the cookie - prevents XSS attacks
        secure: config.app.secure, // Use HTTPS if the app is in secure mode
        sameSite: 'Lax', // CSRF protection - Lax allows top-level navigation
      });

      // Prepare user data for response
      const userData = req.user.toJSON ? req.user.toJSON() : req.user;
      if (userData.password) {
        delete userData.password;
      }

      // Send the response
      return res.status(200).json({
        success: true,
        token,
        role: req.user.role || (isSubUser ? (req.user.vendorId ? '2' : '3') : null),
        id: req.user.id,
        isSubUser: isSubUser,
        menuPermissions: isSubUser ? menuPermissions : undefined,
        status: isSubUser ? req.user.status : 'approved',
        data: userData,
      });
    } catch (error) {
      // Catch any unexpected error and return a proper response
      console.error("Login error:", error);
      return res.status(500).json({
        success: false,
        message: "An error occurred during login.",
      });
    }
  },

  async deleteUserList(req, res, next) {
    db.user
      .findOne({ where: { id: req.body.id } })
      .then((data) => {
        if (data) {
          return db.user
            .destroy({ where: { id: req.body.id } })
            .then((r) => [r, data]);
        }
        throw new RequestError("User is not found", 409);
      })
      .then((re) => {
        return res
          .status(200)
          .json({ status: "deleted userlist Seccessfully" });
      })
      .catch((err) => {
        next(err);
      });
  },

  /**
   * Controller to handle file uploads to Cloudflare R2.
   * This function expects a file to be present in `req.file` (handled by multer middleware).
   */
  async uploadFileController(req, res) { // New controller function
    try {
      // Debug: Log what we received
      console.log("=== IN CONTROLLER ===");
      console.log("req.body:", req.body);
      console.log("req.body keys:", Object.keys(req.body || {}));
      console.log("req.file:", req.file ? "File exists" : "No file");
      
      // 1. Get the store name from the request body, query parameters, or authenticated user
      // Try multiple variations in case of case sensitivity or different field names
      // Priority: body > query > user session
      const storeName = req.body?.storeName || 
                       req.body?.storename || 
                       req.body?.store_name ||
                       req.query?.storeName || 
                       req.query?.storename ||
                       req.user?.storename ||
                       req.user?.storeName ||
                       req.user?.vendorId ||
                       req.user?.storeId;

      // Basic validation for the required dynamic directory/store name
      if (!storeName) {
        console.error("Store name missing!");
        console.error("req.body:", JSON.stringify(req.body));
        console.error("req.query:", JSON.stringify(req.query));
        return res.status(400).send({
          success: false,
          message: "Store name is missing. Cannot create file directory.",
          debug: {
            bodyKeys: Object.keys(req.body || {}),
            body: req.body,
            query: req.query,
            hasFile: !!req.file
          }
        });
      }

      // Check if a file was actually uploaded by multer
      if (!req.file) {
        return res.status(400).send({
          success: false,
          message: "No file uploaded. Please ensure the 'photo' field is present in the form data.",
        });
      }

      const file = req.file; // req.file directly contains the file object
      const originalFileName = file.originalname; // Original file name
      let fileContent = file.buffer; // Use the buffer directly for file content
      const fileMimeType = file.mimetype; // Use the mimetype

      const splitNameExt = (name) => {
        const safe = String(name || "file").trim() || "file";
        const idx = safe.lastIndexOf(".");
        if (idx <= 0 || idx === safe.length - 1) return { base: safe, ext: "" };
        return { base: safe.slice(0, idx), ext: safe.slice(idx) };
      };
      const randomSuffix = () => `${Math.floor(100000 + Math.random() * 900000)}`; // 6 digits

      // 2. Construct the R2 Key with the dynamic directory
      // Default key format: [storeName]/[originalFileName]
      let r2Key = `${storeName}/${originalFileName}`;

      // If the file is an image, compress it
      if (fileMimeType.startsWith("image/")) {
        try {
          fileContent = await sharp(fileContent)
            .resize({ width: 800 }) // Resize image to a max width of 800px
            .jpeg({ quality: 80 }) // Compress JPEG images to 80% quality
            .png({ quality: 80 }) // Compress PNG images to 80% quality
            .toBuffer();
        } catch (sharpError) {
          console.error("Image compression error:", sharpError);
          return res.status(500).send({
            success: false,
            message: "Error compressing image.",
            error: sharpError.message,
          });
        }
      }

      let message = "File uploaded successfully!";

      // If object already exists, save as a NEW filename with random suffix
      // instead of overwriting the existing object.
      const bucket = process.env.CLOUDFLARE_BUCKET_NAME;
      const { base, ext } = splitNameExt(originalFileName);
      let exists = false;
      try {
        await s3.headObject({ Bucket: bucket, Key: r2Key }).promise();
        exists = true;
      } catch (headErr) {
        if (headErr?.code !== "NotFound" && headErr?.statusCode !== 404) throw headErr;
      }

      if (exists) {
        let attempts = 0;
        while (attempts < 8) {
          attempts += 1;
          const candidateName = `${base}_${randomSuffix()}${ext}`;
          const candidateKey = `${storeName}/${candidateName}`;
          try {
            await s3.headObject({ Bucket: bucket, Key: candidateKey }).promise();
            // still exists, retry
          } catch (headErr) {
            if (headErr?.code === "NotFound" || headErr?.statusCode === 404) {
              r2Key = candidateKey;
              message = "File already existed; stored with a new name.";
              break;
            }
            throw headErr;
          }
        }
      }

      // Parameters for S3 upload
      const params = {
        Bucket: bucket,
        Key: r2Key,
        Body: fileContent,
        ContentType: fileMimeType,
      };

      // Upload the file to R2
      await s3.upload(params).promise();

      // No need to remove temporary files as memoryStorage is used

      // 3. Update the file URL to use the new R2 Key
      res.status(200).send({
        success: true,
        message: message, // Use the dynamic message
        fileUrl: `https://pub-5622c42961cc4ef29b17f85c86ab7834.r2.dev/${r2Key}`, // The public URL of the uploaded file on R2
      });
    } catch (error) {
      console.error("File Upload Error: ", error);
      res.status(500).send({
        success: false,
        message: "Error uploading file.",
        error: error.message, // Provide the error message for debugging
      });
    }
  },
};
