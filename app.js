// Import theme styles
import { themes } from './themes.js';


// Import site configuration management
import { createSiteConfig, updateSiteConfig, getSiteConfig } from './config.js';

// Initialize site configuration
let siteConfig = createSiteConfig();

// DOM Elements
const siteNameInput = document.getElementById('siteName');
const themeSelect = document.getElementById('theme');
const mainTitleInput = document.getElementById('mainTitle');
const mainContentInput = document.getElementById('mainContent');
const mainImagesDiv = document.getElementById('mainImages'); // Add new DOM element reference
const addMainImageButton = document.getElementById('addMainImage'); // Add new DOM element reference
const pagesListDiv = document.getElementById('pagesList');
const addPageButton = document.getElementById('addPage');
const generateButton = document.getElementById('generateSite');
const previewFrame = document.getElementById('previewFrame');

// Load available themes
async function loadThemes() {
    try {
        const themeNames = Object.keys(themes);

        themeSelect.innerHTML = themeNames
            .map(themeName =>
                `<option value="${themeName}">${themeName.charAt(0).toUpperCase() + themeName.slice(1)}</option>`
            )
            .join('');
    } catch (error) {
        console.error('Error loading themes:', error);
    }
}

// Event Listeners
siteNameInput.addEventListener('input', handleInputChange);
themeSelect.addEventListener('change', handleInputChange);
mainTitleInput.addEventListener('input', handleInputChange);
mainContentInput.addEventListener('input', handleInputChange);
addMainImageButton.addEventListener('click', addMainImage);
addPageButton.addEventListener('click', addNewPage);
generateButton.addEventListener('click', generateSite);

// Load themes when the page loads
loadThemes();

function saveToLocalStorage() {
    localStorage.setItem('siteConfig', JSON.stringify(siteConfig));
}

// Update site configuration
let inputTimer; 
function handleInputChange() {
    clearTimeout(inputTimer); // Clear previous timer

    inputTimer = setTimeout(() => {
        saveState(); // Save state only after user stops typing
        siteConfig = updateSiteConfig(siteConfig, {
            name: siteNameInput.value,
            theme: themeSelect.value,
            mainTitle: mainTitleInput.value,
            mainContent: mainContentInput.value
        });
        saveToLocalStorage();
        updatePreview();
    }, 500); 
}

// Add new page
function addNewPage() {
    saveState();
    const pageId = Date.now();
    const page = {
        id: pageId,
        title: 'New Page',
        content: '',
        images: [] // Each image will be an object with url and title properties
    };

    siteConfig.pages.push(page);
    renderPages();
    updatePreview();
}

// Render pages list
function renderPages() {
    pagesListDiv.innerHTML = '';

    siteConfig.pages.forEach(page => {
        const pageElement = document.createElement('div');
        pageElement.className = 'page-item';
        pageElement.draggable = true;

        // Set the page ID as a data attribute
        pageElement.dataset.pageId = page.id;


        const dragHandle = document.createElement('div');
        dragHandle.className = 'drag-handle';
        dragHandle.innerHTML = '⋮⋮';

        const pageContent = document.createElement('div');
        pageContent.className = 'content-area';
        pageContent.innerHTML = `
    <input type="text" value="${page.title}" 
           onchange="updatePageTitle(${page.id}, this.value)">
    <textarea placeholder="Page content (Markdown supported)..." 
              onchange="updatePageContent(${page.id}, this.value)">${page.content}</textarea>
    ${typeof page.galleryTitle !== 'undefined' ? `
    <div class="gallery-title-input">
        <label for="galleryTitle-${page.id}">${page.title} images:</label>
        <input type="text" value="${page.galleryTitle}" 
               placeholder="Gallery title" 
               onchange="updateGalleryTitle(${page.id}, this.value)">
    </div>
    ` : ''}
    <div class="image-list" id="images-${page.id}">
        ${generateImageInputs(page)}
    </div>
`;

        const addImageButton = document.createElement('button');
        addImageButton.className = 'btn';
        addImageButton.textContent = 'Add image';
        addImageButton.onclick = () => addImageInput(page.id);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'btn';
        deleteButton.textContent = 'Delete page';
        deleteButton.onclick = () => deletePage(page.id);

        pageElement.appendChild(dragHandle);
        pageElement.appendChild(pageContent);
        pageElement.appendChild(addImageButton);
        pageElement.appendChild(deleteButton);
        pagesListDiv.appendChild(pageElement);

        // Add drag and drop event listeners
        pageElement.addEventListener('dragstart', (e) => {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', page.id);
        });

        pageElement.addEventListener('dragend', (e) => {
            e.target.classList.remove('dragging');
        });
    });

    // Add container drag and drop handlers
    pagesListDiv.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggingElement = document.querySelector('.dragging');
        if (!draggingElement) return;

        const siblings = [...pagesListDiv.querySelectorAll('.page-item:not(.dragging)')];
        const nextSibling = siblings.find(sibling => {
            const box = sibling.getBoundingClientRect();
            const offset = e.clientY - box.top - box.height / 2;
            return offset < 0;
        });

        pagesListDiv.insertBefore(draggingElement, nextSibling);
    });

    pagesListDiv.addEventListener('drop', (e) => {
        e.preventDefault();
        const pageElements = [...pagesListDiv.querySelectorAll('.page-item')];
        const newPages = pageElements.map(el => {
            const pageId = parseInt(el.dataset.pageId, 10);
            return siteConfig.pages.find(p => p.id === pageId);
        });
        siteConfig.pages = newPages;
        updatePreview();
    });
}

