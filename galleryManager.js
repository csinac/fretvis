// galleryManager.js

let collections = [];
let activeCollectionId = null;
let nextCollectionId = 1;
let domElements = {};
let callbacks = {};
const UNTITLED_COLLECTION_NAME = "untitled collection";

// function generateCollectionId() { // Using Date.now().toString() for simplicity and uniqueness
//     return `collection-${nextCollectionId++}`;
// }

function saveActiveCollectionState() {
    if (!activeCollectionId) return;
    const activeCollection = collections.find(c => c.id === activeCollectionId);
    if (!activeCollection) return;

    // Save collection name (title)
    if (activeCollection && domElements.collectionTitleInput) {
        const rawTitle = domElements.collectionTitleInput.value;
        activeCollection.name = rawTitle.trim() === "" ? UNTITLED_COLLECTION_NAME : rawTitle.trim();
    }
    if (domElements.handednessRadios) {
        activeCollection.handedness = document.querySelector('input[name="handedness"]:checked').value;
    }
    if (domElements.viewpointRadios) {
        activeCollection.viewpoint = document.querySelector('input[name="viewpoint"]:checked').value;
    }

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

    // Load collection name (title) into input and main header
    if (domElements.collectionTitleInput) {
        domElements.collectionTitleInput.value = collection.name;
    }
    if (domElements.mainContentHeaderTitle) {
        domElements.mainContentHeaderTitle.textContent = collection.name;
    }

    // Load and set handedness and viewpoint
    if (domElements.handednessRadios && collection.handedness) {
        document.querySelector(`input[name="handedness"][value="${collection.handedness}"]`).checked = true;
    }
    if (domElements.viewpointRadios && collection.viewpoint) {
        document.querySelector(`input[name="viewpoint"][value="${collection.viewpoint}"]`).checked = true;
    }

    domElements.fretboardGallery.innerHTML = ''; // Clear current fretboards

    if (collection.fretboards && collection.fretboards.length > 0) {
        collection.fretboards.forEach(fretboardData => {
            const fretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState, fretboardData);
            domElements.fretboardGallery.appendChild(fretView);
            callbacks.attachFretboardValidation(fretView, callbacks.renderDiagramsAndSaveState);
        });
    } else {
        // If collection is empty, add one default fretboard view
        const defaultFretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState);
        domElements.fretboardGallery.appendChild(defaultFretView);
        callbacks.attachFretboardValidation(defaultFretView, callbacks.renderDiagramsAndSaveState);
    }
    callbacks.renderDiagrams(); // Render once after loading all and setting controls
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
        li.textContent = collection.name; // Use the editable name
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
    saveActiveCollectionState(); // Save current active collection's state before adding a new one.

    let defaultName = `Collection ${collections.length + 1}`;
    if (defaultName.trim() === "") {
        defaultName = UNTITLED_COLLECTION_NAME;
    }

    const newCollectionId = Date.now().toString();

    const newCollection = {
        id: newCollectionId,
        name: defaultName,
        handedness: 'right',
        viewpoint: 'top',
        fretboards: [{
            title: '',
            strings: [
                { label: 'E', ffValue: '' }, { label: 'A', ffValue: '' },
                { label: 'D', ffValue: '' }, { label: 'G', ffValue: '' },
                { label: 'B', ffValue: '' }, { label: 'e', ffValue: '' }
            ]
        }]
    };

    collections.push(newCollection);
    setActiveCollection(newCollection.id); // This will handle setting activeId, localStorage, and all UI updates.

    // Enable/disable remove button based on new collection count
    if (domElements.removeCollectionBtn) {
        domElements.removeCollectionBtn.disabled = collections.length <= 1;
    }
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

function setActiveCollection(collectionId) {
    const collectionExists = collections.find(c => c.id === collectionId);
    if (!collectionExists) {
        console.error('[GalleryManager] setActiveCollection: Attempted to set active to non-existent collection ID:', collectionId);
        return;
    }

    activeCollectionId = collectionId;
    localStorage.setItem('activeFretboardCollectionId', activeCollectionId);
    
    loadCollectionIntoUI(activeCollectionId); // Loads data into inputs, sets main header
    renderGalleryList();                      // Re-renders the list, should highlight the new activeId
    callbacks.renderDiagramsAndSaveState();   // Renders fretboards
}

export function addFretboardToActiveCollection() {
    if (!activeCollectionId) return;
    const fretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState);
    domElements.fretboardGallery.appendChild(fretView);
    callbacks.attachFretboardValidation(fretView, callbacks.renderDiagramsAndSaveState);
    callbacks.renderDiagramsAndSaveState(); // Render and save state
}

