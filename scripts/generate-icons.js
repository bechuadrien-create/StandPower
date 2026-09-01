import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function run() {
  const rootDir = process.cwd();
  const svgSource = fs.readFileSync(path.join(rootDir, 'assets/icon-source.svg'));
  const svgRoundSource = fs.readFileSync(path.join(rootDir, 'assets/icon-source-round.svg'));

  console.log('Rendering 1024x1024 master icons...');
  await sharp(svgSource).resize(1024, 1024).png().toFile(path.join(rootDir, 'assets/icon-source.png'));
  await sharp(svgRoundSource).resize(1024, 1024).png().toFile(path.join(rootDir, 'assets/icon-source-round.png'));

  const sizes = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  for (const { dir, size } of sizes) {
    const targetDir = path.join(rootDir, 'android/app/src/main/res', dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const squarePath = path.join(targetDir, 'ic_launcher.png');
    const roundPath = path.join(targetDir, 'ic_launcher_round.png');

    await sharp(svgSource).resize(size, size).png().toFile(squarePath);
    await sharp(svgRoundSource).resize(size, size).png().toFile(roundPath);

    console.log(`Generated ${dir}: ${size}x${size} -> ic_launcher.png & ic_launcher_round.png`);
  }

  console.log('All icons generated successfully!');
}

run().catch((err) => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
