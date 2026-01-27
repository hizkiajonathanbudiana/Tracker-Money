const fs = require('fs');
const { createCanvas, loadImage } = require('canvas');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  const svgPath = './public/icon.svg';
  
  for (const size of sizes) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Draw rounded rectangle background
    ctx.fillStyle = '#10b981';
    const radius = size / 8;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    ctx.lineTo(size - radius, 0);
    ctx.arcTo(size, 0, size, radius, radius);
    ctx.lineTo(size, size - radius);
    ctx.arcTo(size, size, size - radius, size, radius);
    ctx.lineTo(radius, size);
    ctx.arcTo(0, size, 0, size - radius, radius);
    ctx.lineTo(0, radius);
    ctx.arcTo(0, 0, radius, 0, radius);
    ctx.closePath();
    ctx.fill();
    
    // Draw dollar sign
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'white';
    
    const centerX = size / 2;
    const centerY = size / 5 * 2;
    const radius1 = size / 4.5;
    
    // Outer circle
    ctx.lineWidth = size / 16;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius1, 0, Math.PI * 2);
    ctx.stroke();
    
    // Inner circle (dollar sign)
    const radius2 = size / 9;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius2, 0, Math.PI * 2);
    ctx.fill();
    
    // Vertical line (dollar stem)
    const rectWidth = size / 16;
    const rectHeight = size / 5.3;
    const rectX = centerX - rectWidth / 2;
    const rectY = centerY + radius1 * 0.2;
    
    ctx.beginPath();
    ctx.roundRect(rectX, rectY, rectWidth, rectHeight, size / 64);
    ctx.fill();
    
    // Horizontal base
    const baseWidth = size * 0.41;
    const baseHeight = size / 16;
    const baseX = centerX - baseWidth / 2;
    const baseY = centerY + radius1 * 1.1;
    
    ctx.beginPath();
    ctx.roundRect(baseX, baseY, baseWidth, baseHeight, size / 64);
    ctx.fill();
    
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(`./public/icon-${size}x${size}.png`, buffer);
    console.log(`Generated icon-${size}x${size}.png`);
  }
}

generateIcons().then(() => {
  console.log('All icons generated successfully!');
}).catch(err => {
  console.error('Error generating icons:', err);
});
