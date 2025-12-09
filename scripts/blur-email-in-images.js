const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const imagesDir = path.join(__dirname, '../public/onboarding');
const emailToBlur = 'adrianmorosin02@gmail.com';

async function blurEmailInImage(imagePath, blurRegions) {
  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();
    
    // Load original
    const original = await image.toBuffer();
    
    // Create blurred composites for each region
    const composites = await Promise.all(
      blurRegions.map(async (region) => {
        const extractWidth = Math.min(region.width, metadata.width - region.x);
        const extractHeight = Math.min(region.height, metadata.height - region.y);
        
        if (extractWidth <= 0 || extractHeight <= 0) {
          return null;
        }
        
        const blurredRegion = await sharp(original)
          .extract({
            left: Math.max(0, region.x),
            top: Math.max(0, region.y),
            width: extractWidth,
            height: extractHeight,
          })
          .blur(15)
          .toBuffer();
        
        return {
          input: blurredRegion,
          left: Math.max(0, region.x),
          top: Math.max(0, region.y),
        };
      })
    );
    
    // Filter out null composites
    const validComposites = composites.filter(c => c !== null);
    
    if (validComposites.length > 0) {
      await sharp(original)
        .composite(validComposites)
        .toFile(imagePath);
      
      console.log(`✅ Blurred ${validComposites.length} region(s) in ${path.basename(imagePath)}`);
    } else {
      console.log(`⚠️  No valid regions to blur in ${path.basename(imagePath)}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${imagePath}:`, error.message);
  }
}

async function main() {
  const images = [
    {
      file: 'gmail-confirmation.png',
      regions: [], // No blur
    },
    {
      file: 'gmail-settings.png',
      regions: [], // No blur
    },
    {
      file: 'forwarding-toggle-on.png',
      regions: [], // No blur
    },
    {
      file: 'pink-banner.png',
      regions: [], // No blur
    },
    {
      file: 'save-changes.png',
      regions: [], // No blur
    },
    {
      file: 'gmail-modal.png',
      regions: [], // No blur
    },
  ];

  for (const img of images) {
    const imagePath = path.join(imagesDir, img.file);
    if (fs.existsSync(imagePath)) {
      await blurEmailInImage(imagePath, img.regions);
    } else {
      console.warn(`⚠️  Image not found: ${img.file}`);
    }
  }
  
  console.log('✨ Done blurring email addresses!');
}

main().catch(console.error);

