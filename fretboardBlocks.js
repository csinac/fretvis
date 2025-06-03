// fretboardBlocks.js
// Handles creation of fretboard and string input blocks for Fretboard Visualizer

// Utility: Create a new string block
export function createStringBlock(onRemove, labelValue = 'E', fretsFingersValue = '') {
    const stringBlockTemplate = document.getElementById('string-block-template');
    const stringBlock = stringBlockTemplate.content.firstElementChild.cloneNode(true);
    const removeBtn = stringBlock.querySelector('.remove-string-btn');
    const labelInput = stringBlock.querySelector('.string-label');
    const ffInput = stringBlock.querySelector('.string-frets-fingers');
    labelInput.value = labelValue;
    ffInput.value = fretsFingersValue;
    removeBtn.addEventListener('click', () => {
        if (onRemove) onRemove(stringBlock);
    });
    return stringBlock;
}

// Utility: Create a new fretboard view
export function createFretView() {
    const fretViewTemplate = document.getElementById('fret-view-template');
    const fretView = fretViewTemplate.content.firstElementChild.cloneNode(true);
    const stringInputs = fretView.querySelector('.string-inputs');
    const addStringBtn = fretView.querySelector('.add-string-btn');
    const removeFretBtn = fretView.querySelector('.remove-fret-btn');
    const toggleBtn = fretView.querySelector('.toggle-btn');
    const inputsSection = fretView.querySelector('.fret-view-inputs');

    // Standard tuning labels for guitar (E A D G B e)
    const standardLabels = ['E', 'A', 'D', 'G', 'B', 'e'];
    for(let i=0; i<6; i++) {
        stringInputs.appendChild(createStringBlock(block => block.remove(), standardLabels[i]));
    }

    // Add string logic
    addStringBtn.addEventListener('click', () => {
        stringInputs.appendChild(createStringBlock(block => block.remove()));
    });

    // Remove fretboard logic
    removeFretBtn.addEventListener('click', () => {
        fretView.remove();
    });

    // Toggle input section
    toggleBtn.addEventListener('click', () => {
        if(inputsSection.style.display === 'none') {
            inputsSection.style.display = '';
            toggleBtn.textContent = 'Hide Inputs';
        } else {
            inputsSection.style.display = 'none';
            toggleBtn.textContent = 'Show Inputs';
        }
    });

    return fretView;
}
