# LeadLocker PWA Icons

This directory contains app icons for the Progressive Web App (PWA).

## Required Icons

### icon-192.png
- Size: 192x192 pixels
- Format: PNG
- Purpose: Android app icon, splash screen
- Design: LeadLocker logo on blue background (#2563EB)

### icon-512.png
- Size: 512x512 pixels
- Format: PNG
- Purpose: High-res app icon for various devices
- Design: Same as 192px but higher resolution

## Design Guidelines

**Logo:**
- White "LL" monogram or lock icon
- Centered on blue background (#2563EB)
- Optional: Subtle gradient or shadow

**Style:**
- Modern, clean, professional
- Matches LeadLocker brand
- High contrast for visibility
- Rounded corners optional (system will add)

## Temporary Placeholder

For development, you can use any blue square PNG as a placeholder.

**Quick generation with ImageMagick:**
```bash
# Create simple blue placeholder
convert -size 192x192 xc:"#2563EB" -fill white -pointsize 72 -gravity center -annotate +0+0 "LL" icon-192.png
convert -size 512x512 xc:"#2563EB" -fill white -pointsize 192 -gravity center -annotate +0+0 "LL" icon-512.png
```

**Or use an online tool:**
- https://realfavicongenerator.net/
- https://www.pwabuilder.com/imageGenerator

## Apple Touch Icons (Optional)

For better iOS support, also add:
- `apple-touch-icon.png` (180x180)
- Referenced in layout.tsx with `<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />`

