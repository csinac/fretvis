// renderFretboard.js
// Draws the guitar fretboard on a canvas based on parsed data, handedness, and viewpoint

// --- Palette for all colors and sizes ---
export const palette = {
    background: '#f0f0f0',    // Light gray
    fretboard: '#ffffff',     // White
    fret: '#cccccc',          // Light gray (fret lines)
    string: '#000000',        // Black
    marker: '#ff0000',        // Red (finger position markers)
    markerText: '#ffffff',    // White (text on finger markers)
    label: '#000000',         // Black (string labels, title)
    open: '#555555',          // Dark gray (open string 'O' text & circle)
    muted: '#555555',         // Dark gray (muted string 'X' text)
    nut: '#000000',           // Black
    fretNumber: '#000000',    // Black
    font: '16px sans-serif',
    padding: 40,
    fretNumberFont: 'bold 18px sans-serif',
    stringLabelFont: 'bold 18px sans-serif',
    baseFretWidth: 100, 
    fretWidthRatio: 0.94, 
    minFretsToShow: 5
};

// --- Calculate fret widths (geometric progression) ---
function getFretWidths(numFrets, baseFretWidth, ratio) {
    let widths = [];
    let w = baseFretWidth;
    for (let i = 0; i < numFrets; i++) {
        widths.push(w);
        w *= ratio;
    }
    return widths;
}

