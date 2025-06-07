// fretboardBlocks.js
// Handles creation of fretboard and string input blocks for Fretboard Visualizer

// Utility: Create a new string block
export function createStringBlock(onRemoveAction, // This is now specifically for the remove action's DOM manipulation
                               onActionRequiringRender, // This is for triggering global re-render/save
                               labelValue = 'E', 
                               fretsFingersValue = '') {
    const stringBlockTemplate = document.getElementById('string-block-template');
    const stringBlock = stringBlockTemplate.content.firstElementChild.cloneNode(true);
    const removeBtn = stringBlock.querySelector('.remove-string-btn');
    const labelInput = stringBlock.querySelector('.string-label');
    const ffInput = stringBlock.querySelector('.string-frets-fingers');
    labelInput.value = labelValue;
    ffInput.value = fretsFingersValue;
    removeBtn.addEventListener('click', () => {
        if (onRemoveAction) onRemoveAction(stringBlock); // e.g., block.remove()
        if (onActionRequiringRender) onActionRequiringRender(); // Trigger global update
    });
    return stringBlock;
}

// Helper to open a specific fret input section
export function openFretInput(fretViewElement) {
    const inputsSection = fretViewElement.querySelector('.fret-view-inputs');
    const toggleBtn = fretViewElement.querySelector('.toggle-btn');
    if (inputsSection && toggleBtn) {
        inputsSection.style.display = '';
        toggleBtn.textContent = 'Hide Inputs';
    }
}

// Helper to close a specific fret input section
export function closeFretInput(fretViewElement) {
    const inputsSection = fretViewElement.querySelector('.fret-view-inputs');
    const toggleBtn = fretViewElement.querySelector('.toggle-btn');
    if (inputsSection && toggleBtn) {
        inputsSection.style.display = 'none';
        toggleBtn.textContent = 'Show Inputs';
    }
}

// Helper to close all fret input sections in the gallery
export function closeAllFretInputs(galleryElement) {
    if (!galleryElement) return;
    const fretViews = galleryElement.querySelectorAll('.fret-view');
    fretViews.forEach(fv => closeFretInput(fv));
}

// Utility: Create a new fretboard view
export function createFretView(onActionRequiringRender, initialData = null) {
    const fretViewTemplate = document.getElementById('fret-view-template');
    const fretView = fretViewTemplate.content.firstElementChild.cloneNode(true);
    const stringInputs = fretView.querySelector('.string-inputs');
    const addStringBtn = fretView.querySelector('.add-string-btn');
    const removeFretBtn = fretView.querySelector('.remove-fret-btn');
    const toggleBtn = fretView.querySelector('.toggle-btn');
    const inputsSection = fretView.querySelector('.fret-view-inputs');
    const titleInput = fretView.querySelector('.fret-label-input');

    // Default to closed
    inputsSection.style.display = 'none';
    toggleBtn.textContent = 'Show Inputs';

    if (initialData && initialData.title) {
        titleInput.value = initialData.title;
    }

    if (initialData && initialData.strings && initialData.strings.length > 0) {
        initialData.strings.forEach(stringData => {
            stringInputs.appendChild(createStringBlock(
                (block) => block.remove(), // onRemoveAction: just remove the DOM element
                onActionRequiringRender,    // onActionRequiringRender: for global update
                stringData.label,
                stringData.ffValue
            ));
        });
    } else if (!initialData) { // Only add standard tuning if NOT loading data (i.e., it's a truly new fretboard)
        const standardLabels = ['E', 'A', 'D', 'G', 'B', 'e'];
        for(let i=0; i<6; i++) {
            stringInputs.appendChild(createStringBlock(
                (block) => block.remove(), // onRemoveAction
                onActionRequiringRender,    // onActionRequiringRender
                standardLabels[i]
            ));
        }
    }
    // If initialData is present but has no strings, it will start empty.

    // Add string logic
    addStringBtn.addEventListener('click', () => {
        // When adding a new string manually, use default values
        stringInputs.appendChild(createStringBlock(
            (block) => block.remove(), // onRemoveAction
            onActionRequiringRender     // onActionRequiringRender
        ));
        if (onActionRequiringRender) onActionRequiringRender(); // Update after adding the new string block
    });

    // Remove fretboard logic
    removeFretBtn.addEventListener('click', () => {
        fretView.remove();
        if (onActionRequiringRender) onActionRequiringRender();
    });

    // Toggle input section with accordion behavior
    toggleBtn.addEventListener('click', () => {
        const galleryElement = fretView.closest('.fretboard-gallery'); // Find the main gallery container
        if (inputsSection.style.display === 'none') { // If currently closed, about to open
            if (galleryElement) {
                closeAllFretInputs(galleryElement); // Close all others first
            }
            openFretInput(fretView); // Then open this one
        } else { // If currently open, about to close
            closeFretInput(fretView); // Just close this one
        }
    });

    return fretView;
}