// Generate image inputs for a page
function generateImageInputs(page) {
    return page.images.map((image, index) => `
        <div class="image-input">
            <input type="text" value="${typeof image === 'string' ? image : image?.url || ''}" 
                   placeholder="Image url"
                   onchange="updateImageUrl(${page.id}, ${index}, this.value)">
            <input type="text" value="${typeof image === 'string' ? '' : image?.title || ''}" 
                   placeholder="Image title"
                   onchange="updateImageTitle(${page.id}, ${index}, this.value)">
            <button class="btn remove" onclick="removeImage(${page.id}, ${index})">×</button>
        </div>
    `).join('');
}

// Add new image input
function addImageInput(pageId) {
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page) {
        page.images.push({ url: '', title: '' });
        // If a gallery title doesn’t exist for this page, add it.
        if (typeof page.galleryTitle === 'undefined') {
            page.galleryTitle = '';
        }
        renderPages();
        updatePreview();
    }
}

//Update gallery title
function updateGalleryTitle(pageId, newTitle) {
    saveState();
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page) {
        page.galleryTitle = newTitle;
        updatePreview();
    }
}


// Update image URL
function updateImageUrl(pageId, index, newUrl) {
    saveState();
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page && page.images[index] !== undefined) {
        const currentImage = page.images[index];
        page.images[index] = typeof currentImage === 'string'
            ? { url: newUrl, title: '' }
            : { ...currentImage, url: newUrl };
        updatePreview();
    }
}

// Update image title
function updateImageTitle(pageId, index, newTitle) {
    saveState();
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page && page.images[index] !== undefined) {
        const currentImage = page.images[index];
        page.images[index] = typeof currentImage === 'string'
            ? { url: currentImage, title: newTitle }
            : { ...currentImage, title: newTitle };
        updatePreview();
    }
}

// Remove image
function removeImage(pageId, index) {
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page && page.images[index] !== undefined) {
        page.images.splice(index, 1);
        renderPages();
        updatePreview();
    }
}

// Update page title
function updatePageTitle(pageId, newTitle) {
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page) {
        page.title = newTitle;
        updatePreview();
    }
}

// Update page content
function updatePageContent(pageId, newContent) {
    saveState();
    const page = siteConfig.pages.find(p => p.id === pageId);
    if (page) {
        page.content = newContent;
        updatePreview();
    }
}

// Delete page
function deletePage(pageId) {
    saveState();
    siteConfig.pages = siteConfig.pages.filter(p => p.id !== pageId);
    renderPages();
    updatePreview();
}

