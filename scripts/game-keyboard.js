// Keep gameplay arrow keys from scrolling the page without swallowing game input.
(() => {
    const arrows = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
    document.addEventListener('keydown', (event) => {
        if (!arrows.has(event.key)) return;
        const target = event.target;
        if (target instanceof Element &&
            (target.closest('input, textarea, select') || target.isContentEditable)) return;
        event.preventDefault();
    }, { capture: true, passive: false });
})();
