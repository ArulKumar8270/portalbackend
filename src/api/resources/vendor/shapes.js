
async wordtojson(req, res, next) {
  console.log(req.file.path, "Processing Word document");
  const outputFolder = "./shapes";
  const wordFilePath = req.file.path;
  try {
    await fs.ensureDir(outputFolder);
    const fileBuffer = await fs.readFile(wordFilePath);
    const zip = await jszip.loadAsync(fileBuffer);

    // Log all files in the Word document
    const files = Object.keys(zip.files);
    console.log("All files in Word document:", files);

    // Get document.xml and other relevant files
    const documentXml = zip.files['word/document.xml'];
    const relsFile = zip.files['word/_rels/document.xml.rels'];
    
    if (!documentXml) {
      console.log("No document.xml found");
      return res.status(400).json({
        success: false,
        message: "Invalid Word document format: missing document.xml"
      });
    }

    // Parse document.xml
    const documentData = await documentXml.async('text');
    
    // Parse relationships file if exists
    let relationships = {};
    if (relsFile) {
      const relsData = await relsFile.async('text');
      const relsParser = new xml2js.Parser();
      const relsResult = await relsParser.parseStringPromise(relsData);
      if (relsResult && relsResult.Relationships && relsResult.Relationships.Relationship) {
        relsResult.Relationships.Relationship.forEach(rel => {
          relationships[rel.$.Id] = rel.$.Target;
        });
      }
    }

    // Parse and extract shapes
    const shapes = [];
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(documentData);

    if (!result['w:document'] || !result['w:document']['w:body']) {
      console.log("Document structure not found");
      return res.status(400).json({
        success: false,
        message: "Invalid document structure"
      });
    }

    // Process the document body
    const body = result['w:document']['w:body'][0];
    
    // Function to find shapes in the document
    const findShapes = (node, depth = 0) => {
      if (!node || typeof node !== 'object') return;
      
      const indent = ' '.repeat(depth * 2);
      console.log(indent + "Processing node:", Object.keys(node));

      // Handle shape containers
      if (node['mc:AlternateContent']) {
        const altContent = node['mc:AlternateContent'][0];
        if (altContent['mc:Choice']) {
          processShapeContainer(altContent['mc:Choice'][0], shapes, relationships, indent);
        }
        if (altContent['mc:Fallback']) {
          processShapeContainer(altContent['mc:Fallback'][0], shapes, relationships, indent);
        }
      }

      // Handle direct shapes
      if (node['w:drawing']) {
        processShapeContainer(node, shapes, relationships, indent);
      }

      // Handle VML shapes
      if (node['v:shape']) {
        processVMLShape(node['v:shape'][0], shapes, indent);
      }

      // Recursively process child nodes
      Object.keys(node).forEach(key => {
        if (Array.isArray(node[key])) {
          node[key].forEach(child => findShapes(child, depth + 1));
        }
      });
    };

    // Process the document
    findShapes(body);
    console.log("Found shapes:", shapes);

    if (shapes.length === 0) {
      console.log("No shapes found in document");
      return res.status(400).json({
        success: false,
        message: "No shapes found in document. Please ensure you have inserted shapes using Word's shape tools."
      });
    }

    // Render shapes with improved positioning and styling
    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];
      const imagePath = path.join(outputFolder, `shape_${i + 1}.png`);
      
      // Create larger canvas for better quality
      const canvas = createCanvas(800, 800);
      const ctx = canvas.getContext('2d');
      
      // Set white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 800, 800);
      
      // Calculate scaling to fit shape in canvas
      const padding = 50; // Add padding around shape
      const scale = Math.min(
        (800 - 2 * padding) / shape.width,
        (800 - 2 * padding) / shape.height
      );
      
      // Center the shape on canvas
      const translateX = (800 - shape.width * scale) / 2;
      const translateY = (800 - shape.height * scale) / 2;
      
      // Apply transformations
      ctx.translate(translateX, translateY);
      ctx.scale(scale, scale);
      
      // Set global alpha for opacity
      ctx.globalAlpha = shape.opacity || 1;
      
      // Add shape rendering with proper scaling
      switch(shape.type) {
        case 'rect':
          ctx.fillStyle = shape.color || '#000000';
          ctx.strokeStyle = shape.borderColor || '#000000';
          ctx.lineWidth = (shape.borderWidth || 1) / scale; // Adjust line width for scaling
          
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'circle':
          ctx.fillStyle = shape.color || '#000000';
          ctx.strokeStyle = shape.borderColor || '#000000';
          ctx.lineWidth = (shape.borderWidth || 1) / scale;
          
          const centerX = shape.x + (shape.width / 2);
          const centerY = shape.y + (shape.height / 2);
          const radius = Math.min(shape.width, shape.height) / 2;
          
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.fill();
          ctx.stroke();
          break;
          
        case 'line':
          ctx.strokeStyle = shape.color || '#000000';
          ctx.lineWidth = (shape.lineWidth || 2) / scale;
          ctx.lineCap = 'round';
          
          ctx.beginPath();
          ctx.moveTo(shape.x1, shape.y1);
          ctx.lineTo(shape.x2, shape.y2);
          ctx.stroke();
          break;

        case 'triangle':
          ctx.fillStyle = shape.color || '#000000';
          ctx.strokeStyle = shape.borderColor || '#000000';
          ctx.lineWidth = (shape.borderWidth || 1) / scale;
          
          ctx.beginPath();
          ctx.moveTo(shape.x + shape.width/2, shape.y);
          ctx.lineTo(shape.x + shape.width, shape.y + shape.height);
          ctx.lineTo(shape.x, shape.y + shape.height);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'star':
          ctx.fillStyle = shape.color || '#000000';
          ctx.strokeStyle = shape.borderColor || '#000000';
          ctx.lineWidth = (shape.borderWidth || 1) / scale;
          
          const spikes = shape.points || 5;
          const outerRadius = Math.min(shape.width, shape.height) / 2;
          const innerRadius = outerRadius * 0.4;
          const cx = shape.x + shape.width/2;
          const cy = shape.y + shape.height/2;
          
          ctx.beginPath();
          for(let i = 0; i < spikes * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / spikes;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;
            if(i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          break;

        case 'diagram':
        case 'chart':
        case 'picture':
          // For diagrams, charts and pictures, draw a filled rectangle with label
          ctx.fillStyle = shape.color || '#f0f0f0';
          ctx.strokeStyle = shape.borderColor || '#666666';
          ctx.lineWidth = (shape.borderWidth || 2) / scale;
          
          ctx.beginPath();
          ctx.rect(shape.x, shape.y, shape.width, shape.height);
          ctx.fill();
          ctx.stroke();
          
          // Add label
          ctx.fillStyle = '#666666';
          ctx.font = `${14/scale}px Arial`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(
            shape.type.toUpperCase(),
            shape.x + shape.width/2,
            shape.y + shape.height/2
          );
          break;
      }

      // Reset transformations
      ctx.setTransform(1, 0, 0, 1, 0, 0);

      // Add a border to show canvas bounds (for debugging)
      ctx.strokeStyle = '#cccccc';
      ctx.lineWidth = 1;
      ctx.strokeRect(0, 0, 800, 800);

      const buffer = canvas.toBuffer('image/png');
      await fs.writeFile(imagePath, buffer);
    }

    // Log success with shape details
    console.log("Successfully rendered shapes:", shapes.map(s => ({
      type: s.type,
      dimensions: `${s.width}x${s.height}`,
      position: `(${s.x},${s.y})`,
      color: s.color
    })));

    return res.status(200).json({
      success: true,
      message: `Successfully extracted and rendered ${shapes.length} shapes`
    });

  } catch (err) {
    console.error("Error processing document:", err);
    return next(err);
  }
}
// Helper function to process shape containers
function processShapeContainer(node, shapes, relationships, indent) {
  console.log(indent + "Processing shape container");
  
  try {
    if (node['w:drawing'] && node['w:drawing'][0]) {
      const drawing = node['w:drawing'][0];
      
      // Handle inline shapes
      if (drawing['wp:inline']) {
        const inline = drawing['wp:inline'][0];
        processDrawingElement(inline, shapes, relationships, indent);
      }
      
      // Handle anchored shapes
      if (drawing['wp:anchor']) {
        const anchor = drawing['wp:anchor'][0];
        processDrawingElement(anchor, shapes, relationships, indent);
      }
    }
  } catch (error) {
    console.error(indent + "Error processing shape container:", error);
  }
}

