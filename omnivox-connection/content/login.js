// Login form: the segmented date of birth, validation, and the fields Omnivox expects.
(() => {
    const form = document.querySelector('form');
    const identifier = document.getElementById('identifier');
    const idField = document.getElementById('idField');
    const dobField = document.getElementById('dobField');
    const spoken = document.getElementById('dobSpoken');
    const segments = [
        document.getElementById('dobYear'),
        document.getElementById('dobMonth'),
        document.getElementById('dobDay'),
    ];
    const [year, month, day] = segments;

    // Omnivox hands the identifier back when it returns to the login page.
    const returned = new URLSearchParams(location.search).get('n');
    if (returned) identifier.value = returned;

    /** The typed date, or the reason it is not one yet. */
    function readDate() {
        if (year.value.length < 4 || !month.value || !day.value) return { error: 'dobMissing' };
        const y = Number(year.value), m = Number(month.value), d = Number(day.value);
        const date = new Date(y, m - 1, d);
        if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return { error: 'dobInvalid' };
        if (y < 1900 || date > new Date()) return { error: 'dobRange' };
        return { date, compact: `${year.value}${String(m).padStart(2, '0')}${String(d).padStart(2, '0')}` };
    }

    function setError(field, key) {
        field.classList.toggle('invalid', Boolean(key));
        field.dataset.error = key || '';
        field.querySelector('[data-hint]').textContent = key ? UI.t(key) : '';
    }

    /** Shows the date back in words once it is complete, so a swapped day and month is visible. */
    function refreshSpoken() {
        const { date } = readDate();
        spoken.textContent = date
            ? date.toLocaleDateString(UI.lang === 'fr' ? 'fr-CA' : 'en-CA', { day: 'numeric', month: 'long', year: 'numeric' })
            : '';
    }

    /** Spreads a pasted or typed run of digits over the segments, starting at `from`. */
    function fill(digits, from) {
        let rest = digits;
        for (let i = from; i < segments.length && rest; i++) {
            const size = segments[i].maxLength;
            segments[i].value = rest.slice(0, size);
            rest = rest.slice(size);
            if (segments[i].value.length === size && i + 1 < segments.length) segments[i + 1].focus();
            else segments[i].focus();
        }
    }

    segments.forEach((input, index) => {
        input.addEventListener('input', () => {
            let digits = input.value.replace(/\D/g, '');
            // A first digit that cannot start a month or a day is the whole value: 4 -> 04.
            if (digits.length === 1 && ((input === month && digits > '1') || (input === day && digits > '3'))) {
                digits = '0' + digits;
            }
            input.value = '';
            fill(digits, index);
            if (dobField.dataset.error) setError(dobField, readDate().error);
            refreshSpoken();
        });

        input.addEventListener('keydown', (event) => {
            const atStart = input.selectionStart === 0 && input.selectionEnd === 0;
            const atEnd = input.selectionStart === input.value.length;
            if (event.key === 'Backspace' && atStart && index > 0) {
                event.preventDefault();
                const previous = segments[index - 1];
                previous.value = previous.value.slice(0, -1);
                previous.focus();
                refreshSpoken();
            } else if (event.key === 'ArrowLeft' && atStart && index > 0) {
                event.preventDefault();
                segments[index - 1].focus();
            } else if ((event.key === 'ArrowRight' && atEnd || event.key === '/' || event.key === '-') && index < 2) {
                event.preventDefault();
                if (input.value.length === 1 && input !== year) input.value = '0' + input.value;
                segments[index + 1].focus();
            }
        });

        input.addEventListener('paste', (event) => {
            event.preventDefault();
            const digits = event.clipboardData.getData('text').replace(/\D/g, '');
            if (digits.length === 8) fill(digits, 0);
            else fill(digits, index);
            refreshSpoken();
        });

        input.addEventListener('blur', () => {
            if (input !== year && input.value.length === 1 && input.value !== '0') {
                input.value = '0' + input.value;
                refreshSpoken();
            }
        });
    });

    // Clicking the empty part of the field lands on the first unfinished segment.
    document.querySelector('.dob').addEventListener('mousedown', (event) => {
        if (event.target.tagName === 'INPUT') return;
        event.preventDefault();
        (segments.find((input) => input.value.length < input.maxLength) || day).focus();
    });

    identifier.addEventListener('input', () => {
        if (idField.dataset.error) setError(idField, identifier.value.trim() ? '' : 'idMissing');
    });

    form.addEventListener('submit', (event) => {
        const result = readDate();
        const idError = identifier.value.trim() ? '' : 'idMissing';
        setError(idField, idError);
        setError(dobField, result.error);

        if (idError || result.error) {
            event.preventDefault();
            if (idError) identifier.focus();
            else (segments.find((input) => input.value.length < input.maxLength) || year).focus();
            return;
        }

        identifier.value = identifier.value.trim();
        document.getElementById('dobFormatted').value = result.compact;
        form.querySelector('.btn').classList.add('busy');
    });

    UI.onChange((lang) => {
        document.getElementById('langOmnivox').value = lang === 'fr' ? 'FRA' : 'ANG';
        document.getElementById('langDevice').value = lang === 'fr' ? 'fr-CA' : 'en-CA';
        for (const field of [idField, dobField]) {
            if (field.dataset.error) setError(field, field.dataset.error);
        }
        refreshSpoken();
    });
})();
