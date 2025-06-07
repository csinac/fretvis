// galleryManager.js

let collections = [];
let activeCollectionId = null;
let nextCollectionId = 1;
let newCollectionCounter = 1; // Counter for default collection names like "Collection N"
let domElements = {};
let callbacks = {};
let openFretInputCallback, closeAllFretInputsCallback; // To store callbacks from fretboardBlocks.js
const UNTITLED_COLLECTION_NAME = "untitled collection";
const PRELOAD_FILES = [
    'preload/basic_6_string_guitar_chords.json',
    'preload/basic_4_string_guitar_chords.json'
];

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
        collection.fretboards.forEach(fbData => {
            const fretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState, fbData);
            domElements.fretboardGallery.appendChild(fretView);
            callbacks.attachFretboardValidation(fretView, callbacks.renderDiagramsAndSaveState);
        });

        if (closeAllFretInputsCallback) {
            closeAllFretInputsCallback(domElements.fretboardGallery);
        }
    } else {
        // If collection is empty, add one default fretboard view
        const defaultFretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState);
        domElements.fretboardGallery.appendChild(defaultFretView);
        callbacks.attachFretboardValidation(defaultFretView, callbacks.renderDiagramsAndSaveState);
    }
    callbacks.renderDiagramsAndSaveState(); // Render once after loading all and setting controls
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

    let defaultName = `Collection ${newCollectionCounter}`;
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
    newCollectionCounter++; // Increment for the next new collection
    setActiveCollection(newCollection.id); // This will handle setting activeId, localStorage, and all UI updates.

    // After the new collection with one fretboard is loaded and rendered (via setActiveCollection -> loadCollectionIntoUI),
    // open the inputs for that first fretboard.
    if (openFretInputCallback && domElements.fretboardGallery.firstChild) {
        const firstFretView = domElements.fretboardGallery.querySelector('.fret-view'); // Get the first one
        if (firstFretView) {
            openFretInputCallback(firstFretView);
        }
    }

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
    const newFretboardData = {
        title: '',
        strings: [
            { label: 'E', ffValue: '' }, { label: 'A', ffValue: '' },
            { label: 'D', ffValue: '' }, { label: 'G', ffValue: '' },
            { label: 'B', ffValue: '' }, { label: 'e', ffValue: '' }
        ]
    };
    const fretView = callbacks.createFretView(callbacks.renderDiagramsAndSaveState, newFretboardData);
    // Ensure other fret inputs are closed before adding and opening the new one
    if (closeAllFretInputsCallback) {
        closeAllFretInputsCallback(domElements.fretboardGallery);
    }
    domElements.fretboardGallery.appendChild(fretView);
    if (openFretInputCallback) {
        openFretInputCallback(fretView); // Open the newly added fret view's inputs
    }
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

async function fetchPreloadedCollections() {
    const preloadedCollections = [];
    for (const filePath of PRELOAD_FILES) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.warn(`[GalleryManager] Failed to fetch preloaded collection: ${filePath} - Status: ${response.status}`);
                continue;
            }
            const collectionData = await response.json();
            // Basic validation (can be expanded)
            if (collectionData && collectionData.id && collectionData.name && Array.isArray(collectionData.fretboards)) {
                preloadedCollections.push(collectionData);
            } else {
                console.warn(`[GalleryManager] Invalid format for preloaded collection: ${filePath}`);
            }
        } catch (error) {
            console.error(`[GalleryManager] Error loading or parsing preloaded collection ${filePath}:`, error);
        }
    }
    return preloadedCollections;
}

// Debug function to access collections from console
export function getCollectionsForDebug() {
    return collections;
}

export async function initGallery(config) {
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
    openFretInputCallback = config.openFretInput; // Store the imported function
    closeAllFretInputsCallback = config.closeAllFretInputs; // Store the imported function

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

    const preloaded = await fetchPreloadedCollections();
    const storedCollectionsJSON = localStorage.getItem('fretboardCollections');
    let localStorageCollections = [];
    if (storedCollectionsJSON) {
        try {
            localStorageCollections = JSON.parse(storedCollectionsJSON);
        } catch (e) {
            console.error("[GalleryManager] Error parsing collections from localStorage:", e);
            localStorageCollections = [];
        }
    }

    // Merge preloaded and localStorage collections
    // localStorage takes precedence for matching IDs
    const mergedCollections = [...preloaded];
    localStorageCollections.forEach(storedCollection => {
        const existingIndex = mergedCollections.findIndex(mc => mc.id === storedCollection.id);
        if (existingIndex !== -1) {
            mergedCollections[existingIndex] = storedCollection; // Overwrite with stored version
        } else {
            mergedCollections.push(storedCollection); // Add new from storage
        }
    });
    collections = mergedCollections;

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

    // Always add a new collection on startup and make it active, regardless of preloaded/stored collections.
    // Nullify activeCollectionId before this specific addNewCollection call to prevent saveActiveCollectionState
    // from overwriting a preloaded collection that might have been temporarily set as active.
    activeCollectionId = null;
    addNewCollection();
    // The logic for what to display if collections array was empty before this is now handled by addNewCollection setting itself active.
    // If there were items, addNewCollection still makes the new one active.
    // If activeIdFromStorage was valid and pointed to an existing collection, it would have been loaded into UI,
    // but addNewCollection() will now create a new one and make *that* one active.
    // So, we don't need the explicit loadCollectionIntoUI/renderGalleryList/renderDiagramsAndSaveState here,
    // as addNewCollection -> setActiveCollection handles these for the *newly added* collection.
}

export function handleFretboardChange() {
    saveActiveCollectionState();
    callbacks.renderDiagrams(); // Re-render after saving state
}
