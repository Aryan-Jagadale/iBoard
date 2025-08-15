export const htmlCSSJSSyntax = (files: any) => {
    const htmlFile = files.find((file: any) => file.name === "index.html");
    const cssFile = files.find((file: any) => file.name === "style.css");
    const jsFiles = files.filter((file: any) => file.name.endsWith(".js"));

    if (htmlFile && cssFile) {
        let combinedHTML = htmlFile.content.replace(
            "</head>",
            `<style>${cssFile.content}</style></head>`
        );
        const loggingScript = `
            <script>
                (function() {
                    const methods = ['log', 'error', 'warn', 'info'];
                    methods.forEach((method) => {
                        const original = console[method];
                        console[method] = function(...args) {
                            window.parent.postMessage({ type: 'console', method, data: args }, '*');
                            original.apply(console, args);
                        };
                    });
                })();
            </script>
        `;

        combinedHTML = combinedHTML.replace("</head>", `${loggingScript}</head>`);

        if (jsFiles.length > 0) {
            const scriptTags = jsFiles
                .map((jsFile: any) => {
                    const isModule = jsFile.name.endsWith(".module.js");
                    return `<script ${isModule ? "type='module'" : ""
                        } data-filename="${jsFile.name}">
                                    ${jsFile.content}
                                   </script>`;
                })
                .join("\n");
            combinedHTML = combinedHTML.replace("</body>", `${scriptTags}\n</body>`);
        }
        return combinedHTML;
    }

}