// Update preview with error handling and retry mechanism
function updatePreview() {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 100;
    let retryCount = 0;

    function tryUpdatePreview() {
        if (!previewFrame.contentWindow) {
            if (retryCount < MAX_RETRIES) {
                retryCount++;
                setTimeout(tryUpdatePreview, RETRY_DELAY);
                return;
            }
            console.error('Preview frame not ready after maximum retries');
            return;
        }

        try {
            const previewDoc = previewFrame.contentDocument;
            previewDoc.open();
            previewDoc.write(generateHTML());
            previewDoc.close();

            // Initialize marked library and handle navigation
            const script = previewDoc.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
            script.onerror = () => {
                console.error('Failed to load Marked library');
            };
            script.onload = () => {
                try {
                    initializeMarkdown(previewDoc);
                    setupNavigation(previewDoc);
                } catch (error) {
                    console.error('Error initializing preview:', error);
                }
            };
            previewDoc.head.appendChild(script);
        } catch (error) {
            console.error('Error updating preview:', error);
        }
    }

    function initializeMarkdown(doc) {
        const marked = doc.defaultView.marked;
        marked.setOptions({
            breaks: true,
            gfm: true,
            silent: true
        });

        doc.querySelectorAll('.content').forEach(content => {
            if (content.getAttribute('data-markdown')) {
                try {
                    content.innerHTML = marked.parse(content.getAttribute('data-markdown'));
                } catch (error) {
                    console.error('Error parsing markdown:', error);
                    content.innerHTML = '<p>Error parsing content</p>';
                }
            }
        });
    }

    function setupNavigation(doc) {
        const handleNavigation = () => {
            const hash = doc.location.hash || '#main';
            const sections = doc.querySelectorAll('section');
            sections.forEach(section => {
                section.style.display = '#' + section.id === hash ? 'block' : 'none';
            });

            // Update active state of navigation links
            doc.querySelectorAll('nav a').forEach(link => {
                const linkHash = link.getAttribute('href');
                if (linkHash === hash || (!hash && linkHash === '#main')) {
                    link.classList.add('active');
                } else {
                    link.classList.remove('active');
                }
            });
        };

        doc.querySelectorAll('nav a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const hash = link.getAttribute('href');
                doc.location.hash = hash;
                handleNavigation();
            });
        });

        handleNavigation();
        doc.defaultView.addEventListener('hashchange', handleNavigation);
    }

    tryUpdatePreview();
}

// Image management system
const imageManager = {
    addMainImage() {
        try {
            siteConfig.mainImages.push({ url: '', title: '' });
            this.renderMainImages();
            updatePreview();
        } catch (error) {
            console.error('Error adding main image:', error);
        }
    },

    //Main page images
    renderMainImages() {
        try {
            mainImagesDiv.innerHTML = `
                <div class="gallery-title-input">
                    <label for="mainGalleryTitle">Main page images:</label>
                    <input type="text" value="${siteConfig.mainGalleryTitle || ''}" 
                           id="mainGalleryTitle"
                           placeholder="Gallery title"
                           onchange="imageManager.updateMainGalleryTitle(this.value)">
                </div>
                ${siteConfig.mainImages.map((image, index) => {
                const imageUrl = typeof image === 'string' ? image : image?.url || '';
                const imageTitle = typeof image === 'string' ? '' : image?.title || '';

                return `
                        <div class="image-input">
                            <input type="text" value="${imageUrl}" 
                                   placeholder="Image url"
                                   onchange="imageManager.updateMainImageUrl(${index}, this.value)">
                            <input type="text" value="${imageTitle}" 
                                   placeholder="Image title"
                                   onchange="imageManager.updateMainImageTitle(${index}, this.value)">
                            <button class="btn remove" onclick="imageManager.removeMainImage(${index})">×</button>
                        </div>
                    `;
            }).join('')}
            `;
        } catch (error) {
            console.error('Error rendering main images:', error);
            mainImagesDiv.innerHTML = '<p>Error loading images</p>';
        }
    },

    updateMainGalleryTitle(newTitle) {
        try {
            siteConfig.mainGalleryTitle = newTitle;
            updatePreview();
        } catch (error) {
            console.error('Error updating image title:', error);
        }
    },

    updateMainImageUrl(index, newUrl) {
        try {
            if (siteConfig.mainImages[index] !== undefined) {
                const currentImage = siteConfig.mainImages[index];
                siteConfig.mainImages[index] = typeof currentImage === 'string'
                    ? { url: newUrl, title: '' }
                    : { ...currentImage, url: newUrl };
                updatePreview();
            }
        } catch (error) {
            console.error('Error updating image URL:', error);
        }
    },

    updateMainImageTitle(index, newTitle) {
        try {
            if (siteConfig.mainImages[index] !== undefined) {
                const currentImage = siteConfig.mainImages[index];
                siteConfig.mainImages[index] = typeof currentImage === 'string'
                    ? { url: currentImage, title: newTitle }
                    : { ...currentImage, title: newTitle };
                updatePreview();
            }
        } catch (error) {
            console.error('Error updating image title:', error);
        }
    },

    removeMainImage(index) {
        try {
            if (siteConfig.mainImages[index] !== undefined) {
                siteConfig.mainImages.splice(index, 1);
                this.renderMainImages();
                updatePreview();
            }
        } catch (error) {
            console.error('Error removing image:', error);
        }
    }
};

// Update event listener to use imageManager
addMainImageButton.addEventListener('click', () => imageManager.addMainImage());

// Make imageManager available globally
window.imageManager = imageManager;

