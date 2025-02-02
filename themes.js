// Theme configurations
export const themes = {
    modern: {
        styles: `
            body.theme-modern {
                background-color: #f5f5f5;
                color: #333;
            }
            
            .theme-modern h1, .theme-modern h2 {
                color: #2c3e50;
                font-weight: 600;
            }
            
            .theme-modern nav {
                background: #fff;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            
            .theme-modern nav a {
                color: #3498db;
                text-decoration: none;
                transition: color 0.3s;
            }
            
            .theme-modern nav a:hover {
                color: #2980b9;
            }
            
            .theme-modern .content {
                background: #fff;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                margin-bottom: 2rem;
            }
        `
    },
    minimal: {
        styles: `
            body.theme-minimal {
                background-color: #fff;
                color: #222;
                max-width: 800px;
                margin: 0 auto;
            }
            
            .theme-minimal h1, .theme-minimal h2 {
                color: #000;
                font-weight: 400;
            }
            
            .theme-minimal nav {
                border-bottom: 1px solid #eee;
            }
            
            .theme-minimal nav a {
                color: #666;
                text-decoration: none;
                transition: color 0.3s;
            }
            
            .theme-minimal nav a:hover {
                color: #000;
            }
            
            .theme-minimal .content {
                line-height: 1.8;
            }
        `
    },
    classic: {
        styles: `
            body.theme-classic {
                background-color: #f8f8f8;
                color: #444;
                font-family: Georgia, serif;
            }
            
            .theme-classic h1, .theme-classic h2 {
                color: #333;
                font-family: 'Times New Roman', serif;
            }
            
            .theme-classic nav {
                background: #fff;
                border-bottom: 2px solid #ddd;
            }
            
            .theme-classic nav a {
                color: #666;
                text-decoration: none;
                transition: color 0.3s;
            }
            
            .theme-classic nav a:hover {
                color: #000;
            }
            
            .theme-classic .content {
                background: #fff;
                padding: 2rem;
                border: 1px solid #ddd;
                margin-bottom: 2rem;
            }
        `
    }
};