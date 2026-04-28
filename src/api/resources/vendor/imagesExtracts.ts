try {
      const filePath = req.file.path; // Path of the uploaded Word file
      const outputFolder = path.join(__dirname, "wordsImagefolder"); // Folder to save images
  
      console.log(filePath, "Uploaded file path");
  
      // Ensure the output folder exists
      if (!fs.existsSync(outputFolder)) {
        fs.mkdirSync(outputFolder);
      }
  
      // Read the Word file as a zip archive
      const fileBuffer = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(fileBuffer);
  
      // Extract images from the Word file
      const imagePaths = [];
      const mediaFolder = "word/media/";
  
      if (zip.files) {
        for (const filename in zip.files) {
          if (filename.startsWith(mediaFolder)) {
            const imageContent = await zip.files[filename].async("nodebuffer");
            const imagePath = path.join(outputFolder, path.basename(filename));
            fs.writeFileSync(imagePath, imageContent);
            imagePaths.push(imagePath);
          }
        }
      }
  
      if (imagePaths.length > 0) {
        console.log("Extracted Images:", imagePaths);
        return res.status(200).json({
          success: true,
          message: "Images extracted successfully",
          imagePaths,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "No images found in the Word file",
        });
      }
    } catch (err) {
      console.error(err);
      next(new Error("Error processing the Word file"));
    }