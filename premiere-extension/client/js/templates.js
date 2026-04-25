/**
 * Templates — CRUD de modelos de briefing salvos.
 */
(function() {
    const Templates = {
        all() {
            return Storage.getTemplates();
        },

        get(id) {
            return this.all().find(t => t.id === id);
        },

        create(name, content) {
            const templates = this.all();
            const tpl = {
                id: 'tpl-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
                name: name.trim(),
                content: content.trim(),
                createdAt: new Date().toISOString()
            };
            templates.push(tpl);
            Storage.saveTemplates(templates);
            return tpl;
        },

        update(id, { name, content }) {
            const templates = this.all();
            const idx = templates.findIndex(t => t.id === id);
            if (idx < 0) return null;
            if (name !== undefined) templates[idx].name = name.trim();
            if (content !== undefined) templates[idx].content = content.trim();
            templates[idx].updatedAt = new Date().toISOString();
            Storage.saveTemplates(templates);
            return templates[idx];
        },

        remove(id) {
            const templates = this.all().filter(t => t.id !== id);
            Storage.saveTemplates(templates);
        }
    };

    window.Templates = Templates;

    // Hotfix v1.10.2: carrega ajustes de usabilidade sem depender de editar index.html.
    try {
        if (!window.__FASTVIDEO_HOTFIX_LOADED__) {
            window.__FASTVIDEO_HOTFIX_LOADED__ = true;
            const script = document.createElement('script');
            script.src = 'js/fastvideo-hotfix.js';
            script.defer = true;
            script.onerror = function() {
                console.warn('[FASTVIDEO] hotfix não carregou');
            };
            document.head.appendChild(script);
        }
    } catch (e) {
        console.warn('[FASTVIDEO] falha ao injetar hotfix:', e);
    }
})();
