export function applyText(
    inputBuffer: Float32Array,
    width: number,
    height: number,
    text: string,
    xPercent: number,
    yPercent: number,
    fontFamily: string,
    fontSize: number,
    fontWeight: string,
    fontStyle: string,
    color: string,
    rotation: number,
    align: 'left' | 'center' | 'right',
    baseline: 'top' | 'middle' | 'bottom',
    opacity: number,
    blur: number = 0,
    borderColor?: string,
    borderWidth?: number,
    // isSystemFont // Reserved for future advanced font handling (e.g. FOUT prevention)
): Float32Array {
    // 1. Create a canvas (Offscreen or standard)
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error("Could not get 2D context");
    }

    // 2. Put the input buffer onto the canvas
    const imgData = ctx.createImageData(width, height);
    for (let i = 0; i < inputBuffer.length; i++) {
        imgData.data[i] = inputBuffer[i];
    }
    ctx.putImageData(imgData, 0, 0);

    // 3. Configure Text Style
    ctx.save();

    // Position
    const xPos = (width * xPercent) / 100;
    const yPos = (height * yPercent) / 100;

    ctx.translate(xPos, yPos);
    ctx.rotate((rotation * Math.PI) / 180);

    // Font
    // "italic bold 20px 'Font Name'"
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px "${fontFamily}"`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    // Color & Opacity
    ctx.globalAlpha = opacity / 100;
    ctx.fillStyle = color;

    // Apply Blur if > 0
    if (blur > 0) {
        ctx.filter = `blur(${blur}px)`;
    }

    // Configure Border
    if (borderWidth && borderWidth > 0) {
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor || '#000000';
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
    }

    // 4. Draw Text
    // Split by newlines to support multi-line text
    const lines = text.split('\n');
    const lineHeight = fontSize * 1.2; // Approximate line height

    lines.forEach((line, index) => {
        // ... (lines logic) ...

        const lineOffset = index * lineHeight;

        // Draw Stroke FIRST if we want fill on top, or AFTER if we want stroke on top?
        // Standard is Stroke then Fill for "outside" feel, or Fill then Stroke for standard outline.
        // Let's do Fill then Stroke to ensure legibility of the font face.

        ctx.fillText(line, 0, lineOffset);

        if (borderWidth && borderWidth > 0) {
            ctx.strokeText(line, 0, lineOffset);
        }
    });

    ctx.restore();

    // 5. Get result back
    const resultImgData = ctx.getImageData(0, 0, width, height);
    const resultBuffer = new Float32Array(resultImgData.data.length);
    for (let i = 0; i < resultImgData.data.length; i++) {
        resultBuffer[i] = resultImgData.data[i];
    }

    return resultBuffer;
}