// Generate HTML for preview and download
function generateHTML() {
    const theme = siteConfig.theme;
    const themeStyles = getThemeStyles(theme);

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${siteConfig.mainTitle}</title>
            <style>${themeStyles}</style>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        </head>
        <body class="theme-${theme}">
            <nav class="preview-navigation">
                <a href="#main">Home</a>
                ${generateNavigation()}
            </nav>
            <main>
                <section id="main" style="display: block;">
                    <h2>${siteConfig.mainTitle || 'Main Page'}</h2>
                    <div class="content" data-markdown="${siteConfig.mainContent || ''}">${siteConfig.mainContent || ''}</div>
                    ${generateGallery(siteConfig.mainImages, siteConfig.mainGalleryTitle)}
                </section>
                ${generateContent()}
            </main>
            <script>
                function showSection(hash) {
                    const mainSection = document.getElementById('main');
                    const sections = document.getElementsByTagName('section');
                    
                    if (hash === '#main' || !hash) {
                        mainSection.style.display = 'block';
                        Array.from(sections).forEach(section => {
                            if (section.id !== 'main') {
                                section.style.display = 'none';
                            }
                        });
                    } else {
                        mainSection.style.display = 'none';
                        Array.from(sections).forEach(section => {
                            section.style.display = '#' + section.id === hash ? 'block' : 'none';
                        });
                    }
                }
                
                // Initial section display
                showSection(window.location.hash);
                
                // Handle hash changes
                window.addEventListener('hashchange', () => showSection(window.location.hash));
            </script>
            <script>
                document.querySelectorAll('.content').forEach(content => {
                    if (content.getAttribute('data-markdown')) {
                        content.innerHTML = marked.parse(content.getAttribute('data-markdown'));
                    }
                });
            </script>
        </body>
        </html>
    `;
}

// Generate navigation
function generateNavigation() {
    const currentHash = window.location.hash.slice(1) || (siteConfig.pages[0]?.id || '');
    return siteConfig.pages.map(page =>
        `<a href="#${page.id}" class="${page.id === currentHash ? 'active' : ''}">${page.title}</a>`
    ).join('');
}

// Generate content
function generateContent() {
    return siteConfig.pages.map(page => `
        <section id="${page.id}">
            <h2>${page.title}</h2>
            <div class="content" data-markdown="${page.content}">${page.content}</div>
            ${generateGallery(page.images, page.galleryTitle)}
        </section>
    `).join('');
}

// Generate image gallery
function generateGallery(images, galleryTitle = '') {
    if (!images.length) return '';
    const galleryTitleHTML = galleryTitle ? `<h3 class="gallery-title">${galleryTitle}</h3>` : '';
    return `
        ${galleryTitleHTML}
        <div class="gallery">
            ${images.map(image => {
        const url = typeof image === 'string' ? image : image?.url;
        const title = typeof image === 'string' ? '' : image?.title;
        return url ? `
                    <figure>
                        <img src="${url}" alt="${title || 'Gallery image'}">
                        ${title ? `<figcaption>${title}</figcaption>` : ''}
                    </figure>` : ''
    }).join('')}
        </div>
    `;
}

// Get theme styles
function getThemeStyles(theme) {
    const baseStyles = `
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; line-height: 1.6; }
        nav { padding: 1rem; }
        nav a { margin-right: 1rem; }
        main { padding: 2rem; }
        .gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 1rem; }
        .gallery img { width: 100%; height: auto; border-radius: 4px; }
    `;

    try {
        const themeStyles = themes[theme]?.styles || '';
        return baseStyles + themeStyles;
    } catch (error) {
        console.error(`Error loading theme: ${theme}`, error);
        return baseStyles;
    }
}

// Generate and download site
async function generateSite() {
    const zip = new JSZip();

    // Add index.html
    zip.file('index.html', generateHTML());

    // Generate individual page files
    siteConfig.pages.forEach(page => {
        zip.file(`${page.id}.html`, generatePageHTML(page));
    });

    // Add README.md
    const readmeContent = 'Visit **your link here** to see this site in action!\n\nMade with [Brian\'s Simple Site Generator](https://bgag2783.github.io/Generator/)';
    zip.file('README.md', readmeContent);

    // Add site configuration JSON
    zip.file('site-config.json', JSON.stringify(siteConfig, null, 2));

    // Generate zip file
    const content = await zip.generateAsync({ type: 'blob' });

    // Trigger download
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(content);
    downloadLink.download = `${siteConfig.name || 'site'}.zip`;
    downloadLink.click();

    // Redirect to "What's Next" page after 2 seconds
    setTimeout(() => {
        document.getElementById('whatsNextLink').click();
    }, 2000);
}

// Generate individual page HTML
function generatePageHTML(page) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${page.title} - ${siteConfig.name}</title>
            <style>${getThemeStyles(siteConfig.theme)}</style>
            <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
        </head>
        <body class="theme-${siteConfig.theme}">
            <nav class="preview-navigation">
                <a href="index.html#main">Main</a>
                ${generateNavigation()}
            </nav>
            <main>
                <h2>${page.title}</h2>
                <div class="content" data-markdown="${page.content}">${page.content}</div>
                ${generateGallery(page.images)}
            </main>
            <script>
                document.querySelectorAll('.content').forEach(content => {
                    if (content.getAttribute('data-markdown')) {
                        content.innerHTML = marked.parse(content.getAttribute('data-markdown'));
                    }
                });
            </script>
        </body>
        </html>
    `;
}