// Helper function to process drawing elements
function processDrawingElement(element, shapes, relationships, indent) {
  console.log(indent + "Processing drawing element");
  
  try {
    if (element['a:graphic'] && element['a:graphic'][0]['a:graphicData']) {
      const graphicData = element['a:graphic'][0]['a:graphicData'][0];
      
      // Process shape properties
      if (graphicData['wps:wsp']) {
        const wsp = graphicData['wps:wsp'][0];
        if (wsp['wps:spPr']) {
          const spPr = wsp['wps:spPr'][0];
          const shape = extractShapeFromProperties(spPr, element, indent);
          if (shape) {
            console.log(indent + "Found shape:", shape);
            shapes.push(shape);
          }
        }
      }
    }
  } catch (error) {
    console.error(indent + "Error processing drawing element:", error);
  }
}

// Helper function to extract shape from properties
function extractShapeFromProperties(spPr, container, indent) {
  try {
    const shape = {
      type: 'rect',
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      color: '#000000',
      borderColor: '#000000',
      borderWidth: 1,
      opacity: 1
    };

    // Get shape type
    if (spPr['a:prstGeom']) {
      const geom = spPr['a:prstGeom'][0];
      shape.type = mapShapeType(geom.$.prst);
    }

    // Get position and size from container with proper scaling
    if (container.$ && container.$.cx && container.$.cy) {
      const cx = parseInt(container.$.cx);
      const cy = parseInt(container.$.cy);
      if (!isNaN(cx) && !isNaN(cy)) {
        shape.width = cx / 360000;  // Convert EMUs to points
        shape.height = cy / 360000;
      }
    }
    
    if (container.$ && container.$.x && container.$.y) {
      const x = parseInt(container.$.x);
      const y = parseInt(container.$.y);
      if (!isNaN(x) && !isNaN(y)) {
        shape.x = x / 360000;  // Convert EMUs to points
        shape.y = y / 360000;
      }
    }

    // Get transform data with validation
    if (spPr['a:xfrm'] && spPr['a:xfrm'][0]) {
      const xfrm = spPr['a:xfrm'][0];
      
      // Get position
      if (xfrm['a:off'] && xfrm['a:off'][0] && xfrm['a:off'][0].$) {
        const offX = parseInt(xfrm['a:off'][0].$.x);
        const offY = parseInt(xfrm['a:off'][0].$.y);
        if (!isNaN(offX) && !isNaN(offY)) {
          shape.x = offX / 360000;
          shape.y = offY / 360000;
        }
      }
      
      // Get size
      if (xfrm['a:ext'] && xfrm['a:ext'][0] && xfrm['a:ext'][0].$) {
        const extX = parseInt(xfrm['a:ext'][0].$.cx);
        const extY = parseInt(xfrm['a:ext'][0].$.cy);
        if (!isNaN(extX) && !isNaN(extY)) {
          shape.width = extX / 360000;
          shape.height = extY / 360000;
        }
      }

      // Get rotation if available
      if (xfrm.$ && xfrm.$.rot) {
        const rotation = parseInt(xfrm.$.rot);
        if (!isNaN(rotation)) {
          shape.rotation = rotation / 60000; // Convert to degrees
        }
      }
    }

    // Get fill color with proper parsing
    if (spPr['a:solidFill'] && spPr['a:solidFill'][0]) {
      const fill = spPr['a:solidFill'][0];
      
      // Handle sRGB color
      if (fill['a:srgbClr'] && fill['a:srgbClr'][0].$) {
        const colorVal = fill['a:srgbClr'][0].$.val;
        if (colorVal) {
          shape.color = '#' + colorVal.replace(/[^\da-fA-F]/g, '');
        }
      }
      // Handle scheme color
      else if (fill['a:schemeClr'] && fill['a:schemeClr'][0].$) {
        const schemeColor = fill['a:schemeClr'][0].$.val;
        // Map scheme colors to actual colors
        const schemeColorMap = {
          'tx1': '#000000',    // Text 1
          'tx2': '#666666',    // Text 2
          'bg1': '#FFFFFF',    // Background 1
          'bg2': '#F2F2F2',    // Background 2
          'accent1': '#4472C4', // Accent 1
          'accent2': '#ED7D31', // Accent 2
          'accent3': '#A5A5A5', // Accent 3
          'accent4': '#FFC000', // Accent 4
          'accent5': '#5B9BD5', // Accent 5
          'accent6': '#70AD47'  // Accent 6
        };
        shape.color = schemeColorMap[schemeColor] || '#000000';
      }
      
      // Handle color transforms
      if (fill['a:srgbClr'] && fill['a:srgbClr'][0]) {
        const colorNode = fill['a:srgbClr'][0];
        
        // Handle luminance modification
        if (colorNode['a:lumMod'] && colorNode['a:lumMod'][0].$) {
          const lumMod = parseInt(colorNode['a:lumMod'][0].$.val) / 100000;
          if (!isNaN(lumMod)) {
            shape.luminanceMod = lumMod;
          }
        }
        
        // Handle alpha/opacity
        if (colorNode['a:alpha'] && colorNode['a:alpha'][0].$) {
          const alpha = parseInt(colorNode['a:alpha'][0].$.val) / 100000;
          if (!isNaN(alpha)) {
            shape.opacity = alpha;
          }
        }
      }
    }

    // Get line/border properties
    if (spPr['a:ln'] && spPr['a:ln'][0]) {
      const ln = spPr['a:ln'][0];
      
      // Get line width
      if (ln.$ && ln.$.w) {
        const width = parseInt(ln.$.w);
        if (!isNaN(width)) {
          shape.borderWidth = width / 12700; // Convert to points
        }
      }
      
      // Get line color
      if (ln['a:solidFill'] && ln['a:solidFill'][0]['a:srgbClr'] && ln['a:solidFill'][0]['a:srgbClr'][0].$) {
        const borderColor = ln['a:solidFill'][0]['a:srgbClr'][0].$.val;
        if (borderColor) {
          shape.borderColor = '#' + borderColor.replace(/[^\da-fA-F]/g, '');
        }
      }
    }

    // Ensure coordinates are valid numbers
    if (isNaN(shape.x)) shape.x = 0;
    if (isNaN(shape.y)) shape.y = 0;
    if (isNaN(shape.width)) shape.width = 100;
    if (isNaN(shape.height)) shape.height = 100;

    // Validate shape dimensions and position
    if (shape.width <= 0 || shape.height <= 0) {
      console.log(indent + "Invalid shape dimensions:", shape);
      return null;
    }

    // Clean up color value
    if (typeof shape.color === 'string') {
      if (shape.color.includes('[')) {
        shape.color = '#000000'; // Default to black if color format is invalid
      } else if (!shape.color.startsWith('#')) {
        shape.color = '#' + shape.color.replace(/[^\da-fA-F]/g, '');
      }
    }

    console.log(indent + "Extracted shape properties:", {
      type: shape.type,
      position: `(${shape.x}, ${shape.y})`,
      dimensions: `${shape.width}x${shape.height}`,
      color: shape.color
    });

    return shape;
  } catch (error) {
    console.error(indent + "Error extracting shape properties:", error);
    return null;
  }
}

