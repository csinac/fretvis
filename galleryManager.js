// galleryManager.js

let collections = [];
let activeCollectionId = null;
let nextCollectionId = 1;

let domElements = {};
let callbacks = {};

function generateCollectionId() {
    return `collection-${nextCollectionId++}`;
}

function saveActiveCollectionState() {
    if (!activeCollectionId) return;
    const activeCollection = collections.find(c => c.id === activeCollectionId);
    if (!activeCollection) return;

    activeCollection.fretboards = [];
    const fretViews = domElements.fretboardGallery.querySelectorAll('.fret-view');
    fretViews.forEach(fretView => {
        const titleInput = fretView.querySelector('.fret-label-input');
        const stringBlocks = fretView.querySelectorAll('.string-block');
        let stringsData = [];
        stringBlocks.forEach(sb => {
            stringsData.push({
                label: sb.querySelector('.string-label').value,
                ffValue: sb.querySelector('.string-frets-fingers').value
            });
        });
        activeCollection.fretboards.push({
            title: titleInput ? titleInput.value : '',
            strings: stringsData
        });
    });
}

function loadCollectionIntoUI(collectionId) {
    const collection = collections.find(c => c.id === collectionId);
    if (!collection) return;

    domElements.fretboardGallery.innerHTML = ''; // Clear current fretboards

    if (collection.fretboards && collection.fretboards.length > 0) {
        collection.fretboards.forEach(fretboardData => {
            const fretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState, fretboardData);
            domElements.fretboardGallery.appendChild(fretView);
            callbacks.attachFretboardValidation(fretView, callbacks.renderDiagramsAndSaveState);
        });
    } else {
        const defaultFretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState);
        domElements.fretboardGallery.appendChild(defaultFretView);
        callbacks.attachFretboardValidation(defaultFretView, callbacks.renderDiagramsAndSaveState);
    }
    callbacks.renderDiagrams(); // Render once after loading all
}

function switchCollection(collectionId) {
    if (activeCollectionId === collectionId) return;
    saveActiveCollectionState();
    activeCollectionId = collectionId;
    loadCollectionIntoUI(collectionId);
    renderGalleryList();
    domElements.removeCollectionBtn.disabled = collections.length <= 1;
}

function renderGalleryList() {
    domElements.collectionList.innerHTML = '';
    collections.forEach(collection => {
        const li = document.createElement('li');
        li.textContent = collection.name;
        li.dataset.collectionId = collection.id;
        if (collection.id === activeCollectionId) {
            li.classList.add('active');
        }
        li.addEventListener('click', () => switchCollection(collection.id));
        domElements.collectionList.appendChild(li);
    });
    domElements.removeCollectionBtn.disabled = collections.length <= 1 || !activeCollectionId;
}

function addNewCollection() {
    saveActiveCollectionState();
    const newId = generateCollectionId();
    const newCollectionName = `Collection ${collections.length + 1}`;
    const newCollection = {
        id: newId,
        name: newCollectionName,
        fretboards: [{
            title: '', // Default title for the first fretboard in a new collection
            strings: [
                { label: 'E', ffValue: '' }, { label: 'A', ffValue: '' },
                { label: 'D', ffValue: '' }, { label: 'G', ffValue: '' },
                { label: 'B', ffValue: '' }, { label: 'e', ffValue: '' }
            ]
        }]
    };
    collections.push(newCollection);
    activeCollectionId = newId;
    loadCollectionIntoUI(newId);
    renderGalleryList();
}

function removeActiveCollection() {
    if (!activeCollectionId || collections.length <= 1) {
        alert("Cannot remove the last collection.");
        return;
    }
    const activeCollectionName = collections.find(c => c.id === activeCollectionId).name;
    if (!confirm(`Are you sure you want to delete the collection '${activeCollectionName}'?`)) {
        return;
    }
    collections = collections.filter(c => c.id !== activeCollectionId);
    let newActiveId = null;
    if (collections.length > 0) {
        newActiveId = collections[0].id;
    }
    activeCollectionId = null;
    if (newActiveId) {
        switchCollection(newActiveId);
    } else {
        domElements.fretboardGallery.innerHTML = '';
        renderGalleryList();
    }
}

export function addFretboardToActiveCollection() {
    if (!activeCollectionId) return;
    const fretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState);
    domElements.fretboardGallery.appendChild(fretView);
    callbacks.attachFretboardValidation(fretView, callbacks.renderDiagramsAndSaveState);
    callbacks.renderDiagramsAndSaveState(); // Render and save state
}

export function initGallery(config) {
    domElements = {
        fretboardGallery: config.fretboardGallery,
        addCollectionBtn: config.addCollectionBtn,
        removeCollectionBtn: config.removeCollectionBtn,
        collectionList: config.collectionList
    };
    callbacks = {
        createFretView: config.createFretView,
        attachFretboardValidation: config.attachFretboardValidation,
        renderDiagrams: config.renderDiagrams, // For rendering only
        renderDiagramsAndSaveState: config.renderDiagramsAndSaveState // For actions that also need to save
    };

    domElements.addCollectionBtn.addEventListener('click', addNewCollection);
    domElements.removeCollectionBtn.addEventListener('click', removeActiveCollection);

    if (collections.length === 0) {
        addNewCollection();
    } else {
        if (!activeCollectionId && collections.length > 0) {
            activeCollectionId = collections[0].id;
        }
        loadCollectionIntoUI(activeCollectionId);
        renderGalleryList();
    }
}

// This function will be called by index.html when inputs within a fretboard change,
// or when a string/fretboard is removed from the UI directly.
export function handleFretboardChange() {
    saveActiveCollectionState();
    callbacks.renderDiagrams(); // Re-render after saving state
}
