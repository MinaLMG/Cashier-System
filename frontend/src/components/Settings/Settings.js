import React, { useState, useEffect } from "react";
import axios from "axios";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import classes from "./Settings.module.css";
// We will need a module css for this.

const colorOptions = [
    // --- Layout & Navigation ---
    { label: "خلفية القائمة الجانبية", varName: "--sidebar-bg" },
    { label: "نص القائمة الجانبية", varName: "--sidebar-item-text" },
    { label: "خلفية عنصر القائمة (Hover)", varName: "--sidebar-item-hover-bg" },
    { label: "خلفية العنصر النشط (قائمة)", varName: "--sidebar-active-item-bg" },
    
    // --- Typography (Unused - Global defaults apply) ---

    { label: "ظل عند التركيز (Focus Shadow)", varName: "--input-focus-shadow" },
    { label: "ظل الخطأ (Error Shadow)", varName: "--input-error-shadow" },

    // --- Modals ---
    { label: "خلفية التعتيم (Overlay)", varName: "--modal-overlay-bg" },
    { label: "خلفية المودال", varName: "--modal-bg" },
    { label: "خلفية رأس المودال", varName: "--modal-header-bg" },
    { label: "نص رأس المودال", varName: "--modal-header-text" },
    { label: "حدود المودال", varName: "--modal-border" },
    { label: "أيقونة الإغلاق", varName: "--modal-close-icon" },

    // --- Status & Alerts ---
    { label: "خلفية النجاح (Success)", varName: "--status-success-bg" },
    { label: "نص النجاح", varName: "--status-success-text" },
    { label: "خلفية الخطأ (Error)", varName: "--status-error-bg" },
    { label: "نص الخطأ", varName: "--status-error-text" },
    { label: "خلفية الخطأ (Error)", varName: "--status-error-bg" },
    { label: "نص الخطأ", varName: "--status-error-text" },

    // --- Icons ---
    { label: "أيقونة التعديل", varName: "--icon-edit" },
    { label: "أيقونة الحذف", varName: "--icon-delete" },
    { label: "أيقونة العرض", varName: "--icon-view" },
    { label: "أيقونة الإضافة", varName: "--icon-add" },
    { label: "أيقونة الإضافة", varName: "--icon-add" },

    // --- Tables (Existing) ---
    // View Tables
    { label: "جداول العرض - الحدود", varName: "--table-view-border" },
    { label: "جداول العرض - خلفية الرأس", varName: "--table-view-header-bg" },
    { label: "جداول العرض - نص الرأس", varName: "--table-view-header-text" },
    { label: "جداول العرض - نص الصفوف", varName: "--table-view-text" },
    { label: "جداول العرض - خلفية فردي", varName: "--table-view-row-odd-bg" },
    { label: "جداول العرض - خلفية زوجي", varName: "--table-view-row-even-bg" },
    { label: "جداول العرض - تحويم الصف", varName: "--table-view-row-hover-bg" },

    // Edit Tables
    { label: "جداول الإدخال - الحدود", varName: "--table-edit-border" },
    { label: "جداول الإدخال - خلفية الرأس", varName: "--table-edit-header-bg" },
    { label: "جداول الإدخال - نص الرأس", varName: "--table-edit-header-text" },
    { label: "جداول الإدخال - نص الصفوف", varName: "--table-edit-text" },
    { label: "جداول الإدخال - خلفية فردي", varName: "--table-edit-row-odd-bg" },
    { label: "جداول الإدخال - خلفية زوجي", varName: "--table-edit-row-even-bg" },
    { label: "جداول الإدخال - تحويم الصف", varName: "--table-edit-row-hover-bg" },

    // --- Buttons & States ---
    { label: "خلفية الزر الأساسي", varName: "--btn-primary-bg" },
    { label: "نص الزر الأساسي", varName: "--btn-primary-text" },
    { label: "خلفية الزر الأساسي (Hover)", varName: "--btn-primary-hover-bg" },
    { label: "خلفية الزر الثانوي", varName: "--btn-secondary-bg" },
    { label: "نص الزر الثانوي", varName: "--btn-secondary-text" },
    { label: "خلفية الزر الثانوي (Hover)", varName: "--btn-secondary-hover-bg" },
    { label: "خلفية أزرار الإجراءات (Action)", varName: "--action-btn-bg" },
    { label: "خلفية أزرار الإجراءات (Hover)", varName: "--action-btn-hover-bg" },
    { label: "خلفية التلميحات (Tooltip)", varName: "--tooltip-bg" },

    // --- Buttons (Modal Specific) ---
    { label: "أزرار المودال - خلفية", varName: "--modal-trigger-btn-bg" },
    { label: "أزرار المودال - نص", varName: "--modal-trigger-btn-text" },
];

