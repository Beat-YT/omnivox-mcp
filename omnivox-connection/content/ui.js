// Shared by the login and success pages: interface language and the EN/FR switch.
const UI = (() => {
    const strings = {
        en: {
            tagline: 'Your own personal bridge to Omnivox',
            signInTitle: 'Sign in',
            signInLede: 'Start with your student ID and date of birth. Omnivox takes over from there.',
            idLabel: 'Student ID',
            dobLabel: 'Date of birth',
            year: 'Year', month: 'Month', day: 'Day',
            yearPh: 'YYYY', dayPh: 'DD',
            continue: 'Continue',
            fineprint: "Your password and 2-step verification are entered on Omnivox's own page. This app never sees them.",
            idMissing: 'Enter your student ID.',
            dobMissing: 'Enter your date of birth as year, month, day.',
            dobInvalid: 'That date does not exist.',
            dobRange: 'Check the year.',
            doneTitle: "You're signed in",
            doneLede: 'Save the two session files. They are the only copy: closing this window forgets the login.',
            configWhat: 'Entry page and device identity',
            cookiesWhat: 'Session cookies',
            save: 'Save', saved: 'Saved',
            step1: "Put both files in the server's <code>data/</code> folder, or your <code>OMNIVOX_DATA_DIR</code>.",
            step2: 'Start the server with <code>npm start</code>.',
        },
        fr: {
            tagline: 'Ton pont personnel vers Omnivox',
            signInTitle: 'Connexion',
            signInLede: 'Commence par ton numéro de DA et ta date de naissance. Omnivox prend le relais ensuite.',
            idLabel: 'Numéro de DA',
            dobLabel: 'Date de naissance',
            year: 'Année', month: 'Mois', day: 'Jour',
            yearPh: 'AAAA', dayPh: 'JJ',
            continue: 'Continuer',
            fineprint: "Ton mot de passe et la vérification en 2 étapes sont saisis sur la page d'Omnivox. Cette application ne les voit jamais.",
            idMissing: 'Entre ton numéro de DA.',
            dobMissing: 'Entre ta date de naissance : année, mois, jour.',
            dobInvalid: "Cette date n'existe pas.",
            dobRange: "Vérifie l'année.",
            doneTitle: 'Connexion réussie',
            doneLede: 'Enregistre les deux fichiers de session. Ce sont les seules copies : fermer cette fenêtre oublie la connexion.',
            configWhat: "Page d'accueil et identité de l'appareil",
            cookiesWhat: 'Témoins de session',
            save: 'Enregistrer', saved: 'Enregistré',
            step1: 'Place les deux fichiers dans le dossier <code>data/</code> du serveur, ou dans ton <code>OMNIVOX_DATA_DIR</code>.',
            step2: 'Démarre le serveur avec <code>npm start</code>.',
        },
    };

    const listeners = [];
    let lang = 'en';

    try {
        lang = sessionStorage.getItem('lang') || (navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en');
    } catch {
        // storage unavailable: keep the default
    }

    const t = (key) => strings[lang][key] ?? strings.en[key] ?? key;

    function apply() {
        document.documentElement.lang = lang;
        for (const el of document.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
        // Only ever filled from the strings table above.
        for (const el of document.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
        for (const el of document.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
        for (const el of document.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
        for (const button of document.querySelectorAll('.lang button')) {
            button.setAttribute('aria-pressed', String(button.dataset.lang === lang));
        }
        for (const listener of listeners) listener(lang);
    }

    for (const button of document.querySelectorAll('.lang button')) {
        button.addEventListener('click', () => {
            lang = button.dataset.lang;
            try {
                sessionStorage.setItem('lang', lang);
            } catch {
                // not persisted, still applied
            }
            apply();
        });
    }

    apply();

    return {
        t,
        get lang() { return lang; },
        onChange(listener) { listeners.push(listener); listener(lang); },
    };
})();
