const fs = require('fs');
const path = require('path');
const marked = require('marked');

const SOURCE_DIR = 'strategy_wiki';
const OUTPUT_DIR = 'wiki';

// Template for the HTML pages
const TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Strategy Wiki - Implement Consulting Group</title>
    <link rel="stylesheet" href="{{ROOT}}style.css">
    <style>
        body {
            background-color: #F9F8F4; /* var(--egg-white) */
            color: #1A1A1A; /* var(--im-black) */
            font-family: 'Arial', sans-serif; /* var(--font-body) */
            margin: 0;
            padding: 0;
            overflow-y: auto !important;
            height: auto !important;
            width: 100% !important;
        }
        
        .wiki-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 60px 20px;
            background-color: white;
            min-height: 100vh;
            box-shadow: 0 0 20px rgba(0,0,0,0.05);
        }

        .wiki-nav {
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 100;
        }

        .back-link {
            text-decoration: none;
            color: #1A1A1A;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 8px;
            opacity: 0.6;
            transition: opacity 0.2s;
        }

        .back-link:hover {
            opacity: 1;
        }

        /* Markdown Content Styles */
        .markdown-body {
            line-height: 1.6;
        }

        .markdown-body h1, .markdown-body h2, .markdown-body h3 {
            font-family: 'Palatino Linotype', 'Palatino', serif; /* var(--font-display) */
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }

        .markdown-body h1 { font-size: 2.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
        .markdown-body h2 { font-size: 2rem; }
        .markdown-body h3 { font-size: 1.5rem; }
        
        .markdown-body p { margin-bottom: 1em; }
        .markdown-body ul, .markdown-body ol { margin-bottom: 1em; padding-left: 2em; }
        .markdown-body li { margin-bottom: 0.5em; }
        
        .markdown-body a {
            color: #660000; /* var(--deep-red) */
            text-decoration: none;
            border-bottom: 1px solid transparent;
            transition: border-color 0.2s;
        }
        
        .markdown-body a:hover {
            border-bottom-color: #660000;
        }

        .markdown-body blockquote {
            border-left: 4px solid #D4AF37; /* var(--im-yellow) */
            padding-left: 1em;
            color: #666;
            font-style: italic;
            margin: 1em 0;
        }
    </style>
</head>
<body>

    <nav class="wiki-nav">
        <a href="{{ROOT}}index.html" class="back-link">
            <span>←</span> Back to Presentation
        </a>
    </nav>

    <div class="wiki-container">
        <div class="markdown-body">
            {{CONTENT}}
        </div>
    </div>

</body>
</html>`;

function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

function processFile(filePath, relativePath) {
    const ext = path.extname(filePath);
    const outputRelPath = relativePath.replace(/\.md$/, '.html');
    const outputPath = path.join(OUTPUT_DIR, outputRelPath);

    ensureDir(path.dirname(outputPath));

    if (ext === '.md') {
        console.log(`Processing ${relativePath} -> ${outputRelPath}`);
        const content = fs.readFileSync(filePath, 'utf-8');
        let htmlContent = marked.parse(content);

        // Replace .md links with .html links
        htmlContent = htmlContent.replace(/href="([^"]+)\.md"/g, 'href="$1.html"');

        // Calculate root path
        // e.g. if file is in wiki/subdir/file.html, root is ../../
        // relativePath is subdir/file.md
        const depth = relativePath.split(path.sep).length - 1;
        const rootPath = depth > 0 ? '../'.repeat(depth + 1) : '../'; // +1 because wiki/ is a subdir of root

        const finalHtml = TEMPLATE
            .replace('{{CONTENT}}', htmlContent)
            .replace(/{{ROOT}}/g, rootPath);

        fs.writeFileSync(outputPath, finalHtml);
    } else {
        console.log(`Copying ${relativePath}`);
        fs.copyFileSync(filePath, outputPath);
    }
}

function walkDir(dir, baseDir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        const relativePath = path.relative(baseDir, fullPath);

        if (stat.isDirectory()) {
            walkDir(fullPath, baseDir);
        } else {
            processFile(fullPath, relativePath);
        }
    }
}

// Main execution
console.log('Starting build...');
if (fs.existsSync(OUTPUT_DIR)) {
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
}
ensureDir(OUTPUT_DIR);

walkDir(SOURCE_DIR, SOURCE_DIR);

console.log('Build complete!');