// --- Main rendering function ---
export function renderFretboard({
    canvas,
    data, // { title, strings: [{label, pairs?, open?, muted?}, ...] }
    handedness = 'right', // or 'left'
    viewpoint = 'top',    // or 'front'
}) {
    if (!canvas || !data || !data.strings || data.strings.length === 0) {
        if(canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        return;
    }
    const ctx = canvas.getContext('2d');
    const numStrings = data.strings.length;

    const isLeftHanded = handedness === 'left';
    const isFrontView = viewpoint === 'front';

    // Effective strings array for drawing based on viewpoint
    const displayStrings = isFrontView ? [...data.strings].reverse() : data.strings;

    // Determine fret range to display (based on original data, not displayStrings)
    let allFrettedNotes = [];
    data.strings.forEach(s => { // Use original data for fret range calculation
        if (s.pairs) s.pairs.forEach(p => allFrettedNotes.push(p.fret));
    });

    let minDisplayFret = 1;
    let maxDisplayFret = palette.minFretsToShow;
    if (allFrettedNotes.length > 0) {
        minDisplayFret = Math.min(...allFrettedNotes);
        maxDisplayFret = Math.max(...allFrettedNotes);
        if (maxDisplayFret - minDisplayFret + 1 < palette.minFretsToShow) {
            maxDisplayFret = minDisplayFret + palette.minFretsToShow - 1;
        }
    }
    if (allFrettedNotes.length === 0) {
        minDisplayFret = 1;
        maxDisplayFret = palette.minFretsToShow;
    }

    const numFretsToDraw = maxDisplayFret - minDisplayFret + 1;
    
    // Get base fret widths (always LTR for calculation)
    let baseFretWidths = getFretWidths(numFretsToDraw, palette.baseFretWidth, palette.fretWidthRatio);
    // This array corresponds to frets from minDisplayFret to maxDisplayFret
    // If left-handed, we will iterate through this differently or use it to calculate positions from right edge.

    const fretboardWidth = baseFretWidths.reduce((a, b) => a + b, 0);
    const fretboardHeight = (numStrings - 1) * 80;
    
    // Add extra space for string labels/markers outside the core fretboard area
    const sidePadding = 35; 
    const totalWidth = fretboardWidth + palette.padding * 2 + sidePadding * 2;
    const totalHeight = fretboardHeight + palette.padding * 2;

    canvas.width = totalWidth;
    canvas.height = totalHeight;

    ctx.fillStyle = palette.background;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    const fbX = palette.padding + sidePadding;
    const fbY = palette.padding;

    ctx.fillStyle = palette.fretboard;
    ctx.fillRect(fbX, fbY, fretboardWidth, fretboardHeight);

    // Draw frets (vertical lines)
    let currentX = fbX;
    // Draw the first vertical line (nut or lowest fret wire)
    ctx.lineWidth = (minDisplayFret === 1) ? 6 : 2;
    ctx.strokeStyle = (minDisplayFret === 1) ? palette.nut : palette.fret;
    ctx.beginPath();
    ctx.moveTo(isLeftHanded ? fbX + fretboardWidth : fbX, fbY);
    ctx.lineTo(isLeftHanded ? fbX + fretboardWidth : fbX, fbY + fretboardHeight);
    ctx.stroke();

    // Draw subsequent fret wires
    ctx.lineWidth = 2;
    ctx.strokeStyle = palette.fret;
    currentX = fbX; // Reset for LTR accumulation
    for (let i = 0; i < numFretsToDraw; i++) {
        const fretWidth = baseFretWidths[i]; // Width of the current logical fret slot
        if (isLeftHanded) {
            // For left-handed, draw from right to left
            // The (i)-th fret wire (after nut) is at (fbX + fretboardWidth) - sum of widths up to (i-1)th reversed fret
            let xPos = fbX + fretboardWidth;
            for(let j=0; j < i +1; j++) xPos -= baseFretWidths[numFretsToDraw - 1 - j];
            ctx.beginPath();
            ctx.moveTo(xPos, fbY);
            ctx.lineTo(xPos, fbY + fretboardHeight);
            ctx.stroke();
        } else {
            currentX += fretWidth;
            ctx.beginPath();
            ctx.moveTo(currentX, fbY);
            ctx.lineTo(currentX, fbY + fretboardHeight);
            ctx.stroke();
        }
    }
    
    // Draw strings (horizontal lines)
    for (let s = 0; s < numStrings; s++) {
        const stringY = fbY + s * 80; // s is visual index from top of canvas
        const stringData = displayStrings[s]; // Use potentially reversed string data due to viewpoint
        
        // Adjust string thickness based on visual position and viewpoint
        const visualStringIndexForThickness = isFrontView ? (numStrings - 1 - s) : s;
        ctx.lineWidth = Math.max(1, 4 - visualStringIndexForThickness * 0.5); 
        ctx.strokeStyle = palette.string;
        ctx.beginPath();
        ctx.moveTo(fbX, stringY);
        ctx.lineTo(fbX + fretboardWidth, stringY);
        ctx.stroke();

        // String label
        ctx.font = palette.stringLabelFont;
        ctx.fillStyle = palette.label;
        ctx.textAlign = isLeftHanded ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        const labelX = isLeftHanded ? (fbX + fretboardWidth + 10) : (fbX - 10);
        ctx.fillText(stringData.label, labelX, stringY);
    }

    // Draw fret numbers
    ctx.font = palette.fretNumberFont;
    ctx.fillStyle = palette.fretNumber;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    let visualAccumulatedWidth = 0; // Tracks width from the left edge of the fretboard drawing area (fbX)
    for (let i = 0; i < numFretsToDraw; i++) { // i is the visual index from left to right
        let fretNumToDisplay;
        if (isLeftHanded) {
            fretNumToDisplay = maxDisplayFret - i; // For LH, leftmost visual fret is maxDisplayFret
        } else { // Right-handed
            fretNumToDisplay = minDisplayFret + i;
        }
        // The i-th visual fret slot from the left has width baseFretWidths[i] for BOTH LH and RH views,
        // because the fret wires for LH are already drawn to represent the physical mirroring.
        const currentVisualFretWidth = baseFretWidths[i];

        const fretCenterX = fbX + visualAccumulatedWidth + currentVisualFretWidth / 2;
        ctx.fillText(fretNumToDisplay.toString(), fretCenterX, fbY + fretboardHeight + 10);
        visualAccumulatedWidth += currentVisualFretWidth;
    }

    // Draw markers (open/muted/fretted)
    for (let s = 0; s < numStrings; s++) {
        const stringY = fbY + s * 80; // s is visual index from top of canvas
        const stringData = displayStrings[s]; // Use potentially reversed string data

        const openMutedMarkerX = isLeftHanded ? (fbX + fretboardWidth + sidePadding/2) : (fbX - sidePadding/2);

        if (stringData.open) {
            ctx.fillStyle = palette.open;
            ctx.beginPath();
            ctx.arc(openMutedMarkerX, stringY, 12, 0, 2 * Math.PI);
            ctx.fill();
            ctx.font = 'bold 16px sans-serif'; // Make 'O' bold and fit circle
            ctx.fillStyle = palette.markerText; // White text on dark gray circle
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('O', openMutedMarkerX, stringY);
        } else if (stringData.muted) {
            ctx.font = 'bold 24px sans-serif';
            ctx.fillStyle = palette.muted;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('X', openMutedMarkerX, stringY);
        } else if (stringData.pairs && stringData.pairs.length > 0) {
            stringData.pairs.forEach(pair => {
                if (pair.fret < minDisplayFret || pair.fret > maxDisplayFret) return;

                let visualSlotIndex; // 0-based index of the visual slot from the left
                if (isLeftHanded) {
                    visualSlotIndex = maxDisplayFret - pair.fret;
                } else { // Right-handed
                    visualSlotIndex = pair.fret - minDisplayFret;
                }

                let markerSlotAccumulatedWidth = 0;
                for (let k = 0; k < visualSlotIndex; k++) {
                    // Accumulate widths of visual slots to the left of the target slot.
                    // baseFretWidths[k] is the width of the k-th visual slot from the left.
                    markerSlotAccumulatedWidth += baseFretWidths[k];
                }
                const targetSlotWidth = baseFretWidths[visualSlotIndex];
                let markerX = fbX + markerSlotAccumulatedWidth + targetSlotWidth / 2;

                ctx.beginPath();
                ctx.arc(markerX, stringY, 15, 0, 2 * Math.PI);
                ctx.fillStyle = palette.marker;
                ctx.fill();

                ctx.font = palette.font;
                ctx.fillStyle = palette.markerText;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(pair.finger.toString(), markerX, stringY);
            });
        }
    }

    // Draw title (top centered)
    if (data.title && data.title.trim() !== '') {
        ctx.font = 'bold 22px sans-serif';
        ctx.fillStyle = palette.label;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillText(data.title, totalWidth / 2, 10);
    }
}
