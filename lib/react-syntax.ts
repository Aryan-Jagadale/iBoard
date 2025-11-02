import pako from 'pako';

const editingScript = `
<script>
  // ---------- Robust text wrapping with MutationObserver ----------
  function makeTextEditable() {
    const root = document.getElementById('root');
    if (!root) return;
    console.log("makeTextEditable called");

    let idCounter = 0;
    const editableClass = 'editable-text';

    // Wrap existing text nodes
    const wrapTextNodes = (container) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);

      nodes.forEach(textNode => {
        if (!textNode.nodeValue?.trim()) return;
        if (textNode.parentNode?.closest(\`.\${editableClass}\`) || textNode.parentNode?.closest('[contenteditable]')) return;

        const span = document.createElement('span');
        span.className = editableClass;
        span.dataset.id = \`editable_\${idCounter++}\`;
        span.textContent = textNode.nodeValue;
        textNode.parentNode.replaceChild(span, textNode);
      });
    };

    // Initial wrap
    wrapTextNodes(root);

    // Observe future changes (React updates, dynamic content, etc.)
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE) {
            if (node.parentNode && !node.parentNode.closest(\`.\${editableClass}\`)) {
              wrapTextNodes(node.parentNode);
            }
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapTextNodes(node);
          }
        });
      });
    });

    observer.observe(root, { childList: true, subtree: true });
  }

  // ---------- Double-click handler ----------
  document.addEventListener('dblclick', e => {
    const span = e.target.closest('.editable-text');
    if (!span) return;

    window.parent.postMessage({
      type: 'OPEN_EDITOR',
      id: span.dataset.id,
      html: span.innerHTML
    }, '*');
  });

  // ---------- Receive update ----------
  window.addEventListener('message', ev => {
    if (ev.source !== window.parent) return;
    const { type, id, html } = ev.data || {};
    if (type !== 'UPDATE_TEXT') return;

    const span = document.querySelector(\`[data-id="\${id}"]\`);
    if (span) {
      span.innerHTML = html;
    }
  });

  // ---------- Wait for React to mount ----------
  const startObserverWhenReady = () => {
    // React 18: createRoot
    if (window.ReactDOMClient?.createRoot) {
      const orig = window.ReactDOMClient.createRoot;
      window.ReactDOMClient.createRoot = (...args) => {
        const root = orig(...args);
        // React flushes DOM after render
        requestAnimationFrame(() => makeTextEditable());
        return root;
      };
    } 
    // React 17: render
    else if (window.ReactDOM?.render) {
      const orig = window.ReactDOM.render;
      window.ReactDOM.render = (...args) => {
        const result = orig(...args);
        requestAnimationFrame(() => makeTextEditable());
        return result;
      };
    } 
    // Fallback: poll for #root content
    else {
      const check = () => {
        if (document.getElementById('root')?.hasChildNodes()) {
          makeTextEditable();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    }
  };

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserverWhenReady);
  } else {
    startObserverWhenReady();
  }
</script>
`;

export const reactAppHTML = (data:any) =>{
    let bundle: string;
    if (data?.isCompressed) {
        bundle = pako.ungzip(data?.bundle, { to: 'string' });
    }else{
        bundle = data.bundle;
    }
    const reactAppHTML = `
            <!DOCTYPE html>
                <html lang="en">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>React App Preview</title>
                    <style>${data?.cssFiles}</style> 
                </head>
                <body>
                    <div id="root"></div>
                    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
                    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
                    ${editingScript}
                    <script type="module">${bundle}</script>
                </body>
                </html>`;
    return reactAppHTML;
}


export const tailwindReactAppHTML = (data:any) =>{

    let bundle: string;
    if (data?.isCompressed) {
        bundle = pako.ungzip(data?.bundle, { to: 'string' });
    }else{
        bundle = data.bundle;
    }
    let html = data.indexHtml;
    html = html.replace(
                /<div id="root">.*<\/div>/,
                '<div id="root"></div>'
            );
    html = html.replace(
                '</head>',
                `<style>${data?.cssFiles || ''}</style></head>`
            );
    html = html.replace(
                '</body>',
                `
              <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
              <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
             <script type="module">${bundle || ''}</script>
            </body>`
            );
    return html;
}