const form = document.querySelector('form');
const dob = document.getElementById('dob');
const dobFormatted = document.getElementById('dobFormatted');

dob.addEventListener('click', () => dob.showPicker());

// set default date to 18 years ago
const currentYear = new Date().getFullYear();
dob.value = `${currentYear - 18}-01-01`;

// Omnivox wants the date as YYYYMMDD
form.addEventListener('submit', () => {
    dobFormatted.value = dob.value.replaceAll('-', '');
});
