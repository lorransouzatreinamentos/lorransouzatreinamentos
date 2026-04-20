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
})();
