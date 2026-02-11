/**
 * @param {import('puppeteer').Frame} frame
 * @param {string} selector
 * @returns {Promise<string>}
 */
export async function getInnerText(frame, selector, { useTextContent = false, all = false } = {}) {
    const normalize = (text) => text.trim()
        .split('\n')
        .map((l) => l.replace(/[\t ]+/g, ' ').trim())
        .filter(Boolean)
        .join('\n');

    if (all) {
        return frame.$$eval(selector, (els, useTc) => {
            return els.map((el) => (useTc ? el.textContent : el.innerText).trim()).filter(Boolean);
        }, useTextContent).then((texts) => normalize(texts.join('\n')));
    }

    return frame.$eval(selector, (el, useTc) => {
        return (useTc ? el.textContent : el.innerText).trim();
    }, useTextContent).then(normalize);
}

/**
 * @param {import('puppeteer').Frame} frame
 * @param {string} selector
 * @returns {Promise<string>}
 */
export async function parseTable(frame, selector = 'table') {
    return frame.evaluate((sel) => {
        const expandRow = (cells) => {
            const out = [];
            for (const cell of cells) {
                const text = cell.innerText.trim().replace(/\s+/g, ' ');
                out.push(text);
                for (let s = 1; s < cell.colSpan; s++) out.push('');
            }
            return out;
        };

        const table = document.querySelector(sel);
        if (!table) throw new Error(`No table found for selector: ${sel}`);

        const totalCols = Math.max(...Array.from(table.rows).map(r =>
            Array.from(r.cells).reduce((sum, c) => sum + c.colSpan, 0)
        ));

        const lines = [];
        let headerGrid = null;
        let namedCols = [];

        for (const row of Array.from(table.rows)) {
            if (row.closest('table') !== table) continue;

            const cells = Array.from(row.cells);
            const texts = cells.map(c => c.innerText.trim().replace(/\s+/g, ' '));

            if (texts.every(t => !t)) continue;

            // Wide-span detection
            const spannedCols = cells.reduce((sum, c) => sum + c.colSpan, 0);
            const isWideSpan = cells.length < totalCols / 2 && spannedCols >= totalCols * 0.8;

            if (isWideSpan) {
                const content = texts.filter(Boolean).join(' — ');
                if (!content) continue;
                const looksLikeHeader = content.length < 120 && !content.includes(':');
                lines.push(looksLikeHeader ? `\n## ${content}\n` : `> ${content}`);
                continue;
            }

            // First multi-cell row = header
            if (!headerGrid && cells.length >= totalCols / 2) {
                headerGrid = expandRow(cells);
                namedCols = headerGrid
                    .map((h, i) => h ? i : -1)
                    .filter(i => i >= 0);

                if (namedCols.length > 0) {
                    const hasUnnamedPrefix = namedCols[0] > 0;
                    const display = [
                        ...(hasUnnamedPrefix ? ['-'] : []),
                        ...namedCols.map(i => headerGrid[i])
                    ];
                    lines.push('| ' + display.join(' | ') + ' |');
                    lines.push('| ' + display.map(() => '---').join(' | ') + ' |');
                }
                continue;
            }

            // Data row
            if (headerGrid && namedCols.length > 0) {
                const grid = expandRow(cells);

                const firstNamed = namedCols[0];
                const label = grid.slice(0, firstNamed).filter(Boolean).join(' ').trim();

                const merged = [
                    ...(firstNamed > 0 ? [label] : []),
                    ...namedCols.map(i => grid[i] ?? '')
                ];

                if (merged.some(Boolean)) {
                    lines.push('| ' + merged.join(' | ') + ' |');
                }
            } else {
                const content = texts.filter(Boolean).join(' | ');
                if (content) lines.push(content);
            }
        }

        return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    }, selector);
}