// Helper function to map Word shape types to our types
function mapShapeType(wordType) {
  const typeMap = {
    'rect': 'rect',
    'square': 'rect',
    'roundRect': 'rect',
    'ellipse': 'circle',
    'circle': 'circle',
    'triangle': 'triangle',
    'rtTriangle': 'triangle',
    'line': 'line',
    'straightConnector1': 'line',
    'star4': 'star',
    'star5': 'star',
    'star6': 'star',
    'star8': 'star',
    'star10': 'star'
  };
  
  return typeMap[wordType] || 'rect';
}

// Helper function to process VML shapes
function processVMLShape(vmlShape, shapes, indent) {
  console.log(indent + "Processing VML shape");
  const shape = {
    type: 'rect',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    color: '#000000'
  };

  if (vmlShape.$ && vmlShape.$.style) {
    const styleProps = vmlShape.$.style.split(';')
      .reduce((acc, prop) => {
        const [key, value] = prop.split(':').map(s => s.trim());
        acc[key] = value;
        return acc;
      }, {});

    if (styleProps.width) shape.width = parseInt(styleProps.width);
    if (styleProps.height) shape.height = parseInt(styleProps.height);
    if (styleProps.position) {
      const [left, top] = styleProps.position.split(',');
      shape.x = parseInt(left);
      shape.y = parseInt(top);
    }
  }

  if (vmlShape.$ && vmlShape.$.fillcolor) {
    shape.color = vmlShape.$.fillcolor;
  }

  // Determine shape type from VML type
  if (vmlShape.$ && vmlShape.$.type) {
    switch(vmlShape.$.type.toLowerCase()) {
      case 'oval':
        shape.type = 'circle';
        break;
      case 'line':
        shape.type = 'line';
        break;
      case 'triangle':
        shape.type = 'triangle';
        break;
    }
  }

  console.log(indent + "Found VML shape:", shape);
  shapes.push(shape);
}