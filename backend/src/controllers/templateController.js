const Template = require("../models/Template");

// Default Theme Values (Extracted from theme.css)
const defaultTheme = {
    "--primary-color": "#f8f9fa",
    "--primary-light": "#ffffff",
    "--primary-dark": "#e9ecef",
    "--secondary-color": "#2d3748",
    "--secondary-light": "#4a5568",
    "--secondary-dark": "#1a202c",
    "--table-borders": "#2d3748",
    "--table-header-bg": "#e9ecef",
    "--table-odd-rows-background": "rgba(165, 180, 252, 0.05)",
    "--table-even-row-bg": "rgba(102, 126, 234, 0.08)",
    "--table-row-hover-bg": "rgba(102, 126, 234, 0.15)",
    "--table-view-border": "#2d3748",
    "--table-view-header-bg": "#e9ecef",
    "--table-view-header-text": "#000000",
    "--table-view-text": "#000000",
    "--table-view-row-odd-bg": "rgba(165, 180, 252, 0.05)",
    "--table-view-row-even-bg": "rgba(102, 126, 234, 0.08)",
    "--table-view-row-hover-bg": "rgba(102, 126, 234, 0.15)",
    "--table-edit-border": "#2d3748",
    "--table-edit-header-bg": "#e9ecef",
    "--table-edit-header-text": "#000000",
    "--table-edit-text": "#000000",
    "--table-edit-row-odd-bg": "rgba(165, 180, 252, 0.05)",
    "--table-edit-row-even-bg": "rgba(102, 126, 234, 0.08)",
    "--table-edit-row-hover-bg": "rgba(102, 126, 234, 0.15)",
    "--modal-trigger-btn-bg": "#2d3748",
    "--modal-trigger-btn-text": "#ffffff",
    "--hovering-li": "#e9ecef",
    "--header-background": "#ffffff",
    "--nav-selected-start": "#e2e8f0",
    "--nav-selected-end": "#cbd5e0",
    "--accent-red": "#c53030",
    "--accent-heart": "#e53e3e",
    "--text-color": "#000000",
    "--text-light": "#2d3748",
    "--background-color": "#ffffff",
    "--border-color": "#000000",
    "--success-color": "#198754",
    "--success-light": "#d1e7dd",
    "--error-color": "#dc3545",
    "--error-light": "#f8d7da",
    "--warning-color": "#ffc107",
    "--warning-light": "#fff3cd",
    "--info-color": "#0dcaf0",
    "--info-light": "#cff4fc",
    "--btn-primary-bg": "#2d3748",
    "--btn-primary-text": "#ffffff",
    "--btn-primary-hover-bg": "#1a202c",
    "--btn-secondary-bg": "#e2e8f0",
    "--btn-secondary-text": "#1a202c",
    "--btn-secondary-hover-bg": "#cbd5e0",
    "--action-btn-bg": "#c53030",
    "--action-btn-hover-bg": "#7a1609",
    "--tooltip-bg": "rgba(0, 0, 0, 0.8)",
    "--tooltip-text": "#ffffff",
    "--input-bg": "#ffffff",
    "--input-text": "#000000",
    "--input-border": "#000000",
    "--input-focus-border": "#2d3748",
    "--input-focus-shadow": "rgba(102, 126, 234, 0.25)",
    "--input-error-shadow": "rgba(229, 62, 62, 0.25)",
    "--input-disabled-bg": "#f8f9fa",
    "--input-placeholder": "#6c757d",
    "--label-text": "#000000",
    "--modal-overlay-bg": "rgba(0, 0, 0, 0.5)",
    "--modal-bg": "#ffffff",
    "--modal-header-bg": "#f8f9fa",
    "--modal-header-text": "#000000",
    "--modal-border": "#000000",
    "--modal-close-icon": "#6c757d",
    "--sidebar-bg": "#f8f9fa",
    "--sidebar-item-text": "#000000",
    "--sidebar-item-hover-bg": "#e9ecef",
    "--sidebar-active-item-bg": "#e2e8f0",
    "--page-bg": "#ffffff",
    "--card-bg": "#ffffff",
    "--heading-text": "#000000",
    "--body-text": "#000000",
    "--muted-text": "#6c757d",
    "--link-text": "#0d6efd",
    "--status-success-bg": "#d1e7dd",
    "--status-success-text": "#0f5132",
    "--status-error-bg": "#f8d7da",
    "--status-error-text": "#842029",
    "--status-warning-bg": "#fff3cd",
    "--status-warning-text": "#664d03",
    "--icon-edit": "brown",
    "--icon-delete": "#848484",
    "--icon-view": "#0d6efd",
    "--icon-add": "#198754",
    "--icon-print": "#28a745"
};

// Seed Defaults
exports.seedDefaults = async () => {
    try {
        // Enforce the latest defaultTheme values on the System Default template
        const filter = { name: "Default (System)", isSystem: true };
        const update = { preferences: defaultTheme };
        const options = { upsert: true, new: true, setDefaultsOnInsert: true };

        await Template.findOneAndUpdate(filter, update, options);
        console.log("TemplateController: Seeded/Updated Default System Template");
    } catch (error) {
        console.error("TemplateController: Seeding failed", error);
    }
};

exports.getTemplates = async (req, res) => {
    try {
        // Fetch System templates AND user's own templates
        const templates = await Template.find({
            $or: [
                { isSystem: true },
                { userId: req.user.id }
            ]
        }).sort({ isSystem: -1, createdAt: 1 }); // System first
        res.status(200).json(templates);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch templates" });
    }
};

exports.createTemplate = async (req, res) => {
    try {
        const { name, preferences } = req.body;
        if (!name || !preferences) {
            return res.status(400).json({ error: "Name and preferences are required" });
        }

        // Check uniqueness for this user
        const existing = await Template.findOne({ name, userId: req.user.id });
        if (existing) {
            return res.status(400).json({ error: "You already have a template with this name" });
        }

        const template = await Template.create({
            name,
            preferences,
            isSystem: false,
            userId: req.user.id
        });

        res.status(201).json(template);
    } catch (error) {
        if (error.code === 11000) {
             return res.status(400).json({ error: "Template name must be unique" });
        }
        res.status(500).json({ error: "Failed to create template" });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { preferences } = req.body;

        const template = await Template.findOne({ _id: id, userId: req.user.id });
        if (!template) {
            return res.status(404).json({ error: "Template not found or access denied" });
        }
        
        if (template.isSystem) {
             return res.status(403).json({ error: "Cannot modify system templates" });
        }

        template.preferences = preferences;
        await template.save();
        res.status(200).json(template);
    } catch (error) {
        res.status(500).json({ error: "Failed to update template" });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const template = await Template.findOne({ _id: id, userId: req.user.id });
        
        if (!template) {
            // Check if it's a system template just to give better error
            const systemTemp = await Template.findOne({ _id: id, isSystem: true });
            if (systemTemp) return res.status(403).json({ error: "Cannot delete system templates" });
            return res.status(404).json({ error: "Template not found" });
        }

        await template.deleteOne();
        res.status(200).json({ message: "Template deleted" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete template" });
    }
};