export default function Settings() {
    const { customTheme, updateTheme, resetTheme } = useTheme();
    const { updateUserProfile, user } = useAuth();
    const [localTheme, setLocalTheme] = useState({});

    // Template State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState("");
    const [newTemplateName, setNewTemplateName] = useState("");
    const [showSaveTemplate, setShowSaveTemplate] = useState(false);

    // Fetch templates on mount
    useEffect(() => {
        fetchTemplates();
    }, []);

    // Sync active template from user profile to state
    useEffect(() => {
        if (user && user.activeTemplate) {
            // Helper: handle both populated obj and raw ID
            const activeId = typeof user.activeTemplate === 'object' ? user.activeTemplate._id : user.activeTemplate;
            setSelectedTemplate(activeId);
            
            // Critical: If we have the full object, load its preferences into local state immediately
            if (typeof user.activeTemplate === 'object' && user.activeTemplate.preferences) {
                console.log("Settings: Loaded preferences from active template", user.activeTemplate.preferences);
                setLocalTheme(user.activeTemplate.preferences);
            } else {
                console.warn("Settings: activeTemplate is missing or not populated", user.activeTemplate);
            }
        }
    }, [user, templates]);

    useEffect(() => {
        console.log("Settings: localTheme updated", localTheme);
    }, [localTheme]);

    const handleChange = (varName, value) => {
        setLocalTheme((prev) => ({ ...prev, [varName]: value }));
    };

    const handleSave = async () => {
        // Find current template details
        const currentTemp = templates.find(t => t._id === selectedTemplate);
        
        if (!currentTemp) {
            alert("يرجى اختيار قالب لحفظ التغييرات عليه، أو حفظ كقالب جديد.");
            return;
        }

        if (currentTemp.isSystem) {
            alert("لا يمكن تعديل قوالب النظام الأساسية. يرجى استخدام زر 'حفظ كقالب جديد'.");
            setShowSaveTemplate(true);
            return;
        }

        // It's a user key, update it
        try {
            const fullPreferences = getAllCurrentPreferences();
            const token = localStorage.getItem("accessToken");
            await axios.put(`${process.env.REACT_APP_BACKEND}templates/${currentTemp._id}`, {
                preferences: fullPreferences
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            // Update local template state
            fetchTemplates();
            
            // Apply changes instantly to the context/DOM
            updateTheme(fullPreferences);

            // Update AuthContext to prevent stale data from reverting inputs
            if (user && user.activeTemplate) {
                 const newActiveTemplate = typeof user.activeTemplate === 'object' 
                    ? { ...user.activeTemplate, preferences: fullPreferences } 
                    : { _id: user.activeTemplate, preferences: fullPreferences };
                 
                 updateUserProfile({ activeTemplate: newActiveTemplate });
            }
            
            alert("تم تحديث القالب بنجاح");
        } catch (error) {
            alert("فشل حفظ التغييرات");
        }
    };

    const handleReset = () => {
        if (window.confirm("هل أنت متأكد من استعادة الإعدادات الافتراضية؟")) {
            // Find default template
            const defaultTemp = templates.find(t => t.isSystem && t.name.includes("Default"));
            if (defaultTemp) {
                handleApplyTemplate(defaultTemp._id);
            } else {
                // Fallback if not found (shouldn't happen if seeded)
                resetTheme(); 
            }
        }
    };

    // --- Template Handlers ---
    const fetchTemplates = async () => {
        try {
            const token = localStorage.getItem("accessToken");
            if (!token) return;
            const res = await axios.get(`${process.env.REACT_APP_BACKEND}templates`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setTemplates(res.data);
        } catch (error) {
            console.error("Failed to fetch templates", error);
        }
    };

    const handleApplyTemplate = async (templateId) => {
        try {
            const token = localStorage.getItem("accessToken");
            // 1. Update Backend Link
            const res = await axios.put(`${process.env.REACT_APP_BACKEND}users/active-template`, 
                { templateId }, 
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // 2. Update Auth Context (propagate to ThemeContext)
            updateUserProfile(res.data); // res.data is the fully populated user

            setSelectedTemplate(templateId);
            
            // Update local inputs to match the new template
            if (res.data.activeTemplate && res.data.activeTemplate.preferences) {
                setLocalTheme(res.data.activeTemplate.preferences);
            }
            
            alert(`تم تطبيق القالب بنجاح`);

        } catch (error) {
            console.error("Failed to apply template", error);
            alert("فشل تطبيق القالب");
        }
    };

    const handleSaveTemplate = async () => {
        if (!newTemplateName) return;
        try {
            const fullPreferences = getAllCurrentPreferences();
            const token = localStorage.getItem("accessToken");
            const res = await axios.post(`${process.env.REACT_APP_BACKEND}templates`, {
                name: newTemplateName,
                preferences: fullPreferences // Save full snapshot
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            await fetchTemplates();
            setShowSaveTemplate(false);
            setNewTemplateName("");
            
            // Auto-apply the newly created template
            if (res.data && res.data._id) {
                await handleApplyTemplate(res.data._id);
            }
            
            alert("تم حفظ القالب وتطبيقه بنجاح");
        } catch (error) {
            alert(error.response?.data?.error || "فشل حفظ القالب");
        }
    };

    const handleDeleteTemplate = async (id) => {
        if (!window.confirm("هل أنت متأكد من حذف هذا القالب؟")) return;
        try {
            const token = localStorage.getItem("accessToken");
            await axios.delete(`${process.env.REACT_APP_BACKEND}templates/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchTemplates();
            if (selectedTemplate === id) setSelectedTemplate("");
        } catch (error) {
            alert(error.response?.data?.error || "فشل حذف القالب");
        }
    };

    const handleUpdateTemplate = async (id) => {
        if (!window.confirm("هل تريد تحديث هذا القالب بالإعدادات الحالية؟")) return;
        try {
            const token = localStorage.getItem("accessToken");
            const fullPreferences = getAllCurrentPreferences();
            await axios.put(`${process.env.REACT_APP_BACKEND}templates/${id}`, {
                preferences: fullPreferences
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            // Apply changes instantly
            updateTheme(fullPreferences);

            // Update AuthContext
            if (user && user.activeTemplate) {
                 const newActiveTemplate = typeof user.activeTemplate === 'object' 
                    ? { ...user.activeTemplate, preferences: fullPreferences } 
                    : { _id: user.activeTemplate, preferences: fullPreferences };
                 updateUserProfile({ activeTemplate: newActiveTemplate });
            }

            alert("تم تحديث القالب بنجاح");
            fetchTemplates();
        } catch (error) {
            alert("فشل تحديث القالب");
        }
    };

    const rgbToHex = (r, g, b) => {
        return "#" + [r, g, b].map(x => {
            const hex = parseInt(x).toString(16);
            return hex.length === 1 ? "0" + hex : hex;
        }).join("");
    };

    const ensureHex = (color) => {
        if (!color) return "#ffffff";
        color = color.trim();
        
        // Already hex
        if (color.startsWith("#")) {
            if (color.length === 4) {
                // Expand short hex #FFF -> #FFFFFF
                return "#" + color[1] + color[1] + color[2] + color[2] + color[3] + color[3];
            }
            return color.slice(0, 7); // Ensure max 7 chars
        }

        // Handle rgb/rgba
        if (color.startsWith("rgb")) {
            const matches = color.match(/\d+/g);
            if (matches && matches.length >= 3) {
                return rgbToHex(matches[0], matches[1], matches[2]);
            }
        }
        
        // Fallback for named colors (basic) or invalid formats
        // We could use a temporary element to compute it, but that's expensive/complex for render.
        // For now, return a safe default if not parseable to avoid the console error.
        // Or if we really want to support 'brown', 'red' etc:
        const ctx = document.createElement("canvas").getContext("2d");
        ctx.fillStyle = color;
        return ctx.fillStyle; 
    };

    const getValue = (varName) => {
        if (localTheme && localTheme[varName]) {
             // console.log(`getValue(${varName}): Found in localTheme`, localTheme[varName]);
             return localTheme[varName];
        }
        
        // Fallback to the actual CSS variable value currently applied (from theme.css)
        if (typeof window !== "undefined") {
            const style = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
            // console.log(`getValue(${varName}): Fallback to computed`, style);
            if (style) return style;
        }
        return "#ffffff"; 
    };

    // Helper to build the full 88-variable object from current UI state
    // ensuring we save a complete snapshot, not just what's in local React state
    const getAllCurrentPreferences = () => {
        const prefs = {};
        colorOptions.forEach(opt => {
            prefs[opt.varName] = getValue(opt.varName);
        });
        return prefs;
    };

    return (
        <div className={classes.container}>
            <h2 className={classes.title}>إعدادات الألوان (Theme Settings)</h2>
            
            {/* Templates Section */}
            <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px', border: '1px solid #dee2e6' }}>
                <h3 style={{ fontSize: '18px', marginBottom: '15px' }}>قوالب التصميم (Templates)</h3>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select 
                        value={selectedTemplate} 
                        onChange={(e) => handleApplyTemplate(e.target.value)}
                        style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ced4da', minWidth: '200px' }}
                    >
                        <option value="">-- اختر قالب --</option>
                        {templates.map(t => (
                            <option key={t._id} value={t._id}>
                                {t.name} {t.isSystem ? "(System)" : ""}
                            </option>
                        ))}
                    </select>

                    <button 
                        onClick={() => setShowSaveTemplate(!showSaveTemplate)}
                        style={{ padding: '8px 15px', background: '#2d3748', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
                        حفظ التصميم الحالي كقالب جديد
                    </button>
                    
                     {/* User Template Constraints */}
                    {selectedTemplate && templates.find(t => t._id === selectedTemplate && !t.isSystem) && (
                        <>
                            <button 
                                onClick={() => handleUpdateTemplate(selectedTemplate)}
                                style={{ padding: '8px 15px', background: '#e0a800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                تحديث القالب
                            </button>
                            <button 
                                onClick={() => handleDeleteTemplate(selectedTemplate)}
                                style={{ padding: '8px 15px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                حذف
                            </button>
                        </>
                    )}
                </div>

                {showSaveTemplate && (
                    <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                        <input 
                            type="text" 
                            placeholder="اسم القالب الجديد" 
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            style={{ padding: '8px', borderRadius: '4px', border: '1px solid #ced4da' }}
                        />
                        <button 
                            onClick={handleSaveTemplate}
                            style={{ padding: '8px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            تأكيد الحفظ
                        </button>
                    </div>
                )}
            </div>

            <div className={classes.grid}>
                {colorOptions.map((option) => (
                    <div key={option.varName} className={classes.item}>
                        <label>{option.label}</label>
                        <div className={classes.inputGroup}>
                            <input
                                type="color"
                                value={ensureHex(getValue(option.varName))}
                                onChange={(e) => handleChange(option.varName, e.target.value)}
                                className={classes.colorInput}
                            />
                            <input
                                type="text"
                                value={getValue(option.varName)}
                                onChange={(e) => handleChange(option.varName, e.target.value)}
                                className={classes.textInput}
                                dir="ltr"
                            />
                        </div>
                    </div>
                ))}
            </div>
            <div className={classes.actions}>
                <button className={classes.saveBtn} onClick={handleSave}>حفظ التغييرات</button>
                <button className={classes.resetBtn} onClick={handleReset}>استعادة الافتراضي</button>
            </div>
        </div>
    );
}