export function updateActiveCollectionName(newName) {
    if (!activeCollectionId) return;
    const activeCollection = collections.find(c => c.id === activeCollectionId);
    if (activeCollection) {
        activeCollection.name = newName;
        renderGalleryList(); // Update the name in the list
        // No need to call saveActiveCollectionState here as it's called by input event which also calls this.
        // Or, if this is the primary way to change name, it should call save.
        // For now, assume saveActiveCollectionState will be called by the input event handler in index.html after this.
    }
}

export function updateActiveCollectionVisualControls(controlType, value) {
    if (!activeCollectionId) return;
    const activeCollection = collections.find(c => c.id === activeCollectionId);
    if (activeCollection) {
        if (controlType === 'handedness') {
            activeCollection.handedness = value;
        } else if (controlType === 'viewpoint') {
            activeCollection.viewpoint = value;
        }
        saveActiveCollectionState(); // Save the change
        callbacks.renderDiagrams();  // Re-render with new settings
    }
}

export function initGallery(config) {
    domElements = {
        fretboardGallery: config.fretboardGallery,
        addCollectionBtn: config.addCollectionBtn,
        removeCollectionBtn: config.removeCollectionBtn,
        collectionList: config.collectionList,
        collectionTitleInput: config.collectionTitleInput, 
        handednessRadios: config.handednessRadios,       
        viewpointRadios: config.viewpointRadios,         
        mainContentHeaderTitle: config.mainContentHeaderTitle // New DOM element for main title
    };
    callbacks = {
        createFretView: config.createFretView,
        attachFretboardValidation: config.attachFretboardValidation,
        renderDiagrams: config.renderDiagrams,
        renderDiagramsAndSaveState: config.renderDiagramsAndSaveState
    };

    domElements.addCollectionBtn.addEventListener('click', addNewCollection);
    domElements.removeCollectionBtn.addEventListener('click', removeActiveCollection);

    if (domElements.collectionTitleInput) {
        domElements.collectionTitleInput.addEventListener('input', (e) => {
            const rawValue = e.target.value;
            const effectiveName = rawValue.trim() === "" ? UNTITLED_COLLECTION_NAME : rawValue.trim();

            updateActiveCollectionName(effectiveName); // Updates activeCollection.name and renders gallery list
            
            if (domElements.mainContentHeaderTitle) {
                domElements.mainContentHeaderTitle.textContent = effectiveName;
            }
            // saveActiveCollectionState will be called, and it will use the same logic 
            // to ensure activeCollection.name is set to effectiveName.
            saveActiveCollectionState(); 
        });
    }

    const storedCollectionsJSON = localStorage.getItem('fretboardCollections');
    if (storedCollectionsJSON) {
        collections = JSON.parse(storedCollectionsJSON);
    } else {
        collections = []; // Initialize as empty array if nothing in storage
    }

    let activeIdFromStorage = localStorage.getItem('activeFretboardCollectionId');
    if (activeIdFromStorage === "null" || activeIdFromStorage === "undefined") {
        activeIdFromStorage = null; // Treat "null"/"undefined" strings as actual null
    }

    if (activeIdFromStorage && collections.find(c => c.id === activeIdFromStorage)) {
        activeCollectionId = activeIdFromStorage;
    } else if (collections.length > 0) {
        activeCollectionId = collections[0].id;
        localStorage.setItem('activeFretboardCollectionId', activeCollectionId); // Persist this default choice
    } else {
        activeCollectionId = null;
    }

    if (collections.length > 0) {
        const maxNumericIdPart = collections.reduce((max, c) => {
            const idStr = c.id.toString();
            // Try to extract a number if it's like 'collection-123' or just '123'
            // For Date.now() strings, this will likely result in NaN or the full number.
            const numericPart = parseInt(idStr.substring(idStr.lastIndexOf('-') + 1), 10);
            return Math.max(max, (isNaN(numericPart) ? 0 : numericPart));
        }, 0);
        nextCollectionId = maxNumericIdPart + 1; 
    } else {
        nextCollectionId = 1;
    }

    if (collections.length === 0) {
        addNewCollection();
    } else {
        loadCollectionIntoUI(activeCollectionId);
        renderGalleryList(); 
        callbacks.renderDiagramsAndSaveState();
    }
}

export function handleFretboardChange() {
    saveActiveCollectionState();
    callbacks.renderDiagrams(); // Re-render after saving state
}
