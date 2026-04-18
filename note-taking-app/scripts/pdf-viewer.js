/* PDF Viewer & Editor Module */

const PDFViewer = {
    // State
    doc: null,
    filePath: null,
    fileName: null,
    annotations: [], // Array of annot objects
    bookmarks: [], // Array of page numbers
    currentPage: 1,
    zoom: 1.0,
    totalPages: 0,
    currentTool: 'cursor', // cursor, highlight, text, bookmark
    isDragging: false,
    dragStart: { x: 0, y: 0 },
    tempAnnot: null,
    renderTasks: new Map(), // pageNum -> renderTask
    visiblePages: new Set(),
    
    // Elements
    el: {
        base: null,
        viewer: null,
        fileName: null,
        filePath: null,
        pageInput: null,
        totalPages: null,
        zoomLevel: null,
        annotationsList: null,
        bookmarksList: null,
        layersPanel: null
    },

    async init() {
        console.log("[PDF] Initializing PDFViewer...");
        this.el.base = document.getElementById('pdfBase');
        this.el.viewer = document.getElementById('pdfViewer');
        this.el.fileName = document.getElementById('pdfFileName');
        this.el.filePath = document.getElementById('pdfFilePath');
        this.el.pageInput = document.getElementById('pdfPageInput');
        this.el.totalPages = document.getElementById('pdfTotalPages');
        this.el.zoomLevel = document.getElementById('pdfZoomLevel');
        this.el.annotationsList = document.getElementById('pdfAnnotationsList');
        this.el.bookmarksList = document.getElementById('pdfBookmarksList');
        this.el.layersPanel = document.getElementById('pdfLayersPanel');

        this.bindEvents();
        this.setupIntersectionObserver();
    },

    bindEvents() {
        // Back
        document.getElementById('pdfBackBtn').onclick = () => this.close();

        // Navigation
        document.getElementById('pdfPrevPage').onclick = () => this.jumpToPage(this.currentPage - 1);
        document.getElementById('pdfNextPage').onclick = () => this.jumpToPage(this.currentPage + 1);
        this.el.pageInput.onchange = (e) => this.jumpToPage(parseInt(e.target.value));
        this.el.pageInput.onkeydown = (e) => { if (e.key === 'Enter') this.jumpToPage(parseInt(this.el.pageInput.value)); };

        // Zoom
        document.getElementById('pdfZoomIn').onclick  = () => this.changeZoom(0.15);
        document.getElementById('pdfZoomOut').onclick = () => this.changeZoom(-0.15);
        document.getElementById('pdfFitWidth').onclick = () => this.fitToWidth();

        // Tool buttons — use data-tool attribute
        document.querySelectorAll('.pdf-labeled-tool[data-tool]').forEach(btn => {
            btn.onclick = () => this.setTool(btn.dataset.tool);
        });

        // Highlight color swatches
        this.highlightColor = 'rgba(250, 204, 21, 0.45)'; // default yellow
        document.querySelectorAll('.pdf-color-swatch').forEach(sw => {
            sw.onclick = () => {
                document.querySelectorAll('.pdf-color-swatch').forEach(s => s.classList.remove('active'));
                sw.classList.add('active');
                const map = {
                    yellow: 'rgba(250,204,21,0.45)',
                    cyan:   'rgba(34,211,238,0.45)',
                    lime:   'rgba(134,239,172,0.45)',
                    pink:   'rgba(249,168,212,0.45)',
                    orange: 'rgba(251,146,60,0.45)',
                };
                this.highlightColor = map[sw.dataset.color] || 'rgba(250,204,21,0.45)';
            };
        });

        // Open PDF button
        document.getElementById('pdfOpenBtn').onclick = () => this.pickAndOpenFile();

        // Layers panel toggle
        document.getElementById('pdfToggleLayers').onclick = () => this.toggleLayers();
        document.getElementById('pdfCloseLayers').onclick  = () => this.toggleLayers(false);

        // Layer tabs
        document.querySelectorAll('.layer-tab').forEach(tab => {
            tab.onclick = () => {
                document.querySelectorAll('.layer-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const type = tab.dataset.tab;
                document.getElementById('pdfAnnotationsList').classList.toggle('hidden', type !== 'annotations');
                document.getElementById('pdfBookmarksList').classList.toggle('hidden', type !== 'bookmarks');
            };
        });

        // Scroll → update page number
        this.el.viewer.onscroll = () => this.updateCurrentPageFromScroll();

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (!this.el.base || this.el.base.classList.contains('hidden')) return;
            const tag = document.activeElement?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.contentEditable === 'true') return;
            const k = e.key.toLowerCase();
            if (k === 'v') this.setTool('cursor');
            if (k === 'h') this.setTool('highlight');
            if (k === 't') this.setTool('text');
            if (k === 'b') this.setTool('bookmark');
            if (k === '-') this.changeZoom(-0.1);
            if (k === '=') this.changeZoom(0.1);
            if (e.key === 'ArrowLeft' || e.key === 'ArrowUp')   { e.preventDefault(); this.jumpToPage(this.currentPage - 1); }
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); this.jumpToPage(this.currentPage + 1); }
            if (e.key === 'Escape') this.toggleLayers(false);
        });
    },

    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const pageNum = parseInt(entry.target.dataset.page);
                if (entry.isIntersecting) {
                    this.visiblePages.add(pageNum);
                    this.renderPageIfVisible(pageNum);
                } else {
                    this.visiblePages.delete(pageNum);
                    // Optionally clear canvas of non-visible pages to save memory
                }
            });
        }, {
            root: this.el.viewer,
            threshold: 0.1
        });
    },

    async pickAndOpenFile() {
        const filePath = await window.electronAPI.pdfOpenDialog();
        if (filePath) {
            await this.openFile(filePath);
        }
    },

    async openFile(filePath) {
        console.log(`[PDF] Opening file: ${filePath}`);
        this.filePath = filePath;
        this.fileName = filePath.split(/[/\\]/).pop();
        
        try {
            // Show loader/empty state
            this.el.viewer.innerHTML = '<div class="pdf-loading">Loading document...</div>';
            
            // Read binary data
            const base64 = await window.electronAPI.pdfReadFile(filePath);
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
            
            // Load PDF
            this.doc = await pdfjsLib.getDocument({ data: bytes.buffer }).promise;
            this.totalPages = this.doc.numPages;
            
            // Load sidecar annotations
            this.annotations = await window.electronAPI.pdfReadAnnotations(filePath) || [];
            
            // UI Update
            this.el.fileName.textContent = this.fileName;
            this.el.filePath.textContent = filePath;
            this.el.totalPages.textContent = this.totalPages;
            this.el.pageInput.value = 1;
            this.el.pageInput.max = this.totalPages;
            
            // Clear viewer and prepare containers for ALL pages (lazy render)
            this.el.viewer.innerHTML = '';
            for (let i = 1; i <= this.totalPages; i++) {
                const wrapper = document.createElement('div');
                wrapper.className = 'pdf-page-wrapper';
                wrapper.id = `pdf-page-${i}`;
                wrapper.dataset.page = i;
                
                const canvas = document.createElement('canvas');
                canvas.className = 'pdf-page-canvas';
                wrapper.appendChild(canvas);
                
                const annotLayer = document.createElement('div');
                annotLayer.className = 'annotation-layer';
                wrapper.appendChild(annotLayer);
                
                this.el.viewer.appendChild(wrapper);
                this.observer.observe(wrapper);
                
                this.setupPageInteraction(wrapper, i);
            }
            
            this.renderAnnotations();
            this.renderBookmarks();
            this.updateRecentList();
            
            // Initial render of first few pages handled by Observer
            
        } catch (err) {
            console.error("[PDF] Failed to load PDF:", err);
            this.el.viewer.innerHTML = `<div class="pdf-error">Error: ${err.message}</div>`;
        }
    },

    async renderPageIfVisible(pageNum) {
        if (!this.doc || !this.visiblePages.has(pageNum)) return;
        
        const wrapper = document.getElementById(`pdf-page-${pageNum}`);
        const canvas = wrapper.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        // Check if already being rendered or if zoom level matched
        if (canvas.dataset.zoom === this.zoom.toString()) return;

        try {
            const page = await this.doc.getPage(pageNum);
            const viewport = page.getViewport({ scale: this.zoom * window.devicePixelRatio });
            
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            canvas.style.width = (viewport.width / window.devicePixelRatio) + 'px';
            canvas.style.height = (viewport.height / window.devicePixelRatio) + 'px';
            wrapper.style.width = canvas.style.width;
            wrapper.style.height = canvas.style.height;
            
            canvas.dataset.zoom = this.zoom.toString();
            
            const renderContext = {
                canvasContext: ctx,
                viewport: viewport
            };
            
            // Cancel previous task if any
            if (this.renderTasks.has(pageNum)) {
                this.renderTasks.get(pageNum).cancel();
            }
            
            const renderTask = page.render(renderContext);
            this.renderTasks.set(pageNum, renderTask);
            
            await renderTask.promise;
            this.renderTasks.delete(pageNum);
            
            // Update annotations on this page
            this.renderPageAnnotations(pageNum);
            
        } catch (err) {
            if (err.name !== 'RenderingCancelledException') {
                console.error(`[PDF] Render error page ${pageNum}:`, err);
            }
        }
    },

    setupPageInteraction(wrapper, pageNum) {
        wrapper.onmousedown = (e) => {
            if (this.currentTool === 'highlight') {
                this.startHighlight(e, pageNum, wrapper);
            }
        };

        wrapper.onmousemove = (e) => {
            if (this.isDragging && this.currentTool === 'highlight') {
                this.updateHighlight(e, pageNum, wrapper);
            }
        };

        wrapper.onmouseup = () => {
            if (this.isDragging && this.currentTool === 'highlight') {
                this.finishHighlight(pageNum);
            }
        };

        wrapper.onclick = (e) => {
            if (this.currentTool === 'bookmark') {
                this.toggleBookmark(pageNum);
            } else if (this.currentTool === 'text') {
                this.addTextAtPosition(e, pageNum, wrapper);
            }
        };
    },

    // TOOLS

    setTool(tool) {
        this.currentTool = tool;
        // Update labeled tool buttons
        document.querySelectorAll('.pdf-labeled-tool[data-tool]').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tool === tool);
        });
        // Update viewer cursor
        this.el.viewer.className = `pdf-viewer-container tool-${tool}`;
    },

    startHighlight(e, pageNum, wrapper) {
        this.isDragging = true;
        const rect = wrapper.getBoundingClientRect();
        this.dragStart = {
            x: (e.clientX - rect.left) / this.zoom,
            y: (e.clientY - rect.top) / this.zoom
        };

        this.tempAnnot = document.createElement('div');
        this.tempAnnot.className = 'annot-highlight temp';
        this.tempAnnot.style.left = this.dragStart.x * this.zoom + 'px';
        this.tempAnnot.style.top = this.dragStart.y * this.zoom + 'px';
        wrapper.querySelector('.annotation-layer').appendChild(this.tempAnnot);
    },

    updateHighlight(e, pageNum, wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const currentX = (e.clientX - rect.left) / this.zoom;
        const currentY = (e.clientY - rect.top) / this.zoom;

        const left = Math.min(this.dragStart.x, currentX);
        const top = Math.min(this.dragStart.y, currentY);
        const width = Math.abs(this.dragStart.x - currentX);
        const height = Math.abs(this.dragStart.y - currentY);

        this.tempAnnot.style.left = left * this.zoom + 'px';
        this.tempAnnot.style.top = top * this.zoom + 'px';
        this.tempAnnot.style.width = width * this.zoom + 'px';
        this.tempAnnot.style.height = height * this.zoom + 'px';
    },

    async finishHighlight(pageNum) {
        this.isDragging = false;
        if (!this.tempAnnot) return;
        
        const style = window.getComputedStyle(this.tempAnnot);
        const w = parseFloat(style.width)  / this.zoom;
        const h = parseFloat(style.height) / this.zoom;

        const newAnnot = {
            id: Date.now().toString(),
            type: 'highlight',
            pageNum: pageNum,
            x: parseFloat(style.left)  / this.zoom,
            y: parseFloat(style.top)   / this.zoom,
            w, h,
            color: this.highlightColor || 'rgba(250,204,21,0.45)',
            createdAt: new Date().toISOString()
        };

        this.tempAnnot.remove();
        this.tempAnnot = null;

        if (w > 3 && h > 3) {
            this.annotations.push(newAnnot);
            await this.saveAnnotations();
            this.renderPageAnnotations(pageNum);
            this.updateAnnotationsList();
        }
    },

    async addTextAtPosition(e, pageNum, wrapper) {
        const rect = wrapper.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom;
        const y = (e.clientY - rect.top) / this.zoom;

        const newAnnot = {
            id: Date.now().toString(),
            type: 'text',
            pageNum: pageNum,
            x: x,
            y: y,
            text: "Double click to edit",
            createdAt: new Date().toISOString()
        };

        this.annotations.push(newAnnot);
        await this.saveAnnotations();
        this.renderPageAnnotations(pageNum);
        this.updateAnnotationsList();
        this.setTool('cursor'); // Return to cursor to edit
    },

    async toggleBookmark(pageNum) {
        const existing = this.annotations.findIndex(a => a.type === 'bookmark' && a.pageNum === pageNum);
        if (existing !== -1) {
            this.annotations.splice(existing, 1);
        } else {
            this.annotations.push({
                id: Date.now().toString(),
                type: 'bookmark',
                pageNum: pageNum,
                createdAt: new Date().toISOString()
            });
        }
        await this.saveAnnotations();
        this.renderPageAnnotations(pageNum);
        this.renderBookmarks();
    },

    // RENDERING ANNOTATIONS

    renderPageAnnotations(pageNum) {
        const wrapper = document.getElementById(`pdf-page-${pageNum}`);
        if (!wrapper) return;
        
        const layer = wrapper.querySelector('.annotation-layer');
        layer.innerHTML = '';
        
        const pageAnnots = this.annotations.filter(a => a.pageNum === pageNum);
        
        pageAnnots.forEach(annot => {
            if (annot.type === 'highlight') {
                const el = document.createElement('div');
                el.className = 'annot-highlight';
                el.style.left = annot.x * this.zoom + 'px';
                el.style.top = annot.y * this.zoom + 'px';
                el.style.width = annot.w * this.zoom + 'px';
                el.style.height = annot.h * this.zoom + 'px';
                el.style.backgroundColor = annot.color || 'rgba(250,204,21,0.45)';
                
                el.oncontextmenu = (e) => {
                    e.preventDefault();
                    if (confirm("Delete this highlight?")) {
                        this.deleteAnnotation(annot.id);
                    }
                };
                layer.appendChild(el);
            } 
            else if (annot.type === 'text') {
                const el = document.createElement('div');
                el.className = 'annot-text-box';
                el.style.left = annot.x * this.zoom + 'px';
                el.style.top = annot.y * this.zoom + 'px';
                el.textContent = annot.text;
                el.contentEditable = true;
                
                el.onblur = async () => {
                    annot.text = el.textContent;
                    await this.saveAnnotations();
                    this.updateAnnotationsList();
                };
                
                el.oncontextmenu = (e) => {
                    e.preventDefault();
                    if (confirm("Delete this text?")) {
                        this.deleteAnnotation(annot.id);
                    }
                };
                layer.appendChild(el);
            }
            else if (annot.type === 'bookmark') {
                const el = document.createElement('div');
                el.className = 'annot-bookmark';
                el.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>';
                layer.appendChild(el);
            }
        });
    },

    async deleteAnnotation(id) {
        const index = this.annotations.findIndex(a => a.id === id);
        if (index !== -1) {
            const pageNum = this.annotations[index].pageNum;
            this.annotations.splice(index, 1);
            await this.saveAnnotations();
            this.renderPageAnnotations(pageNum);
            this.updateAnnotationsList();
            this.renderBookmarks();
        }
    },

    renderAnnotations() {
        // Redraw all visible pages' annotations
        this.visiblePages.forEach(p => this.renderPageAnnotations(p));
        this.updateAnnotationsList();
    },

    updateAnnotationsList() {
        this.el.annotationsList.innerHTML = '';
        const list = [...this.annotations].sort((a, b) => a.pageNum - b.pageNum);
        
        if (list.length === 0) {
            this.el.annotationsList.innerHTML = '<div class="empty-state">No annotations yet</div>';
            return;
        }

        list.forEach(annot => {
            if (annot.type === 'bookmark') return;
            
            const item = document.createElement('div');
            item.className = 'layer-item';
            item.innerHTML = `
                <div class="layer-item-header">
                    <span class="layer-item-type">${annot.type}</span>
                    <span class="layer-item-page">Page ${annot.pageNum}</span>
                </div>
                <div class="layer-item-text">${annot.type === 'text' ? annot.text : 'Highlighted area'}</div>
            `;
            item.onclick = () => this.jumpToPage(annot.pageNum);
            this.el.annotationsList.appendChild(item);
        });
    },

    renderBookmarks() {
        this.el.bookmarksList.innerHTML = '';
        const bookmarks = this.annotations.filter(a => a.type === 'bookmark').sort((a, b) => a.pageNum - b.pageNum);
        
        if (bookmarks.length === 0) {
            this.el.bookmarksList.innerHTML = '<div class="empty-state">No bookmarks</div>';
            return;
        }

        bookmarks.forEach(bm => {
            const item = document.createElement('div');
            item.className = 'layer-item';
            item.innerHTML = `
                <div class="layer-item-header">
                    <span class="layer-item-type">Bookmark</span>
                    <span class="layer-item-page">Page ${bm.pageNum}</span>
                </div>
            `;
            item.onclick = () => this.jumpToPage(bm.pageNum);
            this.el.bookmarksList.appendChild(item);
        });
    },

    // NAVIGATION & ZOOM

    jumpToPage(pageNum) {
        if (!this.doc || pageNum < 1 || pageNum > this.totalPages) return;
        this.currentPage = pageNum;
        this.el.pageInput.value = pageNum;
        
        const wrapper = document.getElementById(`pdf-page-${pageNum}`);
        if (wrapper) {
            wrapper.scrollIntoView();
        }
    },

    updateCurrentPageFromScroll() {
        const top = this.el.viewer.scrollTop;
        const pageWrappers = this.el.viewer.querySelectorAll('.pdf-page-wrapper');
        
        let foundPage = 1;
        for (let i = 0; i < pageWrappers.length; i++) {
            if (pageWrappers[i].offsetTop > top - 100) {
                foundPage = i + 1;
                break;
            }
        }
        
        if (this.currentPage !== foundPage) {
            this.currentPage = foundPage;
            this.el.pageInput.value = foundPage;
        }
    },

    changeZoom(delta) {
        this.zoom = Math.max(0.5, Math.min(3.0, this.zoom + delta));
        this.el.zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
        this.rerenderVisible();
    },

    fitToWidth() {
        const firstPage = this.el.viewer.querySelector('.pdf-page-wrapper');
        if (!firstPage) return;
        
        const viewerWidth = this.el.viewer.clientWidth - 40; // Subtract padding
        // We need to fetch the original scale of page 1 to calculate zoom
        this.doc.getPage(1).then(page => {
            const viewport = page.getViewport({ scale: 1.0 });
            this.zoom = viewerWidth / viewport.width;
            this.el.zoomLevel.textContent = Math.round(this.zoom * 100) + '%';
            this.rerenderVisible();
        });
    },

    rerenderVisible() {
        // Just clearing dataset zoom will trigger observer to re-render in renderPageIfVisible
        this.el.viewer.querySelectorAll('canvas').forEach(canvas => {
            canvas.dataset.zoom = '0';
        });
        this.visiblePages.forEach(p => this.renderPageIfVisible(p));
    },

    // PERSISTENCE

    async saveAnnotations() {
        if (!this.filePath) return;
        await window.electronAPI.pdfSaveAnnotations(this.filePath, this.annotations);
    },

    async updateRecentList() {
        const recent = await window.electronAPI.pdfGetRecent() || [];
        const filtered = recent.filter(p => p.path !== this.filePath);
        filtered.unshift({
            name: this.fileName,
            path: this.filePath,
            lastOpened: new Date().toISOString()
        });
        
        // Max 10 recent
        await window.electronAPI.pdfSaveRecent(filtered.slice(0, 10));
    },

    // UI SECTION TOGGLES

    open() {
        this.el.base.classList.remove('hidden');
        ['workspaceSplit','noteBase','questionBase'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
        // If no doc loaded yet, immediately prompt to open
        if (!this.doc) {
            setTimeout(() => this.pickAndOpenFile(), 150);
        }
    },

    close() {
        this.el.base.classList.add('hidden');
        document.getElementById('workspaceSplit').classList.remove('hidden');
        // If we were editing a note, could restore it here, but usually workspace is safer
    },

    toggleLayers(force) {
        if (force !== undefined) {
            this.el.layersPanel.classList.toggle('hidden', !force);
        } else {
            this.el.layersPanel.classList.toggle('hidden');
        }
    }
};

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
    PDFViewer.init();
    window.PDFViewer = PDFViewer; // Expose globally
});
