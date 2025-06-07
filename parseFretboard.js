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
        let stringData = { label };
        let usedFretsOnThisString = []; // Renamed to avoid conflict with outer 'usedFrets'

        const trimmedInput = ffRaw.trim().toLowerCase();

        if (trimmedInput === 'open') {
            stringData.open = true;
        } else if (trimmedInput === 'x') {
            stringData.muted = true;
        } else if (trimmedInput !== '') {
            stringData.pairs = [];
            let items = ffRaw.trim().split(/\s+/);
            let seenFrets = new Set();
            for (let item of items) {
                const lowerItem = item.toLowerCase();
                if (lowerItem === 'open' || lowerItem === 'x') {
                    error = `Cannot mix '${item}' with fret/finger pairs in string ${i + 1}`;
                    break;
                }
                let [fret, ...fingerParts] = item.split(',');
                let finger = fingerParts.join(',') || '';
                if (!/^\d{1,2}$/.test(fret)) {
                    error = `Invalid fret number: '${fret}' in string ${i + 1}`;
                    break;
                }
                let fretNum = parseInt(fret, 10);
                if (fretNum < 1 || fretNum > 99) {
                    error = `Fret number out of range: '${fret}' in string ${i + 1}`;
                    break;
                }
                if (seenFrets.has(fretNum)) {
                    error = `Duplicate fret '${fretNum}' in string ${i + 1}`;
                    break;
                }
                seenFrets.add(fretNum);
                finger = finger.slice(0, 2);
                stringData.pairs.push({ fret: fretNum, finger });
                usedFretsOnThisString.push(fretNum);
            }
            if (error) break; // Stop processing this fretView if an error occurred in pairs
        } else {
            // Empty input, implies no fretted notes, not open, not muted
            stringData.pairs = [];
        }

        parsedStrings.push(stringData);
        allFrets = allFrets.concat(usedFretsOnThisString);
        if (error) break; // Stop processing further strings if an error occurred
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

export function attachFretboardValidation(fretView, onUpdateCallback) {
    // Event delegation: Attach a single listener to fretView
    fretView.addEventListener('input', function(event) {
        // Check if the event target matches our input selectors
        if (event.target.matches('.string-label, .string-frets-fingers, .fret-label-input')) {
            validateAndTriggerUpdate();
        }
    });

    function validateAndTriggerUpdate() {
        const currentResult = parseAndValidateFretboard(fretView);

        if (currentResult.error) {
            console.warn('Validation error:', currentResult.error);
            lastValidResults.delete(fretView); // Clear last valid result on error
        } else {
            const previousResult = lastValidResults.get(fretView);
            if (!(previousResult && JSON.stringify(currentResult) === JSON.stringify(previousResult))) {
                lastValidResults.set(fretView, currentResult);
            }
        }
        
        // Always call the onUpdateCallback if it's a function, so UI can react
        // (e.g. to show/hide canvas based on error, or re-render)
        if (typeof onUpdateCallback === 'function') {
            onUpdateCallback();
        }
    }

    // Run once on attach to perform initial validation and rendering
    validateAndTriggerUpdate();
}
