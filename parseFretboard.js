// parseFretboard.js
// Handles parsing and validation of fretboard input blocks

/**
 * Parses and validates a single fretboard DOM element.
 * Returns an object with parsed values if valid, or {error: ...} if not.
 */
export function parseAndValidateFretboard(fretView) {
    const labelInputs = fretView.querySelectorAll('.string-label');
    const ffInputs = fretView.querySelectorAll('.string-frets-fingers');
    const titleInput = fretView.querySelector('.fret-label-input');

    let parsedStrings = [];
    let allFrets = [];
    let error = null;

    for (let i = 0; i < labelInputs.length; i++) {
        let label = labelInputs[i].value || '';
        if (label.length > 3) label = label.slice(0, 3); // Truncate string label to 3 chars
        let ffRaw = ffInputs[i].value || '';
        let pairs = [];
        let usedFrets = [];
        if (ffRaw.trim() !== '') {
            // Allow multiple spaces, split on whitespace
            let items = ffRaw.trim().split(/\s+/);
            let seenFrets = new Set();
            for (let item of items) {
                if (item.toLowerCase() === 'open') continue;
                let [fret, ...fingerParts] = item.split(',');
                let finger = fingerParts.join(',') || '';
                // Validation: fret must be 1-99, finger can be anything (use only first 2 chars)
                if (!/^\d{1,2}$/.test(fret)) {
                    error = `Invalid fret number: '${fret}' in string ${i+1}`;
                    break;
                }
                let fretNum = parseInt(fret, 10);
                if (fretNum < 1 || fretNum > 99) {
                    error = `Fret number out of range: '${fret}' in string ${i+1}`;
                    break;
                }
                if (seenFrets.has(fretNum)) {
                    error = `Duplicate fret '${fretNum}' in string ${i+1}`;
                    break;
                }
                seenFrets.add(fretNum);
                finger = finger.slice(0, 2);
                pairs.push({ fret: fretNum, finger });
                usedFrets.push(fretNum);
            }
        }
        parsedStrings.push({
            label,
            pairs // Array of {fret, finger}
        });
        allFrets = allFrets.concat(usedFrets);
        if (error) break;
    }

    // Validation: max fret difference (excluding open)
    if (!error && allFrets.length > 0) {
        let minFret = Math.min(...allFrets);
        let maxFret = Math.max(...allFrets);
        if (maxFret - minFret > 9) {
            error = `Maximum fret difference is 9, but got ${maxFret - minFret}`;
        }
    }

    let title = titleInput ? titleInput.value || '' : '';
    if (title.length > 32) title = title.slice(0, 32); // Truncate title to 32 chars

    if (error) {
        return { error };
    } else {
        return {
            title: title,
            strings: parsedStrings
        };
    }
}

/**
 * Attaches event listeners to all relevant fields in a fretView block to run validation on update.
 * If valid, prints values to console.
 */
const lastValidResults = new WeakMap();

export function attachFretboardValidation(fretView) {
    const allInputs = fretView.querySelectorAll('.string-label, .string-frets-fingers, .fret-label-input');
    function validateAndLog() {
        const currentResult = parseAndValidateFretboard(fretView);

        if (currentResult.error) {
            console.warn('Validation error:', currentResult.error);
            lastValidResults.delete(fretView); // Clear last valid result on error
        } else {
            const previousResult = lastValidResults.get(fretView);
            // Stringify for comparison as they are objects
            if (previousResult && JSON.stringify(currentResult) === JSON.stringify(previousResult)) {
                console.log('No effective changes after parsing. Skipping log.');
            } else {
                console.log('Parsed fretboard:', currentResult);
                lastValidResults.set(fretView, currentResult);
            }
        }
    }
    allInputs.forEach(input => {
        input.addEventListener('input', validateAndLog);
    });
    // Run once on attach
    validateAndLog();
}
