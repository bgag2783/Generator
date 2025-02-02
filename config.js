// Site configuration management

// Default site configuration
const defaultConfig = {
    name: '',
    theme: 'modern',
    mainTitle: '',
    mainContent: '',
    mainImages: [],
    pages: []
};

// Create a new site configuration
export function createSiteConfig() {
    return { ...defaultConfig };
}

// Update site configuration
export function updateSiteConfig(config, updates) {
    return { ...config, ...updates };
}

// Get current site configuration
export function getSiteConfig(config) {
    return { ...config };
}

// Validate site configuration
export function validateConfig(config) {
    const requiredFields = ['name', 'theme', 'mainTitle'];
    const missingFields = requiredFields.filter(field => !config[field]);
    
    return {
        isValid: missingFields.length === 0,
        missingFields
    };
}

// Export configuration utilities
export const configUtils = {
    createSiteConfig,
    updateSiteConfig,
    getSiteConfig,
    validateConfig
};