// Add import button event listener
const importButton = document.createElement('button');
importButton.id = 'importSite';
importButton.className = 'btn';
importButton.textContent = 'Import site';
document.querySelector('.actions').insertBefore(importButton, generateButton);

// Add file input for importing
const importInput = document.createElement('input');
importInput.type = 'file';
importInput.accept = '.json';
importInput.style.display = 'none';
document.body.appendChild(importInput);

// Import site configuration
importButton.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedConfig = JSON.parse(e.target.result);
                siteConfig = importedConfig;

                // Update UI with imported configuration
                siteNameInput.value = siteConfig.name || '';
                themeSelect.value = siteConfig.theme || 'modern';
                mainTitleInput.value = siteConfig.mainTitle || '';
                mainContentInput.value = siteConfig.mainContent || '';

                // Update main images
                siteConfig.mainImages = siteConfig.mainImages || [];
                imageManager.renderMainImages();

                // Update pages
                renderPages();

                // Update preview
                updatePreview();
            } catch (error) {
                console.error('Error importing site configuration:', error);
                alert('Error importing site configuration. Please make sure the file is valid.');
            }
        };
        reader.readAsText(file);
    }
});

// History stacks for undo/redo
let undoStack = [];
let redoStack = [];

// Capture state before modification
function saveState() {
    undoStack.push(JSON.stringify(siteConfig));
    redoStack = []; // Clear redo stack since new changes invalidate redo history
}

// Undo action
function undo() {
    if (undoStack.length > 0) {
        redoStack.push(JSON.stringify(siteConfig)); // Save current state to redo stack
        siteConfig = JSON.parse(undoStack.pop()); // Restore previous state
        updateUI();
    }
}

// Redo action
function redo() {
    if (redoStack.length > 0) {
        undoStack.push(JSON.stringify(siteConfig)); // Save current state to undo stack
        siteConfig = JSON.parse(redoStack.pop()); // Restore redo state
        updateUI();
    }
}

// Attach Undo/Redo event listeners
document.getElementById('undoButton').addEventListener('click', undo);
document.getElementById('redoButton').addEventListener('click', redo);



// Function to update UI after undo/redo
function updateUI() {
    siteNameInput.value = siteConfig.name || '';
    themeSelect.value = siteConfig.theme || 'modern';
    mainTitleInput.value = siteConfig.mainTitle || '';
    mainContentInput.value = siteConfig.mainContent || '';

    renderPages();
    updatePreview();

    // Enable/disable undo/redo buttons based on stack size
    document.getElementById('undoButton').disabled = undoStack.length === 0;
    document.getElementById('redoButton').disabled = redoStack.length === 0;
}

function loadFromLocalStorage() {
    const savedConfig = localStorage.getItem('siteConfig');
    if (savedConfig) {
        siteConfig = JSON.parse(savedConfig);

        // Update UI with saved configuration
        siteNameInput.value = siteConfig.name || '';
        themeSelect.value = siteConfig.theme || 'modern';
        mainTitleInput.value = siteConfig.mainTitle || '';
        mainContentInput.value = siteConfig.mainContent || '';

        // Update pages and images
        renderPages();
        imageManager.renderMainImages();

        updatePreview();
    }
}

document.getElementById('clearStorageButton').addEventListener('click', () => {
    if (confirm('Are you sure you want to clear saved progress? This cannot be undone.')) {
        localStorage.removeItem('siteConfig');
        location.reload(); // Reload the page to reset everything
    }
});


// Expose functions for inline event handlers
window.updatePageTitle = updatePageTitle;
window.updatePageContent = updatePageContent;
window.updateImageUrl = updateImageUrl;
window.updateImageTitle = updateImageTitle;
window.removeImage = removeImage;
window.updateGalleryTitle = updateGalleryTitle;
window.addEventListener('load', loadFromLocalStorage);